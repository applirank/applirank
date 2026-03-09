# ─── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# Public site URL is baked in at build time; override with --build-arg for production
ARG NUXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NUXT_PUBLIC_SITE_URL=${NUXT_PUBLIC_SITE_URL}

# PostHog — the @posthog/nuxt module is conditionally loaded at build time.
# Pass your project API key so the module is included in the production bundle.
# Railway auto-passes service variables as Docker build args.
ARG POSTHOG_PUBLIC_KEY
ENV POSTHOG_PUBLIC_KEY=${POSTHOG_PUBLIC_KEY}
ARG POSTHOG_HOST
ENV POSTHOG_HOST=${POSTHOG_HOST}

RUN npm run build

# ─── Stage 2: Run ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S reqcore && adduser -S reqcore -G reqcore

# .output is fully self-contained (server, public assets)
COPY --chown=reqcore:reqcore --from=builder /app/.output ./.output

# @nuxt/content SQLite database — built during `npm run build`, stored outside .output
COPY --chown=reqcore:reqcore --from=builder /app/.data ./.data

# Drizzle migrations are loaded at runtime via a relative path ("./server/database/migrations")
# They must live alongside .output so the path resolves correctly inside the container
COPY --chown=reqcore:reqcore --from=builder /app/server/database/migrations ./server/database/migrations

# Seed script support — copies node_modules, package.json, and server source
# so `docker compose exec app npm run db:seed` works inside the container
COPY --chown=reqcore:reqcore --from=builder /app/package.json ./package.json
COPY --chown=reqcore:reqcore --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --chown=reqcore:reqcore --from=builder /app/node_modules ./node_modules
COPY --chown=reqcore:reqcore --from=builder /app/server ./server

USER reqcore

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
