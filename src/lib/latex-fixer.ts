// ─────────────────────────────────────────────────────────────
// LaTeXForge — LaTeX Error Fixer
// ─────────────────────────────────────────────────────────────
// Two-tier fix system:
//   1. Rule-based fixes for common, deterministic issues
//   2. AI-powered fixes via OpenRouter for complex problems
//
// Rule-based fixes are instant and reliable. AI fixes are used
// as a fallback when no rule matches, and are premium-only.
// ─────────────────────────────────────────────────────────────

import type { LatexError, ErrorCategory } from './latex-log-parser';
import { callAI } from './ai';

// ── Types ────────────────────────────────────────────────────

export interface FixSuggestion {
    /** Unique ID matching the error */
    errorId: string;
    /** Human-readable description of the fix */
    description: string;
    /** The fix type */
    type: 'rule' | 'ai';
    /** The edit to apply */
    edit: FixEdit;
    /** Confidence level (0-1) */
    confidence: number;
}

export interface FixEdit {
    /** Action type */
    action: 'replace_line' | 'insert_before' | 'insert_after' | 'delete_line' | 'replace_range';
    /** Line number to target (1-indexed) */
    line: number;
    /** End line for range replacements */
    endLine?: number;
    /** The text to insert/replace with */
    newText?: string;
    /** Original text being replaced (for confirmation UI) */
    originalText?: string;
}

// ── Known package mappings ───────────────────────────────────
// Maps undefined commands to the package that defines them.

const COMMAND_TO_PACKAGE: Record<string, string> = {
    // ── Math ──
    '\\mathbb': 'amssymb',
    '\\mathcal': 'amsmath',
    '\\mathfrak': 'amssymb',
    '\\mathscr': 'mathrsfs',
    '\\boldsymbol': 'amsmath',
    '\\text': 'amsmath',
    '\\intertext': 'amsmath',
    '\\binom': 'amsmath',
    '\\DeclareMathOperator': 'amsmath',
    '\\operatorname': 'amsmath',
    '\\xleftarrow': 'amsmath',
    '\\xrightarrow': 'amsmath',
    '\\overset': 'amsmath',
    '\\underset': 'amsmath',
    '\\implies': 'amsmath',
    '\\iff': 'amsmath',

    // ── Graphics ──
    '\\includegraphics': 'graphicx',
    '\\graphicspath': 'graphicx',
    '\\rotatebox': 'graphicx',
    '\\scalebox': 'graphicx',
    '\\resizebox': 'graphicx',

    // ── Colors ──
    '\\textcolor': 'xcolor',
    '\\colorbox': 'xcolor',
    '\\definecolor': 'xcolor',
    '\\rowcolors': 'xcolor',

    // ── Formatting ──
    '\\url': 'url',
    '\\href': 'hyperref',
    '\\autoref': 'hyperref',
    '\\nameref': 'hyperref',
    '\\toprule': 'booktabs',
    '\\midrule': 'booktabs',
    '\\bottomrule': 'booktabs',
    '\\cmidrule': 'booktabs',
    '\\multirow': 'multirow',
    '\\SI': 'siunitx',
    '\\si': 'siunitx',
    '\\num': 'siunitx',
    '\\lstinline': 'listings',
    '\\lstset': 'listings',
    '\\mintinline': 'minted',
    '\\subcaption': 'subcaption',
    '\\subfigure': 'subcaption',
    '\\lipsum': 'lipsum',

    // ── Drawing ──
    '\\tikz': 'tikz',
    '\\draw': 'tikz',
    '\\node': 'tikz',
    '\\fill': 'tikz',
    '\\path': 'tikz',
    '\\pgfplotstableread': 'pgfplots',

    // ── Layout ──
    '\\geometry': 'geometry',
    '\\fancyhf': 'fancyhdr',
    '\\fancyhead': 'fancyhdr',
    '\\fancyfoot': 'fancyhdr',
    '\\pagestyle': 'fancyhdr',
    '\\setlist': 'enumitem',
    '\\titleformat': 'titlesec',
};

// ── Environment → Package mappings ───────────────────────────

