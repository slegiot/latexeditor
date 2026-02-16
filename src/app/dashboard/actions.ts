"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserLimits, getUserProjectCount } from "@/lib/plan-limits";

export async function createProject(formData: FormData) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name || name.trim().length === 0) {
        return { error: "Project name is required" };
    }

    // Enforce project limit based on plan
    const limits = await getUserLimits(user.id);
    const projectCount = await getUserProjectCount(user.id);
    if (projectCount >= limits.maxProjects) {
        return {
            error: `You've reached the ${limits.maxProjects}-project limit on the ${limits.plan} plan. Upgrade to Pro for unlimited projects.`,
        };
    }

    const { error } = await supabase.from("projects").insert({
        owner_id: user.id,
        name: name.trim(),
        description: description?.trim() ?? "",
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard");
    return { error: null };
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("owner_id", user.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard");
    return { error: null };
}

export async function createProjectFromTemplate(
    name: string,
    description: string,
    templateContent: string
) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    if (!name || name.trim().length === 0) {
        return { error: "Project name is required" };
    }

    // Enforce project limit based on plan
    const limits = await getUserLimits(user.id);
    const projectCount = await getUserProjectCount(user.id);
    if (projectCount >= limits.maxProjects) {
        return {
            error: `You've reached the ${limits.maxProjects}-project limit on the ${limits.plan} plan. Upgrade to Pro for unlimited projects.`,
        };
    }

    // Create the project
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
            owner_id: user.id,
            name: name.trim(),
            description: description?.trim() ?? "",
        })
        .select("id")
        .single();

    if (projectError || !project) {
        return { error: projectError?.message || "Failed to create project" };
    }

    // Create the document with template content
    const { error: docError } = await supabase.from("documents").insert({
        project_id: project.id,
        title: "main.tex",
        content: templateContent,
    });

    if (docError) {
        // Clean up the project if document creation failed
        await supabase.from("projects").delete().eq("id", project.id);
        return { error: docError.message };
    }

    revalidatePath("/dashboard");
    return { error: null, projectId: project.id };
}
