import { createClient } from "@/lib/supabase/server";
import { FileText, ExternalLink, Download } from "lucide-react";
import Link from "next/link";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function SharedProjectPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch the project (must be public)
    const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("is_public", true)
        .single();

    if (!project || error) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-[var(--color-surface-0)]">
                <div className="text-center space-y-4 animate-fade-in">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-surface-200)]/10 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-[var(--color-surface-500)]" />
                    </div>
                    <h1 className="text-xl font-bold">Project Not Found</h1>
                    <p className="text-sm text-[var(--color-surface-500)]">
                        This project doesn&apos;t exist or isn&apos;t publicly shared.
                    </p>
                    <Link href="/" className="btn-primary inline-flex">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    // Fetch the document content
    const { data: document } = await supabase
        .from("documents")
        .select("content")
        .eq("project_id", id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

    const content = document?.content || "";
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    return (
        <div className="min-h-dvh bg-[var(--color-surface-0)]">
            {/* Header */}
            <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-50)]">
                <div className="flex items-center gap-3">
                    <Link href="/" className="text-[var(--color-accent-400)] font-bold text-lg">
                        LatexForge
                    </Link>
                    <div className="h-5 w-px bg-[var(--color-glass-border)]" />
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--color-surface-500)]" />
                        <span className="text-sm font-medium truncate max-w-[250px]">
                            {project.name}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-surface-500)]">
                        {wordCount} words · Read-only
                    </span>
                    <Link
                        href="/signup"
                        className="btn-primary text-xs !px-3 !py-1.5"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Create Your Own
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {project.description && (
                    <p className="text-sm text-[var(--color-surface-600)] mb-6">
                        {project.description}
                    </p>
                )}
                <div className="rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-100)] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-glass-border)] text-xs text-[var(--color-surface-500)]">
                        <span>main.tex</span>
                        <button
                            onClick={undefined}
                            className="flex items-center gap-1 hover:text-[var(--color-surface-700)] transition-colors"
                        >
                            <Download className="w-3 h-3" />
                            Download
                        </button>
                    </div>
                    <pre className="p-4 text-sm font-mono text-[var(--color-surface-800)] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[70vh] overflow-y-auto">
                        {content}
                    </pre>
                </div>
            </main>
        </div>
    );
}
