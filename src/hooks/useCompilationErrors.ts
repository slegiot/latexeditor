'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — useCompilationErrors Hook
// ─────────────────────────────────────────────────────────────
// Parses compilation errors and provides one-click fix actions:
//   ✦ Automatic log parsing on compilation failure
//   ✦ Rule-based fix suggestions (free for all users)
//   ✦ AI-powered fixes (premium-only, on-demand)
//   ✦ One-click fix application to editor
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo } from 'react';
import type { LatexError } from '@/lib/latex-log-parser';
import type { FixSuggestion, FixEdit } from '@/lib/latex-fixer';

export interface UseCompilationErrorsOptions {
    /** Called when a fix is applied — provides edited source */
    onApplyFix?: (newSource: string) => void;
}

export interface UseCompilationErrorsReturn {
    /** Parsed errors from the last compilation */
    errors: LatexError[];
    /** Parsed warnings */
    warnings: LatexError[];
    /** Available fix suggestions */
    fixes: FixSuggestion[];
    /** Whether we're currently parsing or fetching fixes */
    isAnalyzing: boolean;
    /** Analyze a compilation log */
    analyzeLog: (log: string, source: string) => Promise<void>;
    /** Request an AI fix for a specific error (premium) */
    requestAIFix: (errorId: string, log: string, source: string) => Promise<void>;
    /** Apply a fix to the source code */
    applyFix: (fix: FixSuggestion, source: string) => string;
    /** Get the fix for a specific error (if available) */
    getFixForError: (errorId: string) => FixSuggestion | undefined;
    /** Whether any errors have fixes available */
    hasFixableErrors: boolean;
    /** Apply all available fixes at once */
    applyAllFixes: (source: string) => string;
    /** Clear all errors and fixes */
    clear: () => void;
    /** Error message from analysis */
    analysisError: string | null;
}

export function useCompilationErrors(
    options: UseCompilationErrorsOptions = {}
): UseCompilationErrorsReturn {
    const [errors, setErrors] = useState<LatexError[]>([]);
    const [warnings, setWarnings] = useState<LatexError[]>([]);
    const [fixes, setFixes] = useState<FixSuggestion[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // ── Analyze compilation log ──────────────────────────────
    const analyzeLog = useCallback(async (log: string, source: string) => {
        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
            const res = await fetch('/api/ai/fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ log, source }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Analysis failed' }));
                setAnalysisError(errData.error || 'Failed to analyze errors');
                return;
            }

            const data = await res.json();
            setErrors(data.errors || []);
            setWarnings(data.warnings || []);
            setFixes(data.fixes || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Network error';
            setAnalysisError(message);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    // ── Request AI fix for specific error ────────────────────
    const requestAIFix = useCallback(async (
        errorId: string,
        log: string,
        source: string
    ) => {
        setIsAnalyzing(true);

        try {
            const res = await fetch('/api/ai/fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ log, source, errorId }),
            });

            if (!res.ok) return;

            const data = await res.json();
            // Merge new fixes with existing ones (replace if same errorId)
            setFixes((prev) => {
                const newFixes = data.fixes || [];
                const existing = prev.filter(
                    (f: FixSuggestion) => !newFixes.some((n: FixSuggestion) => n.errorId === f.errorId)
                );
                return [...existing, ...newFixes];
            });
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    // ── Apply a single fix to source ─────────────────────────
    const applyFix = useCallback((fix: FixSuggestion, source: string): string => {
        const lines = source.split('\n');
        const result = applyEditToLines(lines, fix.edit);
        const newSource = result.join('\n');

        options.onApplyFix?.(newSource);
        return newSource;
    }, [options]);

    // ── Apply all fixes (sorted by line descending to avoid offset issues)
    const applyAllFixes = useCallback((source: string): string => {
        if (fixes.length === 0) return source;

        // Sort fixes by line number descending so earlier fixes don't shift line numbers
        const sortedFixes = [...fixes].sort((a, b) => b.edit.line - a.edit.line);

        let lines = source.split('\n');
        for (const fix of sortedFixes) {
            lines = applyEditToLines(lines, fix.edit);
        }

        const newSource = lines.join('\n');
        options.onApplyFix?.(newSource);
        return newSource;
    }, [fixes, options]);

    // ── Get fix for a specific error ─────────────────────────
    const getFixForError = useCallback((errorId: string): FixSuggestion | undefined => {
        return fixes.find((f) => f.errorId === errorId);
    }, [fixes]);

    // ── Computed ─────────────────────────────────────────────
    const hasFixableErrors = useMemo(() => fixes.length > 0, [fixes]);

    // ── Clear ────────────────────────────────────────────────
    const clear = useCallback(() => {
        setErrors([]);
        setWarnings([]);
        setFixes([]);
        setAnalysisError(null);
    }, []);

    return {
        errors,
        warnings,
        fixes,
        isAnalyzing,
        analyzeLog,
        requestAIFix,
        applyFix,
        getFixForError,
        hasFixableErrors,
        applyAllFixes,
        clear,
        analysisError,
    };
}

// ── Edit Application ─────────────────────────────────────────

function applyEditToLines(lines: string[], edit: FixEdit): string[] {
    const result = [...lines];
    const idx = edit.line - 1; // Convert to 0-indexed

    switch (edit.action) {
        case 'replace_line':
            if (idx >= 0 && idx < result.length && edit.newText !== undefined) {
                result[idx] = edit.newText;
            }
            break;

        case 'insert_before':
            if (idx >= 0 && edit.newText !== undefined) {
                result.splice(idx, 0, edit.newText);
            }
            break;

        case 'insert_after':
            if (idx >= 0 && edit.newText !== undefined) {
                result.splice(idx + 1, 0, edit.newText);
            }
            break;

        case 'delete_line':
            if (idx >= 0 && idx < result.length) {
                result.splice(idx, 1);
            }
            break;

        case 'replace_range':
            if (idx >= 0 && edit.endLine && edit.newText !== undefined) {
                const count = edit.endLine - edit.line + 1;
                result.splice(idx, count, edit.newText);
            }
            break;
    }

    return result;
}
