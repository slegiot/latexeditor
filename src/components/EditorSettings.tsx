"use client";

import { useState, useEffect } from "react";
import { X, Settings, Check } from "lucide-react";

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
            <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="glass relative z-10 w-full max-w-lg mx-4 rounded-2xl shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-surface-800/50">
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-accent-400" />
                        <h2 className="text-white font-semibold">Editor Settings</h2>
                    </div>
                    <button onClick={onClose} className="btn-ghost p-1" aria-label="Close">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Compiler Section */}
                    <div className="space-y-1.5">
                        <label className="text-sm text-white font-medium">LaTeX Compiler</label>
                        <select
                            value={settings.compiler}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    compiler: e.target.value as SettingsState["compiler"],
                                })
                            }
                            className="input-field text-sm w-full"
                        >
                            <option value="pdflatex">pdfLaTeX (default)</option>
                            <option value="xelatex">XeLaTeX (Unicode)</option>
                            <option value="lualatex">LuaLaTeX (Lua)</option>
                        </select>
                        <p className="text-xs text-surface-500">Choose the LaTeX engine for PDF compilation</p>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-1.5">
                        <label className="text-sm text-white font-medium">Font Size</label>
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
                                className="flex-1 h-1.5 bg-surface-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                            />
                            <span className="text-sm text-surface-300 font-mono w-8 text-right">{settings.fontSize}</span>
                        </div>
                    </div>

                    {/* Tab Size */}
                    <div className="space-y-1.5">
                        <label className="text-sm text-white font-medium">Tab Size</label>
                        <div className="flex gap-2">
                            {[2, 4, 8].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSettings({ ...settings, tabSize: size })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${settings.tabSize === size
                                            ? "bg-accent-500/20 text-accent-400 ring-1 ring-accent-500/30"
                                            : "bg-surface-800/50 text-surface-400 hover:bg-surface-800"
                                        }`}
                                >
                                    {size} spaces
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toggle Options */}
                    <div className="space-y-1 border-t border-surface-800/50 pt-4">
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
                <div className="flex items-center justify-between p-5 border-t border-surface-800/50">
                    <button
                        onClick={() => setSettings(defaultSettings)}
                        className="btn-ghost text-xs text-surface-500"
                    >
                        Reset to defaults
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="btn-secondary text-xs">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="btn-primary text-xs">
                            {saved ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
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
        <div className="flex items-center justify-between py-2.5">
            <div>
                <p className="text-sm text-white">{label}</p>
                <p className="text-xs text-surface-500">{description}</p>
            </div>
            <button
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-accent-500" : "bg-surface-700"
                    }`}
            >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"
                    }`} />
            </button>
        </div>
    );
}
