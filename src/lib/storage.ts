// ─────────────────────────────────────────────────────────────
// LaTeXForge — Supabase Storage Service
// ─────────────────────────────────────────────────────────────
// Wraps Supabase Storage operations for project binary assets.
// Storage keys follow: projects/{projectId}/{path}
// This mirrors the LaTeX directory layout, so that during
// compilation we can reconstruct the exact file tree.
// ─────────────────────────────────────────────────────────────

import { SupabaseClient } from '@supabase/supabase-js';
import type { AssetDirectory, ProjectAsset, SubscriptionTier } from '@/types';
import { STORAGE_LIMITS, ALLOWED_ASSET_MIMES } from '@/types';

const BUCKET = 'project-assets';

// ── Storage Key Helpers ──────────────────────────────────────

/**
 * Build the Supabase Storage key for an asset.
 * Pattern: `{projectId}/{directory}/{filename}`
 * This directly mirrors the LaTeX \includegraphics path.
 *
 * Example:
 *   projectId = "abc-123"
 *   path      = "figures/diagram.png"
 *   key       = "abc-123/figures/diagram.png"
 */
export function buildStorageKey(projectId: string, assetPath: string): string {
    return `${projectId}/${assetPath}`;
}

/**
 * Infer the asset directory from a file path.
 * "figures/foo.png"  → "figures"
 * "data/results.csv" → "data"
 * "references.bib"   → "root"
 */
export function inferDirectory(assetPath: string): AssetDirectory {
    const parts = assetPath.split('/');
    if (parts.length > 1) {
        const dir = parts[0] as AssetDirectory;
        if (['figures', 'data', 'sections'].includes(dir)) return dir;
    }
    return 'root';
}

/**
 * Validate that a MIME type is allowed for the target directory.
 */
export function isAllowedMime(mimeType: string, directory: AssetDirectory): boolean {
    const allowed = ALLOWED_ASSET_MIMES[directory];
    return allowed ? allowed.includes(mimeType) : false;
}

// ── Storage Operations ───────────────────────────────────────

/**
 * Upload a binary asset to Supabase Storage and create metadata record.
 */
export async function uploadAsset(
    supabase: SupabaseClient,
    params: {
        projectId: string;
        path: string;         // e.g. "figures/diagram.png"
        file: File | Blob;
        filename: string;
        mimeType: string;
        userId: string;
    }
): Promise<{ asset: ProjectAsset; error: null } | { asset: null; error: string }> {
    const { projectId, path: assetPath, file, filename, mimeType, userId } = params;

    const directory = inferDirectory(assetPath);

    // Validate MIME type
    if (!isAllowedMime(mimeType, directory)) {
        return { asset: null, error: `File type "${mimeType}" is not allowed in /${directory}` };
    }

    const storageKey = buildStorageKey(projectId, assetPath);
    const sizeBytes = file.size;

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storageKey, file, {
            contentType: mimeType,
            upsert: true,  // Overwrite if exists
        });

    if (uploadError) {
        return { asset: null, error: `Storage upload failed: ${uploadError.message}` };
    }

    // Create metadata record
    const { data: asset, error: dbError } = await supabase
        .from('project_assets')
        .upsert(
            {
                project_id: projectId,
                path: assetPath,
                storage_key: storageKey,
                filename,
                mime_type: mimeType,
                size_bytes: sizeBytes,
                directory,
                uploaded_by: userId,
            },
            { onConflict: 'project_id,path' }
        )
        .select()
        .single();

    if (dbError) {
        // Rollback: delete the uploaded file
        await supabase.storage.from(BUCKET).remove([storageKey]);
        return { asset: null, error: `Metadata insert failed: ${dbError.message}` };
    }

    return { asset, error: null };
}

/**
 * Delete an asset from both Storage and DB.
 */
export async function deleteAsset(
    supabase: SupabaseClient,
    projectId: string,
    assetPath: string
): Promise<{ error: string | null }> {
    const storageKey = buildStorageKey(projectId, assetPath);

    // Delete from Storage
    const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([storageKey]);

    if (storageError) {
        return { error: `Storage delete failed: ${storageError.message}` };
    }

    // Delete metadata
    const { error: dbError } = await supabase
        .from('project_assets')
        .delete()
        .eq('project_id', projectId)
        .eq('path', assetPath);

    if (dbError) {
        return { error: `Metadata delete failed: ${dbError.message}` };
    }

    return { error: null };
}

/**
 * Get a signed download URL for an asset (valid for 1 hour).
 */
export async function getAssetUrl(
    supabase: SupabaseClient,
    projectId: string,
    assetPath: string
): Promise<string | null> {
    const storageKey = buildStorageKey(projectId, assetPath);

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storageKey, 3600); // 1 hour

    if (error || !data) return null;
    return data.signedUrl;
}

/**
 * List all assets for a project, optionally filtered by directory.
 */
export async function listAssets(
    supabase: SupabaseClient,
    projectId: string,
    directory?: AssetDirectory
): Promise<ProjectAsset[]> {
    let query = supabase
        .from('project_assets')
        .select('*')
        .eq('project_id', projectId)
        .order('path', { ascending: true });

    if (directory) {
        query = query.eq('directory', directory);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data;
}

/**
 * Get the full asset manifest for a compile job.
 * Returns tuples of (path, storage_key) so the worker can
 * download each binary and place it at the correct path.
 */
export async function getAssetManifest(
    supabase: SupabaseClient,
    projectId: string
): Promise<Array<{ path: string; storage_key: string }>> {
    const { data, error } = await supabase
        .from('project_assets')
        .select('path, storage_key')
        .eq('project_id', projectId);

    if (error || !data) return [];
    return data;
}

/**
 * Get total storage used by a project (in bytes).
 */
export async function getProjectStorageUsage(
    supabase: SupabaseClient,
    projectId: string
): Promise<number> {
    const { data, error } = await supabase
        .rpc('get_project_storage_bytes', { p_project_id: projectId });

    if (error || data === null) return 0;
    return Number(data);
}

/**
 * Check if a file upload would exceed the user's storage limits.
 */
export async function checkStorageLimits(
    supabase: SupabaseClient,
    projectId: string,
    fileSizeBytes: number,
    tier: SubscriptionTier
): Promise<{ allowed: boolean; reason?: string }> {
    const limits = STORAGE_LIMITS[tier];

    // Check per-file limit
    if (fileSizeBytes > limits.maxFileBytes) {
        const maxMB = Math.round(limits.maxFileBytes / (1024 * 1024));
        return { allowed: false, reason: `File exceeds ${maxMB}MB limit for ${tier} tier` };
    }

    // Check total project storage
    const currentUsage = await getProjectStorageUsage(supabase, projectId);
    if (currentUsage + fileSizeBytes > limits.maxProjectBytes) {
        const maxMB = Math.round(limits.maxProjectBytes / (1024 * 1024));
        return { allowed: false, reason: `Project would exceed ${maxMB}MB storage limit for ${tier} tier` };
    }

    return { allowed: true };
}

/**
 * Download a binary asset from Supabase Storage.
 * Used by the compile worker to fetch assets into the sandbox.
 */
export async function downloadAsset(
    supabase: SupabaseClient,
    storageKey: string
): Promise<{ data: Blob | null; error: string | null }> {
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .download(storageKey);

    if (error) {
        return { data: null, error: `Download failed: ${error.message}` };
    }

    return { data, error: null };
}
