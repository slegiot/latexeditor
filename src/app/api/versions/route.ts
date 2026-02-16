import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/versions?projectId=xxx
 * Returns version history for a project.
 *
 * POST /api/versions
 * Creates a named version snapshot.
 */
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // Verify ownership
    const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .single();

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: versions, error } = await supabase
        .from("document_versions")
        .select("id, label, content, created_at, word_count")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ versions: versions || [] });
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, content, label } = await request.json();

    if (!projectId || !content) {
        return NextResponse.json({ error: "Missing projectId or content" }, { status: 400 });
    }

    // Verify ownership
    const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .single();

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Simple word count
    const wordCount = content
        .replace(/\\[a-zA-Z]+/g, "") // Remove LaTeX commands
        .replace(/[{}[\]()]/g, "")
        .split(/\s+/)
        .filter((w: string) => w.length > 0).length;

    const { data: version, error } = await supabase
        .from("document_versions")
        .insert({
            project_id: projectId,
            user_id: user.id,
            content,
            label: label || `Auto-save ${new Date().toLocaleString()}`,
            word_count: wordCount,
        })
        .select("id, label, created_at, word_count")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ version });
}
