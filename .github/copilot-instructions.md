# Copilot Instructions — Applirank

* [Product Vision and Goals](../PRODUCT.md): Understand the product vision, target users, UVP, and feature roadmap.
* [System Architecture and Design Principles](../ARCHITECTURE.md): Overall system architecture, data model, technology stack, and security boundaries.
* [Roadmap and Progress](../ROADMAP.md): What's built, what's in progress, and what's planned next.
* [Changelog](../CHANGELOG.md): What changed and when, organized by date.

Suggest to update these documents if you find any incomplete or conflicting information during your work.

## Architecture Overview

Applirank is a **Nuxt 4** full-stack application using the `app/` directory structure. Key technology choices:

- **Framework**: Nuxt 4 (`app/` is `srcDir`, `server/` stays at project root)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin (NOT `@nuxtjs/tailwindcss`)
- **Icons**: `lucide-vue-next` — tree-shakeable, consistent icon library
- **Database**: PostgreSQL 16 via **Drizzle ORM** + `postgres` (postgres.js) driver
- **Auth**: **Better Auth** with organization plugin (manual integration via catch-all route)
- **Object Storage**: MinIO (S3-compatible), accessed via S3 API
- **Validation**: Zod v4
- **Infrastructure**: Docker Compose for local Postgres, MinIO, and Adminer

## Product Vision: The Sovereign Recruitment Engine

Applirank is a lean, open-source ATS designed to return power to the employer. We are the "Glass Box" alternative to the "Black Box" incumbents.

### Unique Value Proposition (UVP)
1. **Ownership over Access**: In a closed ATS, you pay for *access* to your data. In Applirank, you *own* the infrastructure (Postgres/MinIO). Your talent pool is a permanent asset, not a monthly subscription.
2. **Auditable Intelligence (The Glass Box)**: We reject "Secret Algorithms." AI in Applirank is a transparent assistant. When AI ranks a candidate, it must provide a visible "Matching Logic" summary so recruiters can verify the result.
3. **The Anti-Growth Tax**: We abolish per-seat pricing. Applirank is designed to let companies scale their hiring teams without increasing their software bill.
4. **Privacy Sovereignty**: By supporting local-first storage (MinIO) and local AI (Ollama), we offer the only ATS where sensitive candidate PII never has to leave the company's private network.

### Marketing Context for AI Generation
- **Focus**: Efficiency, Transparency, and Ownership.
- **Tone**: Professional, high-integrity, and engineering-grade.
- **UI Principle**: Show the "Proof." If the AI matches a skill, highlight it. If a candidate is "High Potential," explain why based on the data.

## Project Structure

```
app/              # Client-side source (components, pages, composables, etc.)
server/           # Nitro server code (api/, routes/, utils/, middleware/)
  api/public/     # Unauthenticated endpoints (public job board, apply)
  api/documents/  # Document download/preview (server-proxied streaming)
  utils/env.ts    # Runtime env validation — all env vars validated with Zod
  utils/slugify.ts # URL slug generation for public job pages
  utils/rateLimit.ts # IP-based sliding window rate limiter
  utils/s3.ts      # MinIO/S3 client and file operations
  utils/requireAuth.ts # Auth guard utility (throws 401/403)
  utils/schemas/   # Shared Zod validation schemas (document, job, candidate, etc.)
public/           # Static assets
docker-compose.yml
```

### Sidebar & Navigation

The `AppSidebar` component (`app/components/AppSidebar.vue`) provides:
- **Main nav**: Dashboard, Jobs, Candidates, Applications — icons from `lucide-vue-next`, Tailwind utility classes (no scoped CSS)
- **Dynamic job context nav**: When the route matches `/dashboard/jobs/:id/*`, a contextual sub-nav appears with tabs:
  - **Overview** → `/dashboard/jobs/:id` (job detail)
  - **Pipeline** → `/dashboard/jobs/:id/pipeline` (Kanban board)
  - **Application Form** → `/dashboard/jobs/:id/application-form` (custom questions + shareable link)
- The sidebar detects the active job from `route.path` — no props or global state needed
- Active tab highlighting uses exact route matching via a local `isActiveTab(to, exact)` helper

### Dashboard Layout

