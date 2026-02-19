// ─────────────────────────────────────────────────────────────
// API Route: POST /api/compile
// ─────────────────────────────────────────────────────────────
// Enqueues a LaTeX compilation job for the given project.
// Returns the compilation ID for status polling.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enqueueCompilation } from '@/lib/queue';
import { getAssetManifest } from '@/lib/storage';
import { z } from 'zod';
import type { CompilerEngine } from '@/types';

const CompileRequestSchema = z.object({
    project_id: z.string().uuid(),
    engine: z.enum(['pdflatex', 'xelatex', 'lualatex']).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // ── Auth check ─────────────────────────────────────────────
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // ── Validate request body ──────────────────────────────────
        const body = await request.json();
        const parsed = CompileRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { project_id, engine } = parsed.data;

        // ── Verify project access ──────────────────────────────────
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, compiler')
            .eq('id', project_id)
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { error: 'Project not found or access denied' },
                { status: 404 }
            );
        }

        // ── Fetch project files ────────────────────────────────────
        const { data: files, error: filesError } = await supabase
            .from('project_files')
            .select('path, content, is_entrypoint')
            .eq('project_id', project_id);

        if (filesError || !files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files found in project' },
                { status: 400 }
            );
        }

        // ── Create compilation record ──────────────────────────────
        const compilerEngine = (engine || project.compiler) as CompilerEngine;

        const { data: compilation, error: compileError } = await supabase
            .from('compilations')
            .insert({
                project_id,
                triggered_by: user.id,
                status: 'queued',
                engine: compilerEngine,
            })
            .select('id')
            .single();

        if (compileError || !compilation) {
            return NextResponse.json(
                { error: 'Failed to create compilation record' },
                { status: 500 }
            );
        }

        // ── Fetch asset manifest (binary files in Storage) ──────
        const assets = await getAssetManifest(supabase, project_id);

        // ── Enqueue BullMQ job ─────────────────────────────────────
        await enqueueCompilation({
            compilationId: compilation.id,
            projectId: project_id,
            engine: compilerEngine,
            files: files.map((f) => ({
                path: f.path,
                content: f.content,
                is_entrypoint: f.is_entrypoint,
            })),
            assets: assets.map((a) => ({
                path: a.path,
                storage_key: a.storage_key,
            })),
        });

        return NextResponse.json({
            compilation_id: compilation.id,
            status: 'queued',
        });
    } catch (error) {
        console.error('[API /compile] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
