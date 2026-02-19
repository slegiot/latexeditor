-- ─────────────────────────────────────────────────────────────
-- LaTeXForge — Scientific Workspace Migration
-- ─────────────────────────────────────────────────────────────
-- Adds:
--   1. project_assets table (metadata for binary files in Storage)
--   2. template column on projects
--   3. Supabase Storage bucket + policies
-- ─────────────────────────────────────────────────────────────
-- ─────────────────────────────────────────────────────────────
-- 1. Add workspace template to projects
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'blank' CHECK (
        template IN (
            'blank',
            'scientific',
            'thesis',
            'presentation',
            'letter'
        )
    );
-- ─────────────────────────────────────────────────────────────
-- 2. Project Assets — binary file metadata
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.project_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    -- e.g. "figures/diagram.png"
    storage_key TEXT NOT NULL,
    -- Supabase Storage key: "projects/{id}/figures/diagram.png"
    filename TEXT NOT NULL,
    -- Original filename: "diagram.png"
    mime_type TEXT NOT NULL,
    -- e.g. "image/png", "image/tiff"
    size_bytes BIGINT NOT NULL DEFAULT 0,
    directory TEXT NOT NULL DEFAULT 'figures' -- Virtual directory: "figures", "data", "sections"
    CHECK (
        directory IN ('figures', 'data', 'sections', 'root')
    ),
    width INTEGER,
    -- Image dimensions (null for non-image)
    height INTEGER,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, path)
);
CREATE INDEX idx_project_assets_project ON public.project_assets(project_id);
CREATE INDEX idx_project_assets_directory ON public.project_assets(project_id, directory);
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
-- Visible to project members (same pattern as project_files)
CREATE POLICY "Assets visible to project members" ON public.project_assets FOR
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
-- Owner and editors can manage assets
CREATE POLICY "Members can manage assets" ON public.project_assets FOR
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
CREATE POLICY "Members can delete assets" ON public.project_assets FOR DELETE TO authenticated USING (
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
-- 3. Storage bucket for project assets
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'project-assets',
        'project-assets',
        false,
        104857600,
        -- 100 MB max (enforced per-tier in application code)
        ARRAY [
    'image/png',
    'image/jpeg',
    'image/tiff',
    'image/svg+xml',
    'image/eps',
    'application/postscript',    -- EPS fallback MIME
    'application/pdf',           -- PDF figures
    'text/csv',
    'application/json',
    'application/x-bibtex',
    'text/plain'
  ]
    ) ON CONFLICT (id) DO NOTHING;
-- Storage RLS: authenticated users can upload to their project paths
CREATE POLICY "Users can upload to their projects" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'project-assets'
        AND EXISTS (
            SELECT 1
            FROM public.projects p
            WHERE p.id::text = (storage.foldername(name)) [1]
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
-- Storage RLS: project members can read assets
CREATE POLICY "Members can read project assets" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'project-assets'
        AND EXISTS (
            SELECT 1
            FROM public.projects p
            WHERE p.id::text = (storage.foldername(name)) [1]
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
-- Storage RLS: project members can delete assets
CREATE POLICY "Members can delete project assets" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'project-assets'
    AND EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.id::text = (storage.foldername(name)) [1]
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
-- 4. Helper: compute total project storage usage
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_project_storage_bytes(p_project_id UUID) RETURNS BIGINT LANGUAGE sql STABLE AS $$
SELECT COALESCE(SUM(size_bytes), 0)
FROM public.project_assets
WHERE project_id = p_project_id;
$$;