'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — useBibliography Hook
// ─────────────────────────────────────────────────────────────
// React hook for bibliography management:
//   ✦ Load and search project bibliography entries
//   ✦ DOI lookup via Crossref → auto-add BibTeX
//   ✦ Upload .bib files
//   ✦ Remove entries
//   ✦ Get \cite{} suggestions for Monaco
//   ✦ Download .bib file
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useMemo } from 'react';

// ── Types ────────────────────────────────────────────────────

export interface BibEntryJSON {
    key: string;
    type: string;
    title: string;
    author: string;
    year: string;
    journal: string;
    doi: string;
    fields: Record<string, string>;
}

export interface CrossrefResult {
    doi: string;
    title: string;
    authors: string;
    year: string;
    journal: string;
    bibtex: string;
    citationKey: string;
}

export interface CiteSuggestion {
    key: string;
    label: string; // "Author (Year) — Title"
    detail: string; // Type + Journal
    insertText: string; // \cite{key}
}

export interface UseBibliographyOptions {
    projectId: string;
    /** Auto-load entries on mount */
    autoLoad?: boolean;
}

export interface UseBibliographyReturn {
    /** Current bibliography entries */
    entries: BibEntryJSON[];
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;

    /** Load/refresh bibliography entries */
    loadEntries: (query?: string) => Promise<void>;

    /** Lookup a DOI and add the entry */
    lookupDOI: (doi: string) => Promise<{ citationKey: string; entry: BibEntryJSON } | null>;

    /** Search Crossref for works */
    searchCrossref: (query: string) => Promise<CrossrefResult[]>;

    /** Add a BibTeX entry string */
    addEntry: (bibtex: string) => Promise<string | null>;

    /** Upload a .bib file content */
    uploadBib: (content: string) => Promise<{
        imported: number; newEntries: number; updatedEntries: number
    } | null>;

    /** Remove an entry by key */
    removeEntry: (key: string) => Promise<boolean>;

    /** Get \cite{} suggestions for Monaco completions */
    citeSuggestions: CiteSuggestion[];

    /** Download the bibliography as a .bib file */
    downloadBib: () => void;

    /** Total entry count */
    totalEntries: number;
}

// ── Hook ─────────────────────────────────────────────────────

