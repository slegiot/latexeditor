"use client";

import { useState, useEffect } from "react";
import {
    X,
    History,
    GitCommit,
    RotateCcw,
    Clock,
    User,
    ChevronRight,
    Loader2,
    Github,
} from "lucide-react";

interface Version {
    id: string;
    created_at: string;
    content: string;
    created_by?: string;
    message?: string;
    type: "snapshot" | "commit";
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
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
    const [activeTab, setActiveTab] = useState<"versions" | "git">("versions");

    useEffect(() => {
        if (open) {
            fetchVersions();
        }
    }, [open, projectId]);

    const fetchVersions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/versions?projectId=${projectId}`);
            if (response.ok) {
                const data = await response.json();
                setVersions(data.versions || []);
            }
        } catch {
            console.error("Failed to fetch versions");
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = (version: Version) => {
        if (confirm("Are you sure you want to restore this version? Current changes will be lost.")) {
            onRestore(version.content);
            onClose();
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!open) return null;

    return (
        <>
            {/* Mobile overlay */}
            <div
                className="fixed inset-0 bg-black/50 lg:hidden z-40"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-14 bottom-0 w-80 bg-[var(--bg-secondary)] border-l border-[var(--border-secondary)] z-50 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <History className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">History</h3>
                            <p className="text-xs text-[var(--text-muted)]">
                                {versions.length} version{versions.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors lg:hidden"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-secondary)]">
                    <button
                        onClick={() => setActiveTab("versions")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors ${activeTab === "versions"
                                ? "text-orange-400 border-b-2 border-orange-400"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                    >
                        <History className="w-4 h-4" />
                        Versions
                    </button>
                    {githubRepoUrl && (
                        <button
                            onClick={() => setActiveTab("git")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors ${activeTab === "git"
                                    ? "text-orange-400 border-b-2 border-orange-400"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                }`}
                        >
                            <Github className="w-4 h-4" />
                            Git
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "versions" ? (
                        loading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
                            </div>
                        ) : versions.length === 0 ? (
                            <div className="text-center py-8 text-[var(--text-muted)]">
                                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No versions yet</p>
                                <p className="text-xs mt-1">
                                    Versions are created automatically when you save
                                </p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {versions.map((version, index) => (
                                    <VersionItem
                                        key={version.id}
                                        version={version}
                                        isLatest={index === 0}
                                        onRestore={() => handleRestore(version)}
                                        onSelect={() => setSelectedVersion(version)}
                                        formatDate={formatDate}
                                        formatTime={formatTime}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        <GitHistory githubRepoUrl={githubRepoUrl} />
                    )}
                </div>

                {/* Version Preview */}
                {selectedVersion && (
                    <div className="border-t border-[var(--border-secondary)] p-4 bg-[var(--bg-tertiary)]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[var(--text-muted)]">
                                {formatDate(selectedVersion.created_at)} at{" "}
                                {formatTime(selectedVersion.created_at)}
                            </span>
                            <button
                                onClick={() => setSelectedVersion(null)}
                                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="max-h-32 overflow-y-auto text-xs font-mono bg-[var(--bg-secondary)] p-2 rounded">
                            <pre className="text-[var(--text-secondary)]">
                                {selectedVersion.content.slice(0, 500)}
                                {selectedVersion.content.length > 500 && "..."}
                            </pre>
                        </div>
                        <button
                            onClick={() => handleRestore(selectedVersion)}
                            className="w-full mt-3 btn-primary text-sm justify-center"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Restore This Version
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

interface VersionItemProps {
    version: Version;
    isLatest: boolean;
    onRestore: () => void;
    onSelect: () => void;
    formatDate: (date: string) => string;
    formatTime: (date: string) => string;
}

function VersionItem({
    version,
    isLatest,
    onRestore,
    onSelect,
    formatDate,
    formatTime,
}: VersionItemProps) {
    return (
        <div
            className="group flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
            onClick={onSelect}
        >
            <div className="flex flex-col items-center gap-1">
                <div
                    className={`w-2 h-2 rounded-full ${isLatest ? "bg-emerald-400" : "bg-[var(--text-muted)]"
                        }`}
                />
                <div className="w-px h-full bg-[var(--border-secondary)]" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {isLatest ? "Current" : formatDate(version.created_at)}
                    </span>
                    {isLatest && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                            Latest
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(version.created_at)}</span>
                    {version.created_by && (
                        <>
                            <span>•</span>
                            <User className="w-3 h-3" />
                            <span>{version.created_by}</span>
                        </>
                    )}
                </div>
                {version.message && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                        {version.message}
                    </p>
                )}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                title="Restore this version"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
        </div>
    );
}

function GitHistory({ githubRepoUrl }: { githubRepoUrl?: string | null }) {
    if (!githubRepoUrl) {
        return (
            <div className="text-center py-8 text-[var(--text-muted)]">
                <Github className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">GitHub not connected</p>
                <p className="text-xs mt-1">Connect GitHub to see commit history</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-tertiary)] mb-4">
                <Github className="w-5 h-5 text-[var(--text-muted)]" />
                <a
                    href={githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-400 hover:underline truncate flex-1"
                >
                    {githubRepoUrl.replace("https://github.com/", "")}
                </a>
            </div>
            <p className="text-sm text-[var(--text-muted)] text-center">
                Git commit history would appear here
            </p>
        </div>
    );
}
