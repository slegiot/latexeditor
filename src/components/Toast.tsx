"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
    X,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    Loader2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import type { LatexError } from "@/lib/latex-errors";

interface Toast {
    id: string;
    type: "success" | "error" | "warning" | "info" | "compiling";
    title: string;
    message?: string;
    errors?: LatexError[];
    duration?: number;
}

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    return (
        <div
            role="region"
            aria-label="Notifications"
            className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

const iconMap = {
    success: { Icon: CheckCircle2, color: "text-success" },
    error: { Icon: XCircle, color: "text-danger" },
    warning: { Icon: AlertTriangle, color: "text-warning" },
    info: { Icon: Info, color: "text-info" },
    compiling: { Icon: Loader2, color: "text-accent-400" },
};

const borderColorMap: Record<string, string> = {
    success: "border-l-success",
    error: "border-l-danger",
    warning: "border-l-warning",
    info: "border-l-info",
    compiling: "border-l-accent-400",
};

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: Toast;
    onDismiss: (id: string) => void;
}) {
    const [showErrors, setShowErrors] = useState(false);
    const [progress, setProgress] = useState(100);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startRef = useRef<number>(0);
    const durationRef = useRef<number>(toast.duration ?? (toast.type === "compiling" ? 0 : 5000));

    useEffect(() => {
        const duration = durationRef.current;
        if (duration <= 0) return;

        startRef.current = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startRef.current;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 50);

        timerRef.current = setTimeout(() => {
            onDismiss(toast.id);
        }, duration);

        return () => {
            clearInterval(interval);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [toast.id, onDismiss]);

    const { Icon, color } = iconMap[toast.type];

    return (
        <div
            role="alert"
            className={`pointer-events-auto glass rounded-xl shadow-2xl overflow-hidden animate-slide-in-right border-l-4 ${borderColorMap[toast.type] ?? "border-l-surface-500"}`}
        >
            <div className="flex items-start gap-3 p-4">
                <div className="shrink-0 mt-0.5">
                    <Icon className={`w-5 h-5 ${color} ${toast.type === "compiling" ? "icon-spin" : ""}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{toast.title}</p>
                    {toast.message && (
                        <p className="text-xs text-surface-400 mt-0.5">{toast.message}</p>
                    )}
                </div>
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="btn-ghost p-1 shrink-0"
                    aria-label="Dismiss notification"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Error details */}
            {toast.errors && toast.errors.length > 0 && (
                <div className="px-4 pb-3">
                    <button
                        onClick={() => setShowErrors(!showErrors)}
                        className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-300 transition-colors"
                    >
                        {showErrors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {showErrors ? "Hide details" : "Show details"}
                    </button>
                    {showErrors && (
                        <div className="mt-2 space-y-1 text-xs font-mono text-surface-400 bg-surface-900/50 rounded-lg p-2.5 max-h-32 overflow-y-auto">
                            {toast.errors.map((err, i) => (
                                <div key={i}>
                                    [{err.severity}] Ln {err.line}: {err.message}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Progress bar */}
            {durationRef.current > 0 && (
                <div className="h-0.5 bg-surface-800/50">
                    <div
                        className="h-full bg-surface-600/50 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// ── Hook ──
export function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback(
        (toast: Omit<Toast, "id">): string => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            setToasts((prev) => [...prev, { ...toast, id }]);
            return id;
        },
        []
    );

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, addToast, dismissToast };
}
