"use client";

import { useState, useCallback, useEffect } from "react";
import {
    X,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Info,
    Loader2,
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info" | "compiling";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    errors?: Array<{ line: number; message: string; severity: string }>;
    duration?: number;
}

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-[800] flex flex-col gap-2 max-w-sm w-full">
            {toasts.map((toast) => (
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
    useEffect(() => {
        if (toast.type !== "compiling" && toast.duration !== 0) {
            const timer = setTimeout(() => {
                onDismiss(toast.id);
            }, toast.duration || 5000);
            return () => clearTimeout(timer);
        }
    }, [toast, onDismiss]);

    const getIcon = () => {
        switch (toast.type) {
            case "success":
                return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case "error":
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            case "warning":
                return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
            case "compiling":
                return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
            default:
                return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case "success":
                return "border-emerald-500/30";
            case "error":
                return "border-red-500/30";
            case "warning":
                return "border-yellow-500/30";
            case "compiling":
                return "border-blue-500/30";
            default:
                return "border-blue-500/30";
        }
    };

    return (
        <div
            className={`glass-strong border ${getBorderColor()} rounded-xl shadow-lg p-4 animate-slide-in-right`}
            role="alert"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-[var(--text-primary)]">
                        {toast.title}
                    </h4>
                    {toast.message && (
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            {toast.message}
                        </p>
                    )}
                    {toast.errors && toast.errors.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {toast.errors.slice(0, 3).map((error, index) => (
                                <div
                                    key={index}
                                    className="text-xs font-mono p-2 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                                >
                                    <span
                                        className={
                                            error.severity === "error"
                                                ? "text-red-400"
                                                : "text-yellow-400"
                                        }
                                    >
                                        {error.severity}
                                    </span>
                                    : Line {error.line}: {error.message}
                                </div>
                            ))}
                            {toast.errors.length > 3 && (
                                <p className="text-xs text-[var(--text-muted)]">
                                    +{toast.errors.length - 3} more errors
                                </p>
                            )}
                        </div>
                    )}
                </div>
                {toast.type !== "compiling" && (
                    <button
                        onClick={() => onDismiss(toast.id)}
                        className="flex-shrink-0 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

// Hook for using toasts
export function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback(
        (toast: Omit<Toast, "id">) => {
            const id = Math.random().toString(36).substring(2, 9);
            setToasts((prev) => [...prev, { ...toast, id }]);
            return id;
        },
        []
    );

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const updateToast = useCallback(
        (id: string, updates: Partial<Toast>) => {
            setToasts((prev) =>
                prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
            );
        },
        []
    );

    return { toasts, addToast, dismissToast, updateToast };
}
