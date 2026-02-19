// ─────────────────────────────────────────────────────────────
// LaTeXForge — LaTeX Language Definition for Monaco Editor
// ─────────────────────────────────────────────────────────────
// Registers a custom 'latex' language with:
//   - Monarch tokenizer for syntax highlighting
//   - Language configuration (brackets, auto-closing, comments)
//   - Folding rules for \begin{...}\end{...} blocks
// ─────────────────────────────────────────────────────────────

import type * as Monaco from 'monaco-editor';

export const LATEX_LANGUAGE_ID = 'latex';

/**
 * Register the LaTeX language definition with Monaco.
 * Call this once during editor initialization.
 */
export function registerLatexLanguage(monaco: typeof Monaco): void {
    // Skip if already registered
    if (monaco.languages.getLanguages().some((l) => l.id === LATEX_LANGUAGE_ID)) {
        return;
    }

    // ── Register language ID ─────────────────────────────────────
    monaco.languages.register({
        id: LATEX_LANGUAGE_ID,
        extensions: ['.tex', '.sty', '.cls', '.bib', '.bbl', '.dtx', '.ins'],
        aliases: ['LaTeX', 'latex', 'tex'],
        mimetypes: ['text/x-latex', 'application/x-latex'],
    });

    // ── Language Configuration ───────────────────────────────────
    monaco.languages.setLanguageConfiguration(LATEX_LANGUAGE_ID, {
        comments: {
            lineComment: '%',
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '$', close: '$' },
            { open: '`', close: "'" },
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '$', close: '$' },
            { open: '`', close: "'" },
            { open: '"', close: '"' },
        ],
        folding: {
            markers: {
                start: /\\begin\{/,
                end: /\\end\{/,
            },
        },
        indentationRules: {
            increaseIndentPattern: /\\begin\{(?!document)/,
            decreaseIndentPattern: /\\end\{(?!document)/,
        },
        wordPattern: /\\?[a-zA-Z@]+\*?|[^\s\\{}[\]$%&~#^]+/,
        onEnterRules: [
            // After \begin{env}, indent and prepare \end{env}
            {
                beforeText: /\\begin\{([^}]*)\}.*$/,
                action: {
                    indentAction: monaco.languages.IndentAction.Indent,
                },
            },
            // After \item, maintain indent
            {
                beforeText: /^\s*\\item/,
                action: {
                    indentAction: monaco.languages.IndentAction.None,
                },
            },
        ],
    });

    // ── Monarch Tokenizer ────────────────────────────────────────
    monaco.languages.setMonarchTokensProvider(LATEX_LANGUAGE_ID, {
        defaultToken: '',
        tokenPostfix: '.latex',

        brackets: [
            { open: '{', close: '}', token: 'delimiter.curly' },
            { open: '[', close: ']', token: 'delimiter.bracket' },
            { open: '(', close: ')', token: 'delimiter.paren' },
        ],

        // Common LaTeX commands grouped by category
        keywords: [
            'documentclass', 'usepackage', 'begin', 'end',
            'newcommand', 'renewcommand', 'newenvironment',
            'input', 'include', 'includegraphics',
            'label', 'ref', 'cite', 'bibliography',
            'title', 'author', 'date', 'maketitle',
            'tableofcontents', 'listoffigures', 'listoftables',
            'appendix', 'printbibliography',
        ],

        sectionCommands: [
            'part', 'chapter', 'section', 'subsection',
            'subsubsection', 'paragraph', 'subparagraph',
        ],

        mathCommands: [
            'frac', 'sqrt', 'sum', 'prod', 'int', 'oint',
            'lim', 'inf', 'sup', 'max', 'min',
            'sin', 'cos', 'tan', 'log', 'ln', 'exp',
            'alpha', 'beta', 'gamma', 'delta', 'epsilon',
            'theta', 'lambda', 'mu', 'pi', 'sigma', 'omega',
            'infty', 'partial', 'nabla', 'forall', 'exists',
            'mathbb', 'mathcal', 'mathbf', 'mathrm', 'mathit',
            'left', 'right', 'bigl', 'bigr',
            'text', 'textrm', 'textbf', 'textit',
        ],

        formatCommands: [
            'textbf', 'textit', 'texttt', 'textsf', 'textsc',
            'emph', 'underline', 'overline',
            'tiny', 'small', 'normalsize', 'large', 'Large',
            'LARGE', 'huge', 'Huge',
            'centering', 'raggedright', 'raggedleft',
            'bfseries', 'itshape', 'ttfamily',
        ],

        environments: [
            'document', 'figure', 'table', 'equation', 'align',
            'itemize', 'enumerate', 'description',
            'abstract', 'verbatim', 'lstlisting',
            'tabular', 'array', 'matrix', 'pmatrix', 'bmatrix',
            'theorem', 'proof', 'lemma', 'corollary', 'definition',
            'center', 'flushleft', 'flushright',
            'minipage', 'frame', 'block',
        ],

        tokenizer: {
            root: [
                // ── Comments ───────────────────────────────────────
                [/%.*$/, 'comment'],

                // ── Math modes ─────────────────────────────────────
                [/\$\$/, { token: 'string.math', next: '@displayMath' }],
                [/\$/, { token: 'string.math', next: '@inlineMath' }],
                [/\\\[/, { token: 'string.math', next: '@displayMathBracket' }],
                [/\\\(/, { token: 'string.math', next: '@inlineMathParen' }],

                // ── Section commands (special highlighting) ────────
                [
                    /\\(part|chapter|section|subsection|subsubsection|paragraph|subparagraph)\*?\s*/,
                    { token: 'keyword.section' },
                ],

                // ── \begin{env} and \end{env} ─────────────────────
                [/\\begin/, { token: 'keyword.control', next: '@envName' }],
                [/\\end/, { token: 'keyword.control', next: '@envName' }],

                // ── Known commands ─────────────────────────────────
                [
                    /\\([a-zA-Z@]+\*?)/,
                    {
                        cases: {
                            '@keywords': 'keyword',
                            '@mathCommands': 'support.function.math',
                            '@formatCommands': 'support.function.format',
                            '@default': 'tag',
                        },
                    },
                ],

                // ── Special characters ─────────────────────────────
                [/[&~]/, 'operator'],
                [/#\d/, 'variable.parameter'],
                [/\\[\\{}$&#%_^~]/, 'constant.character.escape'],

                // ── Braces ─────────────────────────────────────────
                [/[{}()\[\]]/, '@brackets'],

                // ── Numbers ────────────────────────────────────────
                [/\d+(\.\d+)?/, 'number'],
            ],

            // ── Inline math: $...$  ─────────────────────────────────
            inlineMath: [
                [/\$/, { token: 'string.math', next: '@pop' }],
                [/\\[a-zA-Z]+/, 'support.function.math'],
                [/[^$\\]+/, 'string.math'],
                [/./, 'string.math'],
            ],

            // ── Display math: $$...$$ ───────────────────────────────
            displayMath: [
                [/\$\$/, { token: 'string.math', next: '@pop' }],
                [/\\[a-zA-Z]+/, 'support.function.math'],
                [/[^$\\]+/, 'string.math'],
                [/./, 'string.math'],
            ],

            // ── Display math: \[...\] ───────────────────────────────
            displayMathBracket: [
                [/\\\]/, { token: 'string.math', next: '@pop' }],
                [/\\[a-zA-Z]+/, 'support.function.math'],
                [/[^\]\\]+/, 'string.math'],
                [/./, 'string.math'],
            ],

            // ── Inline math: \(...\) ────────────────────────────────
            inlineMathParen: [
                [/\\\)/, { token: 'string.math', next: '@pop' }],
                [/\\[a-zA-Z]+/, 'support.function.math'],
                [/[^)\\]+/, 'string.math'],
                [/./, 'string.math'],
            ],

            // ── Environment name after \begin / \end ────────────────
            envName: [
                [/\{/, { token: 'delimiter.curly' }],
                [
                    /([a-zA-Z*]+)/,
                    {
                        cases: {
                            '@environments': 'type.environment',
                            '@default': 'type.environment',
                        },
                    },
                ],
                [/\}/, { token: 'delimiter.curly', next: '@pop' }],
            ],
        },
    } as Monaco.languages.IMonarchLanguage);
}