export function useBibliography(options: UseBibliographyOptions): UseBibliographyReturn {
    const { projectId, autoLoad = true } = options;

    const [entries, setEntries] = useState<BibEntryJSON[]>([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Load entries ─────────────────────────────────────────
    const loadEntries = useCallback(async (query?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ projectId });
            if (query) params.set('q', query);

            const res = await fetch(`/api/bibliography?${params}`);

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Load failed' }));
                setError(data.error || 'Failed to load bibliography');
                return;
            }

            const data = await res.json();
            setEntries(data.entries || []);
            setTotalEntries(data.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    // Auto-load on mount
    useEffect(() => {
        if (autoLoad && projectId) {
            loadEntries();
        }
    }, [autoLoad, projectId, loadEntries]);

    // ── DOI Lookup ───────────────────────────────────────────
    const lookupDOI = useCallback(async (
        doi: string
    ): Promise<{ citationKey: string; entry: BibEntryJSON } | null> => {
        setIsLoading(true);
        setError(null);

        try {
            // Step 1: Lookup DOI via Crossref
            const lookupRes = await fetch('/api/bibliography', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    action: 'lookup_doi',
                    doi,
                }),
            });

            if (!lookupRes.ok) {
                const data = await lookupRes.json().catch(() => ({ error: 'DOI lookup failed' }));
                setError(data.error || 'DOI not found');
                return null;
            }

            const lookupData = await lookupRes.json();

            // Step 2: Add the BibTeX entry to the project
            const addRes = await fetch('/api/bibliography', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    action: 'add_entry',
                    bibtex: lookupData.bibtex,
                }),
            });

            if (!addRes.ok) {
                const data = await addRes.json().catch(() => ({ error: 'Failed to add entry' }));
                setError(data.error || 'Failed to add entry');
                return null;
            }

            const addData = await addRes.json();

            // Refresh entries
            await loadEntries();

            return {
                citationKey: addData.citationKey,
                entry: addData.added,
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [projectId, loadEntries]);

    // ── Search Crossref ──────────────────────────────────────
    const searchCrossrefFn = useCallback(async (
        query: string
    ): Promise<CrossrefResult[]> => {
        try {
            const res = await fetch('/api/bibliography', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    action: 'search',
                    query,
                }),
            });

            if (!res.ok) return [];

            const data = await res.json();
            return data.results || [];
        } catch {
            return [];
        }
    }, [projectId]);

    // ── Add entry ────────────────────────────────────────────
    const addEntry = useCallback(async (bibtex: string): Promise<string | null> => {
        setError(null);

        try {
            const res = await fetch('/api/bibliography', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    action: 'add_entry',
                    bibtex,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Failed to add' }));
                setError(data.error);
                return null;
            }

            const data = await res.json();
            await loadEntries();
            return data.citationKey;
        } catch {
            return null;
        }
    }, [projectId, loadEntries]);

    // ── Upload .bib ──────────────────────────────────────────
    const uploadBib = useCallback(async (
        content: string
    ): Promise<{ imported: number; newEntries: number; updatedEntries: number } | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/bibliography', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    action: 'upload_bib',
                    content,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Upload failed' }));
                setError(data.error);
                return null;
            }

            const data = await res.json();
            await loadEntries();
            return {
                imported: data.imported,
                newEntries: data.newEntries,
                updatedEntries: data.updatedEntries,
            };
        } catch {
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [projectId, loadEntries]);

    // ── Remove entry ─────────────────────────────────────────
    const removeEntry = useCallback(async (key: string): Promise<boolean> => {
        setError(null);

        try {
            const res = await fetch('/api/bibliography', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    action: 'remove_entry',
                    key,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Remove failed' }));
                setError(data.error);
                return false;
            }

            await loadEntries();
            return true;
        } catch {
            return false;
        }
    }, [projectId, loadEntries]);

    // ── Cite suggestions for Monaco ──────────────────────────
    const citeSuggestions: CiteSuggestion[] = useMemo(() => {
        return entries.map((entry) => {
            const authorShort = entry.author.split(/\s+and\s+/i)[0].split(',')[0].trim();
            const label = `${authorShort} (${entry.year}) — ${entry.title.slice(0, 60)}`;
            const detail = `${entry.type} · ${entry.journal}`;

            return {
                key: entry.key,
                label,
                detail,
                insertText: `\\cite{${entry.key}}`,
            };
        });
    }, [entries]);

    // ── Download .bib ────────────────────────────────────────
    const downloadBib = useCallback(() => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/bibliography';
        form.target = '_blank';

        const addHidden = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        addHidden('projectId', projectId);
        addHidden('action', 'get_bib');

        // Use fetch instead for a cleaner download
        fetch(`/api/bibliography?projectId=${projectId}`)
            .then(async (res) => {
                // Build plain bib content from entries
                const data = await res.json();
                const bibEntries = (data.entries || []) as BibEntryJSON[];
                const bibContent = bibEntries
                    .map((e: BibEntryJSON) => {
                        const fields = Object.entries(e.fields)
                            .map(([k, v]) => `  ${k} = {${v}}`)
                            .join(',\n');
                        return `@${e.type}{${e.key},\n${fields}\n}`;
                    })
                    .join('\n\n');

                const blob = new Blob([bibContent], { type: 'application/x-bibtex' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'references.bib';
                a.click();
                URL.revokeObjectURL(url);
            });
    }, [projectId]);

    return {
        entries,
        isLoading,
        error,
        loadEntries,
        lookupDOI,
        searchCrossref: searchCrossrefFn,
        addEntry,
        uploadBib,
        removeEntry,
        citeSuggestions,
        downloadBib,
        totalEntries,
    };
}
