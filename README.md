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

You need three tools installed: **Git**, **Node.js** (v20 or later), and **Docker Desktop** (or Docker Engine on Linux). Pick your operating system below and follow every step — even if you've never used a terminal before.

<details>
<summary><strong>🐧 Linux (Ubuntu / Debian)</strong></summary>

Open a terminal (`Ctrl + Alt + T`).

**1. Install Git**

```bash
sudo apt update && sudo apt install -y git
```

Verify: `git --version` → should print something like `git version 2.x.x`.

**2. Install Node.js (LTS)**

The version in your distro's default repos is often outdated. Use the official NodeSource installer:

```bash
# Download the NodeSource setup script for the latest LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x -o nodesource_setup.sh

# Run the setup script
sudo -E bash nodesource_setup.sh

# Install Node.js
sudo apt install -y nodejs
```

Verify:
```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 10.x.x or higher
```

**3. Install Docker Engine + Docker Compose**

```bash
# Install Docker's official GPG key and repository
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the Docker repository (DEB822 format)
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Allow your user to run Docker without `sudo` (log out and back in after this):

```bash
sudo usermod -aG docker $USER
```

> **Important:** Log out and log back in (or reboot) for the group change to take effect.

Verify:
```bash
docker --version          # should print Docker version 2x.x.x
docker compose version    # should print Docker Compose version v2.x.x
```

> **Debian users:** Replace `ubuntu` with `debian` in the `URIs` line above. For other distros, see [Docker's official install docs](https://docs.docker.com/engine/install/).

</details>

<details>
<summary><strong>🍎 macOS</strong></summary>

Open **Terminal** (press `Cmd + Space`, type "Terminal", hit Enter).

**1. Install Homebrew** (macOS package manager)

If you don't have Homebrew yet:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the on-screen instructions. When it finishes, it may ask you to run two commands to add Homebrew to your PATH — **run those commands**.

Verify: `brew --version`

**2. Install Git**

macOS may have Git pre-installed. Check with `git --version`. If it's not installed or prompts you to install Xcode command-line tools, either accept that prompt or run:

```bash
brew install git
```

**3. Install Node.js (LTS)**

```bash
brew install node
```

This installs the latest Node.js version (v20+ is required). Verify:

```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 10.x.x or higher
```

**4. Install Docker Desktop**

```bash
brew install --cask docker
```

After installation, **open Docker Desktop** from your Applications folder (or Spotlight: `Cmd + Space` → "Docker"). Wait until the Docker icon in the menu bar shows a steady state (not "starting…").

> **First time?** Docker Desktop may ask for your password and to enable some system extensions — accept these prompts.

Verify:
```bash
docker --version          # should print Docker version 2x.x.x
docker compose version    # should print Docker Compose version v2.x.x
```

</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

**1. Install Git**

Download and run the Git installer from [git-scm.com/downloads/win](https://git-scm.com/downloads/win). During installation:
- Accept all default options
- When asked about the default editor, pick whichever you prefer (Notepad is fine)
- When asked about adjusting your PATH, choose **"Git from the command line and also from 3rd-party software"** (the recommended option)

**2. Install Node.js (LTS)**

Download the Windows installer (`.msi`) from [nodejs.org](https://nodejs.org) — click the big **LTS** download button. During installation:
- Accept the defaults
- Check the box for **"Automatically install the necessary tools"** if prompted

**3. Install Docker Desktop**

Download Docker Desktop from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/). During installation:
- ✅ Check **"Use WSL 2 instead of Hyper-V"** (recommended)
- If prompted, install the **WSL 2 Linux kernel update** — follow the link Docker gives you, download and install it, then continue
- **Restart your computer** when asked

After restarting:
1. Open **Docker Desktop** from the Start menu
2. Accept the terms of service
3. Wait until Docker says "Docker Desktop is running" in the bottom-left

> **Troubleshooting WSL 2:** If Docker complains about WSL 2, open PowerShell as Administrator and run:
> ```powershell
> wsl --install
> ```
> Then restart your computer and try again.

**4. Open a terminal**

For all remaining steps, use **Git Bash** (installed with Git) or **PowerShell**. To open Git Bash: right-click on your Desktop → "Open Git Bash Here".

Verify everything is installed:
```bash
git --version            # git version 2.x.x
node --version           # v20.x.x or higher
npm --version            # 10.x.x or higher
docker --version         # Docker version 2x.x.x
docker compose version   # Docker Compose version v2.x.x
```

</details>

---

### Step-by-step installation

Once you have Git, Node.js, and Docker installed and running, follow these steps in your terminal.

**1. Clone the repository**

```bash
git clone https://github.com/applirank/applirank.git
cd applirank
```

**2. Create your environment file**

```bash
cp .env.example .env
```

Now open the `.env` file in any text editor and replace the placeholder values. Here's what each variable does:

```env
# ── Database (used by Docker Compose to create the Postgres container) ──
DB_USER=admin
DB_PASSWORD=pick-a-strong-password        # ← change this
DB_NAME=applirank

