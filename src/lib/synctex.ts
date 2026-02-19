// ─────────────────────────────────────────────────────────────
// LaTeXForge — SyncTeX Parser & Mapper
// ─────────────────────────────────────────────────────────────
// Parses SyncTeX output to map between:
//   source line numbers ↔ PDF page + coordinates
//
// SyncTeX is a technology built into pdfLaTeX/XeLaTeX/LuaLaTeX
// that generates a .synctex.gz file alongside the PDF. This file
// records the mapping between source file positions and output
// positions in the PDF.
//
// This module provides:
//   1. parseSyncTexFromGz — Parse raw .synctex.gz binary
//   2. sourceToPage      — Map source line → PDF page + y offset
//   3. pageToSource      — Map PDF click → source line (inverse)
// ─────────────────────────────────────────────────────────────

/** A single sync point mapping source → PDF */
export interface SyncTexRecord {
    /** Source file path (relative) */
    file: string;
    /** Line number in source (1-indexed) */
    line: number;
    /** Column in source (0-indexed, often 0) */
    column: number;
    /** PDF page number (1-indexed) */
    page: number;
    /** X coordinate on page (in PDF points, 72dpi) */
    x: number;
    /** Y coordinate on page (in PDF points, from bottom) */
    y: number;
    /** Width of the element */
    width: number;
    /** Height of the element */
    height: number;
}

/** Parsed SyncTeX data for a compilation */
export interface SyncTexData {
    /** Map from source file → sorted records */
    bySource: Map<string, SyncTexRecord[]>;
    /** Map from page number → records on that page */
    byPage: Map<number, SyncTexRecord[]>;
    /** All file paths referenced */
    files: string[];
    /** Total PDF page count */
    pageCount: number;
}

/** Result of forward sync: source → PDF */
export interface ForwardSyncResult {
    page: number;
    x: number;
    y: number;
    /** Normalized y position (0–1, from top) */
    yNorm: number;
}

/** Result of inverse sync: PDF → source */
export interface InverseSyncResult {
    file: string;
    line: number;
    column: number;
}

// ── SyncTeX Format Constants ─────────────────────────────────
// SyncTeX is a line-based text format (after gunzip):
//
// Preamble:
//   SyncTeX Version:1
//   Input:<id>:<filename>
//   Output:...
//
// Content section (after "Content:"):
//   {<page>       — Page start
//   [<x>,<y>,<w>,<h>   — vbox
//   (<x>,<y>,<w>,<h>   — hbox
//   h<x>,<y>,<w>,<h>   — math/char node
//   x<x>,<y>,<w>,<h>   — kern/glue node
//   g<x>,<y>,<w>,<h>   — glue node
//   v<x>,<y>,<w>,<h>   — vbox node
//   k<x>,<y>,<w>,<h>   — kern
//   $<x>,<y>,<w>,<h>   — math node
//   ]               — End box
//   )               — End box
//   }<page>          — Page end
//
// Each record line format:
//   <type><link>:<x>,<y>[:<W>,<H>,<D>]
//   where link = <fileId>,<line>,<column>

/**
 * Parse a SyncTeX text string (already decompressed from .synctex.gz).
 * Returns the structured mapping data.
 */
