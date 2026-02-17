"use client";

import { useState, useEffect } from "react";
import { X, Type, Palette, Layout, Keyboard } from "lucide-react";

interface EditorSettingsProps {
    open: boolean;
    onClose: () => void;
}

interface Settings {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    wordWrap: boolean;
    minimap: boolean;
    lineNumbers: boolean;
    bracketMatching: boolean;
    autoSave: boolean;
    autoSaveDelay: number;
    theme: string;
}

const defaultSettings: Settings = {
    fontSize: 14,
    fontFamily: "JetBrains Mono",
    lineHeight: 1.5,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    bracketMatching: true,
    autoSave: true,
    autoSaveDelay: 3000,
    theme: "latexforge-dark",
};

export function EditorSettings({ open, onClose }: EditorSettingsProps) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [activeTab, setActiveTab] = useState<"editor" | "appearance" | "shortcuts">("editor");

    useEffect(() => {
        // Load settings from localStorage
        const stored = localStorage.getItem("latexforge-settings");
        if (stored) {
            try {
                setSettings({ ...defaultSettings, ...JSON.parse(stored) });
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    const updateSetting = <K extends keyof Settings>(
        key: K,
        value: Settings[K]
    ) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem("latexforge-settings", JSON.stringify(newSettings));
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl glass-strong border border-[var(--border-primary)] shadow-2xl animate-scale-in flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
                    <h2 className="text-xl font-semibold">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        aria-label="Close settings"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-secondary)]">
                    <TabButton
                        active={activeTab === "editor"}
                        onClick={() => setActiveTab("editor")}
                        icon={Type}
                        label="Editor"
                    />
                    <TabButton
                        active={activeTab === "appearance"}
                        onClick={() => setActiveTab("appearance")}
                        icon={Palette}
                        label="Appearance"
                    />
                    <TabButton
                        active={activeTab === "shortcuts"}
                        onClick={() => setActiveTab("shortcuts")}
                        icon={Keyboard}
                        label="Shortcuts"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === "editor" && (
                        <div className="space-y-6">
                            {/* Font Size */}
                            <SettingRow
                                label="Font Size"
                                description="Editor font size in pixels"
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="10"
                                        max="24"
                                        value={settings.fontSize}
                                        onChange={(e) =>
                                            updateSetting("fontSize", parseInt(e.target.value))
                                        }
                                        className="w-32"
                                    />
                                    <span className="text-sm text-[var(--text-secondary)] w-8">
                                        {settings.fontSize}px
                                    </span>
                                </div>
                            </SettingRow>

                            {/* Line Height */}
                            <SettingRow
                                label="Line Height"
                                description="Space between lines"
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="1"
                                        max="2.5"
                                        step="0.1"
                                        value={settings.lineHeight}
                                        onChange={(e) =>
                                            updateSetting("lineHeight", parseFloat(e.target.value))
                                        }
                                        className="w-32"
                                    />
                                    <span className="text-sm text-[var(--text-secondary)] w-8">
                                        {settings.lineHeight}
                                    </span>
                                </div>
                            </SettingRow>

                            {/* Word Wrap */}
                            <SettingRow
                                label="Word Wrap"
                                description="Wrap lines at viewport width"
                            >
                                <Toggle
                                    checked={settings.wordWrap}
                                    onChange={(v) => updateSetting("wordWrap", v)}
                                />
                            </SettingRow>

                            {/* Line Numbers */}
                            <SettingRow
                                label="Line Numbers"
                                description="Show line numbers in editor"
                            >
                                <Toggle
                                    checked={settings.lineNumbers}
                                    onChange={(v) => updateSetting("lineNumbers", v)}
                                />
                            </SettingRow>

                            {/* Minimap */}
                            <SettingRow
                                label="Minimap"
                                description="Show code overview on the right"
                            >
                                <Toggle
                                    checked={settings.minimap}
                                    onChange={(v) => updateSetting("minimap", v)}
                                />
                            </SettingRow>

                            {/* Auto Save */}
                            <SettingRow
                                label="Auto Save"
                                description="Automatically save changes"
                            >
                                <Toggle
                                    checked={settings.autoSave}
                                    onChange={(v) => updateSetting("autoSave", v)}
                                />
                            </SettingRow>
                        </div>
                    )}

                    {activeTab === "appearance" && (
                        <div className="space-y-6">
                            {/* Theme */}
                            <SettingRow label="Editor Theme" description="Color scheme for the editor">
                                <select
                                    value={settings.theme}
                                    onChange={(e) => updateSetting("theme", e.target.value)}
                                    className="input-field w-auto"
                                >
                                    <option value="latexforge-dark">LaTeX Forge Dark</option>
                                    <option value="latexforge-light">LaTeX Forge Light</option>
                                    <option value="vs-dark">VS Dark</option>
                                    <option value="vs">VS Light</option>
                                    <option value="hc-black">High Contrast</option>
                                </select>
                            </SettingRow>

                            {/* Font Family */}
                            <SettingRow label="Font Family" description="Editor font">
                                <select
                                    value={settings.fontFamily}
                                    onChange={(e) => updateSetting("fontFamily", e.target.value)}
                                    className="input-field w-auto"
                                >
                                    <option value="JetBrains Mono">JetBrains Mono</option>
                                    <option value="Fira Code">Fira Code</option>
                                    <option value="Cascadia Code">Cascadia Code</option>
                                    <option value="SF Mono">SF Mono</option>
                                    <option value="Consolas">Consolas</option>
                                </select>
                            </SettingRow>
                        </div>
                    )}

                    {activeTab === "shortcuts" && (
                        <div className="space-y-4">
                            <ShortcutRow action="Compile" shortcut="Ctrl + Enter" />
                            <ShortcutRow action="Save" shortcut="Ctrl + S" />
                            <ShortcutRow action="Toggle Files" shortcut="Ctrl + \" />
                            <ShortcutRow action="Toggle Preview" shortcut="Ctrl + Shift + P" />
                            <ShortcutRow action="Toggle History" shortcut="Ctrl + Shift + H" />
                            <ShortcutRow action="Toggle AI" shortcut="Ctrl + Shift + A" />
                            <ShortcutRow action="Find" shortcut="Ctrl + F" />
                            <ShortcutRow action="Replace" shortcut="Ctrl + H" />
                            <ShortcutRow action="Go to Line" shortcut="Ctrl + G" />
                            <ShortcutRow action="Command Palette" shortcut="F1" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-secondary)]">
                    <button
                        onClick={() => {
                            setSettings(defaultSettings);
                            localStorage.setItem(
                                "latexforge-settings",
                                JSON.stringify(defaultSettings)
                            );
                        }}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        Reset to Defaults
                    </button>
                    <button onClick={onClose} className="btn-primary">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${active
                    ? "text-emerald-400 border-emerald-400"
                    : "text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]"
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

interface SettingRowProps {
    label: string;
    description?: string;
    children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <label className="font-medium text-sm">{label}</label>
                {description && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
                )}
            </div>
            {children}
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

interface ShortcutRowProps {
    action: string;
    shortcut: string;
}

function ShortcutRow({ action, shortcut }: ShortcutRowProps) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-[var(--border-secondary)] last:border-0">
            <span className="text-sm">{action}</span>
            <kbd className="px-2 py-1 text-xs font-mono bg-[var(--bg-tertiary)] rounded border border-[var(--border-secondary)]">
                {shortcut}
            </kbd>
        </div>
    );
}
