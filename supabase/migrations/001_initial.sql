-- ─────────────────────────────────────────────────────────────
-- LaTeXForge — Initial Database Schema
-- ─────────────────────────────────────────────────────────────
-- Designed for Supabase (PostgreSQL 15+)
-- Includes RLS policies for multi-tenant security
--
-- NOTE: Tables created first, cross-referencing RLS policies
-- added after all tables exist to avoid forward references.
-- ─────────────────────────────────────────────────────────────
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ─────────────────────────────────────────────────────────────
-- 1. Profiles (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT UNIQUE,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$ BEGIN
INSERT INTO public.profiles (id, display_name, avatar_url)
VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            'User'
        ),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    );
RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ─────────────────────────────────────────────────────────────
-- 2. Projects (table only, policies deferred)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Project',
    description TEXT,
    compiler TEXT NOT NULL DEFAULT 'pdflatex' CHECK (compiler IN ('pdflatex', 'xelatex', 'lualatex')),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- ─────────────────────────────────────────────────────────────
-- 3. Project Files (table only, policies deferred)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    is_entrypoint BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, path)
);
CREATE INDEX idx_project_files_project ON public.project_files(project_id);
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
-- ─────────────────────────────────────────────────────────────
-- 4. Collaborators
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);
CREATE INDEX idx_collaborators_project ON public.collaborators(project_id);
CREATE INDEX idx_collaborators_user ON public.collaborators(user_id);
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
-- ─────────────────────────────────────────────────────────────
-- 5. Compilations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.compilations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    triggered_by UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (
        status IN (
            'queued',
            'compiling',
            'success',
            'error',
            'timeout'
        )
    ),
    pdf_url TEXT,
    log TEXT,
    duration_ms INTEGER,
    engine TEXT NOT NULL DEFAULT 'pdflatex',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_compilations_project ON public.compilations(project_id);
CREATE INDEX idx_compilations_status ON public.compilations(status);
ALTER TABLE public.compilations ENABLE ROW LEVEL SECURITY;
-- ─────────────────────────────────────────────────────────────
-- 6. RLS Policies (all tables exist, safe to cross-reference)
-- ─────────────────────────────────────────────────────────────
-- Projects policies
CREATE POLICY "Project visible to owner and collaborators" ON public.projects FOR
SELECT TO authenticated USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.collaborators c
            WHERE c.project_id = id
                AND c.user_id = auth.uid()
        )
    );
CREATE POLICY "Owner can create projects" ON public.projects FOR
INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner can update projects" ON public.projects FOR
UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner can delete projects" ON public.projects FOR DELETE TO authenticated USING (owner_id = auth.uid());
-- Project files policies
CREATE POLICY "Files visible to project members" ON public.project_files FOR
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
CREATE POLICY "Project members can modify files" ON public.project_files FOR ALL TO authenticated USING (
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
-- Collaborators policies
CREATE POLICY "Collaborators visible to project members" ON public.collaborators FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.projects p
            WHERE p.id = project_id
                AND (
                    p.owner_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM public.collaborators c2
                        WHERE c2.project_id = p.id
                            AND c2.user_id = auth.uid()
                    )
                )
        )
    );
CREATE POLICY "Owner manages collaborators" ON public.collaborators FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.id = project_id
            AND p.owner_id = auth.uid()
    )
);
-- Compilations policies
CREATE POLICY "Compilations visible to project members" ON public.compilations FOR
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
CREATE POLICY "Members can create compilations" ON public.compilations FOR
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
-- ─────────────────────────────────────────────────────────────
-- 7. Updated-at trigger (shared)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$;
CREATE TRIGGER set_profiles_updated_at BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_projects_updated_at BEFORE
UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_project_files_updated_at BEFORE
UPDATE ON public.project_files FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();