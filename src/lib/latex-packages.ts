// ─────────────────────────────────────────────────────────────
// LaTeXForge — Package Registry
// ─────────────────────────────────────────────────────────────
// Canonical list of toggleable LaTeX packages with metadata.
// Used by the Package Manager UI to populate the grid, and
// by the preamble updater to insert/remove \usepackage lines.
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

export interface PackageInfo {
    /** LaTeX package name (as used in \usepackage{...}) */
    name: string;
    /** Human-readable short description */
    description: string;
    /** Category for grouping in the UI */
    category: PackageCategory;
    /** Default options (e.g., "ruled,vlined" for algorithm2e) */
    defaultOptions?: string;
    /** Packages this depends on (auto-enabled) */
    requires?: string[];
    /** Example usage shown in the UI */
    example?: string;
    /** Whether this is commonly used (shown first) */
    popular?: boolean;
}

export type PackageCategory =
    | 'math'
    | 'physics'
    | 'chemistry'
    | 'plots'
    | 'tables'
    | 'algorithms'
    | 'typography'
    | 'references'
    | 'fonts'
    | 'utilities';

export const CATEGORY_LABELS: Record<PackageCategory, { label: string; icon: string }> = {
    math: { label: 'Mathematics', icon: '∑' },
    physics: { label: 'Physics & Units', icon: '⚛' },
    chemistry: { label: 'Chemistry', icon: '🧪' },
    plots: { label: 'Plots & Diagrams', icon: '📈' },
    tables: { label: 'Tables', icon: '📊' },
    algorithms: { label: 'Algorithms & Code', icon: '⚙️' },
    typography: { label: 'Typography & Layout', icon: '🔤' },
    references: { label: 'References', icon: '📎' },
    fonts: { label: 'Fonts', icon: '🅰️' },
    utilities: { label: 'Utilities', icon: '🔧' },
};

// ── Package Registry ─────────────────────────────────────────

