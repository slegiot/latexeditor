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
            <button onClick={() => setOpen(true)} className="btn-primary">
                <Plus className="w-4 h-4" />
                New Project
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="backdrop-overlay" onClick={() => setOpen(false)} />

                    {/* Dialog */}
                    <div
                        ref={dialogRef}
                        className="relative z-50 w-full max-w-lg glass rounded-2xl shadow-2xl animate-scale-in"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800/50">
                            <div className="flex items-center gap-2.5">
                                <FileText className="w-5 h-5 text-accent-400" />
                                <h2 className="text-lg font-semibold text-white">New Project</h2>
                            </div>
                            <button onClick={() => setOpen(false)} className="btn-ghost p-1.5" aria-label="Close">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-surface-800/50">
                            <button
                                onClick={() => setTab("blank")}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${tab === "blank"
                                        ? "border-accent-500 text-accent-400"
                                        : "border-transparent text-surface-500 hover:text-surface-300"
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                Blank
                            </button>
                            <button
                                onClick={() => setTab("template")}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${tab === "template"
                                        ? "border-accent-500 text-accent-400"
                                        : "border-transparent text-surface-500 hover:text-surface-300"
                                    }`}
                            >
                                <LayoutTemplate className="w-4 h-4" />
                                Templates
                            </button>
                        </div>

                        {tab === "blank" ? (
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="project-name" className="block text-sm font-medium text-surface-300 mb-1.5">
                                        Project Name
                                    </label>
                                    <input
                                        ref={nameRef}
                                        id="project-name"
                                        name="name"
                                        type="text"
                                        placeholder="My Research Paper"
                                        required
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="project-desc" className="block text-sm font-medium text-surface-300 mb-1.5">
                                        Description <span className="text-surface-600">(optional)</span>
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
                                    <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 icon-spin" />
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
                            <div className="p-6">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 text-accent-400 icon-spin" />
                                    </div>
                                ) : (
                                    <TemplatesGallery onSelect={handleTemplateSelect} />
                                )}
                                {error && (
                                    <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mt-4">
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
