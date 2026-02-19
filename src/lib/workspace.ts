// ─────────────────────────────────────────────────────────────
// LaTeXForge — Workspace Template Scaffolding
// ─────────────────────────────────────────────────────────────
// Creates the initial file structure for different project
// templates. The "scientific" template sets up /figures, /data,
// /sections with a pre-wired main.tex that includes
// \graphicspath and \input directives.
// ─────────────────────────────────────────────────────────────

import { SupabaseClient } from '@supabase/supabase-js';
import type { WorkspaceTemplate } from '@/types';

interface ScaffoldFile {
    path: string;
    content: string;
    is_entrypoint: boolean;
}

// ── Template Definitions ─────────────────────────────────────

const SCIENTIFIC_PREAMBLE = `% ─────────────────────────────────────────────────────
% Preamble — shared packages and macros
% ─────────────────────────────────────────────────────

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage{cleveref}
\\usepackage[margin=1in]{geometry}
\\usepackage{xcolor}
\\usepackage{listings}
\\usepackage{caption}
\\usepackage{subcaption}
\\usepackage[backend=biber,style=numeric,sorting=nyt]{biblatex}

% Graphics path — ensures \\includegraphics resolves
\\graphicspath{{./figures/}}

% Bibliography
\\addbibresource{references.bib}

% Custom commands
\\newcommand{\\figref}[1]{Figure~\\ref{fig:#1}}
\\newcommand{\\tabref}[1]{Table~\\ref{tab:#1}}
\\newcommand{\\eqref}[1]{Equation~\\ref{eq:#1}}
`;

const SCIENTIFIC_MAIN = `\\documentclass[12pt,a4paper]{article}

\\input{preamble}

\\title{Your Paper Title}
\\author{Author Name \\\\\\\\
  \\small Department of Computer Science \\\\\\\\
  \\small University Name \\\\\\\\
  \\small \\texttt{author@university.edu}
}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract goes here. This should be a concise summary of your
research, typically 150--250 words.
\\end{abstract}

\\tableofcontents
\\newpage

\\input{sections/introduction}
\\input{sections/methods}
\\input{sections/results}
\\input{sections/conclusion}

\\printbibliography

\\end{document}
`;

const SCIENTIFIC_INTRODUCTION = `\\section{Introduction}
\\label{sec:introduction}

Introduce the problem domain and motivate your research here.

% Example figure reference (upload an image to /figures first):
% \\begin{figure}[htbp]
%   \\centering
%   \\includegraphics[width=0.8\\textwidth]{example-image}
%   \\caption{Description of the figure.}
%   \\label{fig:example}
% \\end{figure}
`;

const SCIENTIFIC_METHODS = `\\section{Methods}
\\label{sec:methods}

Describe your methodology, experimental setup, and data processing pipeline.

% Example table:
% \\begin{table}[htbp]
%   \\centering
%   \\caption{Experimental parameters.}
%   \\label{tab:params}
%   \\begin{tabular}{lcc}
%     \\toprule
%     Parameter & Value & Unit \\\\\\\\
%     \\midrule
%     Learning rate & 0.001 & --- \\\\\\\\
%     Batch size    & 64    & --- \\\\\\\\
%     \\bottomrule
%   \\end{tabular}
% \\end{table}
`;

const SCIENTIFIC_RESULTS = `\\section{Results}
\\label{sec:results}

Present your findings with figures and tables.

% Reference data files from /data:
% Data was loaded from \\texttt{data/experiment\\_results.csv}.
`;

const SCIENTIFIC_CONCLUSION = `\\section{Conclusion}
\\label{sec:conclusion}

Summarize your findings and discuss future work.
`;

const SCIENTIFIC_REFERENCES = `% ─────────────────────────────────────────────────────
% Bibliography — references.bib
% ─────────────────────────────────────────────────────
% Add your references below in BibTeX format.

@article{example2024,
  author  = {Author, First and Coauthor, Second},
  title   = {An Example Paper Title},
  journal = {Journal of Examples},
  year    = {2024},
  volume  = {1},
  number  = {1},
  pages   = {1--10},
  doi     = {10.1234/example.2024}
}
`;

// ── Template Registry ────────────────────────────────────────

