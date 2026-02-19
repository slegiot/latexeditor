// ─────────────────────────────────────────────────────────────
// LaTeXForge — Line-Level Diff Engine
// ─────────────────────────────────────────────────────────────
// Myers diff algorithm for comparing two versions of LaTeX
// source. Produces line-level diffs with additions/deletions
// suitable for rendering in a green/red diff view.
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

export type DiffLineType = 'equal' | 'add' | 'remove';

export interface DiffLine {
    type: DiffLineType;
    content: string;
    /** Line number in the old version (undefined for additions) */
    oldLineNumber?: number;
    /** Line number in the new version (undefined for deletions) */
    newLineNumber?: number;
}

export interface DiffResult {
    lines: DiffLine[];
    additions: number;
    deletions: number;
    unchanged: number;
}

// ── Main Diff Function ──────────────────────────────────────

/**
 * Compute a line-level diff between two text strings.
 * Uses a simplified Myers diff algorithm.
 */
export function computeDiff(oldText: string, newText: string): DiffResult {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const editScript = myersDiff(oldLines, newLines);

    let additions = 0;
    let deletions = 0;
    let unchanged = 0;

    for (const line of editScript) {
        switch (line.type) {
            case 'add': additions++; break;
            case 'remove': deletions++; break;
            case 'equal': unchanged++; break;
        }
    }

    return { lines: editScript, additions, deletions, unchanged };
}

// ── Myers Diff Algorithm ─────────────────────────────────────

function myersDiff(oldLines: string[], newLines: string[]): DiffLine[] {
    const n = oldLines.length;
    const m = newLines.length;
    const max = n + m;

    // For very large diffs, fall back to simple LCS
    if (max > 10000) {
        return simpleDiff(oldLines, newLines);
    }

    // V array indexed from -max to max
    const vSize = 2 * max + 1;
    const v = new Int32Array(vSize);
    const trace: Int32Array[] = [];

    // Offset so we can use negative indices
    const offset = max;

    for (let d = 0; d <= max; d++) {
        const snapshot = new Int32Array(vSize);
        snapshot.set(v);
        trace.push(snapshot);

        for (let k = -d; k <= d; k += 2) {
            let x: number;

            if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
                x = v[k + 1 + offset]; // move down
            } else {
                x = v[k - 1 + offset] + 1; // move right
            }

            let y = x - k;

            // Follow diagonal (equal lines)
            while (x < n && y < m && oldLines[x] === newLines[y]) {
                x++;
                y++;
            }

            v[k + offset] = x;

            if (x >= n && y >= m) {
                // Found shortest edit script — backtrack
                return backtrack(trace, oldLines, newLines, d, offset);
            }
        }
    }

    // Fallback (should not reach here)
    return simpleDiff(oldLines, newLines);
}

function backtrack(
    trace: Int32Array[],
    oldLines: string[],
    newLines: string[],
    totalD: number,
    offset: number
): DiffLine[] {
    const result: DiffLine[] = [];
    let x = oldLines.length;
    let y = newLines.length;

    for (let d = totalD; d > 0; d--) {
        const v = trace[d - 1];
        const k = x - y;

        let prevK: number;
        if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
            prevK = k + 1;
        } else {
            prevK = k - 1;
        }

        const prevX = v[prevK + offset];
        const prevY = prevX - prevK;

        // Diagonal moves (equal lines)
        while (x > prevX && y > prevY) {
            x--;
            y--;
            result.unshift({
                type: 'equal',
                content: oldLines[x],
                oldLineNumber: x + 1,
                newLineNumber: y + 1,
            });
        }

        if (d > 0) {
            if (x === prevX) {
                // Insertion
                y--;
                result.unshift({
                    type: 'add',
                    content: newLines[y],
                    newLineNumber: y + 1,
                });
            } else {
                // Deletion
                x--;
                result.unshift({
                    type: 'remove',
                    content: oldLines[x],
                    oldLineNumber: x + 1,
                });
            }
        }
    }

    // Remaining diagonal at d=0
    while (x > 0 && y > 0) {
        x--;
        y--;
        result.unshift({
            type: 'equal',
            content: oldLines[x],
            oldLineNumber: x + 1,
            newLineNumber: y + 1,
        });
    }

    return result;
}

// ── Fallback Simple Diff ─────────────────────────────────────

function simpleDiff(oldLines: string[], newLines: string[]): DiffLine[] {
    const result: DiffLine[] = [];

    // LCS-based diff for very large files
    const lcs = computeLCS(oldLines, newLines);

    let oi = 0;
    let ni = 0;
    let li = 0;

    while (oi < oldLines.length || ni < newLines.length) {
        if (li < lcs.length && oi < oldLines.length && ni < newLines.length &&
            oldLines[oi] === lcs[li] && newLines[ni] === lcs[li]) {
            result.push({
                type: 'equal',
                content: oldLines[oi],
                oldLineNumber: oi + 1,
                newLineNumber: ni + 1,
            });
            oi++;
            ni++;
            li++;
        } else if (oi < oldLines.length && (li >= lcs.length || oldLines[oi] !== lcs[li])) {
            result.push({
                type: 'remove',
                content: oldLines[oi],
                oldLineNumber: oi + 1,
            });
            oi++;
        } else if (ni < newLines.length) {
            result.push({
                type: 'add',
                content: newLines[ni],
                newLineNumber: ni + 1,
            });
            ni++;
        }
    }

    return result;
}

function computeLCS(a: string[], b: string[]): string[] {
    const m = a.length;
    const n = b.length;

    // Space-optimized LCS — only keep two rows
    const prev = new Array(n + 1).fill(0);
    const curr = new Array(n + 1).fill(0);

    // First pass: compute LCS length
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                curr[j] = prev[j - 1] + 1;
            } else {
                curr[j] = Math.max(prev[j], curr[j - 1]);
            }
        }
        prev.splice(0, prev.length, ...curr);
        curr.fill(0);
    }

    // Second pass: full DP to reconstruct
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack
    const result: string[] = [];
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
            result.unshift(a[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return result;
}

// ── Stat Summary ─────────────────────────────────────────────

/**
 * Generate a human-readable diff summary.
 */
export function diffSummary(diff: DiffResult): string {
    const parts: string[] = [];
    if (diff.additions > 0) parts.push(`+${diff.additions}`);
    if (diff.deletions > 0) parts.push(`-${diff.deletions}`);
    if (parts.length === 0) return 'No changes';
    return parts.join(', ');
}