# ── Database connection string (used by the app — must match the above) ──
DATABASE_URL=postgresql://admin:pick-a-strong-password@localhost:5432/applirank

# ── Object Storage (used by Docker Compose for the MinIO container) ──
STORAGE_USER=admin
STORAGE_PASSWORD=pick-another-password     # ← change this (min 8 characters)

# ── Object Storage (used by the app — must match the above) ──
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=admin                        # ← same as STORAGE_USER
S3_SECRET_KEY=pick-another-password        # ← same as STORAGE_PASSWORD
S3_BUCKET=applirank

# ── Auth ──
BETTER_AUTH_SECRET=generate-a-random-secret-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

> **How to generate a random secret** for `BETTER_AUTH_SECRET`:
> ```bash
> # macOS / Linux
> openssl rand -base64 32
>
> # Windows (PowerShell)
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
> ```
> Copy the output and paste it as the value of `BETTER_AUTH_SECRET`.

> **Important:** The `DB_PASSWORD` must match the password in `DATABASE_URL`, and `STORAGE_PASSWORD` must match `S3_SECRET_KEY`. If they don't match, the app can't connect to the database or file storage.

**3. Start the infrastructure**

```bash
docker compose up -d
```

This downloads and starts three containers in the background:
- **PostgreSQL 16** — the database (port 5432)
- **MinIO** — file storage for resumes/documents (ports 9000 + 9001)
- **Adminer** — a web-based database viewer (port 8080, optional)

Wait about 10–15 seconds for everything to start. You can check status with:

```bash
docker compose ps
```

All three services should show `running` (or `healthy`).

**4. Install dependencies and start the app**

```bash
npm install
npm run dev
```

The first run will:
1. Install all JavaScript packages (~30 seconds)
2. Run database migrations automatically
3. Create the S3 storage bucket automatically
4. Start the dev server

**5. Open the app**

Open your browser and go to **[http://localhost:3000](http://localhost:3000)**. You should see the Applirank landing page. Click **Get Started** to create your account and organization.

---

### Seed demo data (optional)

To populate your local instance with realistic sample data (5 jobs, 30 candidates, 65+ applications across all pipeline stages):

```bash
npm run db:seed
```

This creates a demo user you can sign in with:
- **Email:** `demo@applirank.com`
- **Password:** `demo1234`

---

### Useful local URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **App** | [http://localhost:3000](http://localhost:3000) | Applirank application |
| **Adminer** | [http://localhost:8080](http://localhost:8080) | Database browser (System: PostgreSQL, Server: `db`, use your `DB_USER`/`DB_PASSWORD`) |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) | File storage admin (use your `STORAGE_USER`/`STORAGE_PASSWORD`) |

---

### Stopping and restarting

```bash
# Stop everything (keeps your data)
docker compose down

# Start again later
docker compose up -d
npm run dev
```

To **delete all data** and start fresh:

```bash
docker compose down -v    # -v removes the database and file storage volumes
docker compose up -d
npm run dev               # migrations will re-create the tables
```

---

### Troubleshooting

| Problem | Solution |
|---------|----------|
| `docker: command not found` | Docker isn't installed or not in your PATH. Re-check the install steps above. On Windows, make sure Docker Desktop is running. |
| `docker compose` fails | Make sure Docker Desktop is **running** (check the system tray / menu bar icon). On Linux, make sure you logged out and back in after adding your user to the `docker` group. |
| Port 5432 already in use | You have another PostgreSQL instance running. Stop it first, or change the port in `docker-compose.yml`. |
| `npm run dev` shows database connection errors | Make sure Docker containers are running (`docker compose ps`). Check that `DATABASE_URL` in `.env` matches `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. |
| `EACCES permission denied` on npm install (macOS/Linux) | Don't use `sudo npm install`. Fix npm permissions: [docs.npmjs.com/resolving-eacces-permissions-errors](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally) |
| MinIO / S3 errors | Check that `S3_ACCESS_KEY` matches `STORAGE_USER` and `S3_SECRET_KEY` matches `STORAGE_PASSWORD` in your `.env`. |

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
