"use client";

import { useState } from "react";
import { LATEX_TEMPLATES } from "@/lib/latex-templates";
import type { LatexTemplate } from "@/lib/latex-templates";

interface TemplatesGalleryProps {
    onSelect: (template: LatexTemplate) => void;
}

export function TemplatesGallery({ onSelect }: TemplatesGalleryProps) {
    const [filter, setFilter] = useState<string>("all");

    const categories = ["all", ...new Set(LATEX_TEMPLATES.map((t) => t.category))];

    const filtered =
        filter === "all"
            ? LATEX_TEMPLATES
            : LATEX_TEMPLATES.filter((t) => t.category === filter);

    return (
        <div className="space-y-4">
            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === cat
                                ? "bg-accent-500/20 text-accent-400 ring-1 ring-accent-500/30"
                                : "bg-surface-800/50 text-surface-400 hover:bg-surface-800 hover:text-surface-300"
                            }`}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {/* Templates grid */}
            <div className="grid grid-cols-2 gap-2">
                {filtered.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className="glass-light rounded-xl p-3 text-left hover:bg-surface-800/40 transition-all hover:ring-1 hover:ring-accent-500/30 group"
                    >
                        <h3 className="text-sm text-white font-medium group-hover:text-accent-400 transition-colors">{template.name}</h3>
                        <p className="text-xs text-surface-500 mt-1 line-clamp-2">{template.description}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-surface-800/50 text-[10px] text-surface-500 font-medium">{template.category}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
