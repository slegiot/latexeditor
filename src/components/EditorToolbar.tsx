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
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <div className="h-5 w-px bg-[var(--color-glass-border)]" />

                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--color-accent-400)]" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                        {projectName}
                    </span>
                </div>
            </div>

            {/* Center — actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onCompile}
                    disabled={compiling}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Compile (Ctrl+Enter)"
                >
                    {compiling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Play className="w-3.5 h-3.5" />
                    )}
                    {compiling ? "Compiling…" : "Compile"}
                </button>

                <button
                    onClick={onSave}
                    disabled={saving || saveStatus === "saved"}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--color-glass-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Save (Ctrl+S)"
                >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Save</span>
                </button>

                <div className="h-5 w-px bg-[var(--color-glass-border)] mx-0.5" />

                {/* Git Menu */}
                <GitMenu
                    projectId={projectId}
                    githubConnected={githubConnected}
                    githubRepoUrl={githubRepoUrl}
                    getContent={getContent}
                />

                {/* Export Menu */}
                <ExportMenu projectId={projectId} pdfUrl={pdfUrl} />

                {/* History */}
                <button
                    onClick={onToggleHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                    title="Version History (Ctrl+H)"
                >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">History</span>
                </button>

                {/* Files */}
                <button
                    onClick={onToggleFiles}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                    title="Project Files"
                >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Files</span>
                </button>

                {/* Settings */}
                <button
                    onClick={onToggleSettings}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                    title="Editor Settings"
                >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Settings</span>
                </button>

                <div className="h-5 w-px bg-[var(--color-glass-border)] mx-0.5" />

                <button
                    onClick={onToggleAI}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${errorCount > 0
                        ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                        : "hover:bg-[var(--color-glass-hover)]"
                        }`}
                    title="AI Assistant"
                >
                    <Sparkles className={`w-3.5 h-3.5 ${errorCount > 0 ? "text-amber-400" : ""
                        }`} />
                    <span className="hidden sm:inline">AI</span>
                </button>
            </div>

            {/* Right — presence + status */}
            <div className="flex items-center gap-3">
                {/* Presence avatars */}
                <PresenceAvatars peers={peers} connected={connected} />

                {errorCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {errorCount} error{errorCount !== 1 ? "s" : ""}
                    </div>
                )}

                {offlineDraft && (
                    <div
                        className="flex items-center gap-1 text-xs text-amber-400"
                        title="Working offline — draft saved locally"
                    >
                        <WifiOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Offline draft</span>
                    </div>
                )}

                <div className="flex items-center gap-1 text-xs text-[var(--color-surface-500)]">
                    {saveStatus === "saved" && (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Saved
                        </>
                    )}
                    {saveStatus === "unsaved" && (
                        <>
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            Unsaved
                        </>
                    )}
                    {saveStatus === "saving" && (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Saving…
                        </>
                    )}
                    {saveStatus === "error" && (
                        <>
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            Save failed
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
