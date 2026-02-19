// ─────────────────────────────────────────────────────────────
// LaTeXForge — AI Agent Tool Registry
// ─────────────────────────────────────────────────────────────
// Defines structured tools the AI assistant can invoke to
// interact with all editor features programmatically.
//
// The AI can:
//   ✦ Manage bibliography (lookup DOI, add/remove entries)
//   ✦ Toggle LaTeX packages in the preamble
//   ✦ Generate and insert snippets (TikZ, tables, etc.)
//   ✦ Insert chemical equations and structures
//   ✦ Insert math expressions
//   ✦ Create version snapshots and compare diffs
//   ✦ Manage compilation and error fixes
// ─────────────────────────────────────────────────────────────

// ── Tool Types ───────────────────────────────────────────────

export interface AgentTool {
    name: string;
    description: string;
    category: ToolCategory;
    parameters: ToolParameter[];
    /** Execute the tool — returns a result message */
    execute: (params: Record<string, string>) => Promise<AgentToolResult>;
}

export interface ToolParameter {
    name: string;
    type: 'string' | 'boolean' | 'number';
    description: string;
    required: boolean;
    enum?: string[];
}

export interface AgentToolResult {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
    /** LaTeX code to insert at cursor (if applicable) */
    insertText?: string;
    /** Whether to show a notification to the user */
    notify?: boolean;
}

export type ToolCategory =
    | 'bibliography'
    | 'packages'
    | 'snippets'
    | 'chemistry'
    | 'math'
    | 'versions'
    | 'compilation'
    | 'editor';

// ── Tool Definitions ─────────────────────────────────────────

