import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    cloneRepo,
    pullRepo,
    pushRepo,
    getLog,
    getStatus,
    cleanupRepo,
} from "@/lib/git-service";

/**
 * POST /api/git
 * Multiplexed Git operations endpoint.
 * Body: { action, projectId, repoUrl?, content?, commitMessage? }
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, projectId, repoUrl, content, commitMessage } = body;

    if (!action || !projectId) {
        return NextResponse.json(
            { error: "Missing action or projectId" },
            { status: 400 }
        );
    }

    // Verify project ownership
    const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .single();

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get GitHub token
    const { data: connection } = await supabase
        .from("github_connections")
        .select("access_token, github_username")
        .eq("user_id", user.id)
        .single();

    const token = connection?.access_token || "";

    // Get user profile for commits
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

    const author = {
        name: profile?.full_name || user.email?.split("@")[0] || "LatexForge User",
        email: user.email || "user@latexforge.dev",
    };

    switch (action) {
        case "link": {
            if (!repoUrl) {
                return NextResponse.json({ error: "Missing repoUrl" }, { status: 400 });
            }
            if (!token) {
                return NextResponse.json(
                    { error: "GitHub not connected. Link your account first." },
                    { status: 400 }
                );
            }

            // Store repo URL in project
            await supabase
                .from("projects")
                .update({ github_repo_url: repoUrl })
                .eq("id", projectId);

            // Clone the repo
            const result = await cloneRepo(projectId, repoUrl, token);
            return NextResponse.json(result);
        }

        case "clone": {
            const { data: proj } = await supabase
                .from("projects")
                .select("github_repo_url")
                .eq("id", projectId)
                .single();

            if (!proj?.github_repo_url) {
                return NextResponse.json({ error: "No repo linked" }, { status: 400 });
            }
            if (!token) {
                return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
            }

            const result = await cloneRepo(projectId, proj.github_repo_url, token);
            return NextResponse.json(result);
        }

        case "pull": {
            if (!token) {
                return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
            }
            const result = await pullRepo(projectId, token);
            return NextResponse.json(result);
        }

        case "push": {
            if (!token) {
                return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
            }
            const result = await pushRepo(
                projectId,
                token,
                content || "",
                commitMessage || `Update from LatexForge — ${new Date().toLocaleString()}`,
                author
            );
            return NextResponse.json(result);
        }

        case "status": {
            const result = await getStatus(projectId);
            return NextResponse.json(result);
        }

        case "log": {
            const result = await getLog(projectId);
            return NextResponse.json(result);
        }

        case "unlink": {
            await supabase
                .from("projects")
                .update({ github_repo_url: null })
                .eq("id", projectId);
            cleanupRepo(projectId);
            return NextResponse.json({ success: true, message: "Repo unlinked" });
        }

        default:
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
}
