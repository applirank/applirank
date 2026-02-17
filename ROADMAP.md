# Applirank — Roadmap

> Last updated: 2026-02-15 (public roadmap page)
>
> This is the single source of truth for what's built, what's in progress, and what's planned.
> For product vision see [PRODUCT.md](PRODUCT.md). For architecture see [ARCHITECTURE.md](ARCHITECTURE.md).
>
> **Convention**: Update this file when you start or finish work. AI agents reference it for context.

## 🎯 Current Focus

**Phase 2, Milestone 9: Resume Parsing** — Extract structured data from uploaded resumes.

> **Recently completed**: Dashboard — At-a-glance overview for recruiters with stat cards, pipeline breakdown, recent applications, top active jobs, and quick actions.

---

## Phase 1: MVP — A Working ATS

Goal: A recruiter can sign up, create jobs, add candidates, track applications, and upload resumes.

### Milestone 1: Foundation ✅

Infrastructure, auth, database schema — the base everything else builds on.

- [x] Nuxt 4 project scaffold with `app/` directory structure
- [x] PostgreSQL + MinIO + Adminer via Docker Compose
- [x] Drizzle ORM with postgres.js driver (`server/utils/db.ts`)
- [x] Zod-validated env vars (`server/utils/env.ts`)
- [x] Auto-apply migrations on startup (`server/plugins/migrations.ts`)
- [x] Better Auth with org plugin (`server/utils/auth.ts`)
- [x] Auth catch-all route (`server/api/auth/[...all].ts`)
- [x] Auth client (`app/utils/auth-client.ts`)
- [x] Domain schema: job, candidate, application, document tables
- [x] Relations between all domain tables
- [x] Context engineering setup (copilot-instructions, agents, prompts, domain instructions)

### Milestone 2: Auth UI & Navigation ✅

Users can sign up, sign in, create/switch orgs, and see an app shell.

- [x] Sign-up page (`app/pages/auth/sign-up.vue`)
- [x] Sign-in page (`app/pages/auth/sign-in.vue`)
- [x] Auth middleware — redirect unauthenticated users (`app/middleware/auth.ts`)
- [x] Guest middleware — redirect authenticated users from auth pages (`app/middleware/guest.ts`)
- [x] Require-org middleware — redirect to org creation (`app/middleware/require-org.ts`)
- [x] Organization creation flow (post-signup) (`app/pages/onboarding/create-org.vue`)
- [x] Organization switcher component (`app/components/OrgSwitcher.vue`)
- [x] App layout with sidebar navigation (`app/layouts/dashboard.vue`)
- [x] Auth layout for sign-in/sign-up forms (`app/layouts/auth.vue`)
- [x] Sidebar component with nav, icons, dynamic job context tabs, and sign-out (`app/components/AppSidebar.vue`)
- [x] Current org composable (`app/composables/useCurrentOrg.ts`)
- [x] Server-side auth guard utility (`server/utils/requireAuth.ts`)
- [x] Root page placeholder (`app/pages/index.vue`) — later replaced by landing page (Milestone 2.5)
- [x] Dashboard placeholder page (`app/pages/dashboard/index.vue`)

### Milestone 2.5: Public Landing Page ✅

Dark-mode marketing page communicating the product vision to visitors.

- [x] Public landing page with Hero, Value Props, How It Works, Tech Stack, CTA, Footer (`app/pages/index.vue`)
- [x] Dark design aesthetic: `#09090b` bg, glass-like borders, subtle glow effects, grid pattern (Linear/Resend/Raycast style)
- [x] `lucide-vue-next` icon library for high-quality, tree-shakeable icons
- [x] Brand SVGs for tech stack section (Nuxt, PostgreSQL)
- [x] Auth-aware navbar — Dashboard link for authenticated users, Sign In/Get Started for guests
- [x] SEO meta tags via `useSeoMeta` (title, description, OpenGraph)
- [x] `useHead` body background override to prevent light-mode bleed on dark page
- [x] Roadmap showcase section on landing page — mini timeline with Shipped/Building/Vision counts and CTA to full roadmap

### Milestone 2.6: Public Roadmap Page ✅

Cinematic horizontal-scrolling roadmap page showing product progress.

