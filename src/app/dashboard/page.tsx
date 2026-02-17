import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plus, FileText, Clock, Globe, Lock, Search } from "lucide-react";
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
        <div className="min-h-dvh flex flex-col bg-[var(--color-surface-0)]">
            <Navbar
                user={{
                    email: user.email ?? "",
                    fullName: profile?.full_name ?? "",
                    avatarUrl: profile?.avatar_url ?? "",
                }}
            />

            <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 animate-fade-in">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">
                                {profile?.full_name
                                    ? `Welcome back, ${profile.full_name.split(" ")[0]} 👋`
                                    : "Your Projects"}
                            </h1>
                            <p className="text-[var(--color-surface-600)] text-sm mt-1">
                                {projects?.length ?? 0} project
                                {(projects?.length ?? 0) !== 1 ? "s" : ""}
                                {" · "}
                                Manage and edit your LaTeX documents
                            </p>
                        </div>

                        <NewProjectDialog />
                    </div>

                    {/* Search bar (client-side filtering handled natively) */}
                    {projects && projects.length > 0 && (
                        <div className="relative mb-6 max-w-md animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-surface-500)]" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="input-field pl-10"
                                id="project-search"
                                aria-label="Search projects"
                                onInput={(e) => {
                                    // Client-side filtering via data attributes
                                    const query = (e.target as HTMLInputElement).value.toLowerCase();
                                    const cards = document.querySelectorAll('[data-project-card]');
                                    cards.forEach((card) => {
                                        const name = card.getAttribute('data-project-name')?.toLowerCase() ?? '';
                                        (card as HTMLElement).style.display = name.includes(query) ? '' : 'none';
                                    });
                                }}
                            />
                        </div>
                    )}

                    {/* Projects Grid */}
                    {error ? (
                        <div className="card-glass p-10 text-center animate-fade-in">
                            <p className="text-red-400 text-sm">
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
                        <div className="card-glass p-12 text-center max-w-md mx-auto animate-fade-in">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent-500)]/20 to-[var(--color-accent-700)]/10 flex items-center justify-center mx-auto mb-5">
                                <FileText className="w-8 h-8 text-[var(--color-accent-400)]" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">
                                No projects yet
                            </h2>
                            <p className="text-[var(--color-surface-600)] text-sm mb-6 leading-relaxed">
                                Create your first LaTeX project to start writing and
                                collaborating with your team.
                            </p>
                            <NewProjectDialog />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
