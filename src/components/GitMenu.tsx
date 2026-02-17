"use client";

import { useState } from "react";
import {
    GitBranch,
    GitCommit,
    GitPullRequest,
    Github,
    Link,
    Loader2,
    Check,
    AlertCircle,
} from "lucide-react";

interface GitMenuProps {
    projectId: string;
    githubConnected: boolean;
    githubRepoUrl?: string | null;
    onClose: () => void;
}

export function GitMenu({
    projectId,
    githubConnected,
    githubRepoUrl,
    onClose,
}: GitMenuProps) {
    const [commitMessage, setCommitMessage] = useState("");
    const [isCommitting, setIsCommitting] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [lastCommit, setLastCommit] = useState<{
        message: string;
        date: string;
        hash: string;
    } | null>(null);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const response = await fetch("/api/github/auth");
            if (response.ok) {
                const data = await response.json();
                window.location.href = data.url;
            }
        } catch {
            alert("Failed to connect to GitHub");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleCommit = async () => {
        if (!commitMessage.trim()) return;

        setIsCommitting(true);
        try {
            const response = await fetch("/api/git", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    message: commitMessage,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setLastCommit({
                    message: commitMessage,
                    date: new Date().toISOString(),
                    hash: data.hash?.slice(0, 7) || "abc1234",
                });
                setCommitMessage("");
            } else {
                const error = await response.json();
                alert(error.error || "Failed to commit");
            }
        } catch {
            alert("Failed to commit changes");
        } finally {
            setIsCommitting(false);
        }
    };

    const handlePush = async () => {
        try {
            const response = await fetch("/api/git", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    action: "push",
                }),
            });

            if (response.ok) {
                alert("Changes pushed successfully!");
            } else {
                const error = await response.json();
                alert(error.error || "Failed to push");
            }
        } catch {
            alert("Failed to push changes");
        }
    };

    return (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-80 glass-strong border border-[var(--border-primary)] rounded-xl shadow-2xl z-50 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)]">
                <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-orange-400" />
                    <span className="font-medium text-sm">Git</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                    ×
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {!githubConnected ? (
                    <div className="text-center py-4">
                        <Github className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)]" />
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            Connect your GitHub account to sync this project with a repository.
                        </p>
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full btn-primary justify-center"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Github className="w-4 h-4" />
                                    Connect GitHub
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Repo Info */}
                        {githubRepoUrl && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-tertiary)]">
                                <Link className="w-4 h-4 text-emerald-400" />
                                <a
                                    href={githubRepoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-emerald-400 hover:underline truncate flex-1"
                                >
                                    {githubRepoUrl.replace("https://github.com/", "")}
                                </a>
                            </div>
                        )}

                        {/* Last Commit */}
                        {lastCommit && (
                            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
                                <div className="flex items-center gap-2 mb-1">
                                    <GitCommit className="w-4 h-4 text-[var(--text-muted)]" />
                                    <span className="text-xs font-mono text-[var(--text-muted)]">
                                        {lastCommit.hash}
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--text-primary)] truncate">
                                    {lastCommit.message}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {new Date(lastCommit.date).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {/* Commit Form */}
                        <div className="space-y-2">
                            <label className="text-xs text-[var(--text-muted)]">
                                Commit Message
                            </label>
                            <input
                                type="text"
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                placeholder="Describe your changes..."
                                className="input-field text-sm"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleCommit}
                                disabled={!commitMessage.trim() || isCommitting}
                                className="flex-1 btn-primary text-sm justify-center"
                            >
                                {isCommitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Committing...
                                    </>
                                ) : (
                                    <>
                                        <GitCommit className="w-4 h-4" />
                                        Commit
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handlePush}
                                className="btn-secondary text-sm"
                            >
                                <GitPullRequest className="w-4 h-4" />
                                Push
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
