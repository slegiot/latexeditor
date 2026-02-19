// ─────────────────────────────────────────────────────────────
// API Route: POST /api/ai/assist
// ─────────────────────────────────────────────────────────────
// AI-powered LaTeX assistance — premium users only (pro/team).
//
// Actions:
//   complete — Ghost-text autocompletion (1-3 sentences)
//   math     — Context-aware math formula suggestion
//   rewrite  — Formalise, shorten, or expand selected text
//
// Rate limit: 30 requests/minute per user
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callAI } from '@/lib/ai';
import type { AIAction } from '@/lib/ai';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Simple in-memory rate limiter (per user, resets each minute)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimits.get(userId);

    if (!entry || now > entry.resetAt) {
        rateLimits.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT) {
        return false;
    }

    entry.count++;
    return true;
}

// Valid actions
const VALID_ACTIONS: AIAction[] = ['complete', 'math', 'rewrite'];
const VALID_REWRITE_MODES = ['formalise', 'shorten', 'expand'];

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

        // ── Premium tier check ──────────────────────────────
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single();

        const tier = profile?.subscription_tier || 'free';

        if (tier === 'free') {
            return NextResponse.json(
                {
                    error: 'AI assistance requires a Pro or Team subscription',
                    upgrade_url: '/pricing',
                },
                { status: 403 }
            );
        }

        // ── Rate limit ──────────────────────────────────────
        if (!checkRateLimit(user.id)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please wait a moment.' },
                { status: 429 }
            );
        }

        // ── API key check ───────────────────────────────────
        if (!OPENROUTER_API_KEY) {
            return NextResponse.json(
                { error: 'AI service not configured' },
                { status: 503 }
            );
        }

        // ── Parse request body ──────────────────────────────
        const body = await request.json();
        const { action, prefix, suffix, selection, rewriteMode, documentContext } = body;

        // Validate action
        if (!action || !VALID_ACTIONS.includes(action)) {
            return NextResponse.json(
                { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate required fields
        if (typeof prefix !== 'string') {
            return NextResponse.json(
                { error: 'Missing required field: prefix' },
                { status: 400 }
            );
        }

        // Validate rewrite-specific fields
        if (action === 'rewrite') {
            if (!selection || typeof selection !== 'string' || selection.trim().length === 0) {
                return NextResponse.json(
                    { error: 'Rewrite action requires non-empty selection text' },
                    { status: 400 }
                );
            }
            if (rewriteMode && !VALID_REWRITE_MODES.includes(rewriteMode)) {
                return NextResponse.json(
                    { error: `Invalid rewriteMode. Must be one of: ${VALID_REWRITE_MODES.join(', ')}` },
                    { status: 400 }
                );
            }
        }

        // ── Call AI ─────────────────────────────────────────
        const result = await callAI(
            {
                action,
                prefix: prefix || '',
                suffix: suffix || '',
                selection,
                rewriteMode,
                documentContext,
            },
            OPENROUTER_API_KEY
        );

        return NextResponse.json({
            text: result.text,
            tokens_used: result.tokensUsed,
            action,
        });
    } catch (error) {
        console.error('[AI Assist] Error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
