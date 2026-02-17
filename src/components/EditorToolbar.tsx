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

function ToolbarButton({
    onClick,
    title,
    shortcut,
    children,
    disabled,
    active,
    accent,
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
            aria-label={shortcut ? `${title} (${shortcut})` : title}
            title={shortcut ? `${title} (${shortcut})` : title}
            className={`btn-ghost text-xs gap-1.5 px-2.5 py-1.5 rounded-lg transition-all
                ${active ? "bg-accent-500/15 text-accent-400" : ""}
                ${accent ? "text-accent-400 hover:text-accent-300" : ""}
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
        >
            {children}
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
        <header className="h-12 bg-surface-900/80 border-b border-surface-800/50 flex items-center justify-between px-3 gap-2 shrink-0 backdrop-blur-sm">
            {/* Left section */}
            <div className="flex items-center gap-2 min-w-0">
                <Link
                    href="/dashboard"
                    aria-label="Back to Dashboard"
                    className="btn-ghost text-xs gap-1 px-2 py-1.5"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Dashboard</span>
                </Link>

                <div className="w-px h-5 bg-surface-800/50" />

                <div className="flex items-center gap-1.5 text-sm text-surface-300 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-accent-400 shrink-0" />
                    <span className="truncate font-medium max-w-[160px]">{projectName}</span>
                </div>
            </div>

            {/* Center — actions */}
            <div className="flex items-center gap-1">
                {/* Compile */}
                <button
                    onClick={onCompile}
                    disabled={compiling}
                    title="Compile (Ctrl+Enter)"
                    aria-label={compiling ? "Compiling document" : "Compile (Ctrl+Enter)"}
                    className={`btn-primary text-xs gap-1.5 px-3 py-1.5 ${compiling ? "opacity-80" : ""}`}
                >
                    {compiling ? (
                        <Loader2 className="w-3.5 h-3.5 icon-spin" />
                    ) : (
                        <Play className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">{compiling ? "Compiling…" : "Compile"}</span>
                </button>

                <div className="w-px h-5 bg-surface-800/50 mx-1" />

                {/* Save */}
                <ToolbarButton
                    onClick={onSave}
                    disabled={saving || saveStatus === "saved"}
                    title="Save"
                    shortcut="⌘S"
                >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Save</span>
                </ToolbarButton>

                {/* Git Menu */}
                <GitMenu
                    projectId={projectId}
                    githubConnected={githubConnected}
                    githubRepoUrl={githubRepoUrl}
                    getContent={getContent}
                />

                {/* Export Menu */}
                <ExportMenu projectId={projectId} pdfUrl={pdfUrl} />

                <div className="w-px h-5 bg-surface-800/50 mx-1 hidden sm:block" />

                {/* History */}
                <ToolbarButton
                    onClick={onToggleHistory}
                    title="Version History"
                    shortcut="⌘⇧H"
                >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">History</span>
                </ToolbarButton>

                {/* Files */}
                <ToolbarButton
                    onClick={onToggleFiles}
                    title="Project Files"
                    shortcut="⌘\"
                >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Files</span>
                </ToolbarButton>

                {/* Settings */}
                <ToolbarButton
                    onClick={onToggleSettings}
                    title="Editor Settings"
                >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Settings</span>
                </ToolbarButton>

                {/* AI */}
                <ToolbarButton
                    onClick={onToggleAI}
                    title="AI Assistant"
                    accent
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">AI</span>
                    {errorCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-danger/20 text-danger text-[10px] font-bold leading-none">
                            {errorCount}
                        </span>
                    )}
                </ToolbarButton>
            </div>

            {/* Right — presence + status */}
            <div className="flex items-center gap-2">
                <PresenceAvatars peers={peers} connected={connected} />
                <ThemeToggle />

                {offlineDraft && (
                    <div className="flex items-center gap-1 text-warning text-xs" title="Working offline — draft saved locally">
                        <WifiOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Offline</span>
                    </div>
                )}

                <div className="flex items-center gap-1 text-xs">
                    {saveStatus === "saved" && (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                            <span className="text-surface-500 hidden sm:inline">Saved</span>
                        </>
                    )}
                    {saveStatus === "unsaved" && (
                        <>
                            <span className="text-warning text-lg leading-none">●</span>
                            <span className="text-warning hidden sm:inline">Unsaved</span>
                        </>
                    )}
                    {saveStatus === "saving" && (
                        <>
                            <Loader2 className="w-3.5 h-3.5 text-surface-400 icon-spin" />
                            <span className="text-surface-400 hidden sm:inline">Saving…</span>
                        </>
                    )}
                    {saveStatus === "error" && (
                        <>
                            <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                            <span className="text-danger hidden sm:inline">Failed</span>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