export const PACKAGE_REGISTRY: PackageInfo[] = [
    // ── Mathematics ──────────────────────────────────────────
    { name: 'amsmath', category: 'math', description: 'Advanced math environments (align, equation*, gather)', popular: true, example: '\\begin{align} E &= mc^2 \\end{align}' },
    { name: 'amssymb', category: 'math', description: 'Extra math symbols (ℝ, ℕ, ∀, ∃)', popular: true, example: '\\mathbb{R}, \\forall x \\in \\mathbb{N}' },
    { name: 'mathtools', category: 'math', description: 'Extends amsmath with paired delimiters, cases*', requires: ['amsmath'], example: '\\DeclarePairedDelimiter{\\abs}{\\lvert}{\\rvert}' },
    { name: 'amsthm', category: 'math', description: 'Theorem environments (theorem, lemma, proof)', popular: true, example: '\\begin{theorem} ... \\end{theorem}' },
    { name: 'bm', category: 'math', description: 'Bold math symbols', example: '\\bm{\\alpha}' },

    // ── Physics & Units ──────────────────────────────────────
    { name: 'physics', category: 'physics', description: 'Dirac notation, derivatives, vectors', popular: true, example: '\\bra{\\psi} \\ket{\\phi}, \\dv{f}{x}' },
    { name: 'siunitx', category: 'physics', description: 'SI units and number formatting', popular: true, example: '\\SI{9.81}{\\meter\\per\\second\\squared}' },
    { name: 'braket', category: 'physics', description: 'Bra-ket notation for quantum mechanics', example: '\\Braket{\\phi | \\psi}' },
    { name: 'tensor', category: 'physics', description: 'Tensor index notation', example: '\\tensor{T}{^a_b^c}' },

    // ── Chemistry ────────────────────────────────────────────
    { name: 'mhchem', category: 'chemistry', description: 'Chemical formulae and equations', popular: true, example: '\\ce{H2O}, \\ce{CO2 + H2O -> H2CO3}' },
    { name: 'chemfig', category: 'chemistry', description: 'Draw chemical structures', example: '\\chemfig{H-C(-[2]H)(-[6]H)-H}' },
    { name: 'chemmacros', category: 'chemistry', description: 'IUPAC nomenclature and chemistry macros', requires: ['mhchem'] },
    { name: 'elements', category: 'chemistry', description: 'Periodic table data access', example: '\\elname{26} → Iron' },

    // ── Plots & Diagrams ─────────────────────────────────────
    { name: 'pgfplots', category: 'plots', description: 'Publication-quality plots and charts', popular: true, defaultOptions: undefined, requires: ['tikz'], example: '\\begin{axis} \\addplot {x^2}; \\end{axis}' },
    { name: 'tikz', category: 'plots', description: 'Programmatic vector graphics', popular: true, example: '\\begin{tikzpicture} \\draw (0,0) -- (1,1); \\end{tikzpicture}' },
    { name: 'pgfplotstable', category: 'plots', description: 'Typeset data tables from CSV files', requires: ['pgfplots'] },
    { name: 'tikz-3dplot', category: 'plots', description: '3D coordinate transformations for TikZ', requires: ['tikz'] },
    { name: 'forest', category: 'plots', description: 'Tree diagrams with easy syntax', requires: ['tikz'] },

    // ── Tables ───────────────────────────────────────────────
    { name: 'booktabs', category: 'tables', description: 'Professional table rules (\\toprule, \\midrule)', popular: true, example: '\\toprule ... \\midrule ... \\bottomrule' },
    { name: 'multirow', category: 'tables', description: 'Cells spanning multiple rows', example: '\\multirow{2}{*}{Text}' },
    { name: 'longtable', category: 'tables', description: 'Tables spanning multiple pages' },
    { name: 'makecell', category: 'tables', description: 'Multi-line cells and styled headers' },
    { name: 'tabularray', category: 'tables', description: 'Modern table package with key-value interface' },

    // ── Algorithms & Code ────────────────────────────────────
    { name: 'algorithm2e', category: 'algorithms', description: 'Pseudocode with KwIn, For, If', popular: true, defaultOptions: 'ruled,vlined', example: '\\begin{algorithm}[H] \\KwIn{data} \\end{algorithm}' },
    { name: 'listings', category: 'algorithms', description: 'Source code listings with syntax highlighting', popular: true, example: '\\begin{lstlisting}[language=Python] ... \\end{lstlisting}' },
    { name: 'minted', category: 'algorithms', description: 'Code highlighting via Pygments (requires -shell-escape)', example: '\\begin{minted}{python} ... \\end{minted}' },

    // ── Typography & Layout ──────────────────────────────────
    { name: 'microtype', category: 'typography', description: 'Micro-typographic refinements (kerning, tracking)', popular: true },
    { name: 'geometry', category: 'typography', description: 'Page margins and dimensions', popular: true, defaultOptions: 'margin=1in', example: '\\usepackage[margin=1in]{geometry}' },
    { name: 'fancyhdr', category: 'typography', description: 'Custom headers and footers', example: '\\fancyhead[L]{Title}' },
    { name: 'titlesec', category: 'typography', description: 'Customise section headings' },
    { name: 'enumitem', category: 'typography', description: 'Customise list environments', example: '\\begin{itemize}[nosep] ... \\end{itemize}' },
    { name: 'float', category: 'typography', description: 'Improved float placement [H]' },

    // ── References ───────────────────────────────────────────
    { name: 'hyperref', category: 'references', description: 'Clickable cross-references and URLs', popular: true },
    { name: 'cleveref', category: 'references', description: 'Smart cross-referencing (\\cref auto-detects type)', requires: ['hyperref'], example: '\\cref{fig:example} → "Figure 1"' },
    { name: 'biblatex', category: 'references', description: 'Modern bibliography management', popular: true, defaultOptions: 'backend=biber' },
    { name: 'natbib', category: 'references', description: 'Author-year citation styles' },

    // ── Fonts ────────────────────────────────────────────────
    { name: 'fontspec', category: 'fonts', description: 'OpenType/TrueType font selection (XeLaTeX/LuaLaTeX)' },
    { name: 'lmodern', category: 'fonts', description: 'Latin Modern fonts (scalable Computer Modern)', popular: true },
    { name: 'unicode-math', category: 'fonts', description: 'Unicode math fonts (requires XeLaTeX/LuaLaTeX)' },

    // ── Utilities ────────────────────────────────────────────
    { name: 'xcolor', category: 'utilities', description: 'Extended colour support', popular: true, example: '\\textcolor{blue}{text}' },
    { name: 'graphicx', category: 'utilities', description: 'Include images (\\includegraphics)', popular: true },
    { name: 'caption', category: 'utilities', description: 'Customise figure/table captions' },
    { name: 'subcaption', category: 'utilities', description: 'Sub-figures and sub-tables', requires: ['caption'] },
    { name: 'standalone', category: 'utilities', description: 'Compile sub-documents independently' },
];

