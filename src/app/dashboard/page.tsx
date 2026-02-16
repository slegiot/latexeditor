import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plus, FileText, Clock, Globe, Lock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProjectCard } from "@/components/ProjectCard";
import { NewProjectDialog } from "@/components/NewProjectDialog";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false });

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <div className="min-h-dvh flex flex-col">
            <Navbar
                user={{
                    email: user.email ?? "",
                    fullName: profile?.full_name ?? "",
                    avatarUrl: profile?.avatar_url ?? "",
                }}
            />

            <main className="flex-1 pt-20 pb-8 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {profile?.full_name
                                    ? `Welcome back, ${profile.full_name.split(" ")[0]}`
                                    : "Your Projects"}
                            </h1>
                            <p className="text-[var(--color-surface-600)] text-sm mt-0.5">
                                {projects?.length ?? 0} project
                                {(projects?.length ?? 0) !== 1 ? "s" : ""}
                            </p>
                        </div>

                        <NewProjectDialog />
                    </div>

                    {/* Projects Grid */}
                    {error ? (
                        <div className="glass rounded-2xl p-8 text-center">
                            <p className="text-red-400">
                                Failed to load projects. Please try again.
                            </p>
                        </div>
                    ) : projects && projects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {projects.map((project, i) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    index={i}
                                />
                            ))}
                        </div>
                    ) : (
                        /* Empty state */
                        <div className="glass rounded-xl p-8 text-center max-w-md mx-auto animate-fade-in">
                            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-500)]/10 flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-6 h-6 text-[var(--color-accent-400)]" />
                            </div>
                            <h2 className="text-lg font-semibold mb-1">
                                No projects yet
                            </h2>
                            <p className="text-[var(--color-surface-600)] text-sm mb-4">
                                Create your first LaTeX project to start writing and
                                collaborating.
                            </p>
                            <NewProjectDialog />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
