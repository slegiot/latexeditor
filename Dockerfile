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
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Runtime ──
FROM node:20-alpine AS runner
WORKDIR /app

# Install TeX Live for PDF compilation
RUN apk add --no-cache \
    texlive \
    texmf-dist \
    texmf-dist-latexextra \
    texmf-dist-fontsrecommended \
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
