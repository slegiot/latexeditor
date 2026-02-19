// ─────────────────────────────────────────────────────────────
// LaTeXForge — BibTeX Parser
// ─────────────────────────────────────────────────────────────
// Parses .bib file content into structured BibEntry records.
// Supports:
//   ✦ All standard entry types (@article, @book, @inproceedings…)
//   ✦ Nested braces in field values
//   ✦ String concatenation (#)
//   ✦ @string macros
//   ✦ LaTeX accent commands (\'{e}, \"{u}, etc.)
//   ✦ Serialisation back to .bib format
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

export type BibEntryType =
    | 'article' | 'book' | 'booklet' | 'conference'
    | 'inbook' | 'incollection' | 'inproceedings'
    | 'manual' | 'mastersthesis' | 'misc' | 'phdthesis'
    | 'proceedings' | 'techreport' | 'unpublished'
    | 'online' | 'software' | 'dataset'
    | string; // Allow custom types

export interface BibEntry {
    /** Citation key (e.g., "einstein1905") */
    key: string;
    /** Entry type (e.g., "article") */
    type: BibEntryType;
    /** Field → value map */
    fields: Record<string, string>;
    /** Raw .bib text for this entry */
    raw: string;
}

export interface ParsedBibliography {
    entries: BibEntry[];
    /** @string macro definitions */
    macros: Record<string, string>;
    /** Parse errors/warnings */
    warnings: string[];
}

// ── Parser ───────────────────────────────────────────────────

/**
 * Parse a .bib file string into structured entries.
 */
export function parseBibTeX(input: string): ParsedBibliography {
    const entries: BibEntry[] = [];
    const macros: Record<string, string> = {};
    const warnings: string[] = [];

    // Pre-defined month macros
    const defaultMacros: Record<string, string> = {
        jan: 'January', feb: 'February', mar: 'March', apr: 'April',
        may: 'May', jun: 'June', jul: 'July', aug: 'August',
        sep: 'September', oct: 'October', nov: 'November', dec: 'December',
    };
    Object.assign(macros, defaultMacros);

    // Match @type{...} blocks
    const entryRegex = /@(\w+)\s*\{/g;
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(input)) !== null) {
        const type = match[1].toLowerCase();
        const startBrace = match.index + match[0].length - 1;

        // Find matching closing brace
        const endBrace = findMatchingBrace(input, startBrace);
        if (endBrace === -1) {
            warnings.push(`Unclosed brace for @${type} at position ${match.index}`);
            continue;
        }

        const body = input.slice(startBrace + 1, endBrace).trim();
        const rawEntry = input.slice(match.index, endBrace + 1);

        if (type === 'string') {
            // Parse @string{name = "value"}
            const strMatch = body.match(/^\s*(\w+)\s*=\s*([\s\S]+)$/);
            if (strMatch) {
                macros[strMatch[1].toLowerCase()] = cleanFieldValue(strMatch[2], macros);
            }
            continue;
        }

        if (type === 'comment' || type === 'preamble') {
            continue;
        }

        // Parse entry: first token is the key, then field=value pairs
        const commaIdx = body.indexOf(',');
        if (commaIdx === -1) {
            warnings.push(`No fields found in @${type} entry`);
            continue;
        }

        const key = body.slice(0, commaIdx).trim();
        const fieldsStr = body.slice(commaIdx + 1);
        const fields = parseFields(fieldsStr, macros, warnings);

        entries.push({ key, type, fields, raw: rawEntry });
    }

    return { entries, macros, warnings };
}

// ── Field Parser ─────────────────────────────────────────────

function parseFields(
    fieldsStr: string,
    macros: Record<string, string>,
    warnings: string[]
): Record<string, string> {
    const fields: Record<string, string> = {};

    // State machine parser for field=value pairs
    let pos = 0;
    const len = fieldsStr.length;

    while (pos < len) {
        // Skip whitespace and commas
        while (pos < len && /[\s,]/.test(fieldsStr[pos])) pos++;
        if (pos >= len) break;

        // Read field name
        const nameStart = pos;
        while (pos < len && /[a-zA-Z0-9_-]/.test(fieldsStr[pos])) pos++;
        const fieldName = fieldsStr.slice(nameStart, pos).toLowerCase();

        if (!fieldName) {
            pos++;
            continue;
        }

        // Skip whitespace and =
        while (pos < len && /[\s]/.test(fieldsStr[pos])) pos++;
        if (pos >= len || fieldsStr[pos] !== '=') {
            warnings.push(`Expected '=' after field "${fieldName}"`);
            continue;
        }
        pos++; // skip =

        // Skip whitespace
        while (pos < len && /[\s]/.test(fieldsStr[pos])) pos++;

        // Read value
        const { value, endPos } = readFieldValue(fieldsStr, pos, macros);
        fields[fieldName] = value;
        pos = endPos;
    }

    return fields;
}

