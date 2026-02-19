-- ─────────────────────────────────────────────────────────────
-- LaTeXForge — Yjs Document State Persistence
-- ─────────────────────────────────────────────────────────────
-- Stores serialized Yjs document state for offline persistence.
-- When a Hocuspocus room opens, the server loads the binary
-- state from this table. On close or periodic flush, it saves
-- the latest snapshot back.
-- ─────────────────────────────────────────────────────────────
-- ─────────────────────────────────────────────────────────────
-- 1. yjs_documents — persisted CRDT state
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.yjs_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_name TEXT NOT NULL UNIQUE,
    -- Room name: "latexforge:{projectId}:{filePath}"
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    -- e.g. "main.tex"
    state BYTEA,
    -- Y.encodeStateAsUpdate(doc)
    state_vector BYTEA,
    -- Y.encodeStateVector(doc)
    snapshot BYTEA,
    -- Optional: Y.snapshot(doc) for version history
    last_saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, file_path)
);
CREATE INDEX idx_yjs_documents_project ON public.yjs_documents(project_id);
CREATE INDEX idx_yjs_documents_name ON public.yjs_documents(document_name);
ALTER TABLE public.yjs_documents ENABLE ROW LEVEL SECURITY;
-- Access follows project membership (same pattern as project_files)
CREATE POLICY "Yjs documents visible to project members" ON public.yjs_documents FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.projects p
            WHERE p.id = project_id
                AND (
                    p.owner_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM public.collaborators c
                        WHERE c.project_id = p.id
                            AND c.user_id = auth.uid()
                    )
                )
        )
    );
-- Editors and owners can upsert
CREATE POLICY "Members can manage yjs documents" ON public.yjs_documents FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.id = project_id
            AND (
                p.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM public.collaborators c
                    WHERE c.project_id = p.id
                        AND c.user_id = auth.uid()
                        AND c.role IN ('editor', 'admin')
                )
            )
    )
);
-- ─────────────────────────────────────────────────────────────
-- 2. collaboration_sessions — active connection tracking
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_name TEXT NOT NULL,
    -- Room name
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    disconnected_at TIMESTAMPTZ,
    user_agent TEXT,
    ip_address INET
);
CREATE INDEX idx_collab_sessions_document ON public.collaboration_sessions(document_name);
CREATE INDEX idx_collab_sessions_user ON public.collaboration_sessions(user_id);
CREATE INDEX idx_collab_sessions_active ON public.collaboration_sessions(document_name)
WHERE disconnected_at IS NULL;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON public.collaboration_sessions FOR
SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can manage sessions" ON public.collaboration_sessions FOR ALL TO service_role USING (true);