The `dashboard` layout (`app/layouts/dashboard.vue`) provides only the sidebar + a full-width `<main>` area. Each page controls its own `max-w-*` and must include `mx-auto` for centering:
- Content pages: `mx-auto max-w-3xl` or `mx-auto max-w-4xl`
- Full-width pages (e.g., pipeline Kanban): no `max-w-*` constraint

### Public vs Authenticated Routes

- **Authenticated API**: `server/api/jobs/`, `server/api/candidates/` — require `requireAuth(event)`
- **Public API**: `server/api/public/jobs/` — no auth, only exposes open jobs, uses slug-based URLs
- **Public pages**: `app/pages/jobs/` — job board, job detail, application form (uses `public` layout)
- **Public standalone pages**: `app/pages/index.vue` (landing), `app/pages/roadmap.vue` (roadmap) — dark theme, no layout
- **Dashboard pages**: `app/pages/dashboard/` — recruiter UI (uses `dashboard` layout, requires auth)

### URL Slugs (Public Job Pages)

- Public job URLs use human-readable slugs: `/jobs/senior-engineer-a1b2c3d4`
- Slugs are auto-generated from `title + short UUID` via `generateJobSlug()` (auto-imported)
- Recruiters can optionally provide a custom slug when creating/editing a job
- The `slug` column on the `job` table has a unique constraint
- Public API routes use `[slug]` param: `GET /api/public/jobs/:slug`, `POST /api/public/jobs/:slug/apply`
- Dashboard (internal) routes still use UUID `[id]` param

## Critical Patterns

### Environment Variables

All server-side env vars are validated in `server/utils/env.ts` using a Zod schema. When adding a new env var:
1. Add it to the `envSchema` in `server/utils/env.ts`
2. Add it to `.env`
3. If it's for Docker services, also wire it in `docker-compose.yml`

Import `env` from `server/utils/env.ts` — never use `process.env` directly in server code.

### Database

- ORM: **Drizzle ORM** with the `postgres` (postgres.js) driver — not `pg` or `@neondatabase/serverless`
- Connection string comes from `env.DATABASE_URL`
- Drizzle schema files go in `server/database/schema/`
- Drizzle config at project root: `drizzle.config.ts`

### Authentication

- **Better Auth** integrated manually via catch-all route (`server/api/auth/[...all].ts`)
- Auth config lives in `server/utils/auth.ts` (Nuxt auto-imports server utils)
- Client-side auth via `app/utils/auth-client.ts` (not a Nuxt module)

### Nuxt 4 Conventions

- Use the `app/` directory for all client source code (`components/`, `pages/`, `composables/`, `layouts/`)
- `server/`, `public/`, `modules/` stay at project root — **not** inside `app/`
- The `~` alias resolves to `app/`
- Data fetching (`useAsyncData`, `useFetch`) returns `shallowRef` by default
- Use `defineNuxtRouteMiddleware` for route middleware

## Development Workflow

```bash
# Start infrastructure (Postgres, MinIO, Adminer)
docker compose up -d

# Install dependencies
npm install

# Start dev server at http://localhost:3000
npm run dev
```

Local services:
- **App**: http://localhost:3000
- **Adminer** (DB GUI): http://localhost:8080
- **MinIO Console**: http://localhost:9001 | S3 API: http://localhost:9000

## Icons

Use **`lucide-vue-next`** for all icons. Import individual icons by name — they are tree-shakeable:

```vue
<script setup lang="ts">
import { ArrowRight, Database, ShieldCheck } from 'lucide-vue-next'
</script>

<template>
  <ArrowRight class="size-5" />
</template>
```

- Browse available icons: https://lucide.dev/icons
- Use `class="size-N"` for sizing (Tailwind `size-4`, `size-5`, `size-6`)
- For brand logos (Nuxt, PostgreSQL, etc.) use inline SVG — Lucide doesn't include brand icons

## Design System — Landing Page & Roadmap Dark Theme

The public landing page (`app/pages/index.vue`) and roadmap page (`app/pages/roadmap.vue`) use a dark aesthetic inspired by Linear/Resend/Raycast:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `bg-[#09090b]` | Page body and sections |
| Glass borders | `border-white/[0.06]` | Cards, nav, dividers |
| Muted text | `text-white/60` | Descriptions, secondary text |
| Glow effects | `bg-indigo-500/20 blur-3xl` | Decorative blobs behind sections |
| Grid pattern | Background SVG with `white/[0.03]` lines | Subtle texture overlay |