const ENV_TO_PACKAGE: Record<string, string> = {
    'align': 'amsmath',
    'align*': 'amsmath',
    'gather': 'amsmath',
    'gather*': 'amsmath',
    'multline': 'amsmath',
    'multline*': 'amsmath',
    'split': 'amsmath',
    'aligned': 'amsmath',
    'cases': 'amsmath',
    'tikzpicture': 'tikz',
    'pgfplot': 'pgfplots',
    'lstlisting': 'listings',
    'minted': 'minted',
    'subfigure': 'subcaption',
    'multicols': 'multicol',
    'algorithm': 'algorithm2e',
    'algorithmic': 'algorithmicx',
};

// ── Rule-Based Fixer ─────────────────────────────────────────

/**
 * Attempt to generate a rule-based fix for the given error.
 * Returns null if no rule matches.
 */
export function generateRuleFix(
    error: LatexError,
    sourceLines: string[]
): FixSuggestion | null {
    switch (error.category) {
        case 'undefined_control_sequence':
            return fixUndefinedControlSequence(error, sourceLines);
        case 'missing_package':
            return fixMissingPackage(error, sourceLines);
        case 'unclosed_brace':
            return fixUnclosedBrace(error, sourceLines);
        case 'missing_math_delimiter':
            return fixMissingMathDelimiter(error, sourceLines);
        case 'unclosed_environment':
            return fixUnclosedEnvironment(error, sourceLines);
        case 'extra_brace':
            return fixExtraBrace(error, sourceLines);
        default:
            return null;
    }
}

// ── Individual Fix Rules ─────────────────────────────────────

function fixUndefinedControlSequence(
    error: LatexError,
    sourceLines: string[]
): FixSuggestion | null {
    const cmd = error.offendingText;
    if (!cmd) return null;

    // Check if there's a known package for this command
    const pkg = COMMAND_TO_PACKAGE[cmd];
    if (pkg) {
        // Check if the package is already imported
        const alreadyImported = sourceLines.some((l) =>
            l.match(new RegExp(`\\\\usepackage(\\[.*?\\])?\\{.*${pkg}.*\\}`))
        );

        if (!alreadyImported) {
            // Find the last \usepackage line to insert after
            let insertLine = 0;
            for (let i = 0; i < sourceLines.length; i++) {
                if (sourceLines[i].includes('\\usepackage')) {
                    insertLine = i + 1;
                }
                if (sourceLines[i].includes('\\begin{document}')) {
                    if (insertLine === 0) insertLine = i;
                    break;
                }
            }

            return {
                errorId: error.id,
                description: `Add \\usepackage{${pkg}} — provides ${cmd}`,
                type: 'rule',
                edit: {
                    action: 'insert_after',
                    line: Math.max(1, insertLine),
                    newText: `\\usepackage{${pkg}}`,
                },
                confidence: 0.95,
            };
        }
    }

    // Check for common typos
    const typoFix = findTypoFix(cmd);
    if (typoFix && error.line) {
        const sourceLine = sourceLines[error.line - 1];
        if (sourceLine) {
            return {
                errorId: error.id,
                description: `Fix typo: ${cmd} → ${typoFix}`,
                type: 'rule',
                edit: {
                    action: 'replace_line',
                    line: error.line,
                    newText: sourceLine.replace(cmd, typoFix),
                    originalText: sourceLine,
                },
                confidence: 0.8,
            };
        }
    }

    return null;
}

function fixMissingPackage(
    error: LatexError,
    sourceLines: string[]
): FixSuggestion | null {
    const pkg = error.offendingText;
    if (!pkg) return null;

    let insertLine = 0;
    for (let i = 0; i < sourceLines.length; i++) {
        if (sourceLines[i].includes('\\usepackage')) insertLine = i + 1;
        if (sourceLines[i].includes('\\begin{document}')) {
            if (insertLine === 0) insertLine = i;
            break;
        }
    }

    return {
        errorId: error.id,
        description: `Add \\usepackage{${pkg}}`,
        type: 'rule',
        edit: {
            action: 'insert_after',
            line: Math.max(1, insertLine),
            newText: `\\usepackage{${pkg}}`,
        },
        confidence: 0.9,
    };
}