- [x] Public roadmap page (`app/pages/roadmap.vue`) — horizontal timeline with glassmorphism cards
- [x] 15 milestone cards with title, description, icon, feature highlights list
- [x] Color-coded statuses: green (shipped), blue (building), purple (vision)
- [x] Intro card — same card style as milestones, centered on page load
- [x] Smooth horizontal scroll — mousewheel-to-horizontal conversion with requestAnimationFrame easing
- [x] Timeline axis with scroll-tracking progress glow (green → blue gradient)
- [x] End CTA — "Shape the future" with GitHub Issues and Get Started buttons
- [x] Auth-aware navbar matching landing page
- [x] Dark theme consistent with landing page (`#09090b`, glass borders, ambient glow blobs)
- [x] Linked from landing page navbar, footer, and roadmap showcase section

### Milestone 3: Job Management ✅

Full CRUD for jobs with status workflow.

- [x] API: `GET /api/jobs` — list jobs (org-scoped)
- [x] API: `POST /api/jobs` — create job
- [x] API: `GET /api/jobs/:id` — job detail
- [x] API: `PATCH /api/jobs/:id` — update job
- [x] API: `DELETE /api/jobs/:id` — delete/archive job
- [x] Composable: `useJobs()` — list + mutations
- [x] Composable: `useJob(id)` — single job + mutations
- [x] Page: Jobs list (`app/pages/dashboard/jobs/index.vue`)
- [x] Page: Job detail/edit (`app/pages/dashboard/jobs/[id].vue`)
- [x] Page: Job creation form (`app/pages/dashboard/jobs/new.vue`)
- [x] Job status transitions UI (draft → open → closed → archived)
- [x] Shared Zod validation schemas (`server/utils/schemas/job.ts`)
- [x] Sidebar Jobs link enabled

### Milestone 4: Candidate Management ✅

Full CRUD for candidates with deduplication.

- [x] API: `GET /api/candidates` — list candidates (org-scoped)
- [x] API: `POST /api/candidates` — create candidate (dedupe by email)
- [x] API: `GET /api/candidates/:id` — candidate detail
- [x] API: `PATCH /api/candidates/:id` — update candidate
- [x] API: `DELETE /api/candidates/:id` — delete candidate
- [x] Composable: `useCandidates()` and `useCandidate(id)`
- [x] Page: Candidates list
- [x] Page: Candidate detail (with applications & documents tabs)
- [x] Page: Candidate creation form

### Milestone 5: Applications & Pipeline ✅

Link candidates to jobs, track through hiring stages.

- [x] API: `GET /api/applications` — list (filterable by job, status, candidate)
- [x] API: `POST /api/applications` — create (link candidate → job)
- [x] API: `GET /api/applications/:id` — application detail with candidate, job, and question responses
- [x] API: `PATCH /api/applications/:id` — update status (with transition validation), notes, score
- [x] Composable: `useApplications(filters)` — list + create mutation
- [x] Composable: `useApplication(id)` — detail + update mutation
- [x] Zod validation schemas (`server/utils/schemas/application.ts`)
- [x] Status transition validation (define allowed transitions)
- [x] Unique constraint on `(organizationId, candidateId, jobId)` to prevent duplicate applications
- [x] Pipeline/Kanban view per job (`app/pages/dashboard/jobs/[id]/pipeline.vue`)
- [x] Pipeline card component (`app/components/PipelineCard.vue`)
- [x] Applications list page (`app/pages/dashboard/applications/index.vue`)
- [x] Application detail page (`app/pages/dashboard/applications/[id].vue`)
- [x] "Apply candidate to job" modal from job detail page (`ApplyCandidateModal.vue`)
- [x] "Apply to job" modal from candidate detail page (`ApplyToJobModal.vue`)
- [x] Sidebar Applications link enabled
- [x] Public apply endpoint duplicate application check
- [x] Job detail page restructured to `[id]/index.vue` for nested pipeline route
- [x] Candidates table view per job (`app/pages/dashboard/jobs/[id]/candidates.vue`) — Supabase-style data table with click-to-open detail sidebar
- [x] Candidate detail sidebar component (`app/components/CandidateDetailSidebar.vue`) — slide-over panel with status transitions, notes, question responses
- [x] Sidebar "Candidates" tab in job context sub-nav

### Milestone 6: Document Storage ✅

Upload and manage resumes/cover letters via MinIO.

