// ─────────────────────────────────────────────────────────────
// LaTeXForge — Crossref API Integration
// ─────────────────────────────────────────────────────────────
// Fetches bibliographic metadata from Crossref and converts
// it to BibTeX format.
//
// Endpoints used:
//   ✦ GET /works/{doi} — fetch by DOI
//   ✦ GET /works?query=... — search by title/author
//
// Rate limit: Crossref allows 50 req/sec for polite clients
// (we include mailto in requests).
// ─────────────────────────────────────────────────────────────

const CROSSREF_BASE = 'https://api.crossref.org';
const MAILTO = 'contact@latexforge.app'; // Polite pool

// ── Types ────────────────────────────────────────────────────

export interface CrossrefWork {
    DOI: string;
    type: string;
    title: string[];
    author?: { given?: string; family?: string; name?: string }[];
    'container-title'?: string[];
    publisher?: string;
    published?: { 'date-parts'?: number[][] };
    volume?: string;
    issue?: string;
    page?: string;
    URL?: string;
    ISSN?: string[];
    ISBN?: string[];
    abstract?: string;
}

export interface CrossrefSearchResult {
    doi: string;
    title: string;
    authors: string;
    year: string;
    journal: string;
    bibtex: string;
    citationKey: string;
}

// ── DOI Lookup ───────────────────────────────────────────────

/**
 * Fetch bibliographic data for a DOI from Crossref.
 */
export async function lookupDOI(doi: string): Promise<CrossrefSearchResult> {
    // Normalize DOI
    const cleanDOI = normalizeDOI(doi);

    // Attempt to get BibTeX directly first (faster)
    const bibtex = await fetchBibTeX(cleanDOI);

    // Also fetch JSON metadata for structured data
    const res = await fetch(
        `${CROSSREF_BASE}/works/${encodeURIComponent(cleanDOI)}?mailto=${MAILTO}`,
        {
            headers: { 'Accept': 'application/json' },
        }
    );

    if (!res.ok) {
        if (res.status === 404) {
            throw new Error(`DOI not found: ${cleanDOI}`);
        }
        throw new Error(`Crossref API error: ${res.status}`);
    }

    const data = await res.json();
    const work: CrossrefWork = data.message;

    return workToResult(work, bibtex);
}

/**
 * Fetch BibTeX directly from Crossref content negotiation.
 */
async function fetchBibTeX(doi: string): Promise<string> {
    try {
        const res = await fetch(
            `https://doi.org/${encodeURIComponent(doi)}`,
            {
                headers: { 'Accept': 'application/x-bibtex' },
                redirect: 'follow',
            }
        );

        if (res.ok) {
            return await res.text();
        }
    } catch {
        // Fall through to generated BibTeX
    }

    return ''; // Will generate from metadata
}

// ── Title Search ─────────────────────────────────────────────

/**
 * Search Crossref for works matching a query.
 */
export async function searchCrossref(
    query: string,
    limit: number = 10
): Promise<CrossrefSearchResult[]> {
    const params = new URLSearchParams({
        query,
        rows: String(limit),
        mailto: MAILTO,
        select: 'DOI,title,author,container-title,published,publisher,volume,issue,page,type',
    });

    const res = await fetch(
        `${CROSSREF_BASE}/works?${params}`,
        {
            headers: { 'Accept': 'application/json' },
        }
    );

    if (!res.ok) {
        throw new Error(`Crossref search failed: ${res.status}`);
    }

    const data = await res.json();
    const items: CrossrefWork[] = data.message?.items || [];

    return items.map((work) => workToResult(work));
}

// ── Conversion Helpers ───────────────────────────────────────

function workToResult(work: CrossrefWork, existingBibtex?: string): CrossrefSearchResult {
    const title = work.title?.[0] || 'Untitled';
    const authors = formatAuthors(work.author);
    const year = extractYear(work);
    const journal = work['container-title']?.[0] || work.publisher || '';
    const citationKey = generateKey(work);

    const bibtex = existingBibtex || generateBibTeX(work, citationKey);

    return { doi: work.DOI, title, authors, year, journal, bibtex, citationKey };
}

function formatAuthors(
    authors?: { given?: string; family?: string; name?: string }[]
): string {
    if (!authors || authors.length === 0) return 'Unknown';

    return authors
        .map((a) => {
            if (a.name) return a.name;
            if (a.family && a.given) return `${a.family}, ${a.given}`;
            return a.family || a.given || 'Unknown';
        })
        .join(' and ');
}

function extractYear(work: CrossrefWork): string {
    const parts = work.published?.['date-parts']?.[0];
    if (parts && parts[0]) return String(parts[0]);
    return '';
}

function generateKey(work: CrossrefWork): string {
    const firstAuthor = work.author?.[0];
    const lastName = (firstAuthor?.family || firstAuthor?.name || 'unknown')
        .replace(/[^a-zA-Z]/g, '')
        .toLowerCase();
    const year = extractYear(work);
    return `${lastName}${year}`;
}

/**
 * Generate BibTeX from Crossref metadata when content negotiation fails.
 */
function generateBibTeX(work: CrossrefWork, key: string): string {
    const type = mapCrossrefType(work.type);
    const fields: string[] = [];

    const title = work.title?.[0];
    if (title) fields.push(`  title = {${title}}`);

    const authors = formatAuthors(work.author);
    if (authors !== 'Unknown') fields.push(`  author = {${authors}}`);

    const year = extractYear(work);
    if (year) fields.push(`  year = {${year}}`);

    const journal = work['container-title']?.[0];
    if (journal) fields.push(`  journal = {${journal}}`);

    if (work.volume) fields.push(`  volume = {${work.volume}}`);
    if (work.issue) fields.push(`  number = {${work.issue}}`);
    if (work.page) fields.push(`  pages = {${work.page}}`);
    if (work.publisher) fields.push(`  publisher = {${work.publisher}}`);
    if (work.DOI) fields.push(`  doi = {${work.DOI}}`);
    if (work.URL) fields.push(`  url = {${work.URL}}`);
    if (work.ISSN?.[0]) fields.push(`  issn = {${work.ISSN[0]}}`);
    if (work.ISBN?.[0]) fields.push(`  isbn = {${work.ISBN[0]}}`);

    return `@${type}{${key},\n${fields.join(',\n')}\n}`;
}

function mapCrossrefType(type: string): string {
    const typeMap: Record<string, string> = {
        'journal-article': 'article',
        'proceedings-article': 'inproceedings',
        'book-chapter': 'incollection',
        'book': 'book',
        'monograph': 'book',
        'report': 'techreport',
        'dataset': 'misc',
        'posted-content': 'unpublished',
        'peer-review': 'misc',
        'dissertation': 'phdthesis',
    };
    return typeMap[type] || 'misc';
}

// ── DOI Normalisation ────────────────────────────────────────

/**
 * Normalise a DOI string — handles URLs, doi: prefix, etc.
 */
export function normalizeDOI(input: string): string {
    let doi = input.trim();

    // Strip common URL prefixes
    doi = doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
    doi = doi.replace(/^doi:\s*/i, '');

    return doi;
}

/**
 * Check if a string looks like a DOI.
 */
export function isDOI(input: string): boolean {
    const normalized = normalizeDOI(input);
    // DOIs start with 10. followed by a registrant code
    return /^10\.\d{4,}\//.test(normalized);
}
