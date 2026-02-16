"use client";

import { useState, useRef, useEffect } from "react";
import { GitBranch, Link2, ArrowDown, ArrowUp, Unlink, Loader2, Check, AlertCircle } from "lucide-react";

interface GitMenuProps {
    projectId: string;
    githubConnected: boolean;
    githubRepoUrl?: string | null;
    getContent: () => string;
}

export function GitMenu({ projectId, githubConnected, githubRepoUrl, getContent }: GitMenuProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [repoUrl, setRepoUrl] = useState("");
    const [showLinkInput, setShowLinkInput] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
                setShowLinkInput(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const clearMessage = () => setTimeout(() => setMessage(null), 3000);

    async function gitAction(action: string, extra: Record<string, string> = {}) {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/git", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, projectId, ...extra }),
            });
            const data = await res.json();
            setMessage({
                text: data.message || data.error || "Done",
                type: data.success ? "success" : "error",
            });
            clearMessage();
            if (action === "unlink" || action === "link") {
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch {
            setMessage({ text: "Network error", type: "error" });
            clearMessage();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${githubRepoUrl
                        ? "text-emerald-400 hover:bg-emerald-500/10"
                        : "hover:bg-[var(--color-glass-hover)]"
                    }`}
                title="GitHub Sync"
            >
                <GitBranch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Git</span>
                {githubRepoUrl && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1 w-72 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-100)] shadow-xl z-50 overflow-hidden">
                    {/* Status message */}
                    {message && (
                        <div
                            className={`px-3 py-2 text-xs flex items-center gap-2 ${message.type === "success"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                        >
                            {message.type === "success" ? (
                                <Check className="w-3 h-3" />
                            ) : (
                                <AlertCircle className="w-3 h-3" />
                            )}
                            {message.text}
                        </div>
                    )}

                    {!githubConnected ? (
                        <div className="p-3">
                            <p className="text-xs text-[var(--color-surface-500)] mb-2">
                                Connect your GitHub account to sync repositories.
                            </p>
                            <a
                                href={`/api/github/auth?projectId=${projectId}`}
                                className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg bg-[#24292e] text-white hover:bg-[#2f363d] transition-colors"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                Connect GitHub
                            </a>
                        </div>
                    ) : !githubRepoUrl ? (
                        <div className="p-2">
                            {showLinkInput ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="https://github.com/user/repo.git"
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--color-surface-50)] border border-[var(--color-glass-border)] focus:outline-none focus:border-[var(--color-accent-500)]"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                if (repoUrl) gitAction("link", { repoUrl });
                                            }}
                                            disabled={!repoUrl || loading}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-600)] disabled:opacity-50 transition-colors"
                                        >
                                            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                                            Clone & Link
                                        </button>
                                        <button
                                            onClick={() => setShowLinkInput(false)}
                                            className="px-2 py-1.5 text-xs rounded-lg hover:bg-[var(--color-glass-hover)]"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowLinkInput(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                                >
                                    <Link2 className="w-4 h-4 text-[var(--color-surface-500)]" />
                                    Link GitHub Repo
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="p-1">
                            {/* Repo info */}
                            <div className="px-3 py-2 text-xs text-[var(--color-surface-500)] border-b border-[var(--color-glass-border)]">
                                <div className="flex items-center gap-1.5">
                                    <GitBranch className="w-3 h-3 text-emerald-400" />
                                    <span className="truncate">{githubRepoUrl.replace("https://github.com/", "")}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => gitAction("pull")}
                                disabled={loading}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDown className="w-4 h-4" />}
                                Pull from GitHub
                            </button>

                            <button
                                onClick={() => gitAction("push", { content: getContent() })}
                                disabled={loading}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                                Push to GitHub
                            </button>

                            <div className="border-t border-[var(--color-glass-border)] mt-1 pt-1">
                                <button
                                    onClick={() => {
                                        if (confirm("Unlink this repository? The remote repo won't be affected.")) {
                                            gitAction("unlink");
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Unlink className="w-4 h-4" />
                                    Unlink Repo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
