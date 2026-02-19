// ─────────────────────────────────────────────────────────────
// LaTeXForge — LaTeX Snippets & Completions for Monaco
// ─────────────────────────────────────────────────────────────
// Registers:
//   1. Snippet-based completions (triggered by typing)
//   2. Auto-closing \begin{env}...\end{env} pairs
//   3. Command palette actions for common LaTeX operations
// ─────────────────────────────────────────────────────────────

import type * as Monaco from 'monaco-editor';
import { LATEX_LANGUAGE_ID } from './latex-language';

// ── Snippet Definitions ──────────────────────────────────────

interface LatexSnippet {
    label: string;
    detail: string;
    documentation?: string;
    insertText: string;
    sortOrder: string;
    category: 'environment' | 'structure' | 'math' | 'formatting' | 'reference' | 'figure';
}

const LATEX_SNIPPETS: LatexSnippet[] = [
    // ── Environments ───────────────────────────────────────────
    {
        label: 'begin',
        detail: 'Environment block',
        documentation: 'Create a \\begin{...}...\\end{...} block',
        insertText: 'begin{${1:environment}}\n\t$0\n\\end{${1:environment}}',
        sortOrder: '0a',
        category: 'environment',
    },
    {
        label: 'figure',
        detail: 'Figure environment',
        insertText: 'begin{figure}[${1:htbp}]\n\t\\centering\n\t\\includegraphics[width=${2:0.8}\\textwidth]{${3:figures/image}}\n\t\\caption{${4:Caption}}\n\t\\label{fig:${5:label}}\n\\end{figure}',
        sortOrder: '0b',
        category: 'environment',
    },
    {
        label: 'table',
        detail: 'Table environment',
        insertText: 'begin{table}[${1:htbp}]\n\t\\centering\n\t\\caption{${2:Caption}}\n\t\\label{tab:${3:label}}\n\t\\begin{tabular}{${4:lcc}}\n\t\t\\toprule\n\t\t${5:Header 1} & ${6:Header 2} & ${7:Header 3} \\\\\\\\\n\t\t\\midrule\n\t\t$0 \\\\\\\\\n\t\t\\bottomrule\n\t\\end{tabular}\n\\end{table}',
        sortOrder: '0c',
        category: 'environment',
    },
    {
        label: 'equation',
        detail: 'Numbered equation',
        insertText: 'begin{equation}\n\t\\label{eq:${1:label}}\n\t${0}\n\\end{equation}',
        sortOrder: '0d',
        category: 'environment',
    },
    {
        label: 'align',
        detail: 'Aligned equations',
        insertText: 'begin{align}\n\t${1} &= ${2} \\\\\\\\\\label{eq:${3:label}}\n\t${0}\n\\end{align}',
        sortOrder: '0e',
        category: 'environment',
    },
    {
        label: 'itemize',
        detail: 'Bullet list',
        insertText: 'begin{itemize}\n\t\\item ${0}\n\\end{itemize}',
        sortOrder: '0f',
        category: 'environment',
    },
    {
        label: 'enumerate',
        detail: 'Numbered list',
        insertText: 'begin{enumerate}\n\t\\item ${0}\n\\end{enumerate}',
        sortOrder: '0g',
        category: 'environment',
    },
    {
        label: 'lstlisting',
        detail: 'Code listing',
        insertText: 'begin{lstlisting}[language=${1:Python}, caption=${2:Caption}]\n${0}\n\\end{lstlisting}',
        sortOrder: '0h',
        category: 'environment',
    },
    {
        label: 'minipage',
        detail: 'Minipage',
        insertText: 'begin{minipage}{${1:0.48}\\textwidth}\n\t${0}\n\\end{minipage}',
        sortOrder: '0i',
        category: 'environment',
    },

    // ── Structure ──────────────────────────────────────────────
    {
        label: 'section',
        detail: 'Section heading',
        insertText: 'section{${1:Title}}\n\\label{sec:${2:label}}\n\n${0}',
        sortOrder: '1a',
        category: 'structure',
    },
    {
        label: 'subsection',
        detail: 'Subsection heading',
        insertText: 'subsection{${1:Title}}\n\\label{sec:${2:label}}\n\n${0}',
        sortOrder: '1b',
        category: 'structure',
    },
    {
        label: 'subsubsection',
        detail: 'Subsubsection heading',
        insertText: 'subsubsection{${1:Title}}\n\n${0}',
        sortOrder: '1c',
        category: 'structure',
    },
    {
        label: 'chapter',
        detail: 'Chapter heading',
        insertText: 'chapter{${1:Title}}\n\\label{ch:${2:label}}\n\n${0}',
        sortOrder: '1d',
        category: 'structure',
    },

    // ── Math ───────────────────────────────────────────────────
    {
        label: 'frac',
        detail: 'Fraction',
        insertText: 'frac{${1:numerator}}{${2:denominator}}',
        sortOrder: '2a',
        category: 'math',
    },
    {
        label: 'sqrt',
        detail: 'Square root',
        insertText: 'sqrt{${1:expression}}',
        sortOrder: '2b',
        category: 'math',
    },
    {
        label: 'sum',
        detail: 'Summation',
        insertText: 'sum_{${1:i=1}}^{${2:n}} ${0}',
        sortOrder: '2c',
        category: 'math',
    },
    {
        label: 'int',
        detail: 'Integral',
        insertText: 'int_{${1:a}}^{${2:b}} ${3:f(x)} \\, d${4:x}',
        sortOrder: '2d',
        category: 'math',
    },
    {
        label: 'lim',
        detail: 'Limit',
        insertText: 'lim_{${1:x} \\to ${2:\\infty}} ${0}',
        sortOrder: '2e',
        category: 'math',
    },
    {
        label: 'matrix',
        detail: 'Matrix (pmatrix)',
        insertText: 'begin{pmatrix}\n\t${1:a} & ${2:b} \\\\\\\\\n\t${3:c} & ${4:d}\n\\end{pmatrix}',
        sortOrder: '2f',
        category: 'math',
    },

    // ── Formatting ─────────────────────────────────────────────
    {
        label: 'textbf',
        detail: 'Bold text',
        insertText: 'textbf{${1:text}}',
        sortOrder: '3a',
        category: 'formatting',
    },
    {
        label: 'textit',
        detail: 'Italic text',
        insertText: 'textit{${1:text}}',
        sortOrder: '3b',
        category: 'formatting',
    },
    {
        label: 'emph',
        detail: 'Emphasized text',
        insertText: 'emph{${1:text}}',
        sortOrder: '3c',
        category: 'formatting',
    },
    {
        label: 'texttt',
        detail: 'Monospace text',
        insertText: 'texttt{${1:text}}',
        sortOrder: '3d',
        category: 'formatting',
    },
    {
        label: 'footnote',
        detail: 'Footnote',
        insertText: 'footnote{${1:text}}',
        sortOrder: '3e',
        category: 'formatting',
    },

    // ── References ─────────────────────────────────────────────
    {
        label: 'ref',
        detail: 'Cross-reference',
        insertText: 'ref{${1:label}}',
        sortOrder: '4a',
        category: 'reference',
    },
    {
        label: 'cite',
        detail: 'Citation',
        insertText: 'cite{${1:key}}',
        sortOrder: '4b',
        category: 'reference',
    },
    {
        label: 'label',
        detail: 'Label',
        insertText: 'label{${1:label}}',
        sortOrder: '4c',
        category: 'reference',
    },
    {
        label: 'href',
        detail: 'Hyperlink',
        insertText: 'href{${1:url}}{${2:text}}',
        sortOrder: '4d',
        category: 'reference',
    },

    // ── Figures ────────────────────────────────────────────────
    {
        label: 'includegraphics',
        detail: 'Include image',
        insertText: 'includegraphics[width=${1:0.8}\\textwidth]{${2:figures/image}}',
        sortOrder: '5a',
        category: 'figure',
    },
    {
        label: 'graphicspath',
        detail: 'Set graphics path',
        insertText: 'graphicspath{{${1:./figures/}}}',
        sortOrder: '5b',
        category: 'figure',
    },
];

