// ─────────────────────────────────────────────────────────────
// API Route: /api/projects/[id]/assets
// ─────────────────────────────────────────────────────────────
// POST   — upload a binary asset (multipart/form-data)
// GET    — list project assets (optional ?directory= filter)
// DELETE — remove an asset by path (?path=figures/image.png)
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    uploadAsset,
    deleteAsset,
    listAssets,
    checkStorageLimits,
    inferDirectory,
    isAllowedMime,
} from '@/lib/storage';
import type { AssetDirectory, SubscriptionTier } from '@/types';

// ── POST — Upload Asset ──────────────────────────────────────

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const supabase = await createClient();

        // Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify project access
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, owner_id')
            .eq('id', projectId)
            .single();

        if (projectError || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Get user tier for storage limits
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single();

        const tier = (profile?.subscription_tier || 'free') as SubscriptionTier;

        // Parse multipart form
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const directory = (formData.get('directory') as string) || 'figures';
        const customPath = formData.get('path') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Build asset path
        const assetPath = customPath || `${directory}/${file.name}`;
        const resolvedDir = inferDirectory(assetPath);

        // Validate MIME type
        if (!isAllowedMime(file.type, resolvedDir)) {
            return NextResponse.json(
                { error: `File type "${file.type}" is not allowed in /${resolvedDir}` },
                { status: 400 }
            );
        }

        // Check storage limits
        const limitCheck = await checkStorageLimits(supabase, projectId, file.size, tier);
        if (!limitCheck.allowed) {
            return NextResponse.json(
                { error: limitCheck.reason },
                { status: 413 }
            );
        }

        // Upload
        const result = await uploadAsset(supabase, {
            projectId,
            path: assetPath,
            file,
            filename: file.name,
            mimeType: file.type,
            userId: user.id,
        });

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            asset: result.asset,
            message: `Uploaded ${file.name} to /${assetPath}`,
        }, { status: 201 });

    } catch (error) {
        console.error('[API /assets POST] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ── GET — List Assets ────────────────────────────────────────

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const supabase = await createClient();

        // Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Optional directory filter
        const directory = request.nextUrl.searchParams.get('directory') as AssetDirectory | null;

        const assets = await listAssets(supabase, projectId, directory || undefined);

        return NextResponse.json({ assets });

    } catch (error) {
        console.error('[API /assets GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ── DELETE — Remove Asset ────────────────────────────────────

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const supabase = await createClient();

        // Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get path from query param
        const assetPath = request.nextUrl.searchParams.get('path');
        if (!assetPath) {
            return NextResponse.json({ error: 'Missing ?path= parameter' }, { status: 400 });
        }

        const result = await deleteAsset(supabase, projectId, assetPath);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            message: `Deleted ${assetPath}`,
        });

    } catch (error) {
        console.error('[API /assets DELETE] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
