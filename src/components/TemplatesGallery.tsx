"use client";

import { useState } from "react";
import { X, Search, FileText, ChevronRight } from "lucide-react";
import { LATEX_TEMPLATES, type LatexTemplate } from "@/lib/latex-templates";

interface TemplatesGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: LatexTemplate) => void;
}

export function TemplatesGallery({
    isOpen,
    onClose,
    onSelect,
}: TemplatesGalleryProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [previewTemplate, setPreviewTemplate] = useState<LatexTemplate | null>(
        null
    );

    const categories = [
        { id: "all", name: "All Templates" },
        { id: "academic", name: "Academic" },
        { id: "presentation", name: "Presentations" },
        { id: "professional", name: "Professional" },
        { id: "general", name: "General" },
    ];

    const filteredTemplates = LATEX_TEMPLATES.filter((template) => {
        const matchesSearch =
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === "all" || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl glass-strong border border-[var(--border-primary)] shadow-2xl animate-scale-in flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
                    <div>
                        <h2 className="text-xl font-semibold">Choose a Template</h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Start with a pre-built template or create from scratch
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="px-6 py-4 border-b border-[var(--border-secondary)] space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search templates..."
                            className="input-field pl-10"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedCategory === category.id
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)]"
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12 text-[var(--text-muted)]">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No templates found</p>
                            <p className="text-sm mt-1">Try adjusting your search</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Blank Template Option */}
                            <button
                                onClick={() =>
                                    onSelect({
                                        id: "blank",
                                        name: "Blank Project",
                                        description: "Start with an empty document",
                                        category: "general",
                                        icon: "📄",
                                        content: "",
                                    })
                                }
                                className="flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-dashed border-[var(--border-primary)] hover:border-emerald-500/50 hover:bg-[var(--bg-tertiary)] transition-all text-left group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/10 transition-colors">
                                    <FileText className="w-6 h-6 text-[var(--text-muted)] group-hover:text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                                        Blank Project
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                        Start with an empty LaTeX document
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            {filteredTemplates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => setPreviewTemplate(template)}
                                    className="flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:border-emerald-500/50 hover:bg-[var(--bg-tertiary)] transition-all text-left group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                        <span className="text-2xl">{template.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                                                {template.name}
                                            </h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] capitalize">
                                                {template.category}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                                            {template.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {previewTemplate && (
                <TemplatePreview
                    template={previewTemplate}
                    onClose={() => setPreviewTemplate(null)}
                    onUse={() => {
                        onSelect(previewTemplate);
                        setPreviewTemplate(null);
                    }}
                />
            )}
        </div>
    );
}

interface TemplatePreviewProps {
    template: LatexTemplate;
    onClose: () => void;
    onUse: () => void;
}

function TemplatePreview({ template, onClose, onUse }: TemplatePreviewProps) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl glass-strong border border-[var(--border-primary)] shadow-2xl animate-scale-in flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{template.icon}</span>
                        <div>
                            <h3 className="text-lg font-semibold">{template.name}</h3>
                            <span className="text-xs text-[var(--text-muted)] capitalize">
                                {template.category}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-[var(--text-secondary)] mb-4">
                        {template.description}
                    </p>
                    <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] overflow-hidden">
                        <div className="px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-secondary)] flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            <span className="ml-2 text-xs text-[var(--text-muted)]">
                                Preview
                            </span>
                        </div>
                        <pre className="p-4 text-sm font-mono text-[var(--text-secondary)] overflow-x-auto max-h-64">
                            <code>{template.content.slice(0, 1000)}</code>
                            {template.content.length > 1000 && (
                                <span className="text-[var(--text-muted)]">...</span>
                            )}
                        </pre>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-secondary)]">
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button onClick={onUse} className="btn-primary">
                        Use This Template
                    </button>
                </div>
            </div>
        </div>
    );
}
