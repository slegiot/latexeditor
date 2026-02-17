"use client";

import { useState } from "react";
import {
    X,
    Copy,
    Check,
    Link as LinkIcon,
    Mail,
    Users,
    Shield,
    Globe,
    Lock,
    Loader2,
} from "lucide-react";

interface ShareDialogProps {
    projectId: string;
    projectName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ShareDialog({
    projectId,
    projectName,
    isOpen,
    onClose,
}: ShareDialogProps) {
    const [activeTab, setActiveTab] = useState<"invite" | "link">("invite");
    const [email, setEmail] = useState("");
    const [permission, setPermission] = useState<"view" | "edit">("view");
    const [isSharing, setIsSharing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState("");

    // Generate share link
    const generateLink = async () => {
        setIsSharing(true);
        try {
            const response = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    permission,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const url = `${window.location.origin}/shared/${data.shareId}`;
                setShareUrl(url);
            }
        } catch {
            alert("Failed to generate share link");
        } finally {
            setIsSharing(false);
        }
    };

    const handleCopyLink = async () => {
        if (!shareUrl) {
            await generateLink();
        }
        if (shareUrl) {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleInvite = async () => {
        if (!email.trim()) return;

        setIsSharing(true);
        try {
            const response = await fetch("/api/share/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    email: email.trim(),
                    permission,
                }),
            });

            if (response.ok) {
                setEmail("");
                alert("Invitation sent!");
            } else {
                const error = await response.json();
                alert(error.error || "Failed to send invitation");
            }
        } catch {
            alert("Failed to send invitation");
        } finally {
            setIsSharing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md rounded-2xl glass-strong border border-[var(--border-primary)] shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
                    <div>
                        <h2 className="text-xl font-semibold">Share Project</h2>
                        <p className="text-sm text-[var(--text-secondary)] truncate max-w-[250px]">
                            {projectName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-secondary)]">
                    <button
                        onClick={() => setActiveTab("invite")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "invite"
                                ? "text-emerald-400 border-b-2 border-emerald-400"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                    >
                        <Mail className="w-4 h-4" />
                        Invite People
                    </button>
                    <button
                        onClick={() => setActiveTab("link")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "link"
                                ? "text-emerald-400 border-b-2 border-emerald-400"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                    >
                        <LinkIcon className="w-4 h-4" />
                        Share Link
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === "invite" ? (
                        <div className="space-y-4">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Email Address
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="colleague@example.com"
                                        className="input-field flex-1"
                                    />
                                </div>
                            </div>

                            {/* Permission Selection */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Permission Level
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setPermission("view")}
                                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${permission === "view"
                                                ? "border-emerald-500/50 bg-emerald-500/10"
                                                : "border-[var(--border-secondary)] hover:border-[var(--border-primary)]"
                                            }`}
                                    >
                                        <EyeIcon />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Can View</p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Read only
                                            </p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setPermission("edit")}
                                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${permission === "edit"
                                                ? "border-emerald-500/50 bg-emerald-500/10"
                                                : "border-[var(--border-secondary)] hover:border-[var(--border-primary)]"
                                            }`}
                                    >
                                        <EditIcon />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Can Edit</p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Make changes
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Send Button */}
                            <button
                                onClick={handleInvite}
                                disabled={!email.trim() || isSharing}
                                className="w-full btn-primary justify-center"
                            >
                                {isSharing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" />
                                        Send Invitation
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Permission Selection */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Link Permission
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setPermission("view")}
                                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${permission === "view"
                                                ? "border-emerald-500/50 bg-emerald-500/10"
                                                : "border-[var(--border-secondary)] hover:border-[var(--border-primary)]"
                                            }`}
                                    >
                                        <Globe className="w-4 h-4" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Anyone with link</p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Can view
                                            </p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setPermission("edit")}
                                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${permission === "edit"
                                                ? "border-emerald-500/50 bg-emerald-500/10"
                                                : "border-[var(--border-secondary)] hover:border-[var(--border-primary)]"
                                            }`}
                                    >
                                        <Users className="w-4 h-4" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Anyone with link</p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Can edit
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Share Link */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Share Link
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-sm text-[var(--text-secondary)] truncate">
                                        {shareUrl || "Click generate to create link..."}
                                    </div>
                                    <button
                                        onClick={handleCopyLink}
                                        disabled={isSharing}
                                        className="btn-secondary"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Security Note */}
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]">
                                <Shield className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Anyone with this link will be able to access your project.
                                    Share carefully.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function EyeIcon() {
    return (
        <svg
            className="w-5 h-5 text-[var(--text-secondary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg
            className="w-5 h-5 text-[var(--text-secondary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
        </svg>
    );
}
