'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — useCompilation Hook
// ─────────────────────────────────────────────────────────────
// React hook for the full compilation lifecycle:
//   ✦ startCompile() → POST /api/compile
//   ✦ Real-time log streaming via SSE
//   ✦ Status, logs, PDF URL, SyncTeX data
//   ✦ Auto-reconnect on SSE disconnect
//   ✦ Cleanup on unmount
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CompilationStatus, CompilerEngine, CompileLogEvent } from '@/types';

export interface UseCompilationOptions {
    /** Called when compilation finishes (success or error) */
    onComplete?: (status: CompilationStatus, pdfUrl?: string) => void;
    /** Called for each log line */
    onLog?: (line: string) => void;
}

export interface UseCompilationReturn {
    /** Trigger a compilation */
    startCompile: (projectId: string, engine?: CompilerEngine) => Promise<void>;
    /** Current compilation status */
    status: CompilationStatus | 'idle';
    /** Accumulated log lines */
    logs: string[];
    /** URL of the compiled PDF (after success) */
    pdfUrl: string | null;
    /** Raw SyncTeX data (after success) */
    synctexRaw: string | null;
    /** Duration of last compilation in ms */
    durationMs: number | null;
    /** Whether a compilation is in progress */
    isCompiling: boolean;
    /** Error message if any */
    error: string | null;
    /** Clear logs and reset state */
    reset: () => void;
}

export function useCompilation(
    options: UseCompilationOptions = {}
): UseCompilationReturn {
    const [status, setStatus] = useState<CompilationStatus | 'idle'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [synctexRaw, setSynctexRaw] = useState<string | null>(null);
    const [durationMs, setDurationMs] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // ── Cleanup SSE connection ───────────────────────────────
    const closeSSE = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => closeSSE();
    }, [closeSSE]);

    // ── Connect to SSE log stream ────────────────────────────
    const connectSSE = useCallback((compilationId: string) => {
        closeSSE();

        const url = `/api/compile/logs?compilationId=${encodeURIComponent(compilationId)}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const data: CompileLogEvent | { type: string;[key: string]: unknown } =
                    JSON.parse(event.data);

                switch (data.type) {
                    case 'log': {
                        const logEvent = data as Extract<CompileLogEvent, { type: 'log' }>;
                        setLogs((prev) => [...prev, logEvent.line]);
                        optionsRef.current.onLog?.(logEvent.line);
                        break;
                    }
                    case 'status': {
                        const statusEvent = data as Extract<CompileLogEvent, { type: 'status' }>;
                        setStatus(statusEvent.status);
                        break;
                    }
                    case 'done': {
                        const doneEvent = data as Extract<CompileLogEvent, { type: 'done' }>;
                        if (doneEvent.pdfUrl) {
                            setPdfUrl(doneEvent.pdfUrl);
                        }
                        setDurationMs(doneEvent.durationMs);

                        // Determine final status from the compilation record
                        // (the sandbox already set it in the DB)
                        fetchFinalStatus(compilationId);
                        closeSSE();
                        break;
                    }
                    case 'heartbeat':
                        // Keepalive, ignore
                        break;
                    case 'connected':
                        break;
                    default:
                        break;
                }
            } catch {
                // Non-JSON event, ignore
            }
        };

        es.onerror = () => {
            // SSE disconnected — if we haven't received 'done', reconnect
            if (status === 'compiling' || status === 'queued') {
                setTimeout(() => {
                    if (eventSourceRef.current === es) {
                        connectSSE(compilationId);
                    }
                }, 2000);
            }
        };
    }, [closeSSE, status]);

    // ── Fetch final compilation status from API ──────────────
    const fetchFinalStatus = useCallback(async (compilationId: string) => {
        try {
            const res = await fetch(`/api/compile/${compilationId}.pdf`);
            if (res.ok) {
                const compilation = await res.json();
                setStatus(compilation.status);
                if (compilation.pdf_url) {
                    setPdfUrl(compilation.pdf_url);
                }

                // Fetch SyncTeX data if available
                if (compilation.synctex_url) {
                    try {
                        const synctexRes = await fetch(compilation.synctex_url);
                        if (synctexRes.ok) {
                            const text = await synctexRes.text();
                            setSynctexRaw(text);
                        }
                    } catch {
                        // SyncTeX fetch failed, non-critical
                    }
                }

                optionsRef.current.onComplete?.(compilation.status, compilation.pdf_url);
            }
        } catch {
            // Fetch failed
        }
    }, []);

    // ── Start Compilation ────────────────────────────────────
    const startCompile = useCallback(async (
        projectId: string,
        engine?: CompilerEngine
    ) => {
        // Reset state
        setLogs([]);
        setPdfUrl(null);
        setSynctexRaw(null);
        setDurationMs(null);
        setError(null);
        setStatus('queued');

        try {
            const res = await fetch('/api/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    engine,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Request failed' }));
                setError(errData.error || 'Compilation request failed');
                setStatus('error');
                return;
            }

            const { compilation_id } = await res.json();

            // Connect to SSE for real-time log streaming
            connectSSE(compilation_id);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Network error';
            setError(message);
            setStatus('error');
        }
    }, [connectSSE]);

    // ── Reset ────────────────────────────────────────────────
    const reset = useCallback(() => {
        closeSSE();
        setStatus('idle');
        setLogs([]);
        setPdfUrl(null);
        setSynctexRaw(null);
        setDurationMs(null);
        setError(null);
    }, [closeSSE]);

    return {
        startCompile,
        status,
        logs,
        pdfUrl,
        synctexRaw,
        durationMs,
        isCompiling: status === 'queued' || status === 'compiling',
        error,
        reset,
    };
}
