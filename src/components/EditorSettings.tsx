"use client";

import { useState, useEffect } from "react";
import { X, Settings, Check, ChevronDown } from "lucide-react";

interface EditorSettingsProps {
    open: boolean;
    onClose: () => void;
}

interface SettingsState {
    compiler: "pdflatex" | "xelatex" | "lualatex";
    spellCheck: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
}

const defaultSettings: SettingsState = {
    compiler: "pdflatex",
    spellCheck: true,
    autoSave: true,
    autoSaveInterval: 3000,
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    minimap: true,
};

export function EditorSettings({ open, onClose }: EditorSettingsProps) {
    const [settings, setSettings] = useState<SettingsState>(defaultSettings);
    const [saved, setSaved] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        if (open) {
            const stored = localStorage.getItem("latexforge-editor-settings");
            if (stored) {
                try {
                    setSettings({ ...defaultSettings, ...JSON.parse(stored) });
                } catch {
                    // Use defaults
                }
            }
        }
    }, [open]);

    // Save settings to localStorage
    const handleSave = () => {
        localStorage.setItem("latexforge-editor-settings", JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 glass rounded-xl shadow-[var(--shadow-card)] animate-scale-in overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-glass-border)]">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[var(--color-accent-400)]" />
                        <h2 className="text-lg font-semibold">Editor Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--color-surface-500)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Compiler Section */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            LaTeX Compiler
                        </label>
                        <div className="relative">
                            <select
                                value={settings.compiler}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        compiler: e.target.value as SettingsState["compiler"],
                                    })
                                }
                                className="input-field appearance-none pr-10"
                            >
                                <option value="pdflatex">pdfLaTeX (default)</option>
                                <option value="xelatex">XeLaTeX (Unicode)</option>
                                <option value="lualatex">LuaLaTeX (Lua)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-surface-500)] pointer-events-none" />
                        </div>
                        <p className="text-xs text-[var(--color-surface-500)] mt-1.5">
                            Choose the LaTeX engine for PDF compilation
                        </p>
                    </div>

                    {/* Font Size */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Font Size
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="10"
                                max="24"
                                value={settings.fontSize}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        fontSize: parseInt(e.target.value),
                                    })
                                }
                                className="flex-1 accent-[var(--color-accent-400)]"
                            />
                            <span className="text-sm font-mono w-10 text-center">
                                {settings.fontSize}
                            </span>
                        </div>
                    </div>

                    {/* Tab Size */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Tab Size
                        </label>
                        <div className="flex gap-2">
                            {[2, 4, 8].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSettings({ ...settings, tabSize: size })}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settings.tabSize === size
                                            ? "bg-[var(--color-accent-500)] text-white"
                                            : "glass hover:bg-[var(--color-glass-hover)]"
                                        }`}
                                >
                                    {size} spaces
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toggle Options */}
                    <div className="space-y-3">
                        <ToggleOption
                            label="Word Wrap"
                            description="Wrap long lines in the editor"
                            checked={settings.wordWrap}
                            onChange={(checked) => setSettings({ ...settings, wordWrap: checked })}
                        />
                        <ToggleOption
                            label="Line Numbers"
                            description="Show line numbers in the gutter"
                            checked={settings.lineNumbers}
                            onChange={(checked) => setSettings({ ...settings, lineNumbers: checked })}
                        />
                        <ToggleOption
                            label="Minimap"
                            description="Show code minimap on the right"
                            checked={settings.minimap}
                            onChange={(checked) => setSettings({ ...settings, minimap: checked })}
                        />
                        <ToggleOption
                            label="Auto Save"
                            description="Automatically save drafts locally"
                            checked={settings.autoSave}
                            onChange={(checked) => setSettings({ ...settings, autoSave: checked })}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--color-glass-border)] bg-[var(--color-surface-100)]">
                    <button
                        onClick={() => setSettings(defaultSettings)}
                        className="text-sm text-[var(--color-surface-500)] hover:text-[var(--color-surface-900)] transition-colors"
                    >
                        Reset to defaults
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="btn-secondary text-sm px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-primary text-sm px-4 py-2"
                        >
                            {saved ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Saved
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ToggleOptionProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function ToggleOption({ label, description, checked, onChange }: ToggleOptionProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-[var(--color-surface-500)]">{description}</p>
            </div>
            <button
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors ${checked
                        ? "bg-[var(--color-accent-500)]"
                        : "bg-[var(--color-surface-400)]"
                    }`}
            >
                <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </button>
        </div>
    );
}
