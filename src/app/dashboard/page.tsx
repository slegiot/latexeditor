import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProjectCard } from "@/components/ProjectCard";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { Suspense } from "react";
import {
    Plus,
    Search,
    FolderOpen,
    Clock,
    Star,
    Settings,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user's projects
    const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false });

    // Fetch shared projects
    const { data: sharedProjects } = await supabase
        .from("project_shares")
        .select("project:projects(*)")
        .eq("shared_with_user_id", user.id);

    const allProjects = projects || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharedProjectList = (sharedProjects as any[])
        ?.map((s) => s.project)
        .filter(Boolean) || [];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Navbar showNavLinks={false} />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                                Your Projects
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Manage and collaborate on your LaTeX documents
                            </p>
                        </div>
                        <NewProjectDialog />
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            icon={FolderOpen}
                            label="Total Projects"
                            value={allProjects.length}
                        />
                        <StatCard
                            icon={Clock}
                            label="Recent Edits"
                            value={allProjects.filter(
                                (p) =>
                                    new Date(p.updated_at) >
                                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            ).length}
                        />
                        <StatCard
                            icon={Star}
                            label="Shared With You"
                            value={sharedProjectList.length}
                        />
                        <StatCard icon={Settings} label="Storage Used" value="12%" />
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="input-field pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="input-field w-auto pr-8">
                                <option value="all">All Projects</option>
                                <option value="recent">Recently Edited</option>
                                <option value="shared">Shared With Me</option>
                            </select>
                        </div>
                    </div>

                    {/* Projects Grid */}
                    <Suspense fallback={<ProjectsSkeleton />}>
                        {allProjects.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {allProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        id={project.id}
                                        name={project.name}
                                        description={project.description}
                                        updatedAt={project.updated_at}
                                        fileCount={1}
                                        collaborators={1}
                                    />
                                ))}
                            </div>
                        )}
                    </Suspense>

                    {/* Shared Projects Section */}
                    {sharedProjectList.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Star className="w-5 h-5 text-emerald-400" />
                                Shared With You
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sharedProjectList.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        id={project.id}
                                        name={project.name}
                                        description={project.description}
                                        updatedAt={project.updated_at}
                                        fileCount={1}
                                        collaborators={2}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
}) {
    return (
        <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-[var(--text-muted)]">{label}</p>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                Create your first LaTeX project to get started. Choose from our
                templates or start from scratch.
            </p>
            <NewProjectDialog />
        </div>
    );
}

function ProjectsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)]" />
                    </div>
                    <div className="h-6 bg-[var(--bg-tertiary)] rounded mb-2 w-3/4" />
                    <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-4 w-full" />
                    <div className="flex items-center gap-3">
                        <div className="h-3 bg-[var(--bg-tertiary)] rounded w-20" />
                        <div className="h-3 bg-[var(--bg-tertiary)] rounded w-16" />
                    </div>
                </div>
            ))}
        </div>
    );
}
