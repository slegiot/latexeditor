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
        <div className="min-h-screen bg-surface-950">
            <Navbar
                user={{
                    email: user.email ?? "",
                    fullName: profile?.full_name ?? "",
                    avatarUrl: profile?.avatar_url ?? "",
                }}
            />

            <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                {profile?.full_name
                                    ? `Welcome back, ${profile.full_name.split(" ")[0]} 👋`
                                    : "Your Projects"}
                            </h1>
                            <p className="text-surface-500 text-sm mt-1">
                                {projects?.length ?? 0} project
                                {(projects?.length ?? 0) !== 1 ? "s" : ""}
                                {" · "}
                                Manage and edit your LaTeX documents
                            </p>
                        </div>

                        <NewProjectDialog />
                    </div>

                    {/* Search bar */}
                    {projects && projects.length > 0 && (
                        <div className="relative mb-8">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                id="project-search"
                                aria-label="Search projects"
                                className="input-field pl-10 max-w-md"
                                onInput={(e) => {
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
                        <div className="glass rounded-2xl p-8 text-center">
                            <p className="text-danger">Failed to load projects. Please try again.</p>
                        </div>
                    ) : projects && projects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {projects.map((project, i) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    index={i}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-2xl p-12 text-center max-w-md mx-auto animate-slide-up">
                            <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-5">
                                <FileText className="w-8 h-8 text-surface-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">No projects yet</h2>
                            <p className="text-sm text-surface-400 mb-6">
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
