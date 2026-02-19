# ─────────────────────────────────────────────────────────────
# LaTeXForge — Next.js + Worker Multi-Stage Build
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Dependencies ─────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# ── Stage 2: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js + compile worker TypeScript
RUN npm run build

# ── Stage 3: Production ──────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create compile workspace directory
RUN mkdir -p /tmp/latex-compile && chown nextjs:nodejs /tmp/latex-compile

USER nextjs

EXPOSE 3000 4444

CMD ["node", "server.js"]
