# Changelog

All notable changes to Applirank are documented here, organized by date.

Format follows [Keep a Changelog](https://keepachangelog.com). Categories: **Added**, **Changed**, **Fixed**, **Removed**.

---

## 2026-02-15

### Added

- **Public roadmap page** (`app/pages/roadmap.vue`) — cinematic horizontal-scrolling timeline with 15 glassmorphism milestone cards, color-coded by status (shipped/building/vision), scroll-tracking progress glow on the timeline axis, smooth mousewheel-to-horizontal scroll conversion via requestAnimationFrame, and intro card centered on page load
- **Roadmap showcase section on landing page** — "Built in the open" section with mini timeline showing Shipped/Building/Vision counts and prominent CTA to full roadmap
- **Roadmap navigation links** — Roadmap link added to landing page navbar and footer

---

## 2026-02-15

### Added

- **IP-based rate limiting** — reusable `createRateLimiter()` utility (`server/utils/rateLimit.ts`) using a sliding window algorithm with automatic stale entry pruning; applied to public application endpoint (5 requests per IP per 15 minutes); returns standard `X-RateLimit-*` headers and `429 Too Many Requests` when exceeded
- **Candidates table view per job** — new `/dashboard/jobs/:id/candidates` page showing all applicants in a Supabase-style data table with columns for name, email, status, score, and applied date; includes status filter dropdown
- **Candidate detail sidebar** — clicking a row in the candidates table opens a slide-over panel (`CandidateDetailSidebar.vue`) with full application details: status transitions, candidate info, notes (editable inline), question responses, and links to full candidate/application pages
- **Sidebar "Candidates" tab** — job context sub-nav now includes a "Candidates" tab (with `Table2` icon) between Pipeline and Application Form
- **File upload question type** — recruiters can add `file_upload` fields to custom application forms, letting applicants upload resumes, cover letters, or other documents (PDF, DOC, DOCX — max 10 MB)
- **Multipart form support on public apply endpoint** — `POST /api/public/jobs/:slug/apply` now supports `multipart/form-data` when file uploads are present, with full security: magic byte MIME validation via `file-type`, server-generated S3 storage keys, per-file size limits
- **DynamicField file input** — `DynamicField.vue` renders drag-and-drop style file selector for `file_upload` questions with clear/remove support
- **Automatic document type detection** — uploaded files are auto-classified as `resume`, `cover_letter`, or `other` based on question label heuristics
- **Document records from public submissions** — files uploaded via the public apply form create `document` records linked to the candidate, visible on the recruiter's candidate detail page
- **Inline PDF preview** — recruiters can preview PDF documents directly in the candidate detail sidebar and candidate page without downloading; uses a same-origin server-proxied streaming endpoint (`GET /api/documents/:id/preview`) that pipes S3 bytes through the Nitro server
- **Document security hardening** — comprehensive security audit and fixes:
  - Private S3 bucket policy enforcement on startup (explicit deny-all-anonymous-access)
  - Filename sanitization utility (`sanitizeFilename`) preventing path traversal, XSS, and filesystem exploits
  - Per-candidate document limit (max 20) enforced on public apply endpoint
  - `storageKey` filtered from API responses (never exposed to clients)
  - Global security headers via Nitro route rules: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection`, `Permissions-Policy`
  - Docker Compose ports bound to `127.0.0.1` (Postgres, MinIO, Adminer)

### Changed

- **Document downloads now server-proxied** — `GET /api/documents/:id/download` no longer returns a presigned S3 URL; instead streams file bytes directly through the authenticated server endpoint, eliminating the risk of URL sharing/leakage
- **Document preview now server-proxied** — `GET /api/documents/:id/preview` streams actual PDF bytes through the server instead of returning a presigned URL; iframe loads from same origin, eliminating cross-origin issues
- **Document cache headers hardened** — both download and preview endpoints now use `Cache-Control: private, no-store` instead of `private, max-age=300`, preventing browser/proxy caching of sensitive candidate documents on shared computers
- **`useDocuments` composable** — `downloadDocument()` now opens the server-proxied endpoint URL directly instead of fetching and redirecting to a presigned URL; `getPreviewUrl()` is now synchronous, returning the API endpoint path directly
- **`X-Frame-Options` route override** — global `DENY` policy with `SAMEORIGIN` exception for `/api/documents/*/preview` to allow inline PDF iframe rendering
- **Public apply form** — now uses `FormData` instead of JSON when the application form includes file upload questions; falls back to JSON for forms without files
- **QuestionForm type selector** — added "File Upload" option to the question type dropdown
- **JobQuestions type labels** — added `file_upload: 'File Upload'` to display labels

## 2026-02-14

### Added

- **Dynamic sidebar job tabs** — when viewing a specific job (`/dashboard/jobs/:id/*`), the sidebar shows contextual sub-navigation: Overview, Pipeline, Application Form
- **Application Form tab page** (`app/pages/dashboard/jobs/[id]/application-form.vue`) — dedicated page for custom questions management and shareable application link
- **Sidebar icons** — all main nav items now display Lucide icons (LayoutDashboard, Briefcase, Users, Inbox, LogOut)
- **"All Jobs" sidebar back-link** — quick return to jobs list from any job sub-page

### Changed

- **Sidebar redesign** — replaced scoped CSS with Tailwind utility classes; added dynamic job context section with tab-based navigation
- **Dashboard layout** — removed `max-w-4xl` wrapper from `dashboard.vue`; each page now controls its own `mx-auto max-w-*` for proper centering
- **All dashboard pages** — added `mx-auto` to root elements for centered content within the main area
- **Dashboard index** — converted from `<style scoped>` to Tailwind utility classes
- **Job detail page** — removed "Back to Jobs" link, "View Pipeline" button, application link section, and Application Form Questions section (all moved to sidebar tabs / dedicated application-form page)
- **Pipeline page** — removed "Back to Job" link (sidebar provides navigation)

### Removed

- **"Back to X" links** on job sub-pages — sidebar now provides all navigation context
- **Scoped CSS** in `AppSidebar.vue` and `dashboard/index.vue` — replaced with Tailwind utilities

---

## 2026-02-14

### Added

- **SEO-friendly job slugs** — public job URLs now use human-readable slugs instead of UUIDs (e.g. `/jobs/senior-software-engineer-a1b2c3d4` instead of `/jobs/a1b2c3d4-...`)
- **Custom slug support** — recruiters can optionally set a custom slug when creating or editing a job; defaults to auto-generated from job title
- **Slug utility** — `server/utils/slugify.ts` with `generateJobSlug(title, id, customSlug?)` function, auto-imported by Nitro
- **Migration** — `0002_kind_inertia.sql` adds `slug` column to `job` table with unique constraint and backfills existing rows

### Changed

- **Public API routes** — `GET /api/public/jobs/:id` and `POST /api/public/jobs/:id/apply` replaced by slug-based routes (`/api/public/jobs/:slug` and `/api/public/jobs/:slug/apply`)
- **Public pages** — `app/pages/jobs/[id]/` renamed to `app/pages/jobs/[slug]/` (detail, apply, confirmation)
- **Job list links** — public job board now links to `/jobs/<slug>` instead of `/jobs/<id>`
- **Dashboard application link** — "Copy Application Link" now generates slug-based URLs
- **Job create/update APIs** — `POST /api/jobs` generates slug on creation; `PATCH /api/jobs/:id` regenerates slug when title or slug changes
- **Zod schemas** — `createJobSchema` and `updateJobSchema` now accept optional `slug` field

### Fixed

- **Honeypot bypass** — removed `z.string().max(0)` from honeypot schema that caused Zod to reject bot submissions with 422 instead of silently discarding them; honeypot validation now handled at runtime only
- **Candidate data overwrite** — public `apply.post.ts` no longer unconditionally overwrites existing candidate `firstName`/`lastName`/`phone`; now only backfills empty fields to prevent data corruption via re-application
- **Application ID leak** — public apply response no longer exposes the internal `applicationId`
- **Reorder atomicity** — question reorder endpoint now runs inside a database transaction instead of `Promise.all` to prevent partial reorder on failure
- **Unbounded applications eager-load** — `GET /api/jobs/:id` now limits eager-loaded applications to 100 with explicit column selection instead of loading all columns for all applications

---

## 2026-02-15

### Added

- **Public job board** (`app/pages/jobs/index.vue`) — browse all open positions with search, type filter, and pagination (no auth required)
- **Public job detail page** (`app/pages/jobs/[id].vue`) — view full job description, requirements, and "Apply Now" CTA (no auth required)
- **API: `GET /api/public/jobs`** — lists open jobs with pagination, search (title/location), and type filter
- Zod validation schema `publicJobsQuerySchema` for public job listing query params
- "Open Positions" navbar link on landing page
- "View Open Positions" CTA button in landing page hero section
- "Back to job details" link on application form page
- "Browse more positions" button on application confirmation page
- Cross-linked navigation flow: Landing → Job Board → Job Detail → Apply → Confirmation → Job Board

---

## 2026-02-15

### Added

- **Public landing page** (`app/pages/index.vue`) — dark-mode marketing page with Hero, Value Props, How It Works, Tech Stack, CTA, and Footer sections
- `lucide-vue-next` icon library — high-quality, tree-shakeable icons for the entire frontend
- Dark landing page design system: `#09090b` background, `white/[0.06]` glass borders, subtle glow effects, grid pattern overlay (Linear/Resend/Raycast aesthetic)
- SEO meta tags on landing page via `useSeoMeta` (title, description, OpenGraph)
- Auth-aware navbar on landing page — shows Dashboard link for authenticated users, Sign In / Get Started for guests
- Brand SVGs for tech stack section (Nuxt, PostgreSQL)

### Changed

- `app/pages/index.vue` — replaced auth redirect with full public landing page
- Disabled Nuxt DevTools in `nuxt.config.ts` (`devtools: { enabled: false }`)

### Fixed

- White bar at bottom of landing page — added `useHead({ bodyAttrs: { style: 'background-color: #09090b;' } })` to override light body background from `main.css`
- Extra scroll space at bottom — added `overflow-hidden` to CTA section to contain decorative glow blob using `translate-y-1/2`

---

## 2026-02-14

### Added

- Tailwind CSS v4 integration via `@tailwindcss/vite` plugin
- Global CSS entry point at `app/assets/css/main.css` with `@theme` brand color tokens
- Semantic color palette: brand (indigo), accent (teal), surface (slate), success (emerald), warning (amber), danger (rose), info (sky)
- Class-based dark mode support via `@custom-variant dark`
- Base layer with antialiased rendering and dark mode body defaults
- Tailwind CSS context engineering: instruction file, skill file, copilot-instructions updates
- Nuxt 4 project scaffold with `app/` directory structure
- Docker Compose infrastructure: PostgreSQL 16, MinIO (S3), Adminer
- Drizzle ORM setup with postgres.js driver (`server/utils/db.ts`)
- Zod-validated environment variables (`server/utils/env.ts`)
- Auto-apply migrations on server startup with advisory lock (`server/plugins/migrations.ts`)
- Better Auth integration with organization plugin (`server/utils/auth.ts`)
- Auth catch-all route (`server/api/auth/[...all].ts`)
- Auth client composable (`app/utils/auth-client.ts`)
- Domain schema: `job`, `candidate`, `application`, `document` tables with relations
- Job status workflow enum: draft → open → closed → archived
- Application status workflow enum: new → screening → interview → offer → hired/rejected
- Document type enum: resume, cover_letter, other
- Per-org candidate deduplication (unique index on `organizationId` + `email`)
- `PRODUCT.md` — product vision, UVP, and target users
- `ARCHITECTURE.md` — system architecture, directory structure, and security boundaries
- `ROADMAP.md` — living roadmap with milestones and progress tracking
- `README.md` — project overview, setup instructions, and contributing guide
- Context engineering setup: copilot-instructions, architect/implement agents, plan prompt, domain instruction files
