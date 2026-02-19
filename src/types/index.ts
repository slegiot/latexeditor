// ─────────────────────────────────────────────────────────────
// LaTeXForge — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────

// ── Database Models ──────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro' | 'team';
export type CompilerEngine = 'pdflatex' | 'xelatex' | 'lualatex';
export type CollaboratorRole = 'viewer' | 'editor' | 'admin';
export type CompilationStatus = 'queued' | 'compiling' | 'success' | 'error' | 'timeout';
export type AssetDirectory = 'figures' | 'data' | 'sections' | 'root';
export type WorkspaceTemplate = 'blank' | 'scientific' | 'thesis' | 'presentation' | 'letter';

export interface Profile {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    stripe_customer_id: string | null;
    subscription_tier: SubscriptionTier;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    owner_id: string;
    title: string;
    description: string | null;
    compiler: CompilerEngine;
    template: WorkspaceTemplate;
    settings: ProjectSettings;
    created_at: string;
    updated_at: string;
}

export interface ProjectSettings {
    font_size?: number;
    theme?: 'light' | 'dark';
    vim_mode?: boolean;
    auto_compile?: boolean;
    auto_compile_delay_ms?: number;
    spell_check?: boolean;
    line_numbers?: boolean;
    word_wrap?: boolean;
}

export interface ProjectFile {
    id: string;
    project_id: string;
    path: string;
    content: string;
    is_entrypoint: boolean;
    created_at: string;
    updated_at: string;
}

export interface Collaborator {
    id: string;
    project_id: string;
    user_id: string;
    role: CollaboratorRole;
    joined_at: string;
    profile?: Profile;
}

export interface Compilation {
    id: string;
    project_id: string;
    triggered_by: string;
    status: CompilationStatus;
    pdf_url: string | null;
    synctex_url: string | null;
    log: string | null;
    duration_ms: number | null;
    engine: CompilerEngine;
    created_at: string;
}

export interface ProjectAsset {
    id: string;
    project_id: string;
    path: string;             // e.g. "figures/diagram.png"
    storage_key: string;      // Supabase Storage key
    filename: string;         // Original filename
    mime_type: string;
    size_bytes: number;
    directory: AssetDirectory;
    width: number | null;
    height: number | null;
    uploaded_by: string;
    created_at: string;
}

// ── API Types ────────────────────────────────────────────────

export interface CompileRequest {
    project_id: string;
    engine?: CompilerEngine;
}

export interface CompileResponse {
    compilation_id: string;
    status: CompilationStatus;
}

export interface CompileJobData {
    compilationId: string;
    projectId: string;
    engine: CompilerEngine;
    files: Array<{
        path: string;
        content: string;
        is_entrypoint: boolean;
    }>;
    assets: Array<{
        path: string;         // e.g. "figures/diagram.png"
        storage_key: string;  // Supabase Storage bucket key
    }>;
}

export interface CompileJobResult {
    status: CompilationStatus;
    pdfUrl?: string;
    synctexUrl?: string;
    log: string;
    durationMs: number;
}

/** SSE event types for real-time log streaming */
export type CompileLogEvent =
    | { type: 'log'; line: string; timestamp: number }
    | { type: 'status'; status: CompilationStatus }
    | { type: 'done'; pdfUrl?: string; synctexUrl?: string; durationMs: number };

// ── Collaboration Types ──────────────────────────────────────

export interface CollaborationUser {
    id: string;
    name: string;
    color: string;
    cursor?: {
        line: number;
        ch: number;
    };
}

export interface ShareInvite {
    email: string;
    role: CollaboratorRole;
    project_id: string;
}

// ── Editor Types ─────────────────────────────────────────────

export interface EditorConfig {
    fontSize: number;
    theme: 'light' | 'dark';
    keymap: 'default' | 'vim' | 'emacs';
    lineNumbers: boolean;
    wordWrap: boolean;
    tabSize: number;
    autoCompile: boolean;
    autoCompileDelay: number;
}

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
    fontSize: 14,
    theme: 'dark',
    keymap: 'default',
    lineNumbers: true,
    wordWrap: true,
    tabSize: 2,
    autoCompile: false,
    autoCompileDelay: 5000,
};

// ── Upload Types ─────────────────────────────────────────────

export const ALLOWED_ASSET_MIMES: Record<string, string[]> = {
    figures: ['image/png', 'image/jpeg', 'image/tiff', 'image/svg+xml', 'image/eps', 'application/postscript', 'application/pdf'],
    data: ['text/csv', 'application/json', 'text/plain'],
    sections: ['text/plain', 'application/x-tex'],
    root: ['application/x-bibtex', 'text/plain'],
};

export const STORAGE_LIMITS: Record<SubscriptionTier, { maxFileBytes: number; maxProjectBytes: number }> = {
    free: { maxFileBytes: 5 * 1024 * 1024, maxProjectBytes: 50 * 1024 * 1024 },
    pro: { maxFileBytes: 50 * 1024 * 1024, maxProjectBytes: 1024 * 1024 * 1024 },
    team: { maxFileBytes: 100 * 1024 * 1024, maxProjectBytes: 5 * 1024 * 1024 * 1024 },
};

export const SCIENTIFIC_DIRECTORIES: AssetDirectory[] = ['figures', 'data', 'sections'];
