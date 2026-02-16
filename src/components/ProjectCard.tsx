"use client";

import React from "react";
import { FileText, Clock, Trash2, MoreVertical, Globe, Lock, Share2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { deleteProject } from "@/app/dashboard/actions";
import { ShareDialog } from "@/components/ShareDialog";
import Link from "next/link";

interface Project {
    id: string;
    name: string;
    description: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

interface ProjectCardProps {
    project: Project;
    index: number;
}

export const ProjectCard = React.memo(function ProjectCard({ project, index }: ProjectCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDelete = async () => {
        if (!confirm("Delete this project? This cannot be undone.")) return;
        setDeleting(true);
        await deleteProject(project.id);
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <Link href={`/editor/${project.id}`} className="block">
            <div
                className={`group relative glass rounded-2xl p-5 transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-accent-500)]/30 cursor-pointer ${deleting ? "opacity-50 pointer-events-none" : ""
                    }`}
                style={{ animation: `fade-in 0.4s ease ${0.05 * index}s both` }}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-500)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-accent-500)]/20 transition-colors">
                        <FileText className="w-5 h-5 text-[var(--color-accent-400)]" />
                    </div>

                    {/* Menu */}
                    <div className="relative flex items-center gap-1" ref={menuRef}>
                        <div onClick={(e) => e.preventDefault()}>
                            <ShareDialog
                                projectId={project.id}
                                projectName={project.name}
                                isPublic={project.is_public}
                            />
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMenuOpen(!menuOpen);
                            }}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--color-glass-hover)] transition-all"
                        >
                            <MoreVertical className="w-4 h-4 text-[var(--color-surface-500)]" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-40 glass rounded-xl overflow-hidden animate-scale-in origin-top-right shadow-[var(--shadow-card)] z-10">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDelete();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Project
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-base mb-1 truncate group-hover:text-[var(--color-accent-400)] transition-colors">
                    {project.name}
                </h3>

                {/* Description */}
                {project.description && (
                    <p className="text-sm text-[var(--color-surface-600)] line-clamp-2 mb-4">
                        {project.description}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-glass-border)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-surface-500)]">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo(project.updated_at)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--color-surface-500)]">
                        {project.is_public ? (
                            <>
                                <Globe className="w-3.5 h-3.5" />
                                Public
                            </>
                        ) : (
                            <>
                                <Lock className="w-3.5 h-3.5" />
                                Private
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
});
