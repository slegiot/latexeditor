"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ error, errorInfo });

        // Optionally send to error tracking service
        if (process.env.NODE_ENV === "production") {
            // Send to error tracking service
            // e.g., Sentry, LogRocket, etc.
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
                    <div className="max-w-md w-full text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-[var(--text-secondary)] mb-6">
                            We're sorry, but an unexpected error occurred. Our team has been
                            notified.
                        </p>

                        {this.state.error && (
                            <div className="mb-6 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-left overflow-auto">
                                <p className="text-sm font-mono text-red-400">
                                    {this.state.error.message}
                                </p>
                                {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                                    <details className="mt-2">
                                        <summary className="text-xs text-[var(--text-muted)] cursor-pointer">
                                            Stack trace
                                        </summary>
                                        <pre className="mt-2 text-xs text-[var(--text-muted)] overflow-auto">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="btn-primary justify-center"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                            <Link href="/" className="btn-secondary justify-center">
                                <Home className="w-4 h-4" />
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return setError;
}

// Error fallback component for specific sections
export function ErrorFallback({
    error,
    resetError,
    title = "Something went wrong",
    description = "An error occurred while loading this section.",
}: {
    error?: Error;
    resetError?: () => void;
    title?: string;
    description?: string;
}) {
    return (
        <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-red-500/20 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">{description}</p>
            {error && (
                <p className="text-xs text-red-400 mb-4 font-mono">{error.message}</p>
            )}
            {resetError && (
                <button onClick={resetError} className="btn-primary text-sm">
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            )}
        </div>
    );
}
