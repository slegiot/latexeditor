-- ============================================================
-- LatexForge — Supabase Storage Setup
-- Run this in the Supabase SQL Editor to create the project-assets bucket
-- ============================================================
-- Create the storage bucket (private — RLS controls access)
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
        10485760,
        -- 10 MB
        ARRAY [
        'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml',
        'application/pdf',
        'application/postscript',             -- .eps
        'application/x-bibtex', 'text/plain'  -- .bib files
    ]
    ) ON CONFLICT (id) DO NOTHING;
-- RLS: Owners can upload files to their project's folder
-- Path pattern: {project_id}/{filename}
CREATE POLICY "Project owners can upload assets" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'project-assets'
        AND EXISTS (
            SELECT 1
            FROM public.projects
            WHERE projects.id = (storage.foldername(name)) [1]::uuid
                AND projects.owner_id = auth.uid()
        )
    );
-- RLS: Owners can read their project's assets
CREATE POLICY "Project owners can read assets" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'project-assets'
        AND EXISTS (
            SELECT 1
            FROM public.projects
            WHERE projects.id = (storage.foldername(name)) [1]::uuid
                AND projects.owner_id = auth.uid()
        )
    );
-- RLS: Owners can delete their project's assets
CREATE POLICY "Project owners can delete assets" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'project-assets'
    AND EXISTS (
        SELECT 1
        FROM public.projects
        WHERE projects.id = (storage.foldername(name)) [1]::uuid
            AND projects.owner_id = auth.uid()
    )
);