// Category icons for the suggestion widget
const CATEGORY_ICONS: Record<string, Monaco.languages.CompletionItemKind> = {
    environment: 7,   // Snippet
    structure: 14,    // Keyword
    math: 3,          // Function
    formatting: 4,    // Constructor
    reference: 17,    // Reference
    figure: 5,        // Field
};

// ── Registration ─────────────────────────────────────────────

/**
 * Register LaTeX snippet completions with Monaco.
 * Triggered when the user types '\'.
 */
export function registerLatexCompletions(monaco: typeof Monaco): Monaco.IDisposable {
    return monaco.languages.registerCompletionItemProvider(LATEX_LANGUAGE_ID, {
        triggerCharacters: ['\\'],

        provideCompletionItems(model, position): Monaco.languages.CompletionList {
            const word = model.getWordUntilPosition(position);
            const range: Monaco.IRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: position.column,
            };

            // Check if we have a backslash before the word
            const lineContent = model.getLineContent(position.lineNumber);
            const charBefore = lineContent.charAt(word.startColumn - 2);
            const hasBackslash = charBefore === '\\';

            const suggestions: Monaco.languages.CompletionItem[] = LATEX_SNIPPETS.map((snippet) => ({
                label: hasBackslash ? snippet.label : `\\${snippet.label}`,
                kind: CATEGORY_ICONS[snippet.category] || 15,
                detail: snippet.detail,
                documentation: snippet.documentation,
                insertText: snippet.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range,
                sortText: snippet.sortOrder,
            }));

            return { suggestions };
        },
    });
}

