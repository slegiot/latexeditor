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
        <div className="space-y-6">
            {/* Profile */}
            <section className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                    <User className="w-4 h-4 text-accent-400" />
                    <h2 className="text-white font-semibold">Profile</h2>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm text-surface-400 font-medium">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setSaved(false); }}
                            className="input-field"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm text-surface-400 font-medium">Email</label>
                        <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="input-field opacity-60 cursor-not-allowed"
                        />
                    </div>
                </div>
            </section>

            {/* Theme */}
            <section className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Moon className="w-4 h-4 text-accent-400" />
                    <h2 className="text-white font-semibold">Theme</h2>
                </div>

                <div className="flex gap-2">
                    {themeOptions.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTheme(key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${settings.theme === key
                                    ? "bg-accent-500/20 text-accent-400 ring-1 ring-accent-500/30"
                                    : "bg-surface-800/50 text-surface-400 hover:bg-surface-800 hover:text-surface-300"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Editor */}
            <section className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Type className="w-4 h-4 text-accent-400" />
                    <h2 className="text-white font-semibold">Editor</h2>
                </div>

                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm text-surface-400 font-medium">Font Size</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={10}
                                max={24}
                                value={settings.font_size}
                                onChange={(e) => update("font_size", parseInt(e.target.value))}
                                className="flex-1 h-1.5 bg-surface-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                            />
                            <span className="text-sm text-surface-300 font-mono w-8 text-right">{settings.font_size}</span>
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
            <section className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Timer className="w-4 h-4 text-accent-400" />
                    <h2 className="text-white font-semibold">Auto-Save</h2>
                </div>

                <div className="space-y-4">
                    <Toggle
                        label="Enable Auto-Save"
                        checked={settings.auto_save}
                        onChange={(v) => update("auto_save", v)}
                    />

                    {settings.auto_save && (
                        <div className="space-y-1.5">
                            <label className="text-sm text-surface-400 font-medium">Interval (seconds)</label>
                            <select
                                value={settings.auto_save_interval}
                                onChange={(e) => update("auto_save_interval", parseInt(e.target.value))}
                                className="input-field text-sm"
                            >
                                <option value={15}>15s</option>
                                <option value={30}>30s</option>
                                <option value={60}>1 min</option>
                                <option value={120}>2 min</option>
                                <option value={300}>5 min</option>
                            </select>
                        </div>
                    )}
                </div>
            </section>

            {/* Export */}
            <section className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                    <FileText className="w-4 h-4 text-accent-400" />
                    <h2 className="text-white font-semibold">Default Export</h2>
                </div>

                <div className="flex gap-2">
                    {(["pdf", "zip"] as const).map((fmt) => (
                        <button
                            key={fmt}
                            onClick={() => update("default_export", fmt)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all uppercase ${settings.default_export === fmt
                                    ? "bg-accent-500/20 text-accent-400 ring-1 ring-accent-500/30"
                                    : "bg-surface-800/50 text-surface-400 hover:bg-surface-800"
                                }`}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className="btn-primary text-sm"
                >
                    {saving ? (
                        <><Loader2 className="w-4 h-4 icon-spin" /> Saving…</>
                    ) : saved ? (
                        <><Check className="w-4 h-4" /> Saved</>
                    ) : (
                        <><Save className="w-4 h-4" /> Save Settings</>
                    )}
                </button>
            </div>
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
                <span className="text-sm text-white">{label}</span>
                {description && (
                    <p className="text-xs text-surface-500 mt-0.5">{description}</p>
                )}
            </div>
            <button
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-accent-500" : "bg-surface-700"
                    }`}
            >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"
                    }`} />
            </button>
        </div>
    );
}
