import type { languages } from "monaco-editor";

export const LATEX_LANGUAGE_ID = "latex";

export const latexLanguageConfig: languages.LanguageConfiguration = {
    comments: {
        lineComment: "%",
    },
    brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
    ],
    autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "$", close: "$" },
        { open: "`", close: "'" },
    ],
    surroundingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "$", close: "$" },
    ],
    folding: {
        markers: {
            start: /\\begin\{/,
            end: /\\end\{/,
        },
    },
};

export const latexTokensProvider: languages.IMonarchLanguage = {
    defaultToken: "",
    tokenPostfix: ".latex",

    brackets: [
        { open: "{", close: "}", token: "delimiter.curly" },
        { open: "[", close: "]", token: "delimiter.bracket" },
        { open: "(", close: ")", token: "delimiter.parenthesis" },
    ],

    keywords:
        "documentclass|usepackage|begin|end|newcommand|renewcommand|newenvironment|input|include|includegraphics|bibliography|bibliographystyle",

    sectionings:
        "part|chapter|section|subsection|subsubsection|paragraph|subparagraph",

    formatting:
        "textbf|textit|texttt|textrm|textsf|textsc|emph|underline",

    tokenizer: {
        root: [
            // Comments
            [/%.*$/, "comment"],

            // Math mode (display)
            [/\\\[/, { token: "keyword.math", next: "@mathDisplay" }],
            [/\$\$/, { token: "keyword.math", next: "@mathDisplay2" }],

            // Math mode (inline)
            [/\$/, { token: "keyword.math", next: "@mathInline" }],

            // Commands with arguments
            [
                /\\(@sectionings)\b/,
                "keyword.section",
            ],
            [
                /\\(@keywords)\b/,
                "keyword",
            ],
            [
                /\\(@formatting)\b/,
                "keyword.formatting",
            ],
            [/\\[a-zA-Z@]+/, "keyword.command"],
            [/\\[^a-zA-Z]/, "keyword.escape"],

            // Braces
            [/[{}]/, "delimiter.curly"],
            [/[\[\]]/, "delimiter.bracket"],
            [/[()]/, "delimiter.parenthesis"],

            // Numbers
            [/\d+/, "number"],
        ],

        mathInline: [
            [/[^$\\]+/, "string.math"],
            [/\\[a-zA-Z]+/, "keyword.math-command"],
            [/\\[^a-zA-Z]/, "keyword.escape"],
            [/\$/, { token: "keyword.math", next: "@pop" }],
        ],

        mathDisplay: [
            [/[^\]\\]+/, "string.math"],
            [/\\[a-zA-Z]+/, "keyword.math-command"],
            [/\\[^a-zA-Z]/, "keyword.escape"],
            [/\\\]/, { token: "keyword.math", next: "@pop" }],
        ],

        mathDisplay2: [
            [/[^$\\]+/, "string.math"],
            [/\\[a-zA-Z]+/, "keyword.math-command"],
            [/\\[^a-zA-Z]/, "keyword.escape"],
            [/\$\$/, { token: "keyword.math", next: "@pop" }],
        ],
    },
};

/**
 * LaTeX snippet completions for common structures
 */
export const latexSnippets = [
    {
        label: "\\begin{environment}",
        insertText: "\\begin{${1:environment}}\n\t$0\n\\end{${1:environment}}",
        documentation: "Insert a LaTeX environment",
    },
    {
        label: "\\frac{}{}",
        insertText: "\\frac{${1:numerator}}{${2:denominator}}",
        documentation: "Insert a fraction",
    },
    {
        label: "\\section{}",
        insertText: "\\section{${1:title}}",
        documentation: "Insert a section heading",
    },
    {
        label: "\\subsection{}",
        insertText: "\\subsection{${1:title}}",
        documentation: "Insert a subsection heading",
    },
    {
        label: "\\textbf{}",
        insertText: "\\textbf{${1:text}}",
        documentation: "Bold text",
    },
    {
        label: "\\textit{}",
        insertText: "\\textit{${1:text}}",
        documentation: "Italic text",
    },
    {
        label: "\\cite{}",
        insertText: "\\cite{${1:key}}",
        documentation: "Citation",
    },
    {
        label: "\\ref{}",
        insertText: "\\ref{${1:label}}",
        documentation: "Cross-reference",
    },
    {
        label: "\\label{}",
        insertText: "\\label{${1:label}}",
        documentation: "Label for cross-reference",
    },
    {
        label: "itemize",
        insertText: "\\begin{itemize}\n\t\\item ${1:item}\n\\end{itemize}",
        documentation: "Bullet list",
    },
    {
        label: "enumerate",
        insertText: "\\begin{enumerate}\n\t\\item ${1:item}\n\\end{enumerate}",
        documentation: "Numbered list",
    },
    {
        label: "figure",
        insertText:
            '\\begin{figure}[${1:htbp}]\n\t\\centering\n\t\\includegraphics[width=${2:0.8}\\textwidth]{${3:image}}\n\t\\caption{${4:caption}}\n\t\\label{fig:${5:label}}\n\\end{figure}',
        documentation: "Figure environment",
    },
    {
        label: "table",
        insertText:
            "\\begin{table}[${1:htbp}]\n\t\\centering\n\t\\begin{tabular}{${2:c|c}}\n\t\t\\hline\n\t\t${3:A & B} \\\\\\\\\n\t\t\\hline\n\t\\end{tabular}\n\t\\caption{${4:caption}}\n\t\\label{tab:${5:label}}\n\\end{table}",
        documentation: "Table environment",
    },
    {
        label: "equation",
        insertText: "\\begin{equation}\n\t${1:equation}\n\t\\label{eq:${2:label}}\n\\end{equation}",
        documentation: "Numbered equation",
    },
    {
        label: "align",
        insertText: "\\begin{align}\n\t${1:equation} &= ${2:result}\n\\end{align}",
        documentation: "Aligned equations",
    },
];
