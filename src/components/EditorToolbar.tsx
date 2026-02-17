"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Save,
    Play,
    History,
    Bot,
    FolderOpen,
    Settings,
    Download,
    GitBranch,
    Share2,
    ChevronDown,
    Check,
    Loader2,
    Wifi,
    WifiOff,
    MoreHorizontal,
    FileText,
} from "lucide-react";
import { PresenceAvatars } from "./PresenceAvatars";
import { ThemeToggle } from "./ThemeToggle";
import { ShareDialog } from "./ShareDialog";
import { GitMenu } from "./GitMenu";
import { ExportMenu } from "./ExportMenu";

interface EditorToolbarProps {
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
    peers: Array<{ name: string; color: string }>;
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
}: EditorToolbarProps) {
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showGitMenu, setShowGitMenu] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(projectName);

    const handleNameSubmit = async () => {
        if (editedName.trim() && editedName !== projectName) {
            // TODO: Update project name via API
            console.log("Updating project name to:", editedName);
        }
        setIsEditingName(false);
    };

    const getSaveStatusIcon = () => {
        switch (saveStatus) {
            case "saving":
                return <Loader2 className="w-3 h-3 animate-spin" />;
            case "saved":
                return <Check className="w-3 h-3 text-emerald-400" />;
            case "error":
                return <WifiOff className="w-3 h-3 text-red-400" />;
            default:
                return null;
        }
    };

    const getSaveStatusText = () => {
        if (offlineDraft) return "Offline draft";
        switch (saveStatus) {
            case "saving":
                return "Saving...";
            case "saved":
                return "Saved";
            case "error":
                return "Save failed";
            case "unsaved":
                return "Unsaved changes";
            default:
                return "";
        }
    };

    return (
        <>
            <header className="h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)] flex items-center px-4 gap-3">
                {/* Left Section - Logo & Project Info */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                    </Link>

                    <div className="h-6 w-px bg-[var(--border-secondary)]" />

                    <div className="flex flex-col">
                        {isEditingName ? (
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onBlur={handleNameSubmit}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleNameSubmit();
                                    if (e.key === "Escape") {
                                        setEditedName(projectName);
                                        setIsEditingName(false);
                                    }
                                }}
                                className="text-sm font-medium bg-[var(--bg-tertiary)] border border-emerald-500/30 rounded px-2 py-0.5 focus:outline-none focus:border-emerald-500"
                                autoFocus
                            />
                        ) : (
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="text-sm font-medium text-[var(--text-primary)] hover:text-emerald-400 transition-colors text-left"
                            >
                                {projectName}
                            </button>
                        )}
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                                {getSaveStatusIcon()}
                                {getSaveStatusText()}
                            </span>
                            {!connected && (
                                <span className="flex items-center gap-1 text-yellow-400">
                                    <WifiOff className="w-3 h-3" />
                                    Offline
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center Section - Actions */}
                <div className="flex-1 flex items-center justify-center gap-1">
                    <ToolbarButton
                        onClick={onToggleFiles}
                        icon={FolderOpen}
                        label="Files"
                        shortcut="Ctrl+\\"
                    />
                    <ToolbarButton
                        onClick={onToggleHistory}
                        icon={History}
                        label="History"
                        shortcut="Ctrl+Shift+H"
                    />
                    <ToolbarButton
                        onClick={onToggleAI}
                        icon={Bot}
                        label="AI"
                        shortcut=""
                    />
                    <div className="h-6 w-px bg-[var(--border-secondary)] mx-1" />
                    <ToolbarButton
                        onClick={() => setShowGitMenu(!showGitMenu)}
                        icon={GitBranch}
                        label="Git"
                        active={showGitMenu}
                    />
                </div>

                {/* Right Section - Compile, Share, Settings */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Presence Avatars */}
                    {peers.length > 0 && (
                        <PresenceAvatars peers={peers} className="mr-2" />
                    )}

                    {/* Connection Status */}
                    <div
                        className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-yellow-400"
                            }`}
                        title={connected ? "Connected" : "Reconnecting..."}
                    />

                    <div className="h-6 w-px bg-[var(--border-secondary)]" />

                    {/* Compile Button */}
                    <button
                        onClick={onCompile}
                        disabled={compiling}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-sm transition-all ${compiling
                                ? "bg-yellow-500/20 text-yellow-400 cursor-wait"
                                : errorCount > 0
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            }`}
                    >
                        {compiling ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Compiling...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Compile
                                {errorCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                        {errorCount}
                                    </span>
                                )}
                            </>
                        )}
                    </button>

                    {/* Export Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={!hasCompiledPdf}
                            className="btn-ghost"
                            title="Export"
                        >
                            <Download className="w-4 h-4" />
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showExportMenu && (
                            <ExportMenu
                                pdfUrl={pdfUrl}
                                onClose={() => setShowExportMenu(false)}
                            />
                        )}
                    </div>

                    {/* Share Button */}
                    <button
                        onClick={() => setShowShareDialog(true)}
                        className="btn-primary text-sm"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>

                    <div className="h-6 w-px bg-[var(--border-secondary)]" />

                    {/* Settings */}
                    <button
                        onClick={onToggleSettings}
                        className="btn-ghost"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    <ThemeToggle />
                </div>
            </header>

            {/* Git Menu Dropdown */}
            {showGitMenu && (
                <GitMenu
                    projectId={projectId}
                    githubConnected={githubConnected}
                    githubRepoUrl={githubRepoUrl}
                    onClose={() => setShowGitMenu(false)}
                />
            )}

            {/* Share Dialog */}
            {showShareDialog && (
                <ShareDialog
                    projectId={projectId}
                    projectName={projectName}
                    isOpen={showShareDialog}
                    onClose={() => setShowShareDialog(false)}
                />
            )}
        </>
    );
}

interface ToolbarButtonProps {
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    shortcut?: string;
    active?: boolean;
}

function ToolbarButton({
    onClick,
    icon: Icon,
    label,
    shortcut,
    active,
}: ToolbarButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                }`}
            title={shortcut ? `${label} (${shortcut})` : label}
        >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
