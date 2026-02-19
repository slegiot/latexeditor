'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — useVersionHistory Hook
// ─────────────────────────────────────────────────────────────
// Manages document version snapshots:
//   ✦ Load version list for a project
//   ✦ Create manual/auto snapshots
//   ✦ Compare two versions (diff)
//   ✦ Restore a previous version
//   ✦ Delete versions
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from 'react';
import type { DiffLine } from '@/lib/diff';

// ── Types ────────────────────────────────────────────────────

export interface VersionMeta {
    id: string;
    project_id: string;
    label: string;
    is_auto: boolean;
    created_at: string;
    content_length: number;
    user_id: string;
}

export interface DiffData {
    lines: DiffLine[];
    additions: number;
    deletions: number;
    unchanged: number;
    summary: string;
}

export interface UseVersionHistoryOptions {
    projectId: string;
    /** Auto-load versions on mount */
    autoLoad?: boolean;
    /** Auto-snapshot interval in ms (0 = disabled) */
    autoSnapshotInterval?: number;
    /** Called when a version is restored — provides content */
    onRestore?: (content: string) => void;
}

export interface UseVersionHistoryReturn {
    /** List of version snapshots (newest first) */
    versions: VersionMeta[];
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;

    /** Refresh version list */
    loadVersions: () => Promise<void>;

    /** Create a named snapshot */
    createSnapshot: (content: string, label?: string) => Promise<boolean>;

    /** Create an auto-snapshot (throttled server-side) */
    autoSnapshot: (content: string) => Promise<void>;

    /** Compute diff between two versions */
    computeDiff: (versionA: string, versionB: string) => Promise<DiffData | null>;

    /** Restore a version (calls onRestore with content) */
    restoreVersion: (versionId: string) => Promise<boolean>;

    /** Delete a version */
    deleteVersion: (versionId: string) => Promise<boolean>;

    /** Currently active diff */
    activeDiff: DiffData | null;

    /** Clear active diff */
    clearDiff: () => void;
}

// ── Hook ─────────────────────────────────────────────────────

export function useVersionHistory(options: UseVersionHistoryOptions): UseVersionHistoryReturn {
    const { projectId, autoLoad = true, autoSnapshotInterval = 0, onRestore } = options;

    const [versions, setVersions] = useState<VersionMeta[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeDiff, setActiveDiff] = useState<DiffData | null>(null);

    const autoTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    // ── Load versions ────────────────────────────────────────
    const loadVersions = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/versions?projectId=${projectId}`);
            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Load failed' }));
                setError(data.error || 'Failed to load versions');
                return;
            }

            const data = await res.json();
            setVersions(data.versions || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    // Auto-load on mount
    useEffect(() => {
        if (autoLoad && projectId) {
            loadVersions();
        }
    }, [autoLoad, projectId, loadVersions]);

    // ── Create snapshot ──────────────────────────────────────
    const createSnapshot = useCallback(async (content: string, label?: string): Promise<boolean> => {
        setError(null);

        try {
            const res = await fetch('/api/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action: 'snapshot', content, label }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Save failed' }));
                setError(data.error);
                return false;
            }

            await loadVersions();
            return true;
        } catch {
            return false;
        }
    }, [projectId, loadVersions]);

    // ── Auto snapshot ────────────────────────────────────────
    const autoSnapshot = useCallback(async (content: string) => {
        try {
            await fetch('/api/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action: 'auto_snapshot', content }),
            });
            // Don't refresh list for auto-snapshots (too noisy)
        } catch {
            // Silent fail for auto-snapshots
        }
    }, [projectId]);

    // Auto-snapshot timer
    useEffect(() => {
        if (autoSnapshotInterval > 0) {
            // The caller should pass their content getter here
            // This just sets up the interval pattern
            autoTimerRef.current = setInterval(() => {
                // The component using this hook should call autoSnapshot
                // with the current content in its own effect
            }, autoSnapshotInterval);

            return () => clearInterval(autoTimerRef.current);
        }
    }, [autoSnapshotInterval]);

    // ── Compute diff ─────────────────────────────────────────
    const computeDiffFn = useCallback(async (
        versionA: string,
        versionB: string
    ): Promise<DiffData | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action: 'diff', versionA, versionB }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Diff failed' }));
                setError(data.error);
                return null;
            }

            const data = await res.json();
            const diff: DiffData = data.diff;
            setActiveDiff(diff);
            return diff;
        } catch {
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    // ── Restore ──────────────────────────────────────────────
    const restoreVersion = useCallback(async (versionId: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action: 'restore', versionId }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Restore failed' }));
                setError(data.error);
                return false;
            }

            const data = await res.json();
            onRestore?.(data.content);
            return true;
        } catch {
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [projectId, onRestore]);

    // ── Delete ───────────────────────────────────────────────
    const deleteVersion = useCallback(async (versionId: string): Promise<boolean> => {
        setError(null);

        try {
            const res = await fetch('/api/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action: 'delete', versionId }),
            });

            if (!res.ok) return false;

            await loadVersions();
            return true;
        } catch {
            return false;
        }
    }, [projectId, loadVersions]);

    // ── Clear diff ───────────────────────────────────────────
    const clearDiff = useCallback(() => setActiveDiff(null), []);

    return {
        versions,
        isLoading,
        error,
        loadVersions,
        createSnapshot,
        autoSnapshot,
        computeDiff: computeDiffFn,
        restoreVersion,
        deleteVersion,
        activeDiff,
        clearDiff,
    };
}
