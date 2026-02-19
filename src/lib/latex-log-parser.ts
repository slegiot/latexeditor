// ─────────────────────────────────────────────────────────────
// LaTeXForge — LaTeX Log Parser
// ─────────────────────────────────────────────────────────────
// Parses pdflatex/xelatex/lualatex .log output into structured
// error, warning, and info records.
//
// LaTeX log format is notoriously messy — lines can be broken
// at column 80, file paths are nested in parentheses, and
// error messages span multiple lines. This parser handles:
//   ✦ ! LaTeX Error / ! Package Error
//   ✦ Undefined control sequence
//   ✦ Missing $ / } / \begin / \end
//   ✦ File not found
//   ✦ Missing package
//   ✦ Overfull/Underfull hbox
//   ✦ Warning lines
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

export type ErrorSeverity = 'error' | 'warning' | 'info';

export type ErrorCategory =
    | 'undefined_control_sequence'
    | 'missing_package'
    | 'unclosed_brace'
    | 'unclosed_environment'
    | 'missing_math_delimiter'
    | 'file_not_found'
    | 'missing_argument'
    | 'extra_brace'
    | 'extra_alignment_tab'
    | 'overfull_hbox'
    | 'underfull_hbox'
    | 'font_warning'
    | 'citation_warning'
    | 'reference_warning'
    | 'general_error'
    | 'general_warning';

export interface LatexError {
    /** Unique ID for this error */
    id: string;
    /** Error severity */
    severity: ErrorSeverity;
    /** Categorised error type */
    category: ErrorCategory;
    /** Human-readable error message */
    message: string;
    /** Raw log line(s) that produced this error */
    rawLog: string;
    /** Source file path (if determinable) */
    file?: string;
    /** Line number in source (if determinable) */
    line?: number;
    /** The offending token/text (if extractable) */
    offendingText?: string;
    /** Whether a rule-based fix is available */
    hasAutoFix: boolean;
}

export interface ParsedLog {
    errors: LatexError[];
    warnings: LatexError[];
    /** Total error count */
    errorCount: number;
    /** Total warning count */
    warningCount: number;
    /** Whether compilation produced a PDF despite errors */
    pdfProduced: boolean;
}

// ── Parser ───────────────────────────────────────────────────

let errorIdCounter = 0;
function nextId(): string {
    return `err_${++errorIdCounter}`;
}

/**
 * Parse a LaTeX compilation log into structured errors/warnings.
 */
export function parseLatexLog(logText: string): ParsedLog {
    errorIdCounter = 0;
    const errors: LatexError[] = [];
    const warnings: LatexError[] = [];

    // LaTeX breaks long lines at column 79-80. Rejoin them.
    const rawLines = logText.split('\n');
    const lines: string[] = [];
    let buffer = '';

    for (const raw of rawLines) {
        buffer += raw;
        // Lines broken at exactly 79 chars are continuations
        if (raw.length === 79) continue;
        lines.push(buffer);
        buffer = '';
    }
    if (buffer) lines.push(buffer);

    // Track current file from ( ) nesting
    let currentFile: string | undefined;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // ── Track current file from ( ) nesting ──────────────
        const fileMatch = line.match(/^\(([^\s()]+\.(?:tex|sty|cls|bbl|aux))/);
        if (fileMatch) {
            currentFile = fileMatch[1];
        }

        // ── ! errors (the main LaTeX error format) ───────────
        if (line.startsWith('!')) {
            const errorInfo = parseErrorBlock(lines, i, currentFile);
            if (errorInfo) {
                errors.push(errorInfo);
            }
            continue;
        }

        // ── l.<number> line indicator (with file-line-error) ─
        const fileLineMatch = line.match(/^([^\s:]+):(\d+):\s*(.+)/);
        if (fileLineMatch) {
            const err = parseFileLineError(fileLineMatch[1], parseInt(fileLineMatch[2], 10), fileLineMatch[3], lines, i);
            if (err) {
                errors.push(err);
            }
            continue;
        }

        // ── LaTeX Warning ────────────────────────────────────
        if (line.includes('LaTeX Warning:') || line.includes('Package') && line.includes('Warning:')) {
            const warning = parseWarning(line, lines, i, currentFile);
            if (warning) {
                warnings.push(warning);
            }
            continue;
        }

        // ── Overfull / Underfull ──────────────────────────────
        if (line.startsWith('Overfull') || line.startsWith('Underfull')) {
            const hboxMatch = line.match(/((?:Over|Under)full \\[hv]box)[^)]*\) in paragraph at lines? (\d+)/);
            warnings.push({
                id: nextId(),
                severity: 'warning',
                category: line.startsWith('Overfull') ? 'overfull_hbox' : 'underfull_hbox',
                message: line.slice(0, 120),
                rawLog: line,
                file: currentFile,
                line: hboxMatch ? parseInt(hboxMatch[2], 10) : undefined,
                hasAutoFix: false,
            });
            continue;
        }
    }

    // Determine if PDF was produced
    const pdfProduced =
        logText.includes('Output written on') ||
        logText.includes('output.pdf');

    return {
        errors,
        warnings,
        errorCount: errors.length,
        warningCount: warnings.length,
        pdfProduced,
    };
}

