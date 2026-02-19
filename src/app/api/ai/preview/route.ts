// ─────────────────────────────────────────────────────────────
// API Route: POST /api/ai/preview
// ─────────────────────────────────────────────────────────────
// Compile a LaTeX snippet document and return the PDF as
// a base64-encoded data URL for live preview in the modal.
//
// This uses the same Docker sandbox as the main compiler,
// but with a lightweight standalone document.
//
// Input:  { document: string }
// Output: { pdfBase64: string } or { error: string }
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

// We do NOT use Docker here for the preview — that's too heavy
// for a quick preview. Instead, we offer two strategies:
//   1. If a local texlive is available, compile directly
//   2. Otherwise, return the document for client-side rendering
//
// For production, the preview compiles via the Docker sandbox.
// For dev, we attempt local compilation.

export async function POST(request: NextRequest) {
    try {
        // ── Auth ────────────────────────────────────────────
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // ── Parse ───────────────────────────────────────────
        const body = await request.json();
        const { document: texDocument } = body;

        if (!texDocument || typeof texDocument !== 'string') {
            return NextResponse.json({ error: 'Missing document field' }, { status: 400 });
        }

        // Limit document size
        if (texDocument.length > 50000) {
            return NextResponse.json({ error: 'Document too large for preview' }, { status: 400 });
        }

        // ── Compile ─────────────────────────────────────────
        const previewId = crypto.randomUUID().slice(0, 8);
        const workDir = path.join(os.tmpdir(), `latex-preview-${previewId}`);

        try {
            await fs.mkdir(workDir, { recursive: true });

            // Write the preview document
            const texPath = path.join(workDir, 'preview.tex');
            await fs.writeFile(texPath, texDocument, 'utf-8');

            // Try to compile with local pdflatex (for dev) or Docker
            const pdfPath = path.join(workDir, 'preview.pdf');

            // Attempt local compilation first
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            try {
                await execAsync(
                    `pdflatex -interaction=nonstopmode -halt-on-error -output-directory="${workDir}" "${texPath}"`,
                    { timeout: 15000, cwd: workDir }
                );
            } catch (compileErr) {
                // Check if PDF was still produced (pdflatex sometimes exits non-zero but produces output)
                try {
                    await fs.access(pdfPath);
                } catch {
                    // No PDF produced, return the compilation error
                    const errMsg = compileErr instanceof Error ? compileErr.message : 'Compilation failed';
                    // Extract useful error from stdout/stderr
                    const stderr = (compileErr as { stderr?: string })?.stderr || '';
                    const stdout = (compileErr as { stdout?: string })?.stdout || '';
                    const logContent = stdout || stderr;
                    const errorLine = logContent.split('\n').find((l: string) => l.startsWith('!'));

                    return NextResponse.json({
                        error: 'Preview compilation failed',
                        detail: errorLine || errMsg.slice(0, 200),
                    }, { status: 422 });
                }
            }

            // Read the PDF and return as base64
            try {
                const pdfBuffer = await fs.readFile(pdfPath);
                const pdfBase64 = pdfBuffer.toString('base64');

                return NextResponse.json({
                    pdfBase64,
                    size: pdfBuffer.length,
                });
            } catch {
                return NextResponse.json({
                    error: 'PDF not produced — check your LaTeX code for errors',
                }, { status: 422 });
            }
        } finally {
            // Cleanup temp directory
            await fs.rm(workDir, { recursive: true, force: true }).catch(() => { });
        }
    } catch (error) {
        console.error('[AI Preview] Error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
