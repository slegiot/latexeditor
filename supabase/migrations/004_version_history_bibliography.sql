-- ─────────────────────────────────────────────────────────────
-- LaTeXForge — Version History & Bibliography Migration
-- ─────────────────────────────────────────────────────────────
-- Adds:
--   1. document_versions table (version snapshots for history panel)
--   2. bibliography column on projects (stores .bib content)
--   3. user_package_presets table (saved package configurations)
-- ─────────────────────────────────────────────────────────────
-- ─────────────────────────────────────────────────────────────
-- 1. Document Versions — snapshot history for diff & restore
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL DEFAULT 'main.tex',
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    content_length INTEGER NOT NULL DEFAULT 0,
    label TEXT NOT NULL DEFAULT 'Snapshot',
    is_auto BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_document_versions_project ON public.document_versions(project_id);
CREATE INDEX idx_document_versions_project_file ON public.document_versions(project_id, file_path);
CREATE INDEX idx_document_versions_created ON public.document_versions(project_id, created_at DESC);
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
-- Visible to project members
CREATE POLICY "Versions visible to project members" ON public.document_versions FOR
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
-- Editors and owners can create versions
CREATE POLICY "Members can create versions" ON public.document_versions FOR
INSERT TO authenticated WITH CHECK (
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
-- Only owner can delete versions
CREATE POLICY "Owner can delete versions" ON public.document_versions FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.id = project_id
            AND p.owner_id = auth.uid()
    )
);
-- ─────────────────────────────────────────────────────────────
-- 2. Bibliography column on projects — stores raw .bib content
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS bibliography TEXT DEFAULT '';
-- ─────────────────────────────────────────────────────────────
-- 3. Package presets — saved package configurations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.user_package_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    packages TEXT [] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name)
);
ALTER TABLE public.user_package_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own presets" ON public.user_package_presets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- ─────────────────────────────────────────────────────────────
-- 4. Helper: count versions for auto-pruning
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prune_auto_versions(
        p_project_id UUID,
        p_file_path TEXT DEFAULT 'main.tex',
        p_max_auto INTEGER DEFAULT 50
    ) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE deleted_count INTEGER;
BEGIN WITH ranked AS (
    SELECT id,
        ROW_NUMBER() OVER (
            ORDER BY created_at DESC
        ) as rn
    FROM public.document_versions
    WHERE project_id = p_project_id
        AND file_path = p_file_path
        AND is_auto = true
),
to_delete AS (
    SELECT id
    FROM ranked
    WHERE rn > p_max_auto
)
DELETE FROM public.document_versions
WHERE id IN (
        SELECT id
        FROM to_delete
    );
GET DIAGNOSTICS deleted_count = ROW_COUNT;
RETURN deleted_count;
END;
$$;