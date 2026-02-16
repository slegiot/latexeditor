-- ============================================================
-- LatexForge — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database
-- ============================================================
-- Enable required extensions
create extension if not exists "uuid-ossp";
-- ──────────────── Profiles ────────────────
-- Auto-created on signup via trigger
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    full_name text,
    avatar_url text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);
alter table public.profiles enable row level security;
-- Profiles: users can read all profiles, update only their own
create policy "Public profiles are viewable by everyone" on public.profiles for
select using (true);
create policy "Users can update own profile" on public.profiles for
update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for
insert with check (auth.uid() = id);
-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user() returns trigger as $$ begin
insert into public.profiles (id, email, full_name, avatar_url)
values (
        new.id,
        new.email,
        coalesce(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            ''
        ),
        coalesce(new.raw_user_meta_data->>'avatar_url', '')
    );
return new;
end;
$$ language plpgsql security definer;
create or replace trigger on_auth_user_created
after
insert on auth.users for each row execute function public.handle_new_user();
-- ──────────────── Projects ────────────────
create table if not exists public.projects (
    id uuid default uuid_generate_v4() primary key,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    description text default '',
    is_public boolean default false not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);
alter table public.projects enable row level security;
-- Projects: owners have full CRUD, public projects can be read by anyone
create policy "Users can view own projects" on public.projects for
select using (
        auth.uid() = owner_id
        or is_public = true
    );
create policy "Users can create projects" on public.projects for
insert with check (auth.uid() = owner_id);
create policy "Users can update own projects" on public.projects for
update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = owner_id);
-- ──────────────── Documents ────────────────
create table if not exists public.documents (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.projects(id) on delete cascade not null,
    path text not null default 'main.tex',
    content text default '',
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    unique(project_id, path)
);
alter table public.documents enable row level security;
-- Documents: inherit access from parent project
create policy "Users can view documents of accessible projects" on public.documents for
select using (
        exists (
            select 1
            from public.projects
            where projects.id = documents.project_id
                and (
                    projects.owner_id = auth.uid()
                    or projects.is_public = true
                )
        )
    );
create policy "Users can create documents in own projects" on public.documents for
insert with check (
        exists (
            select 1
            from public.projects
            where projects.id = documents.project_id
                and projects.owner_id = auth.uid()
        )
    );
create policy "Users can update documents in own projects" on public.documents for
update using (
        exists (
            select 1
            from public.projects
            where projects.id = documents.project_id
                and projects.owner_id = auth.uid()
        )
    );
create policy "Users can delete documents in own projects" on public.documents for delete using (
    exists (
        select 1
        from public.projects
        where projects.id = documents.project_id
            and projects.owner_id = auth.uid()
    )
);
-- ──────────────── Updated-at triggers ────────────────
create or replace function public.update_updated_at() returns trigger as $$ begin new.updated_at = now();
return new;
end;
$$ language plpgsql;
create trigger update_profiles_updated_at before
update on public.profiles for each row execute function public.update_updated_at();
create trigger update_projects_updated_at before
update on public.projects for each row execute function public.update_updated_at();
create trigger update_documents_updated_at before
update on public.documents for each row execute function public.update_updated_at();
-- ──────────────── Default document template ────────────────
-- When a new project is created, auto-add a main.tex document
create or replace function public.handle_new_project() returns trigger as $$ begin
insert into public.documents (project_id, path, content)
values (
        new.id,
        'main.tex',
        E'\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath}\n\n\\title{' || new.name || E'}\n\\author{}\n\\date{\\today}\n\n\\begin{document}\n\n\\maketitle\n\n\\section{Introduction}\n\nStart writing here...\n\n\\end{document}'
    );
return new;
end;
$$ language plpgsql security definer;
create trigger on_project_created
after
insert on public.projects for each row execute function public.handle_new_project();