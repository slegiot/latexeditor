// ─────────────────────────────────────────────────────────────
// API Route: /api/versions
// ─────────────────────────────────────────────────────────────
// Document version management endpoints:
//
//   GET  ?projectId=xxx              — List version snapshots
//   GET  ?projectId=xxx&id=vId       — Get specific version
//   POST { projectId, action }       — Actions:
//     • { action: "snapshot", content, label? }
//       → Save a named version snapshot  
//     • { action: "auto_snapshot", content }
//       → Save an auto-snapshot (throttled to 1 per 5 min)
//     • { action: "diff", versionA, versionB }
//       → Compute diff between two versions
//     • { action: "restore", versionId }
//       → Get the content of a version for restoration
//     • { action: "delete", versionId }
//       → Delete a version snapshot
//
// Snapshots are stored in a `document_versions` table.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeDiff, diffSummary } from '@/lib/diff';

// Auto-snapshot throttle: 1 per 5 minutes per project
const autoSnapshotTimestamps = new Map<string, number>();
const AUTO_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

// ── GET: List / Get ──────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const versionId = searchParams.get('id');

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
        }

        if (versionId) {
            // Get specific version
            const { data: version, error } = await supabase
                .from('document_versions')
                .select('*')
                .eq('id', versionId)
                .eq('project_id', projectId)
                .single();

            if (error || !version) {
                return NextResponse.json({ error: 'Version not found' }, { status: 404 });
            }

            return NextResponse.json(version);
        }

        // List all versions (newest first), return metadata only (no content)
        const { data: versions, error } = await supabase
            .from('document_versions')
            .select('id, project_id, label, is_auto, created_at, content_length, user_id')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            return NextResponse.json({ error: 'Failed to list versions' }, { status: 500 });
        }

        return NextResponse.json({
            versions: versions || [],
            total: versions?.length || 0,
        });
    } catch (error) {
        console.error('[Versions GET] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// ── POST: Actions ────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { projectId, action } = body;

        if (!projectId || !action) {
            return NextResponse.json({ error: 'Missing projectId or action' }, { status: 400 });
        }

        switch (action) {
            case 'snapshot':
                return handleSnapshot(supabase, user.id, projectId, body.content, body.label, false);

            case 'auto_snapshot':
                return handleAutoSnapshot(supabase, user.id, projectId, body.content);

            case 'diff':
                return handleDiff(supabase, projectId, body.versionA, body.versionB);

            case 'restore':
                return handleRestore(supabase, projectId, body.versionId);

            case 'delete':
                return handleDelete(supabase, projectId, body.versionId);

            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (error) {
        console.error('[Versions POST] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// ── Handlers ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSnapshot(
    supabase: any,
    userId: string,
    projectId: string,
    content: string,
    label?: string,
    isAuto: boolean = false
) {
    if (!content || typeof content !== 'string') {
        return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('document_versions')
        .insert({
            project_id: projectId,
            user_id: userId,
            content,
            content_length: content.length,
            label: label || (isAuto ? 'Auto-save' : `Snapshot ${new Date().toLocaleString()}`),
            is_auto: isAuto,
        })
        .select('id, label, is_auto, created_at, content_length')
        .single();

    if (error) {
        return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 });
    }

    // Prune old auto-snapshots (keep max 50 per project)
    await pruneAutoSnapshots(supabase, projectId);

    return NextResponse.json({ saved: true, version: data });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleAutoSnapshot(
    supabase: any,
    userId: string,
    projectId: string,
    content: string
) {
    // Throttle: only allow 1 auto-snapshot per 5 minutes per project
    const lastTime = autoSnapshotTimestamps.get(projectId) || 0;
    const now = Date.now();

    if (now - lastTime < AUTO_SNAPSHOT_INTERVAL_MS) {
        return NextResponse.json({
            saved: false,
            reason: 'throttled',
            nextAllowedIn: Math.ceil((AUTO_SNAPSHOT_INTERVAL_MS - (now - lastTime)) / 1000),
        });
    }

    autoSnapshotTimestamps.set(projectId, now);
    return handleSnapshot(supabase, userId, projectId, content, undefined, true);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDiff(
    supabase: any,
    projectId: string,
    versionA: string,
    versionB: string
) {
    if (!versionA || !versionB) {
        return NextResponse.json({ error: 'Missing versionA or versionB' }, { status: 400 });
    }

    // Fetch both versions
    const { data: versions, error } = await supabase
        .from('document_versions')
        .select('id, content, label, created_at')
        .eq('project_id', projectId)
        .in('id', [versionA, versionB]);

    if (error || !versions || versions.length < 2) {
        return NextResponse.json({ error: 'One or both versions not found' }, { status: 404 });
    }

    const a = versions.find((v: { id: string }) => v.id === versionA);
    const b = versions.find((v: { id: string }) => v.id === versionB);

    if (!a || !b) {
        return NextResponse.json({ error: 'Version mismatch' }, { status: 404 });
    }

    const diff = computeDiff(a.content, b.content);

    return NextResponse.json({
        diff: {
            lines: diff.lines,
            additions: diff.additions,
            deletions: diff.deletions,
            unchanged: diff.unchanged,
            summary: diffSummary(diff),
        },
        versionA: { id: a.id, label: a.label, createdAt: a.created_at },
        versionB: { id: b.id, label: b.label, createdAt: b.created_at },
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRestore(
    supabase: any,
    projectId: string,
    versionId: string
) {
    if (!versionId) {
        return NextResponse.json({ error: 'Missing versionId' }, { status: 400 });
    }

    const { data: version, error } = await supabase
        .from('document_versions')
        .select('id, content, label, created_at')
        .eq('id', versionId)
        .eq('project_id', projectId)
        .single();

    if (error || !version) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({
        content: version.content,
        label: version.label,
        createdAt: version.created_at,
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDelete(
    supabase: any,
    projectId: string,
    versionId: string
) {
    if (!versionId) {
        return NextResponse.json({ error: 'Missing versionId' }, { status: 400 });
    }

    const { error } = await supabase
        .from('document_versions')
        .delete()
        .eq('id', versionId)
        .eq('project_id', projectId);

    if (error) {
        return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
}

// ── Pruning ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pruneAutoSnapshots(supabase: any, projectId: string) {
    // Keep only the 50 most recent auto-snapshots
    const { data: autoVersions } = await supabase
        .from('document_versions')
        .select('id')
        .eq('project_id', projectId)
        .eq('is_auto', true)
        .order('created_at', { ascending: false });

    if (autoVersions && autoVersions.length > 50) {
        const idsToDelete = autoVersions.slice(50).map((v: { id: string }) => v.id);
        await supabase
            .from('document_versions')
            .delete()
            .in('id', idsToDelete);
    }
}
