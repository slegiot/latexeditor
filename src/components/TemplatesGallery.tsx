"use client";

import { useState } from "react";
import {
    LATEX_TEMPLATES,
    getTemplatesByCategory,
    type LatexTemplate,
} from "@/lib/latex-templates";

interface TemplatesGalleryProps {
    onSelect: (template: LatexTemplate) => void;
}

const CATEGORIES = [
    { key: "all", label: "All" },
    { key: "academic", label: "Academic" },
    { key: "presentation", label: "Presentation" },
    { key: "professional", label: "Professional" },
    { key: "general", label: "General" },
];

export function TemplatesGallery({ onSelect }: TemplatesGalleryProps) {
    const [category, setCategory] = useState("all");
    const templates = getTemplatesByCategory(category);

    return (
        <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setCategory(cat.key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${category === cat.key
                                ? "bg-[var(--color-accent-500)] text-white"
                                : "bg-[var(--color-glass)] text-[var(--color-surface-600)] hover:bg-[var(--color-glass-hover)]"
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                {templates.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className="group text-left p-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-100)] hover:border-[var(--color-accent-500)]/50 hover:bg-[var(--color-glass-hover)] transition-all"
                    >
                        <div className="text-2xl mb-2">{template.icon}</div>
                        <h4 className="text-sm font-medium group-hover:text-[var(--color-accent-400)] transition-colors">
                            {template.name}
                        </h4>
                        <p className="text-[10px] text-[var(--color-surface-500)] mt-1 line-clamp-2">
                            {template.description}
                        </p>
                        <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-medium rounded-full bg-[var(--color-surface-300)]/20 text-[var(--color-surface-600)] capitalize">
                            {template.category}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
