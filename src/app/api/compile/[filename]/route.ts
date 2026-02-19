// ─────────────────────────────────────────────────────────────
// API Route: GET /api/compile/[filename]
// ─────────────────────────────────────────────────────────────
// Serves compiled artifacts by compilation ID:
//   - GET /api/compile/{id}.pdf     → compilation metadata + PDF URL
//   - GET /api/compile/{id}.synctex → SyncTeX data
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the filename extension to determine what to serve
    const isSynctex = filename.endsWith('.synctex');
    const compilationId = filename
        .replace('.pdf', '')
        .replace('.synctex', '');

    // Fetch compilation record
    const { data: compilation, error } = await supabase
        .from('compilations')
        .select('id, status, pdf_url, synctex_url, log, duration_ms, engine, created_at')
        .eq('id', compilationId)
        .single();

    if (error || !compilation) {
        return NextResponse.json({ error: 'Compilation not found' }, { status: 404 });
    }

    // If requesting SyncTeX data, redirect to the signed URL
    if (isSynctex) {
        if (!compilation.synctex_url) {
            return NextResponse.json(
                { error: 'SyncTeX data not available for this compilation' },
                { status: 404 }
            );
        }
        return NextResponse.redirect(compilation.synctex_url);
    }

    // Return compilation metadata (client uses pdf_url directly)
    return NextResponse.json(compilation);
}
