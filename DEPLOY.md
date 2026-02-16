# LatexForge — Deployment Guide (Render.com)

Everything runs on a single Render Web Service (Docker) with Supabase as the managed database.

---

## Prerequisites

- **GitHub repo**: https://github.com/slegiot/latexeditor.git
- **Supabase project** (free tier is fine)
- **OpenRouter account** with API key
- **Stripe account** (optional, for billing)
- **Resend account** (optional, for waitlist emails)

---

## 1. Supabase Setup

### Create tables

Run these in the Supabase SQL Editor:

```sql
-- Already exists: projects, documents

-- Project sharing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  theme TEXT DEFAULT 'dark',
  font_size INT DEFAULT 14,
  auto_save BOOLEAN DEFAULT true,
  auto_save_interval INT DEFAULT 30,
  default_export TEXT DEFAULT 'pdf',
  vim_mode BOOLEAN DEFAULT false,
  word_wrap BOOLEAN DEFAULT true,
  minimap BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User subscriptions (Stripe)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Auth config

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-app.onrender.com`
- Redirect URLs: `https://your-app.onrender.com/auth/callback`

---

## 2. Render Deployment

### Blueprint (automatic)

The repo includes `render.yaml`. In Render Dashboard:

1. New → **Blueprint**
2. Connect your GitHub repo
3. Render auto-detects `render.yaml` and creates the service

### Manual setup

If you prefer manual:

1. New → **Web Service**
2. Connect `https://github.com/slegiot/latexeditor.git`
3. Settings:
   - **Runtime**: Docker
   - **Instance type**: Starter ($7/mo) or Standard ($25/mo)
   - **Dockerfile path**: `./Dockerfile`
   - **Health check path**: `/`

### Environment variables

Add these in Render Dashboard → Environment:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.onrender.com` |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` |
| `RESEND_API_KEY` | `re_...` (optional) |
| `STRIPE_SECRET_KEY` | `sk_live_...` (optional) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (optional) |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` (optional) |
| `STRIPE_PRICE_TEAM_MONTHLY` | `price_...` (optional) |
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` (optional) |

---

## 3. Custom Domain (optional)

1. Render Dashboard → your service → Settings → Custom Domains
2. Add your domain (e.g. `latexforge.dev`)
3. Add the DNS records Render provides (CNAME)
4. Update `NEXT_PUBLIC_APP_URL` to your domain
5. Update Supabase redirect URLs

---

## 4. Stripe Webhooks (if using billing)

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.onrender.com/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret → `STRIPE_WEBHOOK_SECRET` env var

---

## 5. Verify

After deploy:
- Visit `https://your-app.onrender.com` → landing page loads
- Sign up → dashboard loads
- Create project → editor opens
- Compile → PDF renders
- Click AI button → sidebar streams response

---

## Architecture

```
┌────────────────────────────────┐
│     Render Web Service         │
│  (Docker: Node + TeX Live)     │
│                                │
│  Next.js app (SSR + API)       │
│  ├── /api/compile  (pdflatex)  │
│  ├── /api/ai       (OpenRouter)│
│  ├── /api/stripe/* (billing)   │
│  └── /api/waitlist (Resend)    │
└────────────┬───────────────────┘
             │
    ┌────────┴────────┐
    │    Supabase      │
    │  (Auth + DB)     │
    └─────────────────┘
```