// ── Error Block Parser ───────────────────────────────────────

function parseErrorBlock(
    lines: string[],
    startIdx: number,
    currentFile?: string
): LatexError | null {
    const errorLine = lines[startIdx];

    // Collect up to 5 continuation lines for context
    const rawLines = [errorLine];
    let lineNumber: number | undefined;

    for (let j = startIdx + 1; j < Math.min(startIdx + 6, lines.length); j++) {
        rawLines.push(lines[j]);
        const lMatch = lines[j].match(/^l\.(\d+)\s/);
        if (lMatch) {
            lineNumber = parseInt(lMatch[1], 10);
            break;
        }
    }

    const rawLog = rawLines.join('\n');

    // ── Undefined control sequence ───────────────────────────
    if (errorLine.includes('Undefined control sequence')) {
        const csMatch = rawLog.match(/\\([a-zA-Z@]+)\s*$/m) ||
            rawLog.match(/\\([a-zA-Z@]+)/);
        return {
            id: nextId(),
            severity: 'error',
            category: 'undefined_control_sequence',
            message: `Undefined control sequence: ${csMatch ? '\\' + csMatch[1] : 'unknown'}`,
            rawLog,
            file: currentFile,
            line: lineNumber,
            offendingText: csMatch ? '\\' + csMatch[1] : undefined,
            hasAutoFix: true,
        };
    }

    // ── Missing $ ────────────────────────────────────────────
    if (errorLine.includes('Missing $')) {
        return {
            id: nextId(),
            severity: 'error',
            category: 'missing_math_delimiter',
            message: 'Missing $ inserted — math mode required here',
            rawLog,
            file: currentFile,
            line: lineNumber,
            hasAutoFix: true,
        };
    }

    // ── Missing } or { ──────────────────────────────────────
    if (errorLine.includes('Missing }') || errorLine.includes('Too many }') ||
        errorLine.includes('Extra }')) {
        return {
            id: nextId(),
            severity: 'error',
            category: errorLine.includes('Extra') || errorLine.includes('Too many')
                ? 'extra_brace'
                : 'unclosed_brace',
            message: errorLine.replace(/^!\s*/, '').trim(),
            rawLog,
            file: currentFile,
            line: lineNumber,
            hasAutoFix: true,
        };
    }

    // ── Missing \begin or \end ───────────────────────────────
    if (errorLine.includes('\\begin') || errorLine.includes('\\end')) {
        const envMatch = rawLog.match(/\\(?:begin|end)\{([^}]+)\}/);
        return {
            id: nextId(),
            severity: 'error',
            category: 'unclosed_environment',
            message: `Environment mismatch: ${envMatch ? envMatch[1] : 'unknown'}`,
            rawLog,
            file: currentFile,
            line: lineNumber,
            offendingText: envMatch ? envMatch[0] : undefined,
            hasAutoFix: true,
        };
    }

    // ── File not found ───────────────────────────────────────
    if (errorLine.includes('File') && errorLine.includes('not found') ||
        errorLine.includes('No file')) {
        const fileMatch = errorLine.match(/[`']([^'`]+)[`']/);
        return {
            id: nextId(),
            severity: 'error',
            category: 'file_not_found',
            message: `File not found: ${fileMatch ? fileMatch[1] : 'unknown'}`,
            rawLog,
            file: currentFile,
            line: lineNumber,
            offendingText: fileMatch ? fileMatch[1] : undefined,
            hasAutoFix: false,
        };
    }

    // ── Package error ────────────────────────────────────────
    if (errorLine.includes('Package') && errorLine.includes('Error')) {
        const pkgMatch = errorLine.match(/Package\s+(\S+)\s+Error/);
        return {
            id: nextId(),
            severity: 'error',
            category: 'general_error',
            message: errorLine.replace(/^!\s*/, '').trim(),
            rawLog,
            file: currentFile,
            line: lineNumber,
            offendingText: pkgMatch ? pkgMatch[1] : undefined,
            hasAutoFix: false,
        };
    }

    // ── Generic error ────────────────────────────────────────
    return {
        id: nextId(),
        severity: 'error',
        category: 'general_error',
        message: errorLine.replace(/^!\s*/, '').trim(),
        rawLog,
        file: currentFile,
        line: lineNumber,
        hasAutoFix: false,
    };
}

// ── File-Line-Error Parser ───────────────────────────────────

function parseFileLineError(
    file: string,
    line: number,
    message: string,
    _lines: string[],
    _idx: number
): LatexError | null {
    const category = categorizeMessage(message);

    return {
        id: nextId(),
        severity: 'error',
        category,
        message: message.trim(),
        rawLog: `${file}:${line}: ${message}`,
        file,
        line,
        offendingText: extractOffendingText(message),
        hasAutoFix: ['undefined_control_sequence', 'missing_package', 'unclosed_brace',
            'missing_math_delimiter', 'unclosed_environment'].includes(category),
    };
}

// ── Warning Parser ───────────────────────────────────────────

function parseWarning(
    line: string,
    lines: string[],
    idx: number,
    currentFile?: string
): LatexError | null {
    // Collect multi-line warning
    let fullWarning = line;
    for (let j = idx + 1; j < Math.min(idx + 4, lines.length); j++) {
        if (lines[j].startsWith(' ') || lines[j] === '') {
            fullWarning += ' ' + lines[j].trim();
        } else {
            break;
        }
    }

    const lineMatch = fullWarning.match(/on input line (\d+)/);
    const warningLine = lineMatch ? parseInt(lineMatch[1], 10) : undefined;

    let category: ErrorCategory = 'general_warning';
    if (fullWarning.includes('Citation') && fullWarning.includes('undefined')) {
        category = 'citation_warning';
    } else if (fullWarning.includes('Reference') && fullWarning.includes('undefined')) {
        category = 'reference_warning';
    } else if (fullWarning.includes('Font')) {
        category = 'font_warning';
    }

    return {
        id: nextId(),
        severity: 'warning',
        category,
        message: fullWarning.replace(/^.*Warning:\s*/i, '').trim().slice(0, 200),
        rawLog: fullWarning,
        file: currentFile,
        line: warningLine,
        hasAutoFix: false,
    };
}

// ── Helpers ──────────────────────────────────────────────────

function categorizeMessage(message: string): ErrorCategory {
    if (message.includes('Undefined control sequence')) return 'undefined_control_sequence';
    if (message.includes('Missing $')) return 'missing_math_delimiter';
    if (message.includes('Missing }') || message.includes('Missing {')) return 'unclosed_brace';
    if (message.includes('Extra }') || message.includes('Too many }')) return 'extra_brace';
    if (message.includes('\\begin') || message.includes('\\end')) return 'unclosed_environment';
    if (message.includes('File') && message.includes('not found')) return 'file_not_found';
    if (message.includes('Extra alignment tab')) return 'extra_alignment_tab';
    return 'general_error';
}

function extractOffendingText(message: string): string | undefined {
    // Extract \commandName
    const csMatch = message.match(/\\([a-zA-Z@]+)/);
    if (csMatch) return '\\' + csMatch[1];

    // Extract quoted text
    const quoteMatch = message.match(/[`']([^'`]+)[`']/);
    if (quoteMatch) return quoteMatch[1];

    return undefined;
}
