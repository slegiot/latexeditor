"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    X,
    FileText,
    Loader2,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import { LATEX_TEMPLATES } from "@/lib/latex-templates";

export function NewProjectDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"template" | "details">("template");
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [projectName, setProjectName] = useState("");
    const [description, setDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = LATEX_TEMPLATES.find((t) => t.id === templateId);
        if (template) {
            setProjectName(template.name);
        }
        setStep("details");
    };

    const handleCreate = async () => {
        if (!projectName.trim()) return;

        setIsCreating(true);
        try {
            const template = LATEX_TEMPLATES.find((t) => t.id === selectedTemplate);

            const response = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: projectName.trim(),
                    description: description.trim() || null,
                    template: selectedTemplate,
                    content: template?.content,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/editor/${data.projectId}`);
            } else {
                const error = await response.json();
                alert(error.error || "Failed to create project");
            }
        } catch {
            alert("Failed to create project");
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setStep("template");
        setSelectedTemplate(null);
        setProjectName("");
        setDescription("");
    };

    const handleBack = () => {
        if (step === "details") {
            setStep("template");
            setSelectedTemplate(null);
        } else {
            handleClose();
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="btn-primary"
            >
                <Plus className="w-4 h-4" />
                New Project
            </button>

            {/* Dialog Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Dialog */}
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl glass-strong border border-[var(--border-primary)] shadow-2xl animate-scale-in">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
                            <div className="flex items-center gap-3">
                                {step === "details" && (
                                    <button
                                        onClick={handleBack}
                                        className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                        aria-label="Go back"
                                    >
                                        <ChevronRight className="w-5 h-5 rotate-180" />
                                    </button>
                                )}
                                <h2 className="text-xl font-semibold">
                                    {step === "template" ? "Choose a Template" : "Project Details"}
                                </h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                aria-label="Close dialog"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                            {step === "template" ? (
                                <TemplateGrid
                                    onSelect={handleTemplateSelect}
                                />
                            ) : (
                                <ProjectDetailsForm
                                    projectName={projectName}
                                    setProjectName={setProjectName}
                                    description={description}
                                    setDescription={setDescription}
                                    selectedTemplate={selectedTemplate}
                                    isCreating={isCreating}
                                    onCreate={handleCreate}
                                    onCancel={handleClose}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function TemplateGrid({
    onSelect,
}: {
    onSelect: (templateId: string) => void;
}) {
    const categories = [...new Set(LATEX_TEMPLATES.map((t) => t.category))];

    return (
        <div className="space-y-8">
            {categories.map((category) => (
                <div key={category}>
                    <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {LATEX_TEMPLATES.filter((t) => t.category === category).map(
                            (template) => (
                                <button
                                    key={template.id}
                                    onClick={() => onSelect(template.id)}
                                    className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:border-emerald-500/50 hover:bg-[var(--bg-tertiary)] transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                        <span className="text-xl">{template.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                                            {template.name}
                                        </h4>
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                                            {template.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            )
                        )}
                    </div>
                </div>
            ))}

            {/* Blank Project Option */}
            <div>
                <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                    Start from Scratch
                </h3>
                <button
                    onClick={() => onSelect("blank")}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-dashed border-[var(--border-primary)] hover:border-emerald-500/50 hover:bg-[var(--bg-tertiary)] transition-all text-left group"
                >
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/10 transition-colors">
                        <FileText className="w-5 h-5 text-[var(--text-muted)] group-hover:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-medium text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                            Blank Project
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Start with an empty document
                        </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </div>
    );
}

function ProjectDetailsForm({
    projectName,
    setProjectName,
    description,
    setDescription,
    selectedTemplate,
    isCreating,
    onCreate,
    onCancel,
}: {
    projectName: string;
    setProjectName: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    selectedTemplate: string | null;
    isCreating: boolean;
    onCreate: () => void;
    onCancel: () => void;
}) {
    const template = LATEX_TEMPLATES.find((t) => t.id === selectedTemplate);

    return (
        <div className="space-y-6">
            {/* Selected Template Info */}
            {template && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                        <p className="text-sm text-[var(--text-muted)]">Template</p>
                        <p className="font-medium text-emerald-400">{template.name}</p>
                    </div>
                </div>
            )}

            {/* Project Name */}
            <div>
                <label
                    htmlFor="project-name"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                >
                    Project Name <span className="text-red-400">*</span>
                </label>
                <input
                    id="project-name"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My Research Paper"
                    className="input-field"
                    autoFocus
                />
            </div>

            {/* Description */}
            <div>
                <label
                    htmlFor="project-description"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                >
                    Description <span className="text-[var(--text-muted)]">(optional)</span>
                </label>
                <textarea
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your project..."
                    rows={3}
                    className="input-field resize-none"
                />
            </div>

            {/* AI Suggestion Hint */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-purple-400">AI Assistant</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                        You can use the AI assistant in the editor to help you write and
                        improve your document.
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={onCancel}
                    className="flex-1 btn-secondary"
                    disabled={isCreating}
                >
                    Cancel
                </button>
                <button
                    onClick={onCreate}
                    disabled={!projectName.trim() || isCreating}
                    className="flex-1 btn-primary"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            Create Project
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
