// ─────────────────────────────────────────────────────────────
// LaTeXForge — AI Snippet Generator Service
// ─────────────────────────────────────────────────────────────
// Uses OpenRouter (stepfun/step-3.5-flash:free) to generate
// complex LaTeX elements from natural language:
//   ✦ TikZ diagrams (neural networks, flowcharts, circuits)
//   ✦ Tables from CSV or descriptions
//   ✦ Mathematical environments (matrices, systems)
//   ✦ Algorithm pseudocode
//   ✦ Chemical structures, Gantt charts, plots
//
// All prompts enforce compilable LaTeX output — no markdown,
// no explanatory text, just insertable code.
// ─────────────────────────────────────────────────────────────

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'stepfun/step-3.5-flash:free';

// ── Types ────────────────────────────────────────────────────

export type SnippetType =
    | 'tikz'
    | 'table'
    | 'matrix'
    | 'algorithm'
    | 'plot'
    | 'diagram'
    | 'auto'; // auto-detect from prompt

export interface SnippetRequest {
    /** Natural language description */
    prompt: string;
    /** Hint for snippet type (auto-detected if not provided) */
    type?: SnippetType;
    /** Optional CSV data for table generation */
    csvData?: string;
    /** Optional packages already in the document preamble */
    existingPackages?: string[];
}

export interface SnippetResult {
    /** The generated LaTeX code */
    code: string;
    /** Packages required by this snippet */
    requiredPackages: string[];
    /** Type of snippet generated */
    type: SnippetType;
    /** Minimal compilable document for preview */
    previewDocument: string;
}

// ── Type Detection ───────────────────────────────────────────

const TYPE_KEYWORDS: Record<SnippetType, string[]> = {
    tikz: ['draw', 'diagram', 'flowchart', 'neural network', 'architecture',
        'circuit', 'graph', 'tree', 'automaton', 'state machine', 'tikz',
        'network', 'arrow', 'node', 'shape', 'connection'],
    table: ['table', 'csv', 'spreadsheet', 'row', 'column', 'grid',
        'data', 'comparison', 'list of', 'tabular'],
    matrix: ['matrix', 'determinant', 'linear system', 'augmented',
        'eigenvalue', 'vector', 'tensor'],
    algorithm: ['algorithm', 'pseudocode', 'procedure', 'function',
        'sort', 'search', 'loop', 'recursive'],
    plot: ['plot', 'graph data', 'histogram', 'bar chart', 'pie chart',
        'scatter', 'axis', 'coordinate', 'pgfplots', 'function plot'],
    diagram: ['gantt', 'timeline', 'sequence diagram', 'class diagram',
        'chemistry', 'molecule', 'org chart'],
    auto: [],
};

function detectSnippetType(prompt: string): SnippetType {
    const lower = prompt.toLowerCase();

    let bestType: SnippetType = 'tikz';
    let bestScore = 0;

    for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as [SnippetType, string[]][]) {
        if (type === 'auto') continue;
        let score = 0;
        for (const kw of keywords) {
            if (lower.includes(kw)) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestType = type;
        }
    }

    return bestType;
}

// ── System Prompts ───────────────────────────────────────────

const SYSTEM_BASE = `You are an expert LaTeX code generator. You produce ONLY compilable LaTeX code.

CRITICAL RULES:
1. Output ONLY the LaTeX code snippet — no markdown, no explanations, no comments about what you did.
2. Do NOT wrap output in code fences (\`\`\`). Output raw LaTeX only.
3. Every \\begin{...} MUST have a matching \\end{...}.
4. All brackets, braces, and delimiters must be balanced.
5. Use standard, widely-available LaTeX packages.
6. The code must compile with pdflatex/xelatex without errors.
7. Include descriptive LaTeX comments (%) inside the code where helpful.`;

const TYPE_PROMPTS: Record<SnippetType, string> = {
    tikz: `${SYSTEM_BASE}

Generate a TikZ diagram. Rules:
- Use \\begin{tikzpicture}...\\end{tikzpicture}
- Use clean, well-spaced node positioning
- Use colors from xcolor (blue!60, red!40, etc.)
- Add proper labels and annotations
- For neural networks: use layers of nodes with connections
- For flowcharts: use rectangles, diamonds, arrows
- Keep the diagram compact but readable`,

    table: `${SYSTEM_BASE}

Generate a LaTeX table. Rules:
- Use \\begin{table}[ht]...\\end{table} with \\centering
- Use booktabs (\\toprule, \\midrule, \\bottomrule) for professional styling
- Include \\caption{} and \\label{tab:xxx}
- If CSV data is provided, convert it exactly
- Align numeric columns right, text columns left
- Use \\multicolumn for merged headers if appropriate`,

    matrix: `${SYSTEM_BASE}

Generate a mathematical expression. Rules:
- Use appropriate math environments (equation, align, pmatrix, bmatrix)
- Use amsmath commands
- Include equation numbers via equation environment
- For systems of equations, use aligned or cases
- Add \\label{eq:xxx} for referencing`,

    algorithm: `${SYSTEM_BASE}

Generate algorithm pseudocode. Rules:
- Use \\begin{algorithm}[H]...\\end{algorithm} with algorithm2e package
- Include \\caption{} and \\label{alg:xxx}
- Use \\KwIn, \\KwOut, \\KwData for inputs/outputs
- Use \\For, \\While, \\If, \\ElseIf, \\Else for control flow
- Use proper indentation and formatting`,

    plot: `${SYSTEM_BASE}

Generate a pgfplots chart. Rules:
- Use \\begin{tikzpicture}\\begin{axis}[...]...\\end{axis}\\end{tikzpicture}
- Set axis labels, title, legend
- Use appropriate plot styles (line, bar, scatter)
- Include sample data points with \\addplot
- Use colors and markers for clarity
- Set reasonable axis limits`,

    diagram: `${SYSTEM_BASE}

Generate a diagram using TikZ or a specialized package. Rules:
- Choose the most appropriate LaTeX package for the diagram type
- For Gantt charts: use pgfgantt
- For chemistry: use chemfig
- Use clean layout and professional styling
- Add labels and annotations`,

    auto: SYSTEM_BASE,
};

