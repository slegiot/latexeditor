"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Copy, Check, Globe, Lock, Mail, X, Loader2 } from "lucide-react";

interface ShareDialogProps {
    projectId: string;
    projectName: string;
    isPublic: boolean;
}

export function ShareDialog({ projectId, projectName, isPublic: initialPublic }: ShareDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPublic, setIsPublic] = useState(initialPublic);
    const [copied, setCopied] = useState(false);
    const [email, setEmail] = useState("");
    const [inviting, setInviting] = useState(false);
    const [inviteMsg, setInviteMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/shared/${projectId}`
        : "";

    useEffect(() => {
        if (!open) return;
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [open]);

    async function togglePublic() {
        const next = !isPublic;
        setIsPublic(next);
        try {
            await fetch("/api/git", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_visibility",
                    projectId,
                    isPublic: next,
                }),
            });
        } catch {
            setIsPublic(!next); // revert
        }
    }

    function copyLink() {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function inviteUser() {
        if (!email) return;
        setInviting(true);
        setInviteMsg(null);
        try {
            const res = await fetch("/api/git", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "invite_collaborator",
                    projectId,
                    email,
                }),
            });
            const data = await res.json();
            setInviteMsg({
                text: data.message || (data.success ? "Invited!" : "Failed"),
                ok: !!data.success,
            });
            if (data.success) setEmail("");
        } catch {
            setInviteMsg({ text: "Network error", ok: false });
        } finally {
            setInviting(false);
            setTimeout(() => setInviteMsg(null), 3000);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                title="Share project"
            >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div
                        ref={dialogRef}
                        className="w-full max-w-md mx-4 rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface-100)] shadow-2xl animate-scale-in"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-glass-border)]">
                            <h3 className="text-lg font-semibold">Share &ldquo;{projectName}&rdquo;</h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-glass-hover)]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Public toggle */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-50)]">
                                <div className="flex items-center gap-2.5">
                                    {isPublic ? (
                                        <Globe className="w-4 h-4 text-[var(--color-accent-400)]" />
                                    ) : (
                                        <Lock className="w-4 h-4 text-[var(--color-surface-500)]" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium">{isPublic ? "Public" : "Private"}</p>
                                        <p className="text-[10px] text-[var(--color-surface-500)]">
                                            {isPublic ? "Anyone with the link can view" : "Only you and collaborators"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={togglePublic}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? "bg-[var(--color-accent-500)]" : "bg-[var(--color-surface-400)]"
                                        }`}
                                >
                                    <div
                                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? "left-5.5" : "left-0.5"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Share link */}
                            {isPublic && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[var(--color-surface-600)]">
                                        Share link
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={shareUrl}
                                            className="flex-1 px-3 py-2 text-xs rounded-lg bg-[var(--color-surface-50)] border border-[var(--color-glass-border)] text-[var(--color-surface-700)] font-mono"
                                        />
                                        <button
                                            onClick={copyLink}
                                            className="px-3 py-2 rounded-lg bg-[var(--color-accent-500)] text-white text-xs font-medium hover:bg-[var(--color-accent-600)] transition-colors"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Invite */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--color-surface-600)]">
                                    Invite collaborator
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-surface-500)]" />
                                        <input
                                            type="email"
                                            placeholder="colleague@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && inviteUser()}
                                            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[var(--color-surface-50)] border border-[var(--color-glass-border)] focus:border-[var(--color-accent-500)] focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={inviteUser}
                                        disabled={!email || inviting}
                                        className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-glass)] border border-[var(--color-glass-border)] hover:border-[var(--color-accent-500)] disabled:opacity-50 transition-colors"
                                    >
                                        {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Invite"}
                                    </button>
                                </div>
                                {inviteMsg && (
                                    <p className={`text-[10px] ${inviteMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                                        {inviteMsg.text}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