const TEMPLATES: Record<WorkspaceTemplate, ScaffoldFile[]> = {
    blank: [
        {
            path: 'main.tex',
            content: `\\documentclass[12pt]{article}\n\n\\begin{document}\n\nHello, LaTeX!\n\n\\end{document}\n`,
            is_entrypoint: true,
        },
    ],

    scientific: [
        { path: 'main.tex', content: SCIENTIFIC_MAIN, is_entrypoint: true },
        { path: 'preamble.tex', content: SCIENTIFIC_PREAMBLE, is_entrypoint: false },
        { path: 'sections/introduction.tex', content: SCIENTIFIC_INTRODUCTION, is_entrypoint: false },
        { path: 'sections/methods.tex', content: SCIENTIFIC_METHODS, is_entrypoint: false },
        { path: 'sections/results.tex', content: SCIENTIFIC_RESULTS, is_entrypoint: false },
        { path: 'sections/conclusion.tex', content: SCIENTIFIC_CONCLUSION, is_entrypoint: false },
        { path: 'references.bib', content: SCIENTIFIC_REFERENCES, is_entrypoint: false },
        // Placeholder files to create the directory structure
        { path: 'figures/.gitkeep', content: '', is_entrypoint: false },
        { path: 'data/.gitkeep', content: '', is_entrypoint: false },
    ],

    thesis: [
        {
            path: 'main.tex',
            content: `\\documentclass[12pt,twoside]{report}

\\input{preamble}

\\title{Thesis Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Your thesis abstract.
\\end{abstract}

\\tableofcontents

\\input{sections/introduction}
\\input{sections/methods}
\\input{sections/results}
\\input{sections/conclusion}

\\printbibliography

\\end{document}
`,
            is_entrypoint: true,
        },
        { path: 'preamble.tex', content: SCIENTIFIC_PREAMBLE, is_entrypoint: false },
        { path: 'sections/introduction.tex', content: SCIENTIFIC_INTRODUCTION, is_entrypoint: false },
        { path: 'sections/methods.tex', content: SCIENTIFIC_METHODS, is_entrypoint: false },
        { path: 'sections/results.tex', content: SCIENTIFIC_RESULTS, is_entrypoint: false },
        { path: 'sections/conclusion.tex', content: SCIENTIFIC_CONCLUSION, is_entrypoint: false },
        { path: 'references.bib', content: SCIENTIFIC_REFERENCES, is_entrypoint: false },
        { path: 'figures/.gitkeep', content: '', is_entrypoint: false },
        { path: 'data/.gitkeep', content: '', is_entrypoint: false },
    ],

    presentation: [
        {
            path: 'main.tex',
            content: `\\documentclass{beamer}

\\usetheme{Madrid}
\\usecolortheme{default}

\\graphicspath{{./figures/}}

\\title{Presentation Title}
\\author{Author Name}
\\institute{University Name}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{Outline}
  \\tableofcontents
\\end{frame}

\\section{Introduction}
\\begin{frame}{Introduction}
  \\begin{itemize}
    \\item Point one
    \\item Point two
    \\item Point three
  \\end{itemize}
\\end{frame}

\\section{Conclusion}
\\begin{frame}{Conclusion}
  Thank you for your attention.
\\end{frame}

\\end{document}
`,
            is_entrypoint: true,
        },
        { path: 'figures/.gitkeep', content: '', is_entrypoint: false },
    ],

    letter: [
        {
            path: 'main.tex',
            content: `\\documentclass[12pt]{letter}

\\signature{Your Name}
\\address{Your Address \\\\\\\\ City, Country}

\\begin{document}

\\begin{letter}{Recipient Name \\\\\\\\ Recipient Address \\\\\\\\ City, Country}

\\opening{Dear Sir or Madam,}

Body of the letter goes here.

\\closing{Yours sincerely,}

\\end{letter}

\\end{document}
`,
            is_entrypoint: true,
        },
    ],
};

// ── Public API ───────────────────────────────────────────────

/**
 * Scaffold a project with the given template.
 * Creates all files in the project_files table.
 */
export async function scaffoldProject(
    supabase: SupabaseClient,
    projectId: string,
    template: WorkspaceTemplate
): Promise<{ files: ScaffoldFile[]; error: string | null }> {
    const templateFiles = TEMPLATES[template];

    if (!templateFiles || templateFiles.length === 0) {
        return { files: [], error: `Unknown template: ${template}` };
    }

    // Insert all template files into the DB
    const rows = templateFiles.map((f) => ({
        project_id: projectId,
        path: f.path,
        content: f.content,
        is_entrypoint: f.is_entrypoint,
    }));

    const { error } = await supabase
        .from('project_files')
        .insert(rows);

    if (error) {
        return { files: [], error: `Failed to scaffold project: ${error.message}` };
    }

    return { files: templateFiles, error: null };
}

/**
 * Get the list of virtual directories for a template.
 */
export function getTemplateDirectories(template: WorkspaceTemplate): string[] {
    switch (template) {
        case 'scientific':
        case 'thesis':
            return ['figures', 'data', 'sections'];
        case 'presentation':
            return ['figures'];
        default:
            return [];
    }
}

/**
 * Get available templates with descriptions.
 */
export function getAvailableTemplates(): Array<{
    id: WorkspaceTemplate;
    name: string;
    description: string;
    directories: string[];
}> {
    return [
        {
            id: 'blank',
            name: 'Blank Document',
            description: 'A minimal LaTeX document to start from scratch.',
            directories: [],
        },
        {
            id: 'scientific',
            name: 'Scientific Paper',
            description: 'Pre-structured paper with /figures, /data, /sections, biblatex, and preamble.',
            directories: ['figures', 'data', 'sections'],
        },
        {
            id: 'thesis',
            name: 'Thesis / Dissertation',
            description: 'Multi-chapter report class with full scientific workspace.',
            directories: ['figures', 'data', 'sections'],
        },
        {
            id: 'presentation',
            name: 'Beamer Presentation',
            description: 'Slide deck with the Madrid theme and figure support.',
            directories: ['figures'],
        },
        {
            id: 'letter',
            name: 'Formal Letter',
            description: 'Standard letter class for formal correspondence.',
            directories: [],
        },
    ];
}
