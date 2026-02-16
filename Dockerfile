# syntax=docker/dockerfile:1

# ── Stage 1: Dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public
ENV NEXT_TELEMETRY_DISABLED=1

# Render passes env vars as build args — declare them so Next.js can inline them
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# ── Stage 3: Runtime ──
FROM node:20-alpine AS runner
WORKDIR /app

# Install TeX Live for PDF compilation (comprehensive for chemistry, graphs, science, etc.)
RUN apk add --no-cache \
    texlive \
    texmf-dist \
    texmf-dist-latexextra \
    texmf-dist-fontsrecommended \
    texmf-dist-fontsextra \
    texmf-dist-science \
    texmf-dist-pictures \
    texmf-dist-bibtexextra \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create tmp dirs for git and compilation
RUN mkdir -p /tmp/latexforge-git /tmp/latex-compile /tmp/latexforge && \
    chown -R nextjs:nodejs /tmp/latexforge-git /tmp/latex-compile /tmp/latexforge

USER nextjs

EXPOSE 3000 4444

# Start both Next.js and WebSocket server
CMD ["sh", "-c", "node server/ws-server.mjs & node server.js"]
