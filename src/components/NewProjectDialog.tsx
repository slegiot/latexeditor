"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, Loader2, FileText, LayoutTemplate } from "lucide-react";
import { createProject, createProjectFromTemplate } from "@/app/dashboard/actions";
import { TemplatesGallery } from "./TemplatesGallery";
import { useRouter } from "next/navigation";
import type { LatexTemplate } from "@/lib/latex-templates";

export function NewProjectDialog() {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<"blank" | "template">("blank");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (open && nameRef.current && tab === "blank") {
            nameRef.current.focus();
        }
    }, [open, tab]);

    useEffect(() => {
        function handleEsc(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        if (open) {
            document.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.target as HTMLFormElement);
        const result = await createProject(formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setOpen(false);
            setLoading(false);
            router.refresh();
        }
    };

    const handleTemplateSelect = async (template: LatexTemplate) => {
        setLoading(true);
        setError(null);

        const result = await createProjectFromTemplate(
            template.name,
            template.description,
            template.content
        );

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setOpen(false);
            setLoading(false);
            if (result.projectId) {
                router.push(`/editor/${result.projectId}`);
            } else {
                router.refresh();
            }
        }
    };

    return (
        <>
            <button onClick={() => setOpen(true)} className="btn-primary text-sm px-3 py-2">
                <Plus className="w-4 h-4" />
                New Project
            </button>

            {/* Modal Overlay */}
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Dialog */}
                    <div
                        ref={dialogRef}
                        className="relative w-full max-w-lg glass rounded-2xl p-6 animate-scale-in shadow-[var(--shadow-card)]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-500)]/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-[var(--color-accent-400)]" />
                                </div>
                                <h2 className="text-lg font-semibold">New Project</h2>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                            >
                                <X className="w-4 h-4 text-[var(--color-surface-500)]" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-[var(--color-surface-100)]">
                            <button
                                onClick={() => setTab("blank")}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${tab === "blank"
                                    ? "bg-[var(--color-accent-500)] text-white"
                                    : "hover:bg-[var(--color-glass-hover)]"
                                    }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Blank
                            </button>
                            <button
                                onClick={() => setTab("template")}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${tab === "template"
                                    ? "bg-[var(--color-accent-500)] text-white"
                                    : "hover:bg-[var(--color-glass-hover)]"
                                    }`}
                            >
                                <LayoutTemplate className="w-3.5 h-3.5" />
                                Templates
                            </button>
                        </div>

                        {tab === "blank" ? (
                            /* Blank Form */
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="project-name"
                                        className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5"
                                    >
                                        Project Name
                                    </label>
                                    <input
                                        ref={nameRef}
                                        id="project-name"
                                        name="name"
                                        type="text"
                                        placeholder="My Research Paper"
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="project-desc"
                                        className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5"
                                    >
                                        Description{" "}
                                        <span className="text-[var(--color-surface-500)] font-normal">
                                            (optional)
                                        </span>
                                    </label>
                                    <textarea
                                        id="project-desc"
                                        name="description"
                                        placeholder="A brief description of your project..."
                                        rows={3}
                                        className="input-field resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                Create
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* Template Gallery */
                            <div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-surface-500)]" />
                                    </div>
                                ) : (
                                    <TemplatesGallery onSelect={handleTemplateSelect} />
                                )}
                                {error && (
                                    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
