// ─────────────────────────────────────────────────────────────
// API Route: /api/bibliography
// ─────────────────────────────────────────────────────────────
// Bibliography management endpoints:
//
//   GET  ?projectId=xxx          — List bibliography entries
//   GET  ?projectId=xxx&q=query  — Search entries
//   POST { projectId, action }   — Actions:
//     • { action: "lookup_doi", doi: "10.xxx" }
//       → Lookup DOI via Crossref, return BibTeX
//     • { action: "search", query: "..." }
//       → Search Crossref for works
//     • { action: "add_entry", bibtex: "..." }
//       → Parse and add a BibTeX entry
//     • { action: "upload_bib", content: "..." }
//       → Parse and merge a full .bib file
//     • { action: "remove_entry", key: "..." }
//       → Remove an entry by citation key
//     • { action: "get_bib" }
//       → Return the full .bib file content
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseBibTeX, serialiseBibliography, searchEntries, generateCitationKey } from '@/lib/bibtex-parser';
import type { BibEntry } from '@/lib/bibtex-parser';
import { lookupDOI, searchCrossref, isDOI, normalizeDOI } from '@/lib/crossref';

// ── GET: List / Search ───────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const query = searchParams.get('q');

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
        }

        // Fetch the project's .bib content from the bibliography field
        const { data: project, error: projError } = await supabase
            .from('projects')
            .select('bibliography')
            .eq('id', projectId)
            .single();

        if (projError || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const bibContent = (project.bibliography as string) || '';
        const parsed = parseBibTeX(bibContent);

        let entries = parsed.entries;
        if (query) {
            entries = searchEntries(entries, query);
        }

        return NextResponse.json({
            entries: entries.map(entryToJSON),
            total: parsed.entries.length,
            filtered: entries.length,
            warnings: parsed.warnings,
        });
    } catch (error) {
        console.error('[Bibliography GET] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// ── POST: Actions ────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { projectId, action } = body;

        if (!projectId || !action) {
            return NextResponse.json(
                { error: 'Missing projectId or action' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'lookup_doi':
                return handleLookupDOI(body.doi);

            case 'search':
                return handleSearch(body.query);

            case 'add_entry':
                return handleAddEntry(supabase, projectId, body.bibtex);

            case 'upload_bib':
                return handleUploadBib(supabase, projectId, body.content);

            case 'remove_entry':
                return handleRemoveEntry(supabase, projectId, body.key);

            case 'get_bib':
                return handleGetBib(supabase, projectId);

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('[Bibliography POST] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// ── Action Handlers ──────────────────────────────────────────

async function handleLookupDOI(doi: string) {
    if (!doi) {
        return NextResponse.json({ error: 'Missing doi field' }, { status: 400 });
    }

    if (!isDOI(doi)) {
        return NextResponse.json({ error: 'Invalid DOI format' }, { status: 400 });
    }

    const result = await lookupDOI(normalizeDOI(doi));

    return NextResponse.json({
        found: true,
        entry: result,
        citationKey: result.citationKey,
        bibtex: result.bibtex,
    });
}

async function handleSearch(query: string) {
    if (!query || query.trim().length < 3) {
        return NextResponse.json(
            { error: 'Query must be at least 3 characters' },
            { status: 400 }
        );
    }

    const results = await searchCrossref(query, 10);

    return NextResponse.json({
        results,
        total: results.length,
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleAddEntry(supabase: any, projectId: string, bibtex: string) {
    if (!bibtex) {
        return NextResponse.json({ error: 'Missing bibtex field' }, { status: 400 });
    }

    // Parse the new entry
    const parsed = parseBibTeX(bibtex);
    if (parsed.entries.length === 0) {
        return NextResponse.json({ error: 'No valid BibTeX entry found' }, { status: 400 });
    }

    // Fetch existing bibliography
    const { data: project } = await supabase
        .from('projects')
        .select('bibliography')
        .eq('id', projectId)
        .single();

    const existingBib = (project?.bibliography as string) || '';
    const existingParsed = parseBibTeX(existingBib);

    // Check for duplicate keys
    const newEntry = parsed.entries[0];
    const duplicate = existingParsed.entries.find((e: BibEntry) => e.key === newEntry.key);

    if (duplicate) {
        // Generate a unique key
        let suffix = 'a';
        while (existingParsed.entries.some((e: BibEntry) => e.key === `${newEntry.key}${suffix}`)) {
            suffix = String.fromCharCode(suffix.charCodeAt(0) + 1);
        }
        newEntry.key = `${newEntry.key}${suffix}`;
    }

    // Append new entry
    const allEntries = [...existingParsed.entries, newEntry];
    const newBibContent = serialiseBibliography(allEntries);

    // Save
    const { error: updateError } = await supabase
        .from('projects')
        .update({ bibliography: newBibContent })
        .eq('id', projectId);

    if (updateError) {
        return NextResponse.json({ error: 'Failed to save bibliography' }, { status: 500 });
    }

    return NextResponse.json({
        added: entryToJSON(newEntry),
        citationKey: newEntry.key,
        totalEntries: allEntries.length,
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUploadBib(supabase: any, projectId: string, content: string) {
    if (!content) {
        return NextResponse.json({ error: 'Missing content field' }, { status: 400 });
    }

    const parsed = parseBibTeX(content);

    if (parsed.entries.length === 0) {
        return NextResponse.json({
            error: 'No valid BibTeX entries found in uploaded file',
            warnings: parsed.warnings,
        }, { status: 400 });
    }

    // Fetch existing and merge
    const { data: project } = await supabase
        .from('projects')
        .select('bibliography')
        .eq('id', projectId)
        .single();

    const existingBib = (project?.bibliography as string) || '';
    const existingParsed = parseBibTeX(existingBib);

    // Merge: new entries override existing ones with the same key
    const existingKeys = new Set(existingParsed.entries.map((e: BibEntry) => e.key));
    const newEntries = parsed.entries.filter((e) => !existingKeys.has(e.key));
    const updatedEntries = existingParsed.entries.map((existing: BibEntry) => {
        const updated = parsed.entries.find((e) => e.key === existing.key);
        return updated || existing;
    });

    const allEntries = [...updatedEntries, ...newEntries];
    const newBibContent = serialiseBibliography(allEntries);

    const { error: updateError } = await supabase
        .from('projects')
        .update({ bibliography: newBibContent })
        .eq('id', projectId);

    if (updateError) {
        return NextResponse.json({ error: 'Failed to save bibliography' }, { status: 500 });
    }

    return NextResponse.json({
        imported: parsed.entries.length,
        newEntries: newEntries.length,
        updatedEntries: parsed.entries.length - newEntries.length,
        totalEntries: allEntries.length,
        warnings: parsed.warnings,
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRemoveEntry(supabase: any, projectId: string, key: string) {
    if (!key) {
        return NextResponse.json({ error: 'Missing key field' }, { status: 400 });
    }

    const { data: project } = await supabase
        .from('projects')
        .select('bibliography')
        .eq('id', projectId)
        .single();

    const existingBib = (project?.bibliography as string) || '';
    const parsed = parseBibTeX(existingBib);

    const filtered = parsed.entries.filter((e) => e.key !== key);

    if (filtered.length === parsed.entries.length) {
        return NextResponse.json({ error: `Entry "${key}" not found` }, { status: 404 });
    }

    const newBibContent = serialiseBibliography(filtered);

    const { error: updateError } = await supabase
        .from('projects')
        .update({ bibliography: newBibContent })
        .eq('id', projectId);

    if (updateError) {
        return NextResponse.json({ error: 'Failed to save bibliography' }, { status: 500 });
    }

    return NextResponse.json({
        removed: key,
        totalEntries: filtered.length,
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleGetBib(supabase: any, projectId: string) {
    const { data: project } = await supabase
        .from('projects')
        .select('bibliography')
        .eq('id', projectId)
        .single();

    const bibContent = (project?.bibliography as string) || '';

    return new Response(bibContent, {
        headers: {
            'Content-Type': 'application/x-bibtex',
            'Content-Disposition': 'attachment; filename="references.bib"',
        },
    });
}

// ── Helpers ──────────────────────────────────────────────────

function entryToJSON(entry: BibEntry) {
    return {
        key: entry.key,
        type: entry.type,
        title: entry.fields.title || '',
        author: entry.fields.author || '',
        year: entry.fields.year || '',
        journal: entry.fields.journal || entry.fields.booktitle || '',
        doi: entry.fields.doi || '',
        fields: entry.fields,
    };
}
