"use client";

import {
    ArrowLeft,
    Play,
    Save,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    WifiOff,
    FileText,
    History,
    Sparkles,
    FolderOpen,
    Settings,
} from "lucide-react";
import Link from "next/link";
import { PresenceAvatars } from "./PresenceAvatars";
import { GitMenu } from "./GitMenu";
import { ExportMenu } from "./ExportMenu";
import { ThemeToggle } from "./ThemeToggle";
import type { Peer } from "@/hooks/useYjs";

interface ToolbarProps {
    projectId: string;
    projectName: string;
    compiling: boolean;
    saving: boolean;
    saveStatus: "saved" | "unsaved" | "saving" | "error";
    hasCompiledPdf: boolean;
    pdfUrl: string | null;
    errorCount: number;
    onCompile: () => void;
    onSave: () => void;
    onToggleHistory: () => void;
    onToggleAI: () => void;
    onToggleFiles: () => void;
    onToggleSettings: () => void;
    offlineDraft: boolean;
    connected: boolean;
    peers: Peer[];
    githubConnected: boolean;
    githubRepoUrl?: string | null;
    getContent: () => string;
}

/** Tiny tooltip wrapper for icon buttons with keyboard shortcut hints */
function ToolbarButton({
    onClick,
    title,
    shortcut,
    active,
    accent,
    children,
    disabled,
}: {
    onClick: () => void;
    title: string;
    shortcut?: string;
    active?: boolean;
    accent?: boolean;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all
                ${active
                    ? "bg-[var(--color-accent-500)]/15 text-[var(--color-accent-400)]"
                    : accent
                        ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                        : "hover:bg-[var(--color-glass-hover)]"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            aria-label={shortcut ? `${title} (${shortcut})` : title}
        >
            {children}
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1.5 rounded-lg bg-[var(--color-surface-200)] text-[var(--color-surface-900)] text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                {title}
                {shortcut && (
                    <span className="ml-1.5 text-[var(--color-surface-500)]">{shortcut}</span>
                )}
            </span>
        </button>
    );
}

export function EditorToolbar({
    projectId,
    projectName,
    compiling,
    saving,
    saveStatus,
    hasCompiledPdf,
    pdfUrl,
    errorCount,
    onCompile,
    onSave,
    onToggleHistory,
    onToggleAI,
    onToggleFiles,
    onToggleSettings,
    offlineDraft,
    connected,
    peers,
    githubConnected,
    githubRepoUrl,
    getContent,
}: ToolbarProps) {
    return (
        <header className="h-12 flex items-center justify-between px-3 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-50)] shrink-0 z-20">
            {/* Left section */}
            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 text-sm text-[var(--color-surface-500)] hover:text-[var(--color-surface-900)] transition-colors"
                    aria-label="Back to Dashboard"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <div className="h-5 w-px bg-[var(--color-glass-border)]" />

                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--color-accent-400)]" />
                    <span className="text-sm font-semibold truncate max-w-[200px]">
                        {projectName}
                    </span>
                </div>
            </div>

            {/* Center — actions */}
            <div className="flex items-center gap-0.5">
                {/* Compile */}
                <button
                    onClick={onCompile}
                    disabled={compiling}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--color-accent-500)] to-[var(--color-accent-600)] text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-500/15"
                    title="Compile (Ctrl+Enter)"
                    aria-label={compiling ? "Compiling document" : "Compile (Ctrl+Enter)"}
                >
                    {compiling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Play className="w-3.5 h-3.5" />
                    )}
                    <span className="toolbar-label-hide">{compiling ? "Compiling…" : "Compile"}</span>
                </button>

                {/* Save */}
                <ToolbarButton
                    onClick={onSave}
                    disabled={saving || saveStatus === "saved"}
                    title="Save"
                    shortcut="⌘S"
                >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline toolbar-label-hide">Save</span>
                </ToolbarButton>

                <div className="h-5 w-px bg-[var(--color-glass-border)] mx-1" />

                {/* Git Menu */}
                <GitMenu
                    projectId={projectId}
                    githubConnected={githubConnected}
                    githubRepoUrl={githubRepoUrl}
                    getContent={getContent}
                />

                {/* Export Menu */}
                <ExportMenu projectId={projectId} pdfUrl={pdfUrl} />

                <div className="h-5 w-px bg-[var(--color-glass-border)] mx-1" />

                {/* History */}
                <ToolbarButton
                    onClick={onToggleHistory}
                    title="Version History"
                    shortcut="⌘⇧H"
                >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline toolbar-label-hide">History</span>
                </ToolbarButton>

                {/* Files */}
                <ToolbarButton
                    onClick={onToggleFiles}
                    title="Project Files"
                    shortcut="⌘\"
                >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline toolbar-label-hide">Files</span>
                </ToolbarButton>

                {/* Settings */}
                <ToolbarButton
                    onClick={onToggleSettings}
                    title="Editor Settings"
                >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline toolbar-label-hide">Settings</span>
                </ToolbarButton>

                <div className="h-5 w-px bg-[var(--color-glass-border)] mx-1" />

                {/* AI */}
                <ToolbarButton
                    onClick={onToggleAI}
                    title="AI Assistant"
                    accent={errorCount > 0}
                >
                    <Sparkles className={`w-3.5 h-3.5 ${errorCount > 0 ? "text-amber-400" : ""}`} />
                    <span className="hidden sm:inline toolbar-label-hide">AI</span>
                    {errorCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 min-w-[18px] text-center">
                            {errorCount}
                        </span>
                    )}
                </ToolbarButton>
            </div>

            {/* Right — presence + status */}
            <div className="flex items-center gap-3">
                {/* Presence avatars */}
                <PresenceAvatars peers={peers} connected={connected} />

                {/* Theme toggle */}
                <ThemeToggle />

                {offlineDraft && (
                    <div
                        className="flex items-center gap-1 text-xs text-amber-400"
                        title="Working offline — draft saved locally"
                    >
                        <WifiOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Offline</span>
                    </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-[var(--color-surface-500)]">
                    {saveStatus === "saved" && (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Saved</span>
                        </>
                    )}
                    {saveStatus === "unsaved" && (
                        <>
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="hidden sm:inline">Unsaved</span>
                        </>
                    )}
                    {saveStatus === "saving" && (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="hidden sm:inline">Saving…</span>
                        </>
                    )}
                    {saveStatus === "error" && (
                        <>
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            <span className="hidden sm:inline text-red-400">Failed</span>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