function fixUnclosedBrace(
    error: LatexError,
    sourceLines: string[]
): FixSuggestion | null {
    if (!error.line) return null;

    const line = sourceLines[error.line - 1];
    if (!line) return null;

    // Count braces on the error line
    let opens = 0;
    let closes = 0;
    for (const ch of line) {
        if (ch === '{') opens++;
        if (ch === '}') closes++;
    }

    if (opens > closes) {
        return {
            errorId: error.id,
            description: `Add missing closing brace on line ${error.line}`,
            type: 'rule',
            edit: {
                action: 'replace_line',
                line: error.line,
                newText: line + '}',
                originalText: line,
            },
            confidence: 0.7,
        };
    }

    return null;
}

function fixMissingMathDelimiter(
    error: LatexError,
    sourceLines: string[]
): FixSuggestion | null {
    if (!error.line) return null;

    const line = sourceLines[error.line - 1];
    if (!line) return null;

    // Check for common math symbols used outside math mode
    const mathSymbols = ['_', '^', '\\alpha', '\\beta', '\\gamma', '\\delta',
        '\\sum', '\\int', '\\frac', '\\sqrt', '\\infty', '\\pi',
        '\\theta', '\\lambda', '\\mu', '\\sigma', '\\omega'];

    for (const sym of mathSymbols) {
        const idx = line.indexOf(sym);
        if (idx >= 0) {
            // Check if already in math mode
            const before = line.slice(0, idx);
            const dollarCount = (before.match(/\$/g) || []).length;
            if (dollarCount % 2 === 0) {
                // Not in math mode — wrap the symbol
                // Find the extent of the math expression
                const rest = line.slice(idx);
                const endMatch = rest.match(/^(\\?[a-zA-Z]+(?:\{[^}]*\})?(?:\^|_)?(?:\{[^}]*\})?)/);
                const mathExpr = endMatch ? endMatch[1] : sym;

                return {
                    errorId: error.id,
                    description: `Wrap "${mathExpr}" in math mode ($...$)`,
                    type: 'rule',
                    edit: {
                        action: 'replace_line',
                        line: error.line,
                        newText: line.slice(0, idx) + '$' + mathExpr + '$' + line.slice(idx + mathExpr.length),
                        originalText: line,
                    },
                    confidence: 0.75,
                };
            }
        }
    }

    return null;
}

function fixUnclosedEnvironment(
    error: LatexError,
    sourceLines: string[]
): FixSuggestion | null {
    if (!error.offendingText) return null;

    const envMatch = error.offendingText.match(/\\(?:begin|end)\{([^}]+)\}/);
    if (!envMatch) return null;

    const envName = envMatch[1];

    // Count \begin{env} and \end{env} occurrences
    let beginCount = 0;
    let endCount = 0;
    let lastBeginLine = 0;
    let lastEndLine = 0;

    for (let i = 0; i < sourceLines.length; i++) {
        if (sourceLines[i].includes(`\\begin{${envName}}`)) {
            beginCount++;
            lastBeginLine = i + 1;
        }
        if (sourceLines[i].includes(`\\end{${envName}}`)) {
            endCount++;
            lastEndLine = i + 1;
        }
    }

    if (beginCount > endCount) {
        // Missing \end{env} — insert after the last \begin or at end of document
        const insertAfter = error.line || lastBeginLine || sourceLines.length;
        return {
            errorId: error.id,
            description: `Add missing \\end{${envName}}`,
            type: 'rule',
            edit: {
                action: 'insert_after',
                line: insertAfter,
                newText: `\\end{${envName}}`,
            },
            confidence: 0.8,
        };
    } else if (endCount > beginCount) {
        // Extra \end{env} — insert \begin before the first orphan \end
        const insertBefore = error.line || lastEndLine || 1;
        return {
            errorId: error.id,
            description: `Add missing \\begin{${envName}}`,
            type: 'rule',
            edit: {
                action: 'insert_before',
                line: insertBefore,
                newText: `\\begin{${envName}}`,
            },
            confidence: 0.7,
        };
    }

    return null;
}

