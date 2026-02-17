"use client";

import { useState, useEffect } from "react";
import { X, Share2, Copy, Check, Loader2, Mail, Globe, Lock, Users } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface ShareDialogProps {
    projectId: string;
    projectName: string;
    isPublic: boolean;
}

export function ShareDialog({ projectId, projectName, isPublic }: ShareDialogProps) {
    const [open, setOpen] = useState(false);
    const [publicMode, setPublicMode] = useState(isPublic);
    const [copied, setCopied] = useState(false);
    const [email, setEmail] = useState("");
    const [inviting, setInviting] = useState(false);
    const [inviteStatus, setInviteStatus] = useState<string | null>(null);
    const [toggling, setToggling] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/editor/${projectId}`
        : "";

    const handleToggleVisibility = async () => {
        setToggling(true);
        try {
            const { error } = await supabase
                .from("projects")
                .update({ is_public: !publicMode })
                .eq("id", projectId);

            if (error) throw error;
            setPublicMode(!publicMode);
        } catch (err) {
            console.error("Error toggling visibility:", err);
        } finally {
            setToggling(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = async () => {
        if (!email.trim()) return;
        setInviting(true);
        setInviteStatus(null);

        try {
            const res = await fetch("/api/collaborate/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setInviteStatus("Invitation sent");
            setEmail("");
        } catch (err: any) {
            setInviteStatus(`Error: ${err.message}`);
        } finally {
            setInviting(false);
        }
    };

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="btn-ghost text-xs gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Share
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Dialog */}
            <div className="glass relative z-10 w-full max-w-md mx-4 rounded-2xl shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-surface-800/50">
                    <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-accent-400" />
                        <h2 className="text-white font-semibold">Share &quot;{projectName}&quot;</h2>
                    </div>
                    <button onClick={() => setOpen(false)} className="btn-ghost p-1" aria-label="Close">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Visibility toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {publicMode ? <Globe className="w-5 h-5 text-accent-400" /> : <Lock className="w-5 h-5 text-surface-400" />}
                            <div>
                                <p className="text-sm text-white font-medium">{publicMode ? "Public" : "Private"}</p>
                                <p className="text-xs text-surface-500">
                                    {publicMode
                                        ? "Anyone with the link can view"
                                        : "Only invited collaborators can access"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleVisibility}
                            disabled={toggling}
                            className="btn-secondary text-xs"
                        >
                            {toggling ? "..." : publicMode ? "Make Private" : "Make Public"}
                        </button>
                    </div>

                    {/* Copy link */}
                    <div className="flex gap-2">
                        <input type="text" value={shareUrl} readOnly className="input-field text-xs flex-1 font-mono" />
                        <button onClick={handleCopyLink} className="btn-primary text-xs gap-1.5 shrink-0">
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>

                    {/* Invite collaborator */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-surface-400">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">Invite Collaborator</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="input-field text-xs flex-1"
                            />
                            <button
                                onClick={handleInvite}
                                disabled={inviting || !email.trim()}
                                className="btn-primary text-xs gap-1.5 shrink-0"
                            >
                                {inviting ? <Loader2 className="w-3.5 h-3.5 icon-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                Invite
                            </button>
                        </div>
                        {inviteStatus && (
                            <p className={`text-xs ${inviteStatus.startsWith("Error") ? "text-danger" : "text-success"}`}>
                                {inviteStatus}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
