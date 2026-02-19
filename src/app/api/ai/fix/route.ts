// ─────────────────────────────────────────────────────────────
// API Route: POST /api/ai/fix
// ─────────────────────────────────────────────────────────────
// AI debugging endpoint — parses compilation logs and returns
// structured errors with one-click fix suggestions.
//
// Input:
//   { log: string, source: string, errorId?: string }
//
// Output:
//   { errors: LatexError[], fixes: FixSuggestion[] }
//
// If errorId is provided, generates an AI fix for that specific
// error (premium-only). Otherwise, returns rule-based fixes.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseLatexLog } from '@/lib/latex-log-parser';
import { generateRuleFix, generateAIFix } from '@/lib/latex-fixer';
import type { FixSuggestion } from '@/lib/latex-fixer';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
    try {
        // ── Auth check ──────────────────────────────────────
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // ── Parse request ───────────────────────────────────
        const body = await request.json();
        const { log, source, errorId } = body;

        if (!log || typeof log !== 'string') {
            return NextResponse.json(
                { error: 'Missing required field: log (compilation log text)' },
                { status: 400 }
            );
        }

        if (!source || typeof source !== 'string') {
            return NextResponse.json(
                { error: 'Missing required field: source (LaTeX source code)' },
                { status: 400 }
            );
        }

        // ── Parse log ───────────────────────────────────────
        const parsed = parseLatexLog(log);
        const sourceLines = source.split('\n');

        // ── Generate rule-based fixes for all errors ────────
        const fixes: FixSuggestion[] = [];

        for (const error of parsed.errors) {
            const ruleFix = generateRuleFix(error, sourceLines);
            if (ruleFix) {
                fixes.push(ruleFix);
            }
        }

        // ── AI fix for specific error (premium-only) ────────
        if (errorId && OPENROUTER_API_KEY) {
            // Check premium tier
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            const tier = profile?.subscription_tier || 'free';

            if (tier !== 'free') {
                const targetError = parsed.errors.find((e) => e.id === errorId);
                if (targetError) {
                    const aiFix = await generateAIFix(targetError, sourceLines, OPENROUTER_API_KEY);
                    if (aiFix) {
                        fixes.push(aiFix);
                    }
                }
            }
        }

        return NextResponse.json({
            errors: parsed.errors,
            warnings: parsed.warnings,
            errorCount: parsed.errorCount,
            warningCount: parsed.warningCount,
            pdfProduced: parsed.pdfProduced,
            fixes,
        });
    } catch (error) {
        console.error('[AI Fix] Error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
