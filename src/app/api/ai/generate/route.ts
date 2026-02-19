// ─────────────────────────────────────────────────────────────
// API Route: POST /api/ai/generate
// ─────────────────────────────────────────────────────────────
// Generate complex LaTeX snippets from natural language.
// Premium-only (pro/team).
//
// Input:
//   { prompt: string, type?: SnippetType, csvData?: string }
//
// Output:
//   { code: string, requiredPackages: string[], type: string,
//     previewDocument: string }
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSnippet } from '@/lib/ai-snippet-generator';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
    try {
        // ── Auth ────────────────────────────────────────────
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // ── Premium check ───────────────────────────────────
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single();

        if ((profile?.subscription_tier || 'free') === 'free') {
            return NextResponse.json(
                { error: 'Snippet generation requires a Pro or Team subscription', upgrade_url: '/pricing' },
                { status: 403 }
            );
        }

        // ── API key check ───────────────────────────────────
        if (!OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
        }

        // ── Parse request ───────────────────────────────────
        const body = await request.json();
        const { prompt, type, csvData, existingPackages } = body;

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
            return NextResponse.json(
                { error: 'Provide a description of at least 5 characters' },
                { status: 400 }
            );
        }

        // ── Generate ────────────────────────────────────────
        const result = await generateSnippet(
            { prompt, type, csvData, existingPackages },
            OPENROUTER_API_KEY
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('[AI Generate] Error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
