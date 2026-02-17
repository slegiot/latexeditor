"use client";

import { useState } from "react";
import { User, Mail, Github, Key, Bell, Palette, Loader2, Check, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SettingsFormProps {
    user: {
        id: string;
        email: string;
    };
    profile: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    githubConnected: boolean;
}

export function SettingsForm({ user, profile, githubConnected }: SettingsFormProps) {
    const [activeTab, setActiveTab] = useState<"profile" | "account" | "notifications" | "appearance">("profile");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [formData, setFormData] = useState({
        fullName: profile?.full_name || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        emailNotifications: true,
        collaborationAlerts: true,
        marketingEmails: false,
    });

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSaveMessage(null);

        try {
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: formData.fullName,
                }),
            });

            if (response.ok) {
                setSaveMessage({ type: "success", text: "Profile updated successfully!" });
            } else {
                setSaveMessage({ type: "error", text: "Failed to update profile" });
            }
        } catch {
            setSaveMessage({ type: "error", text: "An error occurred" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleConnectGitHub = async () => {
        try {
            const response = await fetch("/api/github/auth");
            if (response.ok) {
                const data = await response.json();
                window.location.href = data.url;
            }
        } catch {
            alert("Failed to connect to GitHub");
        }
    };

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "account", label: "Account", icon: Key },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "appearance", label: "Appearance", icon: Palette },
    ];

    return (
        <div className="card overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-[var(--border-secondary)] overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${activeTab === tab.id
                                ? "text-emerald-400 border-emerald-400"
                                : "text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6">
                {saveMessage && (
                    <div
                        className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${saveMessage.type === "success"
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                : "bg-red-500/10 border border-red-500/20 text-red-400"
                            }`}
                    >
                        {saveMessage.type === "success" ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        {saveMessage.text}
                    </div>
                )}

                {activeTab === "profile" && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) =>
                                    setFormData({ ...formData, fullName: e.target.value })
                                }
                                className="input-field"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="input-field opacity-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                Email cannot be changed
                            </p>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="btn-primary"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                )}

                {activeTab === "account" && (
                    <div className="space-y-6">
                        {/* GitHub Integration */}
                        <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                                        <Github className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">GitHub</h4>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {githubConnected
                                                ? "Connected to GitHub"
                                                : "Connect your GitHub account"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleConnectGitHub}
                                    className={githubConnected ? "btn-secondary" : "btn-primary"}
                                >
                                    {githubConnected ? "Reconnect" : "Connect"}
                                </button>
                            </div>
                        </div>

                        {/* Change Password */}
                        <div className="border-t border-[var(--border-secondary)] pt-6">
                            <h4 className="font-medium mb-4">Change Password</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, currentPassword: e.target.value })
                                        }
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, newPassword: e.target.value })
                                        }
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, confirmPassword: e.target.value })
                                        }
                                        className="input-field"
                                    />
                                </div>
                                <button className="btn-primary">Update Password</button>
                            </div>
                        </div>

                        {/* Delete Account */}
                        <div className="border-t border-[var(--border-secondary)] pt-6">
                            <h4 className="font-medium text-red-400 mb-2">Danger Zone</h4>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                Once you delete your account, there is no going back.
                            </p>
                            <button className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors">
                                Delete Account
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "notifications" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between py-4 border-b border-[var(--border-secondary)]">
                            <div>
                                <h4 className="font-medium">Email Notifications</h4>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Receive updates about your projects
                                </p>
                            </div>
                            <Toggle
                                checked={formData.emailNotifications}
                                onChange={(v) =>
                                    setFormData({ ...formData, emailNotifications: v })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between py-4 border-b border-[var(--border-secondary)]">
                            <div>
                                <h4 className="font-medium">Collaboration Alerts</h4>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Get notified when someone edits your projects
                                </p>
                            </div>
                            <Toggle
                                checked={formData.collaborationAlerts}
                                onChange={(v) =>
                                    setFormData({ ...formData, collaborationAlerts: v })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between py-4">
                            <div>
                                <h4 className="font-medium">Marketing Emails</h4>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Receive product updates and promotions
                                </p>
                            </div>
                            <Toggle
                                checked={formData.marketingEmails}
                                onChange={(v) =>
                                    setFormData({ ...formData, marketingEmails: v })
                                }
                            />
                        </div>
                    </div>
                )}

                {activeTab === "appearance" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between py-4">
                            <div>
                                <h4 className="font-medium">Dark Mode</h4>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Toggle between light and dark themes
                                </p>
                            </div>
                            <ThemeToggle />
                        </div>

                        <div className="flex items-center justify-between py-4 border-t border-[var(--border-secondary)]">
                            <div>
                                <h4 className="font-medium">Compact Mode</h4>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Reduce spacing throughout the interface
                                </p>
                            </div>
                            <Toggle checked={false} onChange={() => { }} />
                        </div>

                        <div className="flex items-center justify-between py-4 border-t border-[var(--border-secondary)]">
                            <div>
                                <h4 className="font-medium">Show Welcome Guide</h4>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Display onboarding tips for new features
                                </p>
                            </div>
                            <Toggle checked={true} onChange={() => { }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-[var(--bg-tertiary)]"
                }`}
        >
            <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </button>
    );
}
