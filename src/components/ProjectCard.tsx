"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
    FileText,
    Clock,
    Globe,
    Lock,
    Trash2,
    MoreVertical,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ShareDialog } from "./ShareDialog";

interface ProjectCardProps {
    project: {
        id: string;
        name: string;
        description: string;
        updated_at: string;
        is_public: boolean;
    };
    index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDelete = async () => {
        if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
        setDeleting(true);
        const supabase = createClient();
        await supabase.from("projects").delete().eq("id", project.id);
        router.refresh();
    };

    const getRelativeTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div
            data-project-card
            data-project-name={project.name}
            className="glass rounded-2xl p-5 card-hover group animate-slide-up relative"
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <Link
                    href={`/editor/${project.id}`}
                    className="flex items-center gap-2.5 text-white font-semibold hover:text-accent-400 transition-colors flex-1 min-w-0"
                >
                    <div className="w-9 h-9 rounded-xl bg-accent-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-accent-400" />
                    </div>
                    <span className="truncate">{project.name}</span>
                </Link>

                {/* Menu */}
                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Project options"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-40 glass rounded-xl py-1 z-20 shadow-xl animate-scale-in origin-top-right">
                            <ShareDialog
                                projectId={project.id}
                                projectName={project.name}
                                isPublic={project.is_public}
                            />
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="btn-danger w-full justify-start rounded-none px-3 py-2 text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            {project.description && (
                <p className="text-sm text-surface-500 line-clamp-2 mb-4">
                    {project.description}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-surface-600">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {getRelativeTime(project.updated_at)}
                </div>
                <div className="flex items-center gap-1" title={project.is_public ? "Public" : "Private"}>
                    {project.is_public ? (
                        <Globe className="w-3 h-3 text-accent-500" />
                    ) : (
                        <Lock className="w-3 h-3" />
                    )}
                </div>
            </div>
        </div>
    );
}
