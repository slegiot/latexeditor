import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "project-assets";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = new Set([
    "png", "jpg", "jpeg", "gif", "svg",
    "pdf", "eps", "bib",
]);

/**
 * GET /api/assets?projectId=xxx
 * List all assets for a project.
 */
export async function GET(request: NextRequest) {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: files, error } = await supabase.storage
        .from(BUCKET)
        .list(projectId, { limit: 100, sortBy: { column: "name", order: "asc" } });

    if (error) {
        console.error("[assets] list error", error);
        return NextResponse.json({ error: "Failed to list assets" }, { status: 500 });
    }

    // Return file metadata with download URLs
    const assets = (files ?? [])
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((f) => {
            const { data } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(`${projectId}/${f.name}`);

            return {
                name: f.name,
                size: f.metadata?.size ?? 0,
                type: f.metadata?.mimetype ?? "",
                created: f.created_at,
                url: data.publicUrl,
            };
        });

    return NextResponse.json({ assets });
}

/**
 * POST /api/assets (multipart form)
 * Upload a file to a project.
 * Form fields: projectId, file
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const projectId = formData.get("projectId") as string;
    const file = formData.get("file") as File | null;

    if (!projectId || !file) {
        return NextResponse.json({ error: "Missing projectId or file" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
        return NextResponse.json(
            { error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.` },
            { status: 400 }
        );
    }

    // Validate extension
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
            { error: `File type .${ext} is not allowed. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}` },
            { status: 400 }
        );
    }

    // Sanitize filename — keep only safe characters
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${projectId}/${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
        });

    if (error) {
        console.error("[assets] upload error", error);
        return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        name: safeName,
        path: storagePath,
        snippet: ext === "bib"
            ? `\\bibliography{${safeName.replace(`.${ext}`, "")}}`
            : `\\includegraphics{${safeName}}`,
    });
}

/**
 * DELETE /api/assets?projectId=xxx&filename=yyy
 * Delete a single asset from a project.
 */
export async function DELETE(request: NextRequest) {
    const projectId = request.nextUrl.searchParams.get("projectId");
    const filename = request.nextUrl.searchParams.get("filename");

    if (!projectId || !filename) {
        return NextResponse.json({ error: "Missing projectId or filename" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.storage
        .from(BUCKET)
        .remove([`${projectId}/${filename}`]);

    if (error) {
        console.error("[assets] delete error", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