// ── Preamble Utilities ───────────────────────────────────────

/**
 * Detect which packages are already in the preamble.
 */
export function detectEnabledPackages(source: string): string[] {
    const enabled: string[] = [];
    const regex = /\\usepackage(?:\[([^\]]*)\])?\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(source)) !== null) {
        // Handle comma-separated packages: \usepackage{amsmath,amssymb}
        const pkgList = match[2].split(',').map((p) => p.trim());
        enabled.push(...pkgList);
    }

    return enabled;
}

/**
 * Build a \usepackage line for a package.
 */
export function buildUsepackageLine(pkg: PackageInfo): string {
    if (pkg.defaultOptions) {
        return `\\usepackage[${pkg.defaultOptions}]{${pkg.name}}`;
    }
    return `\\usepackage{${pkg.name}}`;
}

/**
 * Insert a package into the preamble (before \begin{document}).
 */
export function addPackageToPreamble(source: string, pkg: PackageInfo): string {
    const line = buildUsepackageLine(pkg);

    // Check if already present
    if (isPackageInPreamble(source, pkg.name)) {
        return source;
    }

    // Find \begin{document} and insert before it
    const beginDocIdx = source.indexOf('\\begin{document}');
    if (beginDocIdx === -1) {
        // No \begin{document} — append at the end
        return source + '\n' + line;
    }

    // Find the line start of \begin{document}
    const beforeDoc = source.slice(0, beginDocIdx);
    const lastNewline = beforeDoc.lastIndexOf('\n');
    const insertPos = lastNewline === -1 ? beginDocIdx : lastNewline + 1;

    return source.slice(0, insertPos) + line + '\n' + source.slice(insertPos);
}

/**
 * Remove a package from the preamble.
 */
export function removePackageFromPreamble(source: string, packageName: string): string {
    // Match \usepackage[...]{name} or \usepackage{name}
    const escapedName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Single package on a line
    const singleRegex = new RegExp(
        `^[ \\t]*\\\\usepackage(?:\\[[^\\]]*\\])?\\{${escapedName}\\}[ \\t]*\\n?`,
        'gm'
    );

    let result = source.replace(singleRegex, '');

    // Package in a comma-separated list: \usepackage{a,name,b}
    // Remove from comma list
    const commaRegex = new RegExp(
        `(\\\\usepackage(?:\\[[^\\]]*\\])?\\{[^}]*),\\s*${escapedName}([^}]*\\})`,
        'g'
    );
    result = result.replace(commaRegex, '$1$2');

    // Package as first in comma list: \usepackage{name,b}
    const firstInListRegex = new RegExp(
        `(\\\\usepackage(?:\\[[^\\]]*\\])?\\{)${escapedName}\\s*,\\s*`,
        'g'
    );
    result = result.replace(firstInListRegex, '$1');

    return result;
}

/**
 * Check if a package is already in the preamble.
 */
export function isPackageInPreamble(source: string, packageName: string): boolean {
    const enabled = detectEnabledPackages(source);
    return enabled.includes(packageName);
}

/**
 * Toggle a package: add if not present, remove if present.
 * Also handles dependencies (adds requires, but does NOT remove deps).
 */
export function togglePackage(source: string, pkg: PackageInfo): { source: string; added: boolean } {
    if (isPackageInPreamble(source, pkg.name)) {
        return { source: removePackageFromPreamble(source, pkg.name), added: false };
    }

    let updated = source;

    // Add dependencies first
    if (pkg.requires) {
        for (const dep of pkg.requires) {
            const depInfo = PACKAGE_REGISTRY.find((p) => p.name === dep);
            if (depInfo && !isPackageInPreamble(updated, dep)) {
                updated = addPackageToPreamble(updated, depInfo);
            }
        }
    }

    updated = addPackageToPreamble(updated, pkg);
    return { source: updated, added: true };
}