- [x] MinIO S3 client utility (`server/utils/s3.ts`)
- [x] API: `POST /api/candidates/:id/documents` — upload (multipart/form-data → MinIO)
- [x] API: `GET /api/documents/:id/download` — download (server-proxied streaming)
- [x] API: `GET /api/documents/:id/preview` — inline PDF preview (server-proxied streaming, same-origin iframe)
- [x] API: `DELETE /api/documents/:id` — delete (MinIO + DB)
- [x] Resume upload component on candidate detail page
- [x] Document list on candidate detail page
- [x] Inline PDF preview in candidate detail sidebar and candidate page
- [x] Composable: `useDocuments()` — upload, download, preview URL, delete
- [x] Security: private S3 bucket policy enforced on startup
- [x] Security: filename sanitization (`sanitizeFilename`) for all uploads
- [x] Security: per-candidate document limit (20) enforced on public apply
- [x] Security: `storageKey` filtered from all API responses
- [x] Security: global security headers via Nitro route rules (`X-Frame-Options`, `X-Content-Type-Options`, etc.)
- [x] Security: Docker Compose ports bound to `127.0.0.1`

### Milestone 7: Public Job Board & Application Form (in progress)

Public-facing pages where applicants can discover open jobs and submit applications.

#### Sub-milestone 7a: Custom Application Forms & Public Submission ✅

Recruiters can configure custom questions per job. Applicants can apply through a public form.

- [x] Schema: `jobQuestion` and `questionResponse` tables with `question_type` enum
- [x] API: `GET /api/jobs/:id/questions` — list custom questions (org-scoped)
- [x] API: `POST /api/jobs/:id/questions` — add question to a job
- [x] API: `PATCH /api/jobs/:id/questions/:questionId` — update question
- [x] API: `DELETE /api/jobs/:id/questions/:questionId` — delete question
- [x] API: `PUT /api/jobs/:id/questions/reorder` — bulk reorder questions
- [x] API: `GET /api/public/jobs/:slug` — public job detail + custom questions (no auth)
- [x] API: `POST /api/public/jobs/:slug/apply` — public application submission (no auth)
- [x] Candidate auto-creation with email deduplication on submission
- [x] Application record creation linking candidate → job
- [x] Question response storage per application
- [x] Composable: `useJobQuestions()` — CRUD for questions
- [x] Component: `QuestionForm.vue` — create/edit question form
- [x] Component: `JobQuestions.vue` — question list manager with reorder
- [x] Component: `DynamicField.vue` — renders questions as form fields (9 types incl. file upload)
- [x] Integration: Application Form section on job detail page
- [x] Shareable application link (shown when job status is `open`)
- [x] Page: Public application form (`app/pages/jobs/[slug]/apply.vue`)
- [x] Page: Submission confirmation (`app/pages/jobs/[slug]/confirmation.vue`)
- [x] Layout: Public layout for unauthenticated pages (`app/layouts/public.vue`)
- [x] Anti-spam: honeypot field on submission form
- [x] Zod validation schemas for questions and public applications
- [x] Application Form tab page (`app/pages/dashboard/jobs/[id]/application-form.vue`) — dedicated page for questions + shareable link
- [x] Dynamic sidebar tabs for job sub-pages (Overview, Pipeline, Application Form)
- [x] `file_upload` question type — recruiters can add file upload fields to application forms
- [x] Public apply endpoint: multipart/form-data support with S3 upload and magic byte MIME validation

#### Sub-milestone 7b: Public Job Board ✅

- [x] Public job listing page — browse open jobs, no auth required (`app/pages/jobs/index.vue`)
- [x] Public job detail page — view description, requirements, location (`app/pages/jobs/[slug]/index.vue`)
- [x] API: `GET /api/public/jobs` — list open jobs (no auth)
- [x] SEO-friendly slug-based URLs for public job pages (e.g. `/jobs/senior-engineer-a1b2c3d4`)
- [x] Custom slug support — recruiters can set a custom slug, defaults to job title
- [x] Slug auto-generated from title + short UUID on job creation, regenerated on title/slug update
- [x] Resume file upload to MinIO during submission (depends on Milestone 6)
- [x] IP-based rate limiting on public submission endpoint (`server/utils/rateLimit.ts`)

### Milestone 8: Dashboard ✅

At-a-glance overview for recruiters.

