'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — useAI Hook
// ─────────────────────────────────────────────────────────────
// React hook for AI-powered LaTeX assistance:
//   ✦ Ghost-text autocompletion
//   ✦ Math formula suggestions
//   ✦ Rewrite (formalise / shorten / expand)
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import type { AIAction } from '@/lib/ai';

export interface UseAIOptions {
    /** Debounce delay for autocomplete (ms) */
    debounceMs?: number;
}

export interface UseAIReturn {
    /** Get ghost-text completion at cursor position */
    complete: (prefix: string, suffix: string, documentContext?: string) => Promise<string | null>;
    /** Get math formula suggestion at cursor position */
    suggestMath: (prefix: string, suffix: string) => Promise<string | null>;
    /** Rewrite selected text */
    rewrite: (
        prefix: string,
        suffix: string,
        selection: string,
        mode?: 'formalise' | 'shorten' | 'expand'
    ) => Promise<string | null>;
    /** Whether an AI request is in-flight */
    isLoading: boolean;
    /** Last error message */
    error: string | null;
    /** Whether user needs to upgrade (403 response) */
    needsUpgrade: boolean;
    /** Cancel any in-flight request */
    cancel: () => void;
}

export function useAI(options: UseAIOptions = {}): UseAIReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needsUpgrade, setNeedsUpgrade] = useState(false);

    const abortRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ── Cancel in-flight request ─────────────────────────────
    const cancel = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        clearTimeout(debounceRef.current);
        setIsLoading(false);
    }, []);

    // ── Core API call ────────────────────────────────────────
    const callAPI = useCallback(async (body: {
        action: AIAction;
        prefix: string;
        suffix: string;
        selection?: string;
        rewriteMode?: string;
        documentContext?: string;
    }): Promise<string | null> => {
        // Cancel any previous request
        cancel();

        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Request failed' }));

                if (res.status === 403) {
                    setNeedsUpgrade(true);
                    setError('AI features require a Pro or Team subscription');
                    return null;
                }

                if (res.status === 429) {
                    setError('Too many requests — please wait a moment');
                    return null;
                }

                setError(errData.error || 'AI request failed');
                return null;
            }

            const data = await res.json();
            return data.text || null;
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return null; // Cancelled, not an error
            }
            const message = err instanceof Error ? err.message : 'Network error';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
            abortRef.current = null;
        }
    }, [cancel]);

    // ── Ghost-text completion ────────────────────────────────
    const complete = useCallback(async (
        prefix: string,
        suffix: string,
        documentContext?: string
    ): Promise<string | null> => {
        return callAPI({
            action: 'complete',
            prefix,
            suffix,
            documentContext,
        });
    }, [callAPI]);

    // ── Math suggestion ──────────────────────────────────────
    const suggestMath = useCallback(async (
        prefix: string,
        suffix: string
    ): Promise<string | null> => {
        return callAPI({
            action: 'math',
            prefix,
            suffix,
        });
    }, [callAPI]);

    // ── Rewrite ──────────────────────────────────────────────
    const rewrite = useCallback(async (
        prefix: string,
        suffix: string,
        selection: string,
        mode: 'formalise' | 'shorten' | 'expand' = 'formalise'
    ): Promise<string | null> => {
        return callAPI({
            action: 'rewrite',
            prefix,
            suffix,
            selection,
            rewriteMode: mode,
        });
    }, [callAPI]);

    return {
        complete,
        suggestMath,
        rewrite,
        isLoading,
        error,
        needsUpgrade,
        cancel,
    };
}
