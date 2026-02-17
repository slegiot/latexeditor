"use client";

import { useState, useEffect, useCallback } from "react";
import {
    X,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Info,
    Loader2,
    Copy,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import type { LatexError } from "@/lib/latex-errors";

export type ToastType = "success" | "error" | "warning" | "info" | "compiling";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    errors?: LatexError[];
    timestamp: Date;
    dismissed?: boolean;
}

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    // Filter out dismissed toasts
    const activeToasts = toasts.filter((t) => !t.dismissed);

    if (activeToasts.length === 0) return null;

    return (
        <div className="fixed bottom-12 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
            {activeToasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

interface ToastItemProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        const text = toast.errors
            ? toast.errors.map((e) => `Line ${e.line}: ${e.message}`).join("\n")
            : toast.message || "";
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [toast]);

    const getIcon = () => {
        switch (toast.type) {
            case "success":
                return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            case "error":
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            case "warning":
                return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case "info":
                return <Info className="w-5 h-5 text-blue-400" />;
            case "compiling":
                return <Loader2 className="w-5 h-5 text-[var(--color-accent-400)] animate-spin" />;
            default:
                return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case "success":
                return "border-l-emerald-400";
            case "error":
                return "border-l-red-400";
            case "warning":
                return "border-l-amber-400";
            case "info":
                return "border-l-blue-400";
            case "compiling":
                return "border-l-[var(--color-accent-400)]";
            default:
                return "border-l-blue-400";
        }
    };

    const errorCount = toast.errors?.filter((e) => e.severity === "error").length || 0;
    const warningCount = toast.errors?.filter((e) => e.severity === "warning").length || 0;

    return (
        <div
            className={`
                glass rounded-lg overflow-hidden animate-scale-in shadow-[var(--shadow-card)]
                border-l-4 ${getBorderColor()}
            `}
        >
            {/* Header */}
            <div className="flex items-start gap-3 p-3">
                <div className="shrink-0 mt-0.5">{getIcon()}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{toast.title}</p>
                    {toast.message && (
                        <p className="text-xs text-[var(--color-surface-500)] mt-0.5 line-clamp-2">
                            {toast.message}
                        </p>
                    )}
                    {toast.errors && toast.errors.length > 0 && (
                        <div className="flex items-center gap-3 mt-1.5">
                            {errorCount > 0 && (
                                <span className="text-xs text-red-400">
                                    {errorCount} error{errorCount !== 1 ? "s" : ""}
                                </span>
                            )}
                            {warningCount > 0 && (
                                <span className="text-xs text-amber-400">
                                    {warningCount} warning{warningCount !== 1 ? "s" : ""}
                                </span>
                            )}
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-xs text-[var(--color-accent-400)] hover:underline flex items-center gap-1"
                            >
                                {expanded ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" />
                                        Hide details
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" />
                                        Show details
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {toast.errors && toast.errors.length > 0 && (
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded hover:bg-[var(--color-glass-hover)] transition-colors"
                            title="Copy errors"
                        >
                            {copied ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <Copy className="w-4 h-4 text-[var(--color-surface-500)]" />
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => onDismiss(toast.id)}
                        className="p-1.5 rounded hover:bg-[var(--color-glass-hover)] transition-colors"
                        title="Dismiss"
                    >
                        <X className="w-4 h-4 text-[var(--color-surface-500)]" />
                    </button>
                </div>
            </div>

            {/* Expanded error details */}
            {expanded && toast.errors && toast.errors.length > 0 && (
                <div className="border-t border-[var(--color-glass-border)] max-h-48 overflow-y-auto">
                    {toast.errors.map((err, i) => (
                        <div
                            key={i}
                            className="px-3 py-2 text-xs border-b border-[var(--color-glass-border)] last:border-b-0 hover:bg-[var(--color-glass-hover)]"
                        >
                            <div className="flex items-center gap-2">
                                {err.severity === "error" ? (
                                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                ) : err.severity === "warning" ? (
                                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                )}
                                <span className="text-[var(--color-surface-400)]">
                                    Ln {err.line}, Col {err.column}
                                </span>
                            </div>
                            <p className="mt-1 text-[var(--color-surface-600)]">{err.message}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Hook for managing toasts
export function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, "id" | "timestamp" | "dismissed">) => {
        const newToast: Toast = {
            ...toast,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date(),
            dismissed: false,
        };
        setToasts((prev) => [...prev, newToast]);
        return newToast.id;
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, dismissed: true } : t))
        );
        // Remove after animation
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    const clearAll = useCallback(() => {
        setToasts((prev) => prev.map((t) => ({ ...t, dismissed: true })));
        setTimeout(() => {
            setToasts([]);
        }, 300);
    }, []);

    return { toasts, addToast, dismissToast, clearAll };
}
