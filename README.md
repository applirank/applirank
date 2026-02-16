<div align="center">

# Applirank

**The open-source ATS you own. No per-seat fees. No data lock-in. No secret algorithms.**

[Live Demo](https://demo.applirank.com) · [Documentation](ARCHITECTURE.md) · [Roadmap](ROADMAP.md) · [Report Bug](https://github.com/applirank/applirank/issues/new)

[![License: ELv2](https://img.shields.io/badge/License-ELv2-blue.svg)](LICENSE)

</div>

---

Most recruiting software holds your candidate data hostage behind per-seat pricing and opaque algorithms. Applirank is different — it runs on **your** infrastructure, your team scales without increasing your software bill, and when AI ranks a candidate, it shows you exactly why.

## Why Applirank?

| | **Applirank** | Greenhouse | Lever | Ashby | OpenCATS |
|---|:---:|:---:|:---:|:---:|:---:|
| **Open source** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Self-hosted** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **No per-seat pricing** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Own your data** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Transparent AI ranking** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Modern tech stack** | Nuxt 4 / Vue 3 | — | — | — | PHP 5 |
| **Active development** | ✅ 2026 | ✅ | ✅ | ✅ | ❌ Stale |
| **Resume parsing** | 🔜 | ✅ | ✅ | ✅ | ❌ |
| **Pipeline / Kanban** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Public job board** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Document storage** | ✅ MinIO | ✅ | ✅ | ✅ | ✅ |
| **Custom application forms** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Local AI (privacy-first)** | 🔜 Ollama | ❌ | ❌ | ❌ | ❌ |

## Features

- **Job management** — Create, edit, and track jobs through draft → open → closed → archived
- **Candidate pipeline** — Drag candidates through screening → interview → offer → hired with a Kanban board
- **Public job board** — SEO-friendly job listings with custom slugs that applicants can browse and apply to
- **Custom application forms** — Add custom questions (text, select, file upload, etc.) per job
- **Document storage** — Upload and manage resumes and cover letters via S3-compatible storage (MinIO)
- **Multi-tenant organizations** — Isolated data per organization with role-based membership
- **Recruiter dashboard** — At-a-glance stats, pipeline breakdown, recent applications, and top active jobs
- **Server-proxied documents** — Resumes are never exposed via public URLs; all access is authenticated and streamed

## Quick Start

```bash
git clone https://github.com/applirank/applirank.git
cd applirank
cp .env.example .env          # configure your environment
docker compose up -d           # start Postgres + MinIO
npm install && npm run dev     # app at http://localhost:3000
```

Migrations run automatically on startup. That's it.

### Seed demo data

To populate your local instance with realistic sample data (5 jobs, 30 candidates, 65+ applications across all pipeline stages):

```bash
npm run db:seed
```

This creates a demo user (`demo@applirank.com` / `demo1234`) with a pre-configured organization.

### Environment Variables

```env
# Database
DB_USER=applirank
DB_PASSWORD=your-secure-password
DB_NAME=applirank
DATABASE_URL=postgresql://applirank:your-secure-password@localhost:5432/applirank

# Auth
BETTER_AUTH_SECRET=your-secret-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# Object Storage (MinIO)
STORAGE_USER=minioadmin
STORAGE_PASSWORD=minioadmin
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=applirank
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3 + Nitro) |
| Database | PostgreSQL 16 |
| ORM | [Drizzle ORM](https://orm.drizzle.team) + postgres.js |
| Auth | [Better Auth](https://www.better-auth.com) with organization plugin |
| Storage | [MinIO](https://min.io) (S3-compatible) |
| Validation | [Zod v4](https://zod.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Icons | [Lucide](https://lucide.dev) (tree-shakeable) |

## Project Structure

```
app/                          # Frontend (Nuxt 4 srcDir)
  pages/                      #   File-based routing
  components/                 #   Auto-imported Vue components
  composables/                #   Auto-imported composables (useJobs, useCandidates, etc.)
  layouts/                    #   Dashboard, auth, and public layouts
server/                       # Backend (Nitro)
  api/                        #   REST API routes (authenticated + public)
  database/schema/            #   Drizzle ORM table definitions
  database/migrations/        #   Generated SQL migrations
  utils/                      #   Auto-imported utilities (db, auth, env, s3)
  plugins/                    #   Startup plugins (migrations, S3 bucket)
docker-compose.yml            # Postgres + MinIO + Adminer
```

## Deployment

Applirank is designed to run on a single VPS. The reference deployment uses:

| Component | Role |
|-----------|------|
| **Hetzner Cloud CX23** | 2 vCPU, 4GB RAM, Ubuntu 24.04 (~€5/mo) |
| **Caddy** | Reverse proxy with automatic HTTPS |
| **Cloudflare** | DNS, DDoS protection, edge SSL (free tier) |
| **Docker Compose** | Postgres + MinIO (localhost only) |
| **systemd** | Process management with auto-restart |

### Deploy

```bash
ssh deploy@your-server '~/deploy.sh'
# Pulls latest code, installs, builds, restarts — zero downtime
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full deployment architecture diagram.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:generate` | Generate migrations from schema changes |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Drizzle Studio (database browser) |

## Roadmap

Applirank is actively developed. Here's what's next:

| Status | Milestone |
|--------|-----------|
| ✅ Shipped | Jobs, Candidates, Applications, Pipeline, Documents, Dashboard, Public Job Board, Custom Forms |
| 🔨 Building | Resume parsing (PDF → structured data) |
| 🔮 Planned | AI candidate ranking (Glass Box — shows matching logic), team collaboration, email notifications, candidate portal |

See the full [Roadmap](ROADMAP.md) and [Product Vision](PRODUCT.md).

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## License

[Elastic License 2.0](LICENSE) — free to use and self-host. See the license file for details.

## Contributing

Applirank is in early development and contributions are welcome. Check the [Roadmap](ROADMAP.md) for unchecked tasks in the current focus milestone — those are the best places to start.

## License

[Elastic License 2.0](LICENSE) — free to use, self-host, and modify. You may not offer Applirank as a managed service to third parties. See [LICENSE](LICENSE) for full terms.