export function parseSyncTex(syncTexContent: string): SyncTexData {
    const lines = syncTexContent.split('\n');

    const fileMap = new Map<number, string>(); // Input ID → filename
    const records: SyncTexRecord[] = [];
    let currentPage = 0;
    let inContent = false;

    // Unit conversion: SyncTeX uses "scaled points" (65536 sp = 1pt)
    // We convert to PDF points (72pt/inch)
    const UNIT = 65536;

    for (const line of lines) {
        // ── Preamble: Input declarations ──────────────────────
        if (line.startsWith('Input:')) {
            const match = line.match(/^Input:(\d+):(.+)$/);
            if (match) {
                fileMap.set(parseInt(match[1], 10), cleanPath(match[2]));
            }
            continue;
        }

        // ── Content section begin ────────────────────────────
        if (line === 'Content:') {
            inContent = true;
            continue;
        }

        if (!inContent) continue;

        // ── Page markers ─────────────────────────────────────
        if (line.startsWith('{')) {
            currentPage = parseInt(line.substring(1), 10) || currentPage + 1;
            continue;
        }
        if (line.startsWith('}')) continue;

        // ── Record lines ─────────────────────────────────────
        // Format examples:
        //   h1,42,0:1234,5678:100,50,20
        //   x1,42,0:1234,5678
        //   [1,42,0:1234,5678:100,50,20
        //   (1,42,0:1234,5678:100,50,20

        const recordMatch = line.match(
            /^[hxgkv$\[\(](\d+),(\d+),(\d+):(-?\d+),(-?\d+)(?::(-?\d+),(-?\d+),(-?\d+))?/
        );

        if (recordMatch) {
            const fileId = parseInt(recordMatch[1], 10);
            const lineNum = parseInt(recordMatch[2], 10);
            const col = parseInt(recordMatch[3], 10);
            const rawX = parseInt(recordMatch[4], 10);
            const rawY = parseInt(recordMatch[5], 10);
            const rawW = recordMatch[6] ? parseInt(recordMatch[6], 10) : 0;
            const rawH = recordMatch[7] ? parseInt(recordMatch[7], 10) : 0;

            const file = fileMap.get(fileId);
            if (!file || lineNum <= 0) continue;

            records.push({
                file,
                line: lineNum,
                column: col,
                page: currentPage,
                x: rawX / UNIT,
                y: rawY / UNIT,
                width: Math.abs(rawW) / UNIT,
                height: Math.abs(rawH) / UNIT,
            });
        }
    }

    // ── Index by source file and by page ────────────────────
    const bySource = new Map<string, SyncTexRecord[]>();
    const byPage = new Map<number, SyncTexRecord[]>();
    const fileSet = new Set<string>();

    for (const record of records) {
        fileSet.add(record.file);

        if (!bySource.has(record.file)) {
            bySource.set(record.file, []);
        }
        bySource.get(record.file)!.push(record);

        if (!byPage.has(record.page)) {
            byPage.set(record.page, []);
        }
        byPage.get(record.page)!.push(record);
    }

    // Sort by line number within each source file
    Array.from(bySource.values()).forEach((recs) => {
        recs.sort((a: SyncTexRecord, b: SyncTexRecord) => a.line - b.line);
    });

    // Sort by y coordinate within each page (top to bottom)
    Array.from(byPage.values()).forEach((recs) => {
        recs.sort((a: SyncTexRecord, b: SyncTexRecord) => a.y - b.y);
    });

    const pageCount = Math.max(0, ...Array.from(byPage.keys()));

    return {
        bySource,
        byPage,
        files: Array.from(fileSet),
        pageCount,
    };
}

// ── Forward Sync (Source → PDF) ──────────────────────────────

/**
 * Given a source file and line number, find the corresponding
 * position in the PDF document.
 *
 * Uses binary search for O(log n) lookup.
 */
export function sourceToPage(
    data: SyncTexData,
    file: string,
    line: number,
    pageHeight?: number
): ForwardSyncResult | null {
    // Normalize the file path
    const normalizedFile = cleanPath(file);

    // Try exact file match first, then partial match
    let records = data.bySource.get(normalizedFile);

    if (!records) {
        // Try basename match
        const basename = normalizedFile.split('/').pop();
        const entries = Array.from(data.bySource.entries());
        for (let i = 0; i < entries.length; i++) {
            if (entries[i][0].endsWith(basename || '')) {
                records = entries[i][1];
                break;
            }
        }
    }

    if (!records || records.length === 0) return null;

    // Binary search for the closest line
    let lo = 0;
    let hi = records.length - 1;
    let best = records[0];

    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        const rec = records[mid];

        if (rec.line === line) {
            best = rec;
            break;
        } else if (rec.line < line) {
            best = rec;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    // Compute normalized Y position (0 = top, 1 = bottom)
    const height = pageHeight || 842; // A4 default height in points
    const yNorm = Math.max(0, Math.min(1, best.y / height));

    return {
        page: best.page,
        x: best.x,
        y: best.y,
        yNorm,
    };
}

// ── Inverse Sync (PDF → Source) ──────────────────────────────

/**
 * Given a click position on a PDF page, find the corresponding
 * source file and line number.
 *
 * Returns the closest match by Euclidean distance.
 */
export function pageToSource(
    data: SyncTexData,
    page: number,
    x: number,
    y: number
): InverseSyncResult | null {
    const records = data.byPage.get(page);
    if (!records || records.length === 0) return null;

    // Find closest record by distance
    let bestDist = Infinity;
    let best = records[0];

    for (const rec of records) {
        const dx = rec.x - x;
        const dy = rec.y - y;
        const dist = dx * dx + dy * dy;

        if (dist < bestDist) {
            bestDist = dist;
            best = rec;
        }
    }

    return {
        file: best.file,
        line: best.line,
        column: best.column,
    };
}

// ── Line-to-Page Map (for scroll sync) ──────────────────────

/**
 * Build a fast lookup table: source line → page number.
 * Used for continuous scroll synchronization.
 *
 * Returns a sparse array where lineToPage[lineNumber] = pageNumber.
 */
export function buildLineToPageMap(
    data: SyncTexData,
    file: string
): Map<number, number> {
    const map = new Map<number, number>();

    const normalizedFile = cleanPath(file);
    let records = data.bySource.get(normalizedFile);

    if (!records) {
        const basename = normalizedFile.split('/').pop();
        const entries = Array.from(data.bySource.entries());
        for (let i = 0; i < entries.length; i++) {
            if (entries[i][0].endsWith(basename || '')) {
                records = entries[i][1];
                break;
            }
        }
    }

    if (!records) return map;

    for (const rec of records) {
        // Take the first occurrence for each line
        if (!map.has(rec.line)) {
            map.set(rec.line, rec.page);
        }
    }

    return map;
}

// ── Utilities ────────────────────────────────────────────────

/**
 * Clean a file path: remove leading ./, absolute prefixes,
 * and Docker sandbox paths (e.g. /work/source/).
 */
function cleanPath(p: string): string {
    return p
        .replace(/^\.\//, '')
        .replace(/^\/work\/source\//, '')
        .replace(/^\/work\/output\//, '')
        .replace(/^(\.\/)+/, '');
}
