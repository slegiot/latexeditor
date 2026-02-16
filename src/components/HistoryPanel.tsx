"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Clock, GitCommit, RotateCcw, Loader2 } from "lucide-react";

interface Version {
    id: string;
    label: string;
    content: string;
    created_at: string;
    word_count: number;
}

interface GitCommitEntry {
    oid: string;
    message: string;
    author: { name: string; email: string; timestamp: number };
}

interface HistoryPanelProps {
    projectId: string;
    open: boolean;
    onClose: () => void;
    onRestore: (content: string) => void;
    githubRepoUrl?: string | null;
}

export function HistoryPanel({
    projectId,
    open,
    onClose,
    onRestore,
    githubRepoUrl,
}: HistoryPanelProps) {
    const [tab, setTab] = useState<"versions" | "git">("versions");
    const [versions, setVersions] = useState<Version[]>([]);
    const [commits, setCommits] = useState<GitCommitEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchVersions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/versions?projectId=${projectId}`);
            const data = await res.json();
            setVersions(data.versions || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    const fetchGitLog = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/git", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "log", projectId }),
            });
            const data = await res.json();
            setCommits(data.commits || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (!open) return;
        if (tab === "versions") fetchVersions();
        else if (tab === "git") fetchGitLog();
    }, [open, tab, fetchVersions, fetchGitLog]);

    function formatTime(dateStr: string) {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 7) return `${diffDay}d ago`;
        return d.toLocaleDateString();
    }

    if (!open) return null;

    return (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-[var(--color-surface-100)] border-l border-[var(--color-glass-border)] z-40 flex flex-col shadow-2xl animate-slide-in">
            {/* Header */}
            <div className="h-12 flex items-center justify-between px-3 border-b border-[var(--color-glass-border)] shrink-0">
                <h3 className="text-sm font-semibold">History</h3>
                <button
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-glass-border)] shrink-0">
                <button
                    onClick={() => setTab("versions")}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${tab === "versions"
                            ? "text-[var(--color-accent-400)] border-b-2 border-[var(--color-accent-400)]"
                            : "text-[var(--color-surface-500)] hover:text-[var(--color-surface-300)]"
                        }`}
                >
                    <Clock className="w-3 h-3" />
                    Versions
                </button>
                <button
                    onClick={() => setTab("git")}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${tab === "git"
                            ? "text-[var(--color-accent-400)] border-b-2 border-[var(--color-accent-400)]"
                            : "text-[var(--color-surface-500)] hover:text-[var(--color-surface-300)]"
                        }`}
                >
                    <GitCommit className="w-3 h-3" />
                    Git Log
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-surface-500)]" />
                    </div>
                ) : tab === "versions" ? (
                    versions.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[var(--color-surface-500)]">
                            No version history yet. Versions are created automatically when you save.
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--color-glass-border)]">
                            {versions.map((v) => (
                                <div key={v.id} className="group px-3 py-3 hover:bg-[var(--color-glass-hover)] transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium truncate">{v.label}</p>
                                            <p className="text-[10px] text-[var(--color-surface-500)] mt-0.5">
                                                {formatTime(v.created_at)} · {v.word_count} words
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (confirm("Restore this version? Your current content will be replaced.")) {
                                                    onRestore(v.content);
                                                }
                                            }}
                                            className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-[var(--color-accent-500)]/10 text-[var(--color-accent-400)] hover:bg-[var(--color-accent-500)]/20 transition-all"
                                        >
                                            <RotateCcw className="w-2.5 h-2.5" />
                                            Restore
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : !githubRepoUrl ? (
                    <div className="p-4 text-center text-xs text-[var(--color-surface-500)]">
                        Link a GitHub repo to see commit history.
                    </div>
                ) : commits.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--color-surface-500)]">
                        No commits found.
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--color-glass-border)]">
                        {commits.map((c) => (
                            <div key={c.oid} className="px-3 py-3 hover:bg-[var(--color-glass-hover)] transition-colors">
                                <div className="flex items-start gap-2.5">
                                    <div className="mt-1 w-5 h-5 rounded-full bg-[var(--color-surface-300)]/20 flex items-center justify-center shrink-0">
                                        <GitCommit className="w-3 h-3 text-[var(--color-surface-500)]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium line-clamp-2">{c.message}</p>
                                        <p className="text-[10px] text-[var(--color-surface-500)] mt-0.5">
                                            <span className="font-mono text-[var(--color-accent-400)]">{c.oid}</span>
                                            {" · "}
                                            {c.author.name}
                                            {" · "}
                                            {formatTime(new Date(c.author.timestamp * 1000).toISOString())}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
