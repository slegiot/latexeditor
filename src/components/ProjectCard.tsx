"use client";

import Link from "next/link";
import { useState } from "react";
import {
    FileText,
    MoreVertical,
    Share2,
    Trash2,
    Edit3,
    Clock,
    Users,
} from "lucide-react";

interface ProjectCardProps {
    id: string;
    name: string;
    description?: string | null;
    updatedAt: string;
    fileCount?: number;
    collaborators?: number;
    onRename?: (id: string, newName: string) => void;
    onDelete?: (id: string) => void;
    onShare?: (id: string) => void;
}

export function ProjectCard({
    id,
    name,
    description,
    updatedAt,
    fileCount = 1,
    collaborators = 1,
    onRename,
    onDelete,
    onShare,
}: ProjectCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(name);

    const handleRename = () => {
        if (newName.trim() && newName !== name) {
            onRename?.(id, newName.trim());
        }
        setIsRenaming(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleRename();
        } else if (e.key === "Escape") {
            setNewName(name);
            setIsRenaming(false);
        }
    };

    const formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: new Date(updatedAt).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });

    return (
        <div className="card card-interactive group relative">
            <Link href={`/editor/${id}`} className="block p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                        <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        {collaborators > 1 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--bg-tertiary)] text-xs text-[var(--text-secondary)]">
                                <Users className="w-3 h-3" />
                                <span>{collaborators}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                    {isRenaming ? (
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={handleKeyDown}
                            className="w-full px-2 py-1 text-lg font-semibold bg-[var(--bg-tertiary)] border border-emerald-500/50 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            autoFocus
                            onClick={(e) => e.preventDefault()}
                        />
                    ) : (
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate group-hover:text-emerald-400 transition-colors">
                            {name}
                        </h3>
                    )}
                    {description && (
                        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                            {description}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formattedDate}
                        </span>
                        <span>{fileCount} file{fileCount !== 1 ? "s" : ""}</span>
                    </div>
                </div>
            </Link>

            {/* Actions Menu */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
                    aria-label="Project actions"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg glass-strong border border-[var(--border-primary)] shadow-xl z-50 animate-scale-in">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    setIsRenaming(true);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                                <Edit3 className="w-4 h-4" />
                                Rename
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    onShare?.(id);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                            <div className="my-1 border-t border-[var(--border-secondary)]" />
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    if (confirm("Are you sure you want to delete this project?")) {
                                        onDelete?.(id);
                                    }
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