function fixExtraBrace(
    error: LatexError,
    sourceLines: string[]
): FixSuggestion | null {
    if (!error.line) return null;

    const line = sourceLines[error.line - 1];
    if (!line) return null;

    // Find and remove an extra closing brace
    let opens = 0;
    let closes = 0;
    let extraBraceIdx = -1;

    for (let i = 0; i < line.length; i++) {
        if (line[i] === '{') opens++;
        if (line[i] === '}') {
            closes++;
            if (closes > opens) {
                extraBraceIdx = i;
                break;
            }
        }
    }

    if (extraBraceIdx >= 0) {
        const newLine = line.slice(0, extraBraceIdx) + line.slice(extraBraceIdx + 1);
        return {
            errorId: error.id,
            description: `Remove extra } on line ${error.line}`,
            type: 'rule',
            edit: {
                action: 'replace_line',
                line: error.line,
                newText: newLine,
                originalText: line,
            },
            confidence: 0.75,
        };
    }

    return null;
}

// ── Common Typo Database ─────────────────────────────────────

const COMMON_TYPOS: Record<string, string> = {
    '\\begn': '\\begin',
    '\\ens': '\\end',
    '\\sectino': '\\section',
    '\\subsectino': '\\subsection',
    '\\itm': '\\item',
    '\\textbf{': '\\textbf{',
    '\\texitit': '\\textit',
    '\\texti': '\\textit',
    '\\textbb': '\\textbf',
    '\\emhp': '\\emph',
    '\\newpagee': '\\newpage',
    '\\usepackge': '\\usepackage',
    '\\documentclas': '\\documentclass',
    '\\incldue': '\\include',
    '\\inlcude': '\\include',
    '\\includegraphic': '\\includegraphics',
    '\\lable': '\\label',
    '\\capton': '\\caption',
    '\\rerf': '\\ref',
    '\\ceite': '\\cite',
    '\\bibilography': '\\bibliography',
};

function findTypoFix(cmd: string): string | null {
    const direct = COMMON_TYPOS[cmd];
    if (direct) return direct;

    // Try Levenshtein distance 1 against common commands
    const commonCommands = [
        '\\begin', '\\end', '\\section', '\\subsection', '\\subsubsection',
        '\\item', '\\textbf', '\\textit', '\\emph', '\\newpage',
        '\\usepackage', '\\documentclass', '\\include', '\\input',
        '\\includegraphics', '\\label', '\\caption', '\\ref', '\\cite',
        '\\bibliography', '\\footnote', '\\chapter', '\\paragraph',
        '\\author', '\\title', '\\date', '\\maketitle', '\\tableofcontents',
    ];

    for (const correct of commonCommands) {
        if (levenshtein(cmd, correct) === 1) {
            return correct;
        }
    }

    return null;
}

function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }

    return dp[m][n];
}

// ── AI-Powered Fix (Fallback) ────────────────────────────────

/**
 * Use AI to suggest a fix for errors that have no rule-based solution.
 * Premium-only — requires OpenRouter API key.
 */
export async function generateAIFix(
    error: LatexError,
    sourceLines: string[],
    apiKey: string
): Promise<FixSuggestion | null> {
    const errorLine = error.line || 1;
    const contextStart = Math.max(0, errorLine - 5);
    const contextEnd = Math.min(sourceLines.length, errorLine + 5);
    const contextLines = sourceLines.slice(contextStart, contextEnd);

    const contextWithNumbers = contextLines
        .map((l, i) => `${contextStart + i + 1}: ${l}`)
        .join('\n');

    try {
        const result = await callAI(
            {
                action: 'rewrite',
                prefix: `The following LaTeX code has an error:\n\nError: ${error.message}\nLine ${error.line || '?'}: ${error.rawLog}\n\nCode context:\n${contextWithNumbers}\n\n`,
                suffix: '',
                selection: sourceLines[errorLine - 1] || '',
                rewriteMode: 'formalise',
            },
            apiKey
        );

        if (!result.text || result.text.trim().length === 0) {
            return null;
        }

        return {
            errorId: error.id,
            description: `AI fix: ${error.message}`,
            type: 'ai',
            edit: {
                action: 'replace_line',
                line: errorLine,
                newText: result.text.split('\n')[0], // Use first line of AI output
                originalText: sourceLines[errorLine - 1],
            },
            confidence: 0.5,
        };
    } catch {
        return null;
    }
}