function readFieldValue(
    str: string,
    pos: number,
    macros: Record<string, string>
): { value: string; endPos: number } {
    const parts: string[] = [];

    while (pos < str.length) {
        // Skip whitespace
        while (pos < str.length && str[pos] === ' ') pos++;

        if (str[pos] === '{') {
            // Brace-delimited value
            const end = findMatchingBrace(str, pos);
            if (end === -1) {
                parts.push(str.slice(pos + 1));
                pos = str.length;
            } else {
                parts.push(str.slice(pos + 1, end));
                pos = end + 1;
            }
        } else if (str[pos] === '"') {
            // Quote-delimited value
            const end = findMatchingQuote(str, pos);
            if (end === -1) {
                parts.push(str.slice(pos + 1));
                pos = str.length;
            } else {
                parts.push(str.slice(pos + 1, end));
                pos = end + 1;
            }
        } else if (/[a-zA-Z0-9]/.test(str[pos])) {
            // Bare word (macro or number)
            const wordStart = pos;
            while (pos < str.length && /[a-zA-Z0-9]/.test(str[pos])) pos++;
            const word = str.slice(wordStart, pos);

            // Check if it's a macro
            const macroVal = macros[word.toLowerCase()];
            parts.push(macroVal || word);
        } else {
            break;
        }

        // Check for # (string concatenation)
        while (pos < str.length && str[pos] === ' ') pos++;
        if (str[pos] === '#') {
            pos++; // skip #
        } else {
            break;
        }
    }

    return { value: parts.join(''), endPos: pos };
}

// ── Serialiser ───────────────────────────────────────────────

/**
 * Serialise a BibEntry back to .bib format.
 */
export function serialiseBibEntry(entry: BibEntry): string {
    const fieldLines = Object.entries(entry.fields)
        .map(([key, value]) => `  ${key} = {${value}}`)
        .join(',\n');

    return `@${entry.type}{${entry.key},\n${fieldLines}\n}`;
}

/**
 * Serialise an entire bibliography.
 */
export function serialiseBibliography(entries: BibEntry[]): string {
    return entries.map(serialiseBibEntry).join('\n\n');
}

// ── Search / Filter ──────────────────────────────────────────

/**
 * Search bibliography entries by query (matches key, title, author).
 */
export function searchEntries(entries: BibEntry[], query: string): BibEntry[] {
    if (!query.trim()) return entries;

    const lower = query.toLowerCase();
    return entries.filter((entry) => {
        if (entry.key.toLowerCase().includes(lower)) return true;
        if (entry.fields.title?.toLowerCase().includes(lower)) return true;
        if (entry.fields.author?.toLowerCase().includes(lower)) return true;
        if (entry.fields.year?.includes(query)) return true;
        return false;
    });
}

/**
 * Generate a citation key from entry fields.
 * Format: authorLastName + year (e.g., "einstein1905")
 */
export function generateCitationKey(fields: Record<string, string>): string {
    const author = fields.author || fields.editor || 'unknown';
    const year = fields.year || new Date().getFullYear().toString();

    // Extract first author's last name
    const firstAuthor = author.split(/\s+and\s+/i)[0];
    const lastName = firstAuthor
        .split(',')[0]           // "Last, First" format
        .split(/\s+/).pop()      // "First Last" format — take last word
        ?.replace(/[^a-zA-Z]/g, '')
        .toLowerCase() || 'unknown';

    return `${lastName}${year}`;
}

// ── Helpers ──────────────────────────────────────────────────

function findMatchingBrace(str: string, openPos: number): number {
    let depth = 1;
    for (let i = openPos + 1; i < str.length; i++) {
        if (str[i] === '{' && str[i - 1] !== '\\') depth++;
        if (str[i] === '}' && str[i - 1] !== '\\') depth--;
        if (depth === 0) return i;
    }
    return -1;
}

function findMatchingQuote(str: string, openPos: number): number {
    for (let i = openPos + 1; i < str.length; i++) {
        if (str[i] === '"' && str[i - 1] !== '\\') return i;
    }
    return -1;
}

function cleanFieldValue(raw: string, macros: Record<string, string>): string {
    const { value } = readFieldValue(raw.trim(), 0, macros);
    return value;
}