export function createAgentTools(context: AgentToolContext): AgentTool[] {
    return [
        // ── Bibliography ─────────────────────────────────────
        {
            name: 'lookup_doi',
            description: 'Look up a DOI via Crossref and add the BibTeX entry to the project bibliography. Returns the citation key for use with \\cite{}.',
            category: 'bibliography',
            parameters: [
                { name: 'doi', type: 'string', description: 'The DOI to look up (e.g., "10.1038/s41586-021-03819-2")', required: true },
            ],
            execute: async (params) => {
                const res = await fetch('/api/bibliography', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId: context.projectId, action: 'lookup_doi', doi: params.doi }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: 'DOI lookup failed' }));
                    return { success: false, message: err.error };
                }
                const data = await res.json();
                // Auto-add to bibliography
                const addRes = await fetch('/api/bibliography', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId: context.projectId, action: 'add_entry', bibtex: data.bibtex }),
                });
                const addData = await addRes.json();
                return {
                    success: true,
                    message: `Added "${data.entry.title}" to bibliography. Use \\cite{${addData.citationKey}} to cite it.`,
                    data: { citationKey: addData.citationKey, title: data.entry.title },
                    insertText: `\\cite{${addData.citationKey}}`,
                };
            },
        },
        {
            name: 'search_references',
            description: 'Search Crossref for academic papers by title or keywords.',
            category: 'bibliography',
            parameters: [
                { name: 'query', type: 'string', description: 'Search query (title, author, keywords)', required: true },
            ],
            execute: async (params) => {
                const res = await fetch('/api/bibliography', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId: context.projectId, action: 'search', query: params.query }),
                });
                if (!res.ok) return { success: false, message: 'Search failed' };
                const data = await res.json();
                const summary = (data.results || []).slice(0, 5)
                    .map((r: { title: string; authors: string; year: string; doi: string }, i: number) =>
                        `${i + 1}. ${r.title} — ${r.authors} (${r.year}) [${r.doi}]`
                    ).join('\n');
                return { success: true, message: `Found ${data.total} results:\n${summary}`, data: { results: data.results } };
            },
        },

        // ── Packages ─────────────────────────────────────────
        {
            name: 'enable_package',
            description: 'Add a LaTeX package to the document preamble. Automatically handles dependencies.',
            category: 'packages',
            parameters: [
                { name: 'package_name', type: 'string', description: 'Package name (e.g., "amsmath", "tikz", "mhchem")', required: true },
                { name: 'options', type: 'string', description: 'Package options (e.g., "margin=1in" for geometry)', required: false },
            ],
            execute: async (params) => {
                const { togglePackage, PACKAGE_REGISTRY, isPackageInPreamble } = await import('@/lib/latex-packages');

                if (isPackageInPreamble(context.getSource(), params.package_name)) {
                    return { success: true, message: `Package "${params.package_name}" is already enabled.` };
                }

                const pkg = PACKAGE_REGISTRY.find((p) => p.name === params.package_name);
                if (!pkg) {
                    // Insert raw \usepackage line
                    const line = params.options
                        ? `\\usepackage[${params.options}]{${params.package_name}}`
                        : `\\usepackage{${params.package_name}}`;
                    const { addPackageToPreamble } = await import('@/lib/latex-packages');
                    context.setSource(addPackageToPreamble(context.getSource(), { name: params.package_name, description: '', category: 'utilities', defaultOptions: params.options }));
                    return { success: true, message: `Added ${line} to preamble.` };
                }

                const result = togglePackage(context.getSource(), pkg);
                context.setSource(result.source);
                const deps = pkg.requires?.join(', ');
                return {
                    success: true,
                    message: `Enabled "${params.package_name}"${deps ? ` (also added dependencies: ${deps})` : ''}.`,
                };
            },
        },
        {
            name: 'disable_package',
            description: 'Remove a LaTeX package from the document preamble.',
            category: 'packages',
            parameters: [
                { name: 'package_name', type: 'string', description: 'Package name to remove', required: true },
            ],
            execute: async (params) => {
                const { removePackageFromPreamble, isPackageInPreamble } = await import('@/lib/latex-packages');

                if (!isPackageInPreamble(context.getSource(), params.package_name)) {
                    return { success: true, message: `Package "${params.package_name}" is not in the preamble.` };
                }

                context.setSource(removePackageFromPreamble(context.getSource(), params.package_name));
                return { success: true, message: `Removed "${params.package_name}" from preamble.` };
            },
        },
        {
            name: 'list_packages',
            description: 'List all packages currently enabled in the document preamble.',
            category: 'packages',
            parameters: [],
            execute: async () => {
                const { detectEnabledPackages } = await import('@/lib/latex-packages');
                const enabled = detectEnabledPackages(context.getSource());
                return {
                    success: true,
                    message: enabled.length > 0
                        ? `Currently enabled packages: ${enabled.join(', ')}`
                        : 'No packages currently in the preamble.',
                    data: { packages: enabled },
                };
            },
        },

        // ── Chemistry ────────────────────────────────────────
        {
            name: 'insert_chemical_equation',
            description: 'Insert a chemical equation using mhchem \\ce{} syntax. Automatically enables the mhchem package if needed.',
            category: 'chemistry',
            parameters: [
                { name: 'equation', type: 'string', description: 'Chemical equation in mhchem syntax (e.g., "H2O + NaOH -> NaCl + H2O")', required: true },
            ],
            execute: async (params) => {
                const { isPackageInPreamble, addPackageToPreamble, PACKAGE_REGISTRY } = await import('@/lib/latex-packages');
                let source = context.getSource();

                if (!isPackageInPreamble(source, 'mhchem')) {
                    const pkg = PACKAGE_REGISTRY.find((p) => p.name === 'mhchem');
                    if (pkg) source = addPackageToPreamble(source, pkg);
                    context.setSource(source);
                }

                const insertText = `\\ce{${params.equation}}`;
                return { success: true, message: `Chemical equation ready: ${insertText}`, insertText };
            },
        },
        {
            name: 'smiles_to_chemfig',
            description: 'Convert SMILES notation to ChemFig LaTeX code for drawing molecular structures.',
            category: 'chemistry',
            parameters: [
                { name: 'smiles', type: 'string', description: 'SMILES string (e.g., "CCO" for ethanol, "c1ccccc1" for benzene)', required: true },
            ],
            execute: async (params) => {
                const { smilesToChemFig } = await import('@/lib/chemfig-converter');
                const result = smilesToChemFig(params.smiles);

                const { isPackageInPreamble, addPackageToPreamble, PACKAGE_REGISTRY } = await import('@/lib/latex-packages');
                let source = context.getSource();
                if (!isPackageInPreamble(source, 'chemfig')) {
                    const pkg = PACKAGE_REGISTRY.find((p) => p.name === 'chemfig');
                    if (pkg) source = addPackageToPreamble(source, pkg);
                    context.setSource(source);
                }

                const insertText = `\\chemfig{${result.chemfig}}`;
                return {
                    success: true,
                    message: result.warnings.length > 0
                        ? `Converted with warnings: ${result.warnings.join('; ')}\n${insertText}`
                        : `Converted: ${insertText}`,
                    insertText,
                };
            },
        },

        // ── Math ─────────────────────────────────────────────
        {
            name: 'insert_math',
            description: 'Insert a mathematical expression wrapped in the appropriate environment.',
            category: 'math',
            parameters: [
                { name: 'latex', type: 'string', description: 'The LaTeX math expression', required: true },
                { name: 'mode', type: 'string', description: 'Wrapping mode: "inline" ($...$), "display" (\\[...\\]), or "equation" (equation environment)', required: false, enum: ['inline', 'display', 'equation'] },
            ],
            execute: async (params) => {
                const mode = params.mode || 'display';
                let insertText: string;
                switch (mode) {
                    case 'inline':
                        insertText = `$${params.latex}$`;
                        break;
                    case 'equation':
                        insertText = `\\begin{equation}\n  ${params.latex}\n\\end{equation}`;
                        break;
                    default:
                        insertText = `\\[\n  ${params.latex}\n\\]`;
                }
                return { success: true, message: `Math expression ready (${mode} mode).`, insertText };
            },
        },

        // ── Snippets ─────────────────────────────────────────
        {
            name: 'generate_snippet',
            description: 'Generate a LaTeX snippet (TikZ diagram, table, algorithm, etc.) from a natural language description using AI.',
            category: 'snippets',
            parameters: [
                { name: 'prompt', type: 'string', description: 'Description of what to generate (e.g., "Draw a neural network with 3 layers")', required: true },
                { name: 'type', type: 'string', description: 'Snippet type', required: false, enum: ['auto', 'tikz', 'table', 'matrix', 'algorithm', 'plot', 'diagram'] },
            ],
            execute: async (params) => {
                const res = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: params.prompt, type: params.type || 'auto' }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: 'Generation failed' }));
                    return { success: false, message: err.error || 'Snippet generation failed' };
                }
                const data = await res.json();
                return {
                    success: true,
                    message: `Generated ${data.type || 'snippet'}. Required packages: ${(data.packages || []).join(', ') || 'none'}.`,
                    insertText: data.code,
                    data: { packages: data.packages, type: data.type },
                };
            },
        },

        // ── Versions ─────────────────────────────────────────
        {
            name: 'save_snapshot',
            description: 'Save a named version snapshot of the current document.',
            category: 'versions',
            parameters: [
                { name: 'label', type: 'string', description: 'Name for this snapshot (e.g., "Before restructuring")', required: true },
            ],
            execute: async (params) => {
                const res = await fetch('/api/versions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId: context.projectId, action: 'snapshot', content: context.getSource(), label: params.label }),
                });
                if (!res.ok) return { success: false, message: 'Failed to save snapshot' };
                return { success: true, message: `Snapshot "${params.label}" saved.`, notify: true };
            },
        },

        // ── Editor ───────────────────────────────────────────
        {
            name: 'insert_text',
            description: 'Insert arbitrary text at the current cursor position in the editor.',
            category: 'editor',
            parameters: [
                { name: 'text', type: 'string', description: 'Text to insert', required: true },
            ],
            execute: async (params) => {
                return { success: true, message: 'Text ready to insert.', insertText: params.text };
            },
        },
        {
            name: 'insert_environment',
            description: 'Insert a LaTeX environment (\\begin{...}...\\end{...}) at the cursor.',
            category: 'editor',
            parameters: [
                { name: 'environment', type: 'string', description: 'Environment name (e.g., "figure", "itemize", "theorem")', required: true },
                { name: 'content', type: 'string', description: 'Content inside the environment', required: false },
                { name: 'options', type: 'string', description: 'Optional arguments (e.g., "[H]" for figure)', required: false },
            ],
            execute: async (params) => {
                const opts = params.options || '';
                const content = params.content || '  ';
                const insertText = `\\begin{${params.environment}}${opts}\n${content}\n\\end{${params.environment}}`;
                return { success: true, message: `${params.environment} environment ready.`, insertText };
            },
        },

        // ── Compilation ──────────────────────────────────────
        {
            name: 'fix_compilation_errors',
            description: 'Analyze compilation log and suggest fixes for LaTeX errors.',
            category: 'compilation',
            parameters: [
                { name: 'log', type: 'string', description: 'Compilation log content', required: true },
            ],
            execute: async (params) => {
                const res = await fetch('/api/ai/fix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ log: params.log, document: context.getSource() }),
                });
                if (!res.ok) return { success: false, message: 'Error analysis failed' };
                const data = await res.json();
                const summary = (data.errors || [])
                    .map((e: { message: string; fix?: string }) => `• ${e.message}${e.fix ? ` → Fix: ${e.fix}` : ''}`)
                    .join('\n');
                return {
                    success: true,
                    message: `Found ${data.errors?.length || 0} errors:\n${summary}`,
                    data,
                };
            },
        },
    ];
}

// ── Context Interface ────────────────────────────────────────

export interface AgentToolContext {
    /** Current project ID */
    projectId: string;
    /** Get the current document source */
    getSource: () => string;
    /** Update the document source */
    setSource: (source: string) => void;
}

// ── Tool Lookup ──────────────────────────────────────────────

/**
 * Get all tool names and descriptions (for the AI system prompt).
 */
export function getToolDescriptions(tools: AgentTool[]): string {
    return tools.map((t) => {
        const params = t.parameters
            .map((p) => `    - ${p.name} (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}`)
            .join('\n');
        return `## ${t.name}\n${t.description}\nCategory: ${t.category}\nParameters:\n${params}`;
    }).join('\n\n');
}

/**
 * Find a tool by name.
 */
export function findTool(tools: AgentTool[], name: string): AgentTool | undefined {
    return tools.find((t) => t.name === name);
}
