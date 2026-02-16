import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditorPage } from "@/components/EditorPage";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditorRoute({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch the project (including github_repo_url)
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

    if (!project || projectError) {
        redirect("/dashboard");
    }

    // Fetch the main document for this project
    const { data: document } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

    // Fetch user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

    // Check GitHub connection
    const { data: githubConnection } = await supabase
        .from("github_connections")
        .select("github_username")
        .eq("user_id", user.id)
        .single();

    // Get the current session access token for WS authentication
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Default content if no document exists yet
    const defaultContent = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}

\\title{${project.name}}
\\author{}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Start writing here...

\\end{document}
`;

    return (
        <EditorPage
            project={{
                id: project.id,
                name: project.name,
                description: project.description,
            }}
            initialContent={document?.content ?? defaultContent}
            documentId={document?.id}
            user={{
                name: profile?.full_name || user.email?.split("@")[0] || "Anonymous",
                email: user.email || "",
            }}
            accessToken={session?.access_token || ""}
            githubConnected={!!githubConnection}
            githubRepoUrl={project.github_repo_url || null}
        />
    );
}