/**
 * Register auto-closing for \begin{env}...\end{env} pairs.
 * When the user types \begin{env} and presses Enter,
 * automatically insert \end{env} below.
 */
export function registerEnvironmentAutoClose(
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco
): Monaco.IDisposable {
    return editor.onDidChangeModelContent((e) => {
        for (const change of e.changes) {
            // Only process single-line insertions that end with }
            if (change.text === '}') {
                const model = editor.getModel();
                if (!model) continue;

                const line = model.getLineContent(change.range.startLineNumber);
                const match = line.match(/\\begin\{([^}]+)\}$/);

                if (match) {
                    const envName = match[1];
                    const lineNumber = change.range.startLineNumber;
                    const indent = line.match(/^(\s*)/)?.[1] || '';

                    // Insert \end{env} on a new line after a blank line
                    const endText = `\n${indent}\t\n${indent}\\end{${envName}}`;
                    const pos = { lineNumber, column: line.length + 1 };

                    // Use executeEdits to insert and position cursor
                    editor.executeEdits('auto-close-env', [
                        {
                            range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                            text: endText,
                            forceMoveMarkers: true,
                        },
                    ]);

                    // Move cursor to the empty line inside the environment
                    editor.setPosition({
                        lineNumber: lineNumber + 1,
                        column: indent.length + 2,
                    });
                }
            }
        }
    });
}

// ── Command Palette Actions ──────────────────────────────────

interface PaletteAction {
    id: string;
    label: string;
    keybinding?: number[];
    snippet: string;
}

const PALETTE_ACTIONS: PaletteAction[] = [
    {
        id: 'latex.insertBold',
        label: 'LaTeX: Bold Text',
        keybinding: undefined, // Will use monaco.KeyMod
        snippet: '\\textbf{${1:text}}',
    },
    {
        id: 'latex.insertItalic',
        label: 'LaTeX: Italic Text',
        snippet: '\\textit{${1:text}}',
    },
    {
        id: 'latex.insertSection',
        label: 'LaTeX: Insert Section',
        snippet: '\\section{${1:Title}}\n\\label{sec:${2:label}}\n\n',
    },
    {
        id: 'latex.insertFigure',
        label: 'LaTeX: Insert Figure',
        snippet: '\\begin{figure}[htbp]\n\t\\centering\n\t\\includegraphics[width=0.8\\textwidth]{${1:figures/image}}\n\t\\caption{${2:Caption}}\n\t\\label{fig:${3:label}}\n\\end{figure}\n',
    },
    {
        id: 'latex.insertTable',
        label: 'LaTeX: Insert Table',
        snippet: '\\begin{table}[htbp]\n\t\\centering\n\t\\caption{${1:Caption}}\n\t\\label{tab:${2:label}}\n\t\\begin{tabular}{${3:lcc}}\n\t\t\\toprule\n\t\t${4:Col 1} & ${5:Col 2} & ${6:Col 3} \\\\\\\\\n\t\t\\midrule\n\t\t \\\\\\\\\n\t\t\\bottomrule\n\t\\end{tabular}\n\\end{table}\n',
    },
    {
        id: 'latex.insertEquation',
        label: 'LaTeX: Insert Equation',
        snippet: '\\begin{equation}\n\t\\label{eq:${1:label}}\n\t${0}\n\\end{equation}\n',
    },
    {
        id: 'latex.insertInlineMath',
        label: 'LaTeX: Inline Math',
        snippet: '$${1:expression}$',
    },
    {
        id: 'latex.insertDisplayMath',
        label: 'LaTeX: Display Math',
        snippet: '\\[\n\t${0}\n\\]\n',
    },
    {
        id: 'latex.insertList',
        label: 'LaTeX: Insert Bullet List',
        snippet: '\\begin{itemize}\n\t\\item ${0}\n\\end{itemize}\n',
    },
    {
        id: 'latex.insertNumberedList',
        label: 'LaTeX: Insert Numbered List',
        snippet: '\\begin{enumerate}\n\t\\item ${0}\n\\end{enumerate}\n',
    },
    {
        id: 'latex.insertCitation',
        label: 'LaTeX: Insert Citation',
        snippet: '\\cite{${1:key}}',
    },
    {
        id: 'latex.insertRef',
        label: 'LaTeX: Insert Reference',
        snippet: '\\ref{${1:label}}',
    },
    {
        id: 'latex.wrapInEnvironment',
        label: 'LaTeX: Wrap in Environment',
        snippet: '\\begin{${1:environment}}\n\t${TM_SELECTED_TEXT}$0\n\\end{${1:environment}}',
    },
    {
        id: 'latex.insertCodeListing',
        label: 'LaTeX: Insert Code Listing',
        snippet: '\\begin{lstlisting}[language=${1:Python}, caption=${2:Caption}]\n${0}\n\\end{lstlisting}\n',
    },
];

