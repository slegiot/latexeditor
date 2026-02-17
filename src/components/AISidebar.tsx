"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    X,
    Sparkles,
    AlertCircle,
    Wand2,
    Copy,
    RotateCcw,
    Check,
    Loader2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import type { LatexError } from "@/lib/latex-errors";

interface AISidebarProps {
    open: boolean;
    mode: "fix" | "generate";
    errors: LatexError[];
    getContent: () => string;
    onApplyContent: (content: string) => void;
    onClose: () => void;
    onModeChange: (mode: "fix" | "generate") => void;
}

export function AISidebar({
    open,
    mode,
    errors,
    getContent,
    onApplyContent,
    onClose,
    onModeChange,
}: AISidebarProps) {
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showErrors, setShowErrors] = useState(true);
    const responseRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (responseRef.current) {
            responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
    }, [response]);

    const handleFixErrors = useCallback(async () => {
        setLoading(true);
        setResponse("");

        const content = getContent();
        const errorSummary = errors
            .map((e) => `Line ${e.line}: ${e.message}`)
            .join("\n");

        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "fix",
                    content,
                    errors: errorSummary,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setResponse(`Error: ${data.error || "AI request failed"}`);
                return;
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                let buffer = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    setResponse(buffer);
                }
            }
        } catch (err) {
            setResponse("Network error — could not reach AI service");
        } finally {
            setLoading(false);
        }
    }, [errors, getContent]);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setResponse("");

        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate",
                    prompt: prompt.trim(),
                    context: getContent().slice(0, 500),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setResponse(`Error: ${data.error || "AI request failed"}`);
                return;
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                let buffer = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    setResponse(buffer);
                }
            }
        } catch (err) {
            setResponse("Network error — could not reach AI service");
        } finally {
            setLoading(false);
        }
    }, [prompt, getContent]);

    const handleApply = () => {
        if (response) {
            onApplyContent(response);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!open) return null;

    return (
        <div className="absolute right-0 top-0 bottom-0 w-96 glass border-l border-surface-800/50 flex flex-col z-30 animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800/50 shrink-0">
                <div className="flex items-center gap-2 text-white text-sm font-semibold">
                    <Sparkles className="w-4 h-4 text-accent-400" />
                    <span>AI Assistant</span>
                </div>
                <button onClick={onClose} className="btn-ghost p-1" aria-label="Close">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-surface-800/50 shrink-0">
                <button
                    onClick={() => onModeChange("fix")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${mode === "fix"
                            ? "border-accent-500 text-accent-400"
                            : "border-transparent text-surface-500 hover:text-surface-300"
                        }`}
                >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Fix Errors
                </button>
                <button
                    onClick={() => onModeChange("generate")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${mode === "generate"
                            ? "border-accent-500 text-accent-400"
                            : "border-transparent text-surface-500 hover:text-surface-300"
                        }`}
                >
                    <Wand2 className="w-3.5 h-3.5" />
                    Generate
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mode === "fix" ? (
                    <div className="space-y-3">
                        {/* Error List */}
                        {errors.length > 0 ? (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowErrors(!showErrors)}
                                    className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-200 transition-colors"
                                >
                                    {showErrors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    {errors.length} error{errors.length !== 1 ? "s" : ""} found
                                </button>
                                {showErrors && (
                                    <div className="space-y-1 text-xs font-mono bg-surface-900/50 rounded-lg p-2.5 max-h-40 overflow-y-auto">
                                        {errors.map((err, i) => (
                                            <div key={i} className="text-surface-400">
                                                <span className="text-danger">Ln {err.line}</span>: {err.message}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={handleFixErrors}
                                    disabled={loading}
                                    className="btn-primary w-full justify-center text-sm"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 icon-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {loading ? "Fixing…" : "Fix All Errors"}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-8 text-center">
                                <Check className="w-8 h-8 text-success mb-2" />
                                <p className="text-sm text-surface-400">No errors found</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe what you want to generate..."
                            rows={4}
                            className="input-field text-sm resize-none"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="btn-primary w-full justify-center text-sm"
                        >
                            {loading ? <Loader2 className="w-4 h-4 icon-spin" /> : <Wand2 className="w-4 h-4" />}
                            {loading ? "Generating…" : "Generate"}
                        </button>
                    </div>
                )}

                {/* Response */}
                {response && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-surface-400">AI Response</span>
                            <div className="flex items-center gap-1">
                                <button onClick={handleCopy} title="Copy" className="btn-ghost p-1">
                                    {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => { setResponse(""); }} title="Retry" className="btn-ghost p-1">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div ref={responseRef} className="bg-surface-900/50 rounded-lg p-3 max-h-60 overflow-y-auto">
                            <pre className="text-xs text-surface-300 whitespace-pre-wrap font-mono">{response}</pre>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handleApply} className="btn-primary text-sm">
                                Apply to Editor
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
