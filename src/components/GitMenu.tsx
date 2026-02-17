"use client";

import { useState, useRef, useEffect } from "react";
import {
    GitBranch,
    Link as LinkIcon,
    Unlink,
    Download,
    Upload,
    Loader2,
    Check,
    ExternalLink,
} from "lucide-react";

interface GitMenuProps {
    projectId: string;
    githubConnected: boolean;
    githubRepoUrl?: string | null;
    getContent: () => string;
}

export function GitMenu({
    projectId,
    githubConnected,
    githubRepoUrl,
    getContent,
}: GitMenuProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);
    const [repoUrl, setRepoUrl] = useState(githubRepoUrl || "");
    const [status, setStatus] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLinkRepo = async () => {
        if (!repoUrl.trim()) return;
        setLoading("link");
        setStatus(null);

        try {
            const res = await fetch("/api/git/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, repoUrl: repoUrl.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus("Repository linked");
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(null);
        }
    };

    const handleUnlinkRepo = async () => {
        setLoading("unlink");
        setStatus(null);

        try {
            const res = await fetch("/api/git/unlink", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setRepoUrl("");
            setStatus("Repository unlinked");
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(null);
        }
    };

    const handlePull = async () => {
        setLoading("pull");
        setStatus(null);

        try {
            const res = await fetch("/api/git/pull", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus("Pulled latest changes");
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(null);
        }
    };

    const handlePush = async () => {
        setLoading("push");
        setStatus(null);

        try {
            const content = getContent();
            const res = await fetch("/api/git/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, content }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus("Pushed to GitHub");
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                title="Git"
                className={`btn-ghost text-xs gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${open ? "bg-accent-500/15 text-accent-400" : ""}`}
            >
                <GitBranch className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Git</span>
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1.5 w-72 glass rounded-xl border border-surface-800/50 shadow-2xl z-40 overflow-hidden animate-scale-in origin-top-left">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-800/50 text-sm font-semibold text-white">
                        <GitBranch className="w-4 h-4 text-accent-400" />
                        <span>GitHub Sync</span>
                    </div>

                    <div className="p-3 space-y-2">
                        {!githubConnected ? (
                            <p className="text-xs text-surface-500 py-2">
                                Connect your GitHub account in Settings to enable Git sync.
                            </p>
                        ) : githubRepoUrl ? (
                            <>
                                <a
                                    href={githubRepoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 transition-colors truncate"
                                >
                                    {githubRepoUrl.replace("https://github.com/", "")}
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>

                                <div className="flex gap-1.5 pt-1">
                                    <button
                                        onClick={handlePull}
                                        disabled={!!loading}
                                        className="btn-secondary text-xs flex-1 justify-center"
                                    >
                                        {loading === "pull" ? <Loader2 className="w-3.5 h-3.5 icon-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        Pull
                                    </button>

                                    <button
                                        onClick={handlePush}
                                        disabled={!!loading}
                                        className="btn-primary text-xs flex-1 justify-center"
                                    >
                                        {loading === "push" ? <Loader2 className="w-3.5 h-3.5 icon-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                        Push
                                    </button>
                                </div>

                                <button
                                    onClick={handleUnlinkRepo}
                                    disabled={!!loading}
                                    className="btn-ghost text-xs text-danger w-full justify-center mt-1"
                                >
                                    {loading === "unlink" ? <Loader2 className="w-3.5 h-3.5 icon-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                                    Unlink Repository
                                </button>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    placeholder="https://github.com/user/repo"
                                    className="input-field text-xs"
                                />
                                <button
                                    onClick={handleLinkRepo}
                                    disabled={!!loading || !repoUrl.trim()}
                                    className="btn-primary text-xs w-full justify-center"
                                >
                                    {loading === "link" ? <Loader2 className="w-3.5 h-3.5 icon-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                                    Link Repository
                                </button>
                            </div>
                        )}
                    </div>

                    {status && (
                        <div className={`flex items-center gap-1.5 px-4 py-2 border-t border-surface-800/50 text-xs ${status.startsWith("Error") ? "text-danger" : "text-success"
                            }`}>
                            {status.startsWith("Error") ? "⚠" : <Check className="w-3.5 h-3.5" />}
                            {status}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