// ── Package Detection ────────────────────────────────────────

const PACKAGE_PATTERNS: [RegExp, string][] = [
    [/\\begin\{tikzpicture\}/, 'tikz'],
    [/\\begin\{axis\}/, 'pgfplots'],
    [/\\toprule|\\midrule|\\bottomrule/, 'booktabs'],
    [/\\multirow/, 'multirow'],
    [/\\begin\{algorithm\}/, 'algorithm2e'],
    [/\\begin\{align/, 'amsmath'],
    [/\\begin\{equation/, 'amsmath'],
    [/\\mathbb|\\mathfrak/, 'amssymb'],
    [/\\textcolor|\\definecolor|\\rowcolors/, 'xcolor'],
    [/\\includegraphics/, 'graphicx'],
    [/\\begin\{ganttchart\}/, 'pgfgantt'],
    [/\\chemfig/, 'chemfig'],
    [/\\begin\{forest\}/, 'forest'],
    [/\\usetikzlibrary/, 'tikz'],
    [/\\pgfplotstableread/, 'pgfplotstable'],
    [/\\SI\{|\\si\{|\\num\{/, 'siunitx'],
    [/\\subcaption|\\subfigure/, 'subcaption'],
    [/\\lstinline|\\begin\{lstlisting\}/, 'listings'],
];

function detectRequiredPackages(code: string): string[] {
    const packages = new Set<string>();

    for (const [pattern, pkg] of PACKAGE_PATTERNS) {
        if (pattern.test(code)) {
            packages.add(pkg);
        }
    }

    // tikz implies xcolor
    if (packages.has('tikz')) {
        packages.add('xcolor');
    }

    // pgfplots implies tikz
    if (packages.has('pgfplots')) {
        packages.add('tikz');
    }

    return Array.from(packages);
}

// ── Preview Document Builder ────────────────────────────────

function buildPreviewDocument(code: string, packages: string[]): string {
    const usepackages = packages
        .map((p) => {
            if (p === 'pgfplots') return '\\usepackage{pgfplots}\n\\pgfplotsset{compat=1.18}';
            if (p === 'tikz') return '\\usepackage{tikz}';
            if (p === 'algorithm2e') return '\\usepackage[ruled,vlined]{algorithm2e}';
            return `\\usepackage{${p}}`;
        })
        .join('\n');

    // Extract any \usetikzlibrary from the generated code
    const tikzLibs: string[] = [];
    const codeWithoutLibs = code.replace(
        /\\usetikzlibrary\{([^}]+)\}/g,
        (_, libs) => { tikzLibs.push(libs); return ''; }
    );
    const tikzLibLine = tikzLibs.length > 0
        ? `\\usetikzlibrary{${tikzLibs.join(',')}}`
        : '';

    return `\\documentclass[border=10pt,preview]{standalone}
${usepackages}
${tikzLibLine}
\\begin{document}
${codeWithoutLibs.trim()}
\\end{document}
`;
}

// ── Main Generator ───────────────────────────────────────────

export async function generateSnippet(
    request: SnippetRequest,
    apiKey: string
): Promise<SnippetResult> {
    const type = request.type === 'auto' || !request.type
        ? detectSnippetType(request.prompt)
        : request.type;

    const systemPrompt = TYPE_PROMPTS[type] || TYPE_PROMPTS.auto;

    // Build user message
    let userMessage = request.prompt;

    if (request.csvData && type === 'table') {
        userMessage += `\n\nCSV Data:\n${request.csvData}`;
    }

    if (request.existingPackages && request.existingPackages.length > 0) {
        userMessage += `\n\nAlready loaded packages: ${request.existingPackages.join(', ')}`;
    }

    userMessage += '\n\nGenerate the LaTeX code. Output ONLY the code, nothing else.';

    const body = {
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        max_tokens: 1500,
        temperature: 0.3,
        top_p: 0.9,
    };

    const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'LaTeXForge',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    let code = data.choices?.[0]?.message?.content?.trim() || '';

    // Clean output
    code = cleanGeneratedCode(code);

    const requiredPackages = detectRequiredPackages(code);
    const previewDocument = buildPreviewDocument(code, requiredPackages);

    return { code, requiredPackages, type, previewDocument };
}

// ── Output Cleaner ───────────────────────────────────────────

function cleanGeneratedCode(text: string): string {
    let cleaned = text;

    // Remove markdown code fences
    cleaned = cleaned.replace(/^```(?:latex|tex)?\s*\n?/gm, '');
    cleaned = cleaned.replace(/\n?```\s*$/gm, '');

    // Remove preamble lines if the AI generated a full document
    cleaned = cleaned.replace(/^\\documentclass.*\n/gm, '');
    cleaned = cleaned.replace(/^\\usepackage.*\n/gm, '');
    cleaned = cleaned.replace(/^\\begin\{document\}\s*\n?/gm, '');
    cleaned = cleaned.replace(/\n?\\end\{document\}\s*$/gm, '');

    // Remove "Here is..." preamble
    cleaned = cleaned.replace(/^(?:Here (?:is|are)|Sure|Certainly)[^\n]*\n+/i, '');

    // Remove trailing meta-commentary
    cleaned = cleaned.replace(/\n+(?:This |Note:|I |The above)[^\n]*$/i, '');

    return cleaned.trim();
}
