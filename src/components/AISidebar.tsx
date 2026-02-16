"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Sparkles,
    X,
    Wand2,
    AlertTriangle,
    Loader2,
    Check,
    Copy,
    RotateCcw,
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
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState("");
    const [extractedCode, setExtractedCode] = useState("");
    const [prompt, setPrompt] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [applied, setApplied] = useState(false);
    const [copied, setCopied] = useState(false);
    const responseRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Auto-scroll response as it streams
    useEffect(() => {
        if (responseRef.current) {
            responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
    }, [response]);

    // Extract LaTeX code from response
    useEffect(() => {
        const match = response.match(/```latex\n([\s\S]*?)```/);
        if (match) {
            setExtractedCode(match[1].trim());
        } else {
            // Try plain code fence
            const plainMatch = response.match(/```\n([\s\S]*?)```/);
            if (plainMatch) {
                setExtractedCode(plainMatch[1].trim());
            }
        }
    }, [response]);

    const handleFixErrors = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        setResponse("");
        setExtractedCode("");
        setError(null);
        setApplied(false);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "fix",
                    content: getContent(),
                    errors: errors.map((e) => ({
                        line: e.line,
                        message: e.message,
                        severity: e.severity,
                    })),
                }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Error ${res.status}`);
            }

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let text = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                text += decoder.decode(value, { stream: true });
                setResponse(text);
            }
        } catch (err: any) {
            if (err.name !== "AbortError") {
                setError(err.message || "AI service error");
            }
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    }, [loading, getContent, errors]);

    const handleGenerate = useCallback(async () => {
        if (loading || !prompt.trim()) return;
        setLoading(true);
        setResponse("");
        setExtractedCode("");
        setError(null);
        setApplied(false);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate",
                    prompt: prompt.trim(),
                }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Error ${res.status}`);
            }

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let text = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                text += decoder.decode(value, { stream: true });
                setResponse(text);
            }
        } catch (err: any) {
            if (err.name !== "AbortError") {
                setError(err.message || "AI service error");
            }
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    }, [loading, prompt]);

    const handleApply = useCallback(() => {
        if (!extractedCode) return;
        onApplyContent(extractedCode);
        setApplied(true);
    }, [extractedCode, onApplyContent]);

    const handleCopy = useCallback(() => {
        const text = extractedCode || response;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [extractedCode, response]);

    const handleCancel = useCallback(() => {
        abortRef.current?.abort();
        setLoading(false);
    }, []);

    // Reset state when closing
    useEffect(() => {
        if (!open) {
            setResponse("");
            setExtractedCode("");
            setError(null);
            setApplied(false);
            setPrompt("");
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="absolute right-0 top-0 bottom-0 w-[380px] max-w-full flex flex-col glass border-l border-[var(--color-glass-border)] animate-slide-in z-30 bg-[var(--color-surface-50)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-glass-border)]">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold">AI Assistant</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                >
                    <X className="w-4 h-4 text-[var(--color-surface-500)]" />
                </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 px-3 pt-3 pb-2">
                <button
                    onClick={() => onModeChange("fix")}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${mode === "fix"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "hover:bg-[var(--color-glass-hover)] text-[var(--color-surface-500)]"
                        }`}
                >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Fix Errors
                    {errors.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                            {errors.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => onModeChange("generate")}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${mode === "generate"
                            ? "bg-[var(--color-accent-500)]/20 text-[var(--color-accent-400)] border border-[var(--color-accent-500)]/30"
                            : "hover:bg-[var(--color-glass-hover)] text-[var(--color-surface-500)]"
                        }`}
                >
                    <Wand2 className="w-3.5 h-3.5" />
                    Generate
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0 px-3 pb-3">
                {mode === "fix" ? (
                    /* Fix Errors Mode */
                    <>
                        {errors.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-surface-500)] gap-2">
                                <Check className="w-8 h-8 text-emerald-400" />
                                <p className="text-sm">No compilation errors</p>
                                <p className="text-xs text-[var(--color-surface-400)]">
                                    Compile first to detect issues
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Error summary */}
                                <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <p className="text-xs text-red-400 font-medium mb-1.5">
                                        {errors.length} error{errors.length !== 1 ? "s" : ""} found
                                    </p>
                                    <div className="space-y-1 max-h-24 overflow-y-auto">
                                        {errors.slice(0, 5).map((e, i) => (
                                            <p
                                                key={i}
                                                className="text-[11px] text-[var(--color-surface-500)] truncate"
                                            >
                                                Ln {e.line}: {e.message}
                                            </p>
                                        ))}
                                        {errors.length > 5 && (
                                            <p className="text-[11px] text-[var(--color-surface-400)]">
                                                +{errors.length - 5} more...
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {!response && !loading && (
                                    <button
                                        onClick={handleFixErrors}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 transition-all"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        AI Fix Errors
                                    </button>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    /* Generate Mode */
                    <>
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-[var(--color-surface-600)] mb-1.5">
                                Describe the document you want
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. IEEE conference paper about quantum error correction with abstract, introduction, methodology, results, and conclusion sections"
                                className="input-field text-xs resize-none"
                                rows={4}
                                disabled={loading}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && e.metaKey) {
                                        handleGenerate();
                                    }
                                }}
                            />
                        </div>

                        {!response && !loading && (
                            <button
                                onClick={handleGenerate}
                                disabled={!prompt.trim()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent-500)] to-emerald-500 text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Wand2 className="w-4 h-4" />
                                Generate LaTeX
                            </button>
                        )}
                    </>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center gap-2 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span className="text-xs text-[var(--color-surface-500)]">
                            AI is thinking...
                        </span>
                        <button
                            onClick={handleCancel}
                            className="ml-auto text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                        {error}
                    </div>
                )}

                {/* Streamed Response */}
                {response && (
                    <div className="flex-1 flex flex-col min-h-0 mt-2">
                        <div
                            ref={responseRef}
                            className="flex-1 overflow-y-auto p-3 rounded-lg bg-[var(--color-surface-100)] border border-[var(--color-glass-border)] text-xs text-[var(--color-surface-700)] font-mono leading-relaxed whitespace-pre-wrap"
                        >
                            {response}
                        </div>

                        {/* Actions */}
                        {!loading && (
                            <div className="flex items-center gap-2 mt-2">
                                {extractedCode && (
                                    <button
                                        onClick={handleApply}
                                        disabled={applied}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${applied
                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                : "bg-gradient-to-r from-[var(--color-accent-500)] to-emerald-500 text-white hover:brightness-110"
                                            }`}
                                    >
                                        {applied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                Applied
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                Apply to Editor
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors text-[var(--color-surface-500)]"
                                >
                                    {copied ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setResponse("");
                                        setExtractedCode("");
                                        setApplied(false);
                                    }}
                                    className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors text-[var(--color-surface-500)]"
                                    title="Try again"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
