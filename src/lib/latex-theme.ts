// ─────────────────────────────────────────────────────────────
// LaTeXForge — LaTeX Editor Theme for Monaco
// ─────────────────────────────────────────────────────────────
// Premium dark theme inspired by One Dark Pro, tuned for LaTeX:
//   - Commands in vibrant blue
//   - Math in warm gold
//   - Environments in teal
//   - Sections in bold magenta
//   - Comments in muted gray
// ─────────────────────────────────────────────────────────────

import type * as Monaco from 'monaco-editor';

export const LATEX_THEME_DARK = 'latexforge-dark';
export const LATEX_THEME_LIGHT = 'latexforge-light';

export function registerLatexThemes(monaco: typeof Monaco): void {
    // ── Dark Theme ─────────────────────────────────────────────
    monaco.editor.defineTheme(LATEX_THEME_DARK, {
        base: 'vs-dark',
        inherit: true,
        rules: [
            // Comments
            { token: 'comment', foreground: '5C6370', fontStyle: 'italic' },

            // Commands
            { token: 'keyword', foreground: '61AFEF', fontStyle: 'bold' },
            { token: 'keyword.control', foreground: 'C678DD', fontStyle: 'bold' },
            { token: 'keyword.section', foreground: 'E06C75', fontStyle: 'bold' },
            { token: 'tag', foreground: '61AFEF' },

            // Math
            { token: 'string.math', foreground: 'E5C07B' },
            { token: 'support.function.math', foreground: 'D19A66', fontStyle: 'bold' },

            // Formatting
            { token: 'support.function.format', foreground: '56B6C2' },

            // Environments
            { token: 'type.environment', foreground: '98C379', fontStyle: 'bold' },

            // Delimiters
            { token: 'delimiter.curly', foreground: 'ABB2BF' },
            { token: 'delimiter.bracket', foreground: 'ABB2BF' },
            { token: 'delimiter.paren', foreground: 'ABB2BF' },

            // Other
            { token: 'variable.parameter', foreground: 'E06C75' },
            { token: 'constant.character.escape', foreground: '56B6C2' },
            { token: 'operator', foreground: 'C678DD' },
            { token: 'number', foreground: 'D19A66' },
        ],
        colors: {
            'editor.background': '#1E1E2E',
            'editor.foreground': '#CDD6F4',
            'editor.lineHighlightBackground': '#2A2B3D',
            'editor.selectionBackground': '#45475A',
            'editor.inactiveSelectionBackground': '#313244',
            'editorCursor.foreground': '#F5E0DC',
            'editorWhitespace.foreground': '#45475A',
            'editorIndentGuide.background': '#313244',
            'editorIndentGuide.activeBackground': '#45475A',
            'editorLineNumber.foreground': '#585B70',
            'editorLineNumber.activeForeground': '#CDD6F4',
            'editor.wordHighlightBackground': '#45475A80',
            'editorBracketMatch.background': '#45475A80',
            'editorBracketMatch.border': '#89B4FA',
            'editorGutter.background': '#1E1E2E',
            'minimap.background': '#181825',
            'scrollbar.shadow': '#00000040',
            'editorOverviewRuler.border': '#00000000',
        },
    });

    // ── Light Theme ────────────────────────────────────────────
    monaco.editor.defineTheme(LATEX_THEME_LIGHT, {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'comment', foreground: 'A0A1A7', fontStyle: 'italic' },
            { token: 'keyword', foreground: '4078F2', fontStyle: 'bold' },
            { token: 'keyword.control', foreground: 'A626A4', fontStyle: 'bold' },
            { token: 'keyword.section', foreground: 'E45649', fontStyle: 'bold' },
            { token: 'tag', foreground: '4078F2' },
            { token: 'string.math', foreground: 'C18401' },
            { token: 'support.function.math', foreground: '986801', fontStyle: 'bold' },
            { token: 'support.function.format', foreground: '0184BC' },
            { token: 'type.environment', foreground: '50A14F', fontStyle: 'bold' },
            { token: 'delimiter.curly', foreground: '383A42' },
            { token: 'delimiter.bracket', foreground: '383A42' },
            { token: 'delimiter.paren', foreground: '383A42' },
            { token: 'variable.parameter', foreground: 'E45649' },
            { token: 'constant.character.escape', foreground: '0184BC' },
            { token: 'operator', foreground: 'A626A4' },
            { token: 'number', foreground: '986801' },
        ],
        colors: {
            'editor.background': '#FAFAFA',
            'editor.foreground': '#383A42',
            'editor.lineHighlightBackground': '#F0F0F0',
            'editor.selectionBackground': '#C8D7F5',
            'editorCursor.foreground': '#526FFF',
            'editorLineNumber.foreground': '#9D9D9F',
            'editorLineNumber.activeForeground': '#383A42',
            'editorIndentGuide.background': '#E8E8E8',
            'editorBracketMatch.background': '#C8D7F580',
            'editorBracketMatch.border': '#4078F2',
        },
    });
}