### Key patterns
- **Body override**: When a dark page is embedded in a light-mode layout, use `useHead({ bodyAttrs: { style: 'background-color: #09090b;' } })` to prevent light body bleed
- **Overflow containment**: When decorative elements use `translate-y-*`, wrap the section in `overflow-hidden` to prevent extra scroll space
- **Auth-aware rendering**: Use `authClient.useSession(useFetch)` to conditionally show Dashboard vs Sign In links

## Package Manager

Use **npm** (lockfile is `package-lock.json`).

## Code Style & Conventions

### Naming
- **Database columns**: `snake_case` (`created_at`, `organization_id`)
- **JS/TS fields**: `camelCase` (`createdAt`, `organizationId`)
- **Components**: `PascalCase` filenames (`JobCard.vue`, `CandidateList.vue`)
- **Composables**: `use` prefix (`useJobs`, `useCandidates`)
- **API routes**: kebab-case paths, method suffix files (`index.get.ts`, `[id].delete.ts`)

### Error Handling
- Server: `createError({ statusCode: 4xx, statusMessage: '...' })` — never `throw new Error()`
- Client: handle `error` from `useFetch` destructuring

### Security — Multi-Tenancy (CRITICAL)
- ALL domain queries MUST filter by `organizationId`
- `organizationId` MUST come from `session.session.activeOrganizationId` — NEVER from request body, query params, or path params
- Detail endpoints: filter by BOTH `id` AND `organizationId`
- This is the #1 source of security bugs — verify it in every handler

### Security — Document Storage
- Document access is **always server-proxied** — presigned S3 URLs are NEVER exposed to clients
- Download: `GET /api/documents/:id/download` streams bytes with `Content-Disposition: attachment`
- Preview: `GET /api/documents/:id/preview` streams PDF bytes with `Content-Disposition: inline` (PDF only, 415 for other types)
- Filename sanitization: always use `sanitizeFilename()` from `server/utils/schemas/document.ts` on user-provided filenames
- Global security headers are set via Nitro route rules in `nuxt.config.ts` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, etc.)
- The preview endpoint overrides `X-Frame-Options` to `SAMEORIGIN` to allow same-origin iframe embedding
- `storageKey` (the internal S3 path) is NEVER included in API responses

### Documentation
- Use JSDoc `/** */` comments for exported functions and complex types
- Add section-separator comments in schema files: `// ─────────────────`

### Nitro Route Conventions (CRITICAL)
- Dynamic param names MUST be consistent within the same path level. If `server/api/jobs/[id].get.ts` uses `[id]`, then subdirectories must also use `[id]/` (NOT `[jobId]/`). Mismatched param names cause 404 errors.
- Public pages using both `pages/[id].vue` (file) and `pages/[id]/` (directory) will conflict. Use `pages/[id]/index.vue` inside the directory instead.

### What NOT to do
- Don't use `pg` or `@neondatabase/serverless` — use `postgres` (postgres.js)
- Don't use `process.env` — use `env` from `server/utils/env.ts`
- Don't use Options API — use `<script setup>`
- Don't use `axios` — use `useFetch` / `$fetch`
- Don't create tables without `organizationId` (auth tables exempted)
- Don't use `serial`/`integer` for primary keys — use text UUIDs
- Don't put client code outside `app/` or server code inside `app/`
- Don't use `@/` alias — use `~/` (resolves to `app/`)
- Don't use `router.push()` — use `navigateTo()`
- Don't use `<a>` tags for internal links — use `<NuxtLink>`
- Don't use `@nuxtjs/tailwindcss` module — use `@tailwindcss/vite` plugin
- Don't create `tailwind.config.js` — use `@theme` in `app/assets/css/main.css`
- Don't use `@tailwind base/components/utilities` directives — use `@import "tailwindcss"` (v4)
- Don't use `<style scoped>` for layout/spacing/colors — use Tailwind utility classes
- Don't interpolate class names (`bg-${color}-500`) — Tailwind can't detect them
- Don't use emoji or inline SVG paths for icons — use `lucide-vue-next` components
- Don't use Heroicons, Font Awesome, or other icon libraries — standardize on Lucide
- Don't put `max-w-*` in the dashboard layout — each page sets its own `mx-auto max-w-*`
- Don't add "Back to X" links on job sub-pages (overview, pipeline, application form) — sidebar provides the navigation
