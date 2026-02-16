"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[LatexForge ErrorBoundary]", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <div className="text-center space-y-4 max-w-md animate-fade-in">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-7 h-7 text-red-400" />
                        </div>
                        <h2 className="text-lg font-semibold">Something went wrong</h2>
                        <p className="text-sm text-[var(--color-surface-500)]">
                            {this.state.error?.message || "An unexpected error occurred."}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="btn-primary inline-flex text-sm"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
