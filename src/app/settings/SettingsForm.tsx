"use client";

import { useState } from "react";
import {
    Sun,
    Moon,
    Monitor,
    Save,
    Loader2,
    Check,
    Type,
    Timer,
    FileText,
    User,
} from "lucide-react";

interface Settings {
    theme: "dark" | "light" | "system";
    font_size: number;
    auto_save: boolean;
    auto_save_interval: number;
    default_export: "pdf" | "zip";
    vim_mode: boolean;
    word_wrap: boolean;
    minimap: boolean;
}

interface SettingsFormProps {
    initialSettings: Settings;
    profile: {
        fullName: string;
        email: string;
    };
}

export function SettingsForm({ initialSettings, profile }: SettingsFormProps) {
    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [name, setName] = useState(profile.fullName);

    function update<K extends keyof Settings>(key: K, value: Settings[K]) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    }

    function setTheme(theme: "dark" | "light" | "system") {
        update("theme", theme);
        const resolved =
            theme === "system"
                ? window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
                : theme;
        document.documentElement.className = resolved;
        localStorage.setItem("latexforge-theme", resolved);
    }

    async function handleSave() {
        setSaving(true);
        try {
            await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings, name }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            // ignore
        } finally {
            setSaving(false);
        }
    }

    const themeOptions = [
        { key: "dark" as const, label: "Dark", icon: Moon },
        { key: "light" as const, label: "Light", icon: Sun },
        { key: "system" as const, label: "System", icon: Monitor },
    ];

    return (
        <div className="space-y-8">
            {/* Profile */}
            <section className="glass rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-[var(--color-accent-400)]" />
                    <h2 className="text-sm font-semibold">Profile</h2>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-[var(--color-surface-500)] mb-1 block">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setSaved(false); }}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-surface-500)] mb-1 block">
                            Email
                        </label>
                        <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="input-field opacity-50 cursor-not-allowed"
                        />
                    </div>
                </div>
            </section>

            {/* Theme */}
            <section className="glass rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Moon className="w-4 h-4 text-[var(--color-accent-400)]" />
                    <h2 className="text-sm font-semibold">Theme</h2>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {themeOptions.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTheme(key)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${settings.theme === key
                                    ? "border-[var(--color-accent-500)] bg-[var(--color-accent-500)]/10"
                                    : "border-[var(--color-glass-border)] hover:border-[var(--color-surface-400)]"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Editor */}
            <section className="glass rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Type className="w-4 h-4 text-[var(--color-accent-400)]" />
                    <h2 className="text-sm font-semibold">Editor</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm">Font Size</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min={10}
                                max={24}
                                value={settings.font_size}
                                onChange={(e) => update("font_size", parseInt(e.target.value))}
                                className="w-24 accent-[var(--color-accent-500)]"
                            />
                            <span className="text-xs font-mono w-6 text-right">{settings.font_size}</span>
                        </div>
                    </div>

                    <Toggle
                        label="Word Wrap"
                        checked={settings.word_wrap}
                        onChange={(v) => update("word_wrap", v)}
                    />

                    <Toggle
                        label="Minimap"
                        checked={settings.minimap}
                        onChange={(v) => update("minimap", v)}
                    />

                    <Toggle
                        label="Vim Mode"
                        description="Use Vim keybindings in the editor"
                        checked={settings.vim_mode}
                        onChange={(v) => update("vim_mode", v)}
                    />
                </div>
            </section>

            {/* Auto-save */}
            <section className="glass rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-[var(--color-accent-400)]" />
                    <h2 className="text-sm font-semibold">Auto-Save</h2>
                </div>

                <Toggle
                    label="Enable Auto-Save"
                    checked={settings.auto_save}
                    onChange={(v) => update("auto_save", v)}
                />

                {settings.auto_save && (
                    <div className="flex items-center justify-between pl-1">
                        <label className="text-sm text-[var(--color-surface-600)]">
                            Interval (seconds)
                        </label>
                        <select
                            value={settings.auto_save_interval}
                            onChange={(e) => update("auto_save_interval", parseInt(e.target.value))}
                            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-surface-100)] border border-[var(--color-glass-border)] focus:outline-none focus:border-[var(--color-accent-500)]"
                        >
                            <option value={15}>15s</option>
                            <option value={30}>30s</option>
                            <option value={60}>1 min</option>
                            <option value={120}>2 min</option>
                            <option value={300}>5 min</option>
                        </select>
                    </div>
                )}
            </section>

            {/* Export */}
            <section className="glass rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-[var(--color-accent-400)]" />
                    <h2 className="text-sm font-semibold">Default Export</h2>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {(["pdf", "zip"] as const).map((fmt) => (
                        <button
                            key={fmt}
                            onClick={() => update("default_export", fmt)}
                            className={`p-3 rounded-xl border transition-all text-sm font-medium uppercase ${settings.default_export === fmt
                                    ? "border-[var(--color-accent-500)] bg-[var(--color-accent-500)]/10"
                                    : "border-[var(--color-glass-border)] hover:border-[var(--color-surface-400)]"
                                }`}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>
            </section>

            {/* Save */}
            <button
                onClick={handleSave}
                disabled={saving || saved}
                className="btn-primary w-full !py-3"
            >
                {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : saved ? (
                    <><Check className="w-4 h-4" /> Saved</>
                ) : (
                    <><Save className="w-4 h-4" /> Save Settings</>
                )}
            </button>
        </div>
    );
}

function Toggle({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <span className="text-sm">{label}</span>
                {description && (
                    <p className="text-[10px] text-[var(--color-surface-500)]">{description}</p>
                )}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`w-10 h-5 rounded-full transition-colors relative ${checked ? "bg-[var(--color-accent-500)]" : "bg-[var(--color-surface-400)]"
                    }`}
            >
                <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "left-5.5" : "left-0.5"
                        }`}
                />
            </button>
        </div>
    );
}
