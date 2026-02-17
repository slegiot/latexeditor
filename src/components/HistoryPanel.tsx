"use client";

import { useState, useEffect, useCallback } from "react";
import { X, History, GitCommit, Clock, RotateCcw, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface HistoryPanelProps {
    projectId: string;
    open: boolean;
    onClose: () => void;
    onRestore: (content: string) => void;
    githubRepoUrl?: string | null;
}

interface Version {
    id: string;
    content: string;
    created_at: string;
    label?: string;
}

interface GitLog {
    sha: string;
    message: string;
    author: string;
    date: string;
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
    const [gitLogs, setGitLogs] = useState<GitLog[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchVersions = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { data, error } = await supabase
                .from("versions")
                .select("*")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;
            setVersions(data || []);
        } catch (err) {
            console.error("Error fetching versions:", err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    const fetchGitLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/git/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId }),
            });
            const data = await res.json();
            if (res.ok) {
                setGitLogs(data.logs || []);
            }
        } catch (err) {
            console.error("Error fetching git logs:", err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (open) {
            if (tab === "versions") {
                fetchVersions();
            } else if (tab === "git") {
                fetchGitLogs();
            }
        }
    }, [open, tab, fetchVersions, fetchGitLogs]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString();
    };

    if (!open) return null;

    return (
        <div className="absolute right-0 top-0 bottom-0 w-80 glass border-l border-surface-800/50 flex flex-col z-30 animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800/50 shrink-0">
                <div className="flex items-center gap-2 text-white text-sm font-semibold">
                    <History className="w-4 h-4 text-accent-400" />
                    <span>History</span>
                </div>
                <button onClick={onClose} className="btn-ghost p-1" aria-label="Close">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-surface-800/50 shrink-0">
                <button
                    onClick={() => setTab("versions")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === "versions"
                            ? "border-accent-500 text-accent-400"
                            : "border-transparent text-surface-500 hover:text-surface-300"
                        }`}
                >
                    <Clock className="w-3.5 h-3.5" />
                    Versions
                </button>
                {githubRepoUrl && (
                    <button
                        onClick={() => setTab("git")}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === "git"
                                ? "border-accent-500 text-accent-400"
                                : "border-transparent text-surface-500 hover:text-surface-300"
                            }`}
                    >
                        <GitCommit className="w-3.5 h-3.5" />
                        Git Log
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 text-accent-400 icon-spin" />
                    </div>
                ) : tab === "versions" ? (
                    versions.length === 0 ? (
                        <p className="text-sm text-surface-500 text-center py-8">No versions yet. Save your project to create a version.</p>
                    ) : (
                        versions.map((v) => (
                            <div key={v.id} className="glass-light rounded-xl p-3 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <span className="text-sm text-white font-medium block truncate">{v.label || "Auto-save"}</span>
                                    <span className="text-xs text-surface-500">{formatDate(v.created_at)}</span>
                                </div>
                                <button onClick={() => onRestore(v.content)} className="btn-ghost text-xs gap-1 shrink-0 text-accent-400">
                                    <RotateCcw className="w-3 h-3" />
                                    Restore
                                </button>
                            </div>
                        ))
                    )
                ) : (
                    gitLogs.length === 0 ? (
                        <p className="text-sm text-surface-500 text-center py-8">No Git commits yet.</p>
                    ) : (
                        gitLogs.map((log) => (
                            <div key={log.sha} className="glass-light rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-accent-400 bg-accent-500/10 px-1.5 py-0.5 rounded">{log.sha.slice(0, 7)}</span>
                                    <span className="text-sm text-white truncate">{log.message}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-surface-500">
                                    <span>{log.author}</span>
                                    <span>·</span>
                                    <span>{formatDate(log.date)}</span>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
}
