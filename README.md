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

> **TL;DR for experienced developers:**
> ```bash
> git clone https://github.com/applirank/applirank.git && cd applirank
> cp .env.example .env          # then edit passwords (see below)
> docker compose up -d           # start Postgres + MinIO
> npm install && npm run dev     # app → http://localhost:3000
> ```

---

### Prerequisites

Install **Git**, **Node.js** (v20+), and **Docker**. Expand your OS below for one-click instructions.

<details>
<summary><strong>🐧 Linux (Ubuntu / Debian)</strong></summary>

```bash
# 1. Git
sudo apt update && sudo apt install -y git

# 2. Node.js (LTS) via NodeSource
curl -fsSL https://deb.nodesource.com/setup_lts.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs

# 3. Docker Engine
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 4. Let your user run Docker without sudo (log out & back in after this)
sudo usermod -aG docker $USER
```

> **Debian users:** Replace `ubuntu` with `debian` in the `URIs` line. For other distros see [Docker docs](https://docs.docker.com/engine/install/).

</details>

<details>
<summary><strong>🍎 macOS</strong></summary>

```bash
# 1. Install Homebrew (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Git, Node.js, and Docker Desktop
brew install git node
brew install --cask docker
```

After installing, **open Docker Desktop** from Applications and wait for it to start.

</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

Download and install these three things (accept all defaults):

1. **Git** → [git-scm.com/downloads/win](https://git-scm.com/downloads/win)
2. **Node.js LTS** → [nodejs.org](https://nodejs.org) (click the big LTS button)
3. **Docker Desktop** → [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) — check **"Use WSL 2"** during install, restart when asked

After restarting, open **Docker Desktop** and wait until it says "running". Use **Git Bash** or **PowerShell** for the steps below.

> If Docker complains about WSL 2, run `wsl --install` in PowerShell (as Admin) and restart.

</details>

---

### Installation

```bash
git clone https://github.com/applirank/applirank.git
cd applirank
cp .env.example .env          # then edit passwords (see below)
docker compose up -d           # start Postgres + MinIO
npm install && npm run dev     # app → http://localhost:3000
```

Migrations and S3 bucket creation happen automatically on first run.

### Configure `.env`

Open `.env` and change the `changeme` values. The key rule: **passwords must match their counterparts**.

| Variable | Must match |
|----------|------------|
| `DB_PASSWORD` | the password in `DATABASE_URL` |
| `STORAGE_PASSWORD` | `S3_SECRET_KEY` |
| `DB_USER` / `STORAGE_USER` | `DATABASE_URL` username / `S3_ACCESS_KEY` |

Generate an auth secret:
```bash
# macOS / Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
```

Paste the output as `BETTER_AUTH_SECRET`.

### Seed demo data (optional)

```bash
npm run db:seed
# Creates demo user: demo@applirank.com / demo1234
```

### Useful local URLs

| Service | URL |
|---------|-----|
| **App** | [localhost:3000](http://localhost:3000) |
| **Adminer** (DB browser) | [localhost:8080](http://localhost:8080) |
| **MinIO Console** | [localhost:9001](http://localhost:9001) |

### Stopping and restarting

```bash
docker compose down              # stop (keeps data)
docker compose up -d && npm run dev  # start again

docker compose down -v           # stop + delete all data
```

<details>
<summary><strong>Troubleshooting</strong></summary>

| Problem | Fix |
|---------|-----|
| `docker: command not found` | Docker isn't installed or Docker Desktop isn't running |
| `docker compose` fails | Make sure Docker Desktop is **running**. On Linux, log out & back in after `usermod` |
| Port 5432 already in use | Another Postgres is running — stop it or change the port in `docker-compose.yml` |
| Database connection errors | Check `DATABASE_URL` matches `DB_USER` + `DB_PASSWORD` in `.env` |
| MinIO / S3 errors | Check `S3_ACCESS_KEY` matches `STORAGE_USER` and `S3_SECRET_KEY` matches `STORAGE_PASSWORD` |
| `EACCES` on npm install | Don't use `sudo`. See [npm docs](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally) |

</details>

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

Applirank is in early development and contributions are welcome. Check the [Roadmap](ROADMAP.md) for unchecked tasks in the current focus milestone — those are the best places to start.

## License

[Elastic License 2.0](LICENSE) — free to use, self-host, and modify. You may not offer Applirank as a managed service to third parties. See [LICENSE](LICENSE) for full terms.