- [x] Dashboard API: `GET /api/dashboard/stats` — aggregated stats (open jobs, candidates, apps, unreviewed), pipeline breakdown, jobs by status, recent applications, top active jobs — all org-scoped
- [x] Composable: `useDashboard()` — wraps stats endpoint with computed unwrappers
- [x] Dashboard page with stat cards (Open Jobs, Candidates, Applications, Unreviewed) — clickable, navigate to filtered list views
- [x] Pipeline overview widget — stacked bar chart with color-coded status segments and legend
- [x] Jobs by status widget — counts per status (draft, open, closed, archived)
- [x] Recent applications widget — last 10 with candidate name, job title, status badge, relative time
- [x] Top active jobs widget — top 5 open jobs by application count with new/unreviewed badges
- [x] "Create Job" and "Add Candidate" quick actions in header
- [x] Welcome empty state for new orgs with CTA to create first job
- [x] Loading skeleton states for all widgets
- [x] Responsive layout (1-col mobile → 4-col desktop)

---

## Phase 2: Intelligence

Goal: AI helps recruiters find the best candidates — transparently.

### Milestone 9: Resume Parsing

- [ ] PDF text extraction service
- [ ] Structured data extraction (contact, experience, education, skills → JSON)
- [ ] Store parsed output in `document.parsedContent`
- [ ] Display parsed resume on candidate detail page
- [ ] Auto-fill candidate fields from parsed resume

### Milestone 10: AI Candidate Ranking (Glass Box)

- [ ] Ranking criteria schema (configurable per job)
- [ ] AI matching engine (job requirements ↔ candidate skills)
- [ ] Matching Logic summary — visible explanation per candidate
- [ ] Highlighted skill matches on candidate cards
- [ ] Sort/filter by AI score
- [ ] Local AI via Ollama as alternative to cloud

---

## Phase 3: Collaboration

Goal: Teams can work together on hiring decisions.

### Milestone 11: Team Collaboration

- [ ] Comments/notes on applications (threaded)
- [ ] Activity log per candidate/job
- [ ] Role-based permissions (recruiter, hiring manager, admin)

### Milestone 12: Communication

- [ ] Interview scheduling
- [ ] Email templates for candidate outreach
- [ ] Candidate portal (view application status)

---

## Phase 4: Production Readiness

Goal: Ready for real teams to self-host in production.

### Milestone 13: Hardening

- [x] Production deployment — Hetzner CX23 VPS, Caddy reverse proxy, systemd service, deploy script
- [x] HTTPS/TLS — Caddy auto-TLS + Cloudflare CDN (Full strict SSL)
- [x] DNS + CDN — Cloudflare Free plan with DDoS protection and AI bot blocking
- [ ] Backup & restore (Postgres + MinIO)
- [x] Rate limiting — in-memory sliding window (`server/utils/rateLimit.ts`), applied to public apply endpoint
- [x] Global security headers — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection`, `Permissions-Policy` via Nitro route rules
- [x] Private S3 bucket policy enforcement on startup (deny anonymous access)
- [x] Filename sanitization for all document uploads
- [x] Docker Compose ports bound to `127.0.0.1` (not exposed to network)
- [x] Server-proxied document access (no presigned URLs exposed to clients)
- [x] In-app feedback — floating button in dashboard creates GitHub Issues for bug reports and feature requests, with per-user rate limiting and server-side GitHub PAT (`server/api/feedback.post.ts`, `FeedbackButton.vue`, `FeedbackModal.vue`)
- [ ] GDPR data export & deletion
- [ ] Test suite (API + E2E)
- [ ] CI/CD pipeline
- [ ] README rewrite with screenshots

---

## Completed Milestones

| Milestone | Completed |
|-----------|-----------|
| 1. Foundation | 2026-02-14 |
| 2. Auth UI & Navigation | 2026-02-14 |
| 2.5. Public Landing Page | 2026-02-14 |
| 2.6. Public Roadmap Page | 2026-02-15 |
| 3. Job Management | 2026-02-14 |
| 7a. Custom Application Forms & Public Submission | 2026-02-14 |
| 7b. Public Job Board | 2026-02-14 |
| 4. Candidate Management | 2026-02-14 |
| 5. Applications & Pipeline | 2026-02-14 |
| 6. Document Storage | 2026-02-15 |
| 8. Dashboard | 2026-02-15 |

---

## How to Use This File

**As a developer**: Check "Current Focus" to know what to build next. Check off tasks as you finish them. Add new tasks when you discover work.

**As AI**: Read this file to understand what's implemented and what isn't. Don't rebuild completed work. Follow the dependency order (milestones are ordered by dependency).

**As a contributor**: Pick any unchecked task from the current focus milestone. Open an issue or PR referencing the task.
