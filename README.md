# LatexForge

A modern, collaborative LaTeX editor — an open-source Overleaf alternative built with Next.js 15, Supabase, and Docker TeXLive.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Auth & DB | Supabase (Postgres, Auth, Realtime) |
| Compilation | Docker TeXLive (pdflatex) |
| Collaboration | Yjs CRDT *(Step 2)* |
| Editor | Monaco Editor *(Step 2)* |

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- A [Supabase](https://supabase.com) project

### 1. Install dependencies

```bash
cd "Latex editor"
npm install
```

### 2. Configure environment

Copy the example and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up the database

Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) and run the contents of `supabase/schema.sql`. This creates:

- **profiles** — auto-created on signup
- **projects** — user's LaTeX projects
- **documents** — files within projects

All tables have Row Level Security (RLS) policies enabled.

### 4. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 5. Start the TeXLive container (optional)

```bash
docker compose up texlive -d
```

Compile a `.tex` file:
```bash
docker exec latexforge-texlive bash /workspace/compile.sh /workspace/input.tex
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login & signup pages
│   │   ├── auth/callback/   # OAuth callback handler
│   │   ├── dashboard/       # Project dashboard
│   │   ├── globals.css      # Design system & tokens
│   │   ├── layout.tsx       # Root layout with auth
│   │   └── page.tsx         # Landing page
│   ├── components/          # Shared UI components
│   ├── lib/supabase/        # Supabase client helpers
│   └── middleware.ts        # Auth middleware
├── supabase/
│   └── schema.sql           # Database schema & RLS
├── compile/
│   └── compile.sh           # TeXLive compile script
├── docker-compose.yml       # TeXLive container
└── next.config.js
```

## Features (Step 1)

- [x] Dark-mode-first design with light mode toggle
- [x] Supabase Auth (email/password + GitHub OAuth)
- [x] Auth-guarded dashboard with project CRUD
- [x] Responsive glass-morphism UI
- [x] Docker TeXLive compilation container
- [x] Auto-generated `main.tex` template for new projects

## Coming Next

- **Step 2**: Monaco editor integration, split-panel PDF preview
- **Step 3**: Yjs real-time collaboration
- **Step 4**: Git sync, version history
- **Step 5**: Freemium billing with Stripe

## License

MIT