/**
 * Register command palette actions for common LaTeX operations.
 * Actions are accessible via Ctrl+Shift+P (Command Palette).
 */
export function registerPaletteActions(
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco
): Monaco.IDisposable[] {
    const disposables: Monaco.IDisposable[] = [];

    for (const action of PALETTE_ACTIONS) {
        disposables.push(
            editor.addAction({
                id: action.id,
                label: action.label,
                keybindings: action.keybinding,
                contextMenuGroupId: 'latex',
                contextMenuOrder: 1,

                run(ed) {
                    const selection = ed.getSelection();
                    if (!selection) return;

                    // Use snippet insertion for proper tab stops
                    const contribution = ed.getContribution<
                        Monaco.editor.IEditorContribution & {
                            insert: (template: string) => void;
                        }
                    >('snippetController2');

                    if (contribution && 'insert' in contribution) {
                        contribution.insert(action.snippet);
                    } else {
                        // Fallback: plain text insertion
                        const plainText = action.snippet
                            .replace(/\$\{?\d+:?([^}]*)\}?/g, '$1')
                            .replace(/\$0/g, '');

                        ed.executeEdits('palette-action', [
                            {
                                range: selection,
                                text: plainText,
                                forceMoveMarkers: true,
                            },
                        ]);
                    }
                },
            })
        );
    }

    // ── Keybindings ──────────────────────────────────────────────
    // Ctrl/Cmd + B → Bold
    disposables.push(
        editor.addAction({
            id: 'latex.bold.shortcut',
            label: 'LaTeX: Bold',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
            run(ed) {
                const sel = ed.getSelection();
                if (!sel) return;
                const selectedText = ed.getModel()?.getValueInRange(sel) || '';
                ed.executeEdits('bold', [{
                    range: sel,
                    text: `\\textbf{${selectedText || 'text'}}`,
                    forceMoveMarkers: true,
                }]);
            },
        })
    );

    // Ctrl/Cmd + I → Italic
    disposables.push(
        editor.addAction({
            id: 'latex.italic.shortcut',
            label: 'LaTeX: Italic',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
            run(ed) {
                const sel = ed.getSelection();
                if (!sel) return;
                const selectedText = ed.getModel()?.getValueInRange(sel) || '';
                ed.executeEdits('italic', [{
                    range: sel,
                    text: `\\textit{${selectedText || 'text'}}`,
                    forceMoveMarkers: true,
                }]);
            },
        })
    );

    // Ctrl/Cmd + M → Inline math
    disposables.push(
        editor.addAction({
            id: 'latex.inlineMath.shortcut',
            label: 'LaTeX: Inline Math',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM],
            run(ed) {
                const sel = ed.getSelection();
                if (!sel) return;
                const selectedText = ed.getModel()?.getValueInRange(sel) || '';
                ed.executeEdits('math', [{
                    range: sel,
                    text: `$${selectedText || 'expression'}$`,
                    forceMoveMarkers: true,
                }]);
            },
        })
    );

    return disposables;
}
