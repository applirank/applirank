# Self-Hosting Reqcore — The Complete Guide

Everything you need to deploy, manage, and update your own Reqcore applicant tracking system. No technical background required.

---

## Table of Contents

1. [What is Self-Hosting?](#what-is-self-hosting)
2. [Why Self-Host Reqcore?](#why-self-host-reqcore)
3. [Requirements](#requirements)
4. [Quick Start (5 Minutes)](#quick-start-5-minutes)
5. [Step-by-Step Installation](#step-by-step-installation)
6. [Updating Your Instance](#updating-your-instance)
7. [Backups & Data Safety](#backups--data-safety)
8. [Custom Domain & HTTPS](#custom-domain--https)
9. [Email Configuration](#email-configuration)
10. [Security Best Practices](#security-best-practices)
11. [Monitoring & Health Checks](#monitoring--health-checks)
12. [Troubleshooting](#troubleshooting)
13. [FAQ](#faq)

---

## What is Self-Hosting?

Self-hosting means running Reqcore on a server you control — your own computer, a rented server, or a cloud virtual machine — instead of using a service managed by someone else. Your recruitment data, candidate documents, and hiring pipeline stay entirely under your control.

Think of it like the difference between renting an apartment and owning a house. With self-hosting, you hold the keys. Nobody else can access your data, change the terms of service, or shut down the platform on you.

**What you get:**
- Complete ownership of all candidate data, documents, and hiring records
- No per-seat pricing — unlimited team members at zero marginal cost
- No data leaves your network unless you choose to integrate external services
- Full source code access — you can audit, modify, and extend everything

---

## Why Self-Host Reqcore?

### Data Sovereignty
Your candidate resumes, interview feedback, and hiring pipeline live on your infrastructure. This matters for organizations with data residency requirements (GDPR, industry regulations) or those who simply want the peace of mind that comes with data ownership.

### Cost Predictability
A single $5–10/month VPS handles Reqcore for most teams. Compare that to cloud ATS platforms that charge $50–200 per seat per month. For a team of 10, that could mean saving $6,000+ annually.

### Zero Vendor Lock-in
The database is standard PostgreSQL. Documents are stored in S3-compatible storage (MinIO). If you ever want to switch tools or export your data, standard database and S3 tools work out of the box.

### Privacy by Default
No analytics, no tracking, no data sharing with third parties. The only telemetry is PostHog analytics, which is disabled by default in self-hosted mode and must be explicitly configured if desired.

---

## Requirements

### What You Need (The Minimum)

| Requirement | Details |
|-------------|---------|
| **A computer or server** | Any modern Linux machine, Mac, or Windows PC with WSL2 |
| **Docker Desktop** | Free software that packages Reqcore and its dependencies together |
| **2 GB RAM** | The minimum. 4 GB is comfortable for teams with heavy usage |
| **10 GB disk space** | For the application, database, and uploaded documents |
| **Internet connection** | Only needed for initial setup and pulling updates |

### Recommended Server Providers (If You Don't Have a Server)

If you need to rent a server, these providers offer affordable options suitable for Reqcore:

| Provider | Minimum Plan | Monthly Cost | Notes |
|----------|-------------|--------------|-------|
| **Hetzner** | CX22 (2 vCPU, 4 GB RAM) | ~€4/month | Best value. European data centers. |
| **DigitalOcean** | Basic Droplet (1 vCPU, 2 GB RAM) | $12/month | Beginner-friendly interface. |
| **Vultr** | Cloud Compute (1 vCPU, 2 GB RAM) | $12/month | Global data centers. |
| **Railway** | Hobby Plan | $5/month | One-click deploy. See README for details. |

All of these providers offer one-click Docker installation when creating a server, which simplifies the setup further.

---

## Quick Start (5 Minutes)

If you have Docker already installed and just want to get running:

```bash
# 1. Download Reqcore
git clone https://github.com/reqcore-inc/reqcore.git
cd reqcore

# 2. Generate secure passwords (one-time)
./setup.sh

# 3. Start everything
docker compose up -d

# 4. Open your browser
# → http://localhost:3000
```

That's it. Sign up, create your organization, and start hiring.

**Want demo data to explore first?**

```bash
docker compose exec app npm run db:seed
```

Then sign in with `demo@reqcore.com` / `demo1234`.

---

## Step-by-Step Installation

### Step 1: Install Docker

Docker packages Reqcore and all its dependencies (database, file storage) into isolated containers. You install Docker once, and everything else is handled automatically.

**On Ubuntu/Debian (most common server OS):**

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Allow your user to run Docker without sudo
sudo usermod -aG docker $USER

# Log out and back in for the group change to take effect
exit
# Then reconnect to your server
```

**On Mac:**
Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) and follow the installer.

**On Windows:**
Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/). Ensure WSL2 is enabled (Docker Desktop will prompt you if it's not).

**Verify it's working:**

```bash
docker --version
# Should print something like: Docker version 24.x.x
```

### Step 2: Download Reqcore

```bash
git clone https://github.com/reqcore-inc/reqcore.git
cd reqcore
```

If you don't have `git` installed:

```bash
# Ubuntu/Debian
sudo apt install git

# Mac (comes with Xcode Command Line Tools)
xcode-select --install
```

### Step 3: Generate Secure Credentials

Reqcore needs database passwords and authentication secrets. The setup script generates cryptographically random values for you:

```bash
./setup.sh
```

This creates a `.env` file with all necessary configuration. **Never share or commit this file** — it contains your database passwords and authentication secrets.

### Step 4: Start Reqcore

```bash
docker compose up -d
```

The `-d` flag runs everything in the background. The first startup takes 2–5 minutes as Docker downloads the required images and builds the application.

**What's happening behind the scenes:**
1. Docker starts a **PostgreSQL 16** database for your data
2. Docker starts **MinIO** (S3-compatible storage) for document uploads
3. Docker builds and starts the **Reqcore application**
4. Database migrations run automatically to create all required tables

### Step 5: Create Your Account

Open your browser and navigate to:

```
http://localhost:3000
```

If you're running on a remote server, replace `localhost` with your server's IP address (e.g., `http://203.0.113.42:3000`).

1. Click **Sign Up**
2. Enter your name, email, and a strong password
3. Create your organization (e.g., your company name)
4. You're ready to start posting jobs and tracking candidates

---

## Updating Your Instance

### Method 1: Update from the UI (Recommended)

Reqcore includes a built-in update system accessible from the Settings panel. No command line needed.

1. Sign in to your Reqcore instance
2. Go to **Settings → Updates**
3. The page automatically checks for new versions
4. If an update is available, click **"Create backup first"** (recommended)
5. Click **"Update to vX.Y.Z"** and confirm
6. Wait for the update to complete (usually under 2 minutes)
7. Refresh the page

The UI shows the progress of each update step and clearly indicates success or failure. Your data is always preserved — database migrations run automatically.

### Method 2: Update from the Command Line

If you prefer using the terminal, or the UI update isn't available:

```bash
# Navigate to your Reqcore directory
cd /path/to/reqcore

# Pull the latest version
git pull origin main

# Rebuild and restart
docker compose up --build -d
```

The entire process takes 2–5 minutes depending on your server's speed. There's about 30 seconds of downtime while the new container starts.

### What Happens During an Update

1. **Code pull**: The latest version is downloaded from GitHub
2. **Docker rebuild**: A new container image is built with the updated code
3. **Container restart**: The old container is replaced with the new one
4. **Migrations**: Database schema changes are applied automatically
5. **Ready**: The application is available at the same URL

**Your data is never lost during updates.** The database and uploaded files live in Docker volumes that persist across container rebuilds.

### Update Notifications

The Settings → Updates page automatically checks whether a new version is available by comparing your installed version against the latest GitHub release. No data is sent to any external service — only a single API call to GitHub's public releases endpoint.

---

## Backups & Data Safety

### Automatic Pre-Update Backups

Before applying any update through the UI, you can click the **"Create backup first"** button. This creates a full PostgreSQL dump that you can restore from if anything goes wrong.

### Manual Database Backup

```bash
# Create a backup
docker compose exec db pg_dump -U reqcore reqcore > backup-$(date +%Y%m%d).sql

# Restore from a backup (⚠️ this replaces all current data)
cat backup-20260315.sql | docker compose exec -T db psql -U reqcore reqcore
```

### Automated Daily Backups (Optional)

Add this to your server's crontab (`crontab -e`) to create daily backups:

```bash
# Daily backup at 2 AM, keep last 30 days
0 2 * * * cd /path/to/reqcore && docker compose exec -T db pg_dump -U reqcore reqcore > /path/to/backups/reqcore-$(date +\%Y\%m\%d).sql && find /path/to/backups -name "reqcore-*.sql" -mtime +30 -delete
```

### Document Backups

Uploaded documents (resumes, cover letters) are stored in MinIO. To back them up:

```bash
# Copy MinIO data to a local directory
docker cp reqcore_minio:/data ./minio-backup-$(date +%Y%m%d)
```

### Full Instance Backup

For a complete backup of everything (database + documents + configuration):

```bash
# Stop the instance briefly
docker compose stop

# Backup Docker volumes
docker run --rm -v reqcore_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
docker run --rm -v reqcore_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz -C /data .

# Copy your .env file (contains passwords)
cp .env .env.backup

# Restart
docker compose up -d
```

---

## Custom Domain & HTTPS

### Using a Reverse Proxy (Recommended)

For production deployments, place a reverse proxy (Caddy, Nginx, or Traefik) in front of Reqcore to handle HTTPS certificates automatically.

**Option A: Caddy (Simplest — Automatic HTTPS)**

Caddy automatically obtains and renews Let's Encrypt certificates. Install Caddy on your server, then create a `Caddyfile`:

```
ats.yourcompany.com {
    reverse_proxy localhost:3000
}
```

Start Caddy:

```bash
caddy start
```

That's it. Caddy handles HTTPS certificates automatically.

**Option B: Nginx + Certbot**

```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx

# Configure Nginx
sudo tee /etc/nginx/sites-available/reqcore <<EOF
server {
    listen 80;
    server_name ats.yourcompany.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 25M;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/reqcore /etc/nginx/sites-enabled/
sudo certbot --nginx -d ats.yourcompany.com
```

### DNS Setup

Point your domain to your server's IP address by adding an A record at your DNS provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | ats | Your server's IP (e.g., 203.0.113.42) | 300 |

### Update Environment Variables

After setting up a custom domain, update your `.env` file:

```bash
BETTER_AUTH_URL=https://ats.yourcompany.com
NUXT_PUBLIC_SITE_URL=https://ats.yourcompany.com
```

Then restart:

```bash
docker compose up --build -d
```

---

## Email Configuration

By default, Reqcore logs email content to the console (useful for development). For production, configure a transactional email service.

### Using Resend (Recommended)

1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month)
2. Verify your sending domain
3. Create an API key
4. Add to your `.env` file:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL="Reqcore <noreply@yourcompany.com>"
```

5. Restart: `docker compose up --build -d`

This enables:
- Team member invitation emails
- Interview scheduling notifications
- Candidate communication emails

---

## Security Best Practices

### What's Already Secured For You

Reqcore ships with security defaults that require no configuration:

- **All services are localhost-bound** — PostgreSQL, MinIO, and Adminer are never exposed to the internet. Only the application port (3000) is accessible externally.
- **Automatic CSRF protection** via Better Auth
- **Encrypted OAuth tokens** with AES-256-GCM
- **Rate limiting** on sensitive endpoints
- **Security headers** — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restricting camera/microphone/geolocation
- **File upload validation** — MIME type verification, file size limits, filename sanitization
- **Server-proxied downloads** — uploaded files are never served directly from storage; they pass through the application server, which enforces authentication and authorization
- **Deny-by-default access control** — every API endpoint checks org membership and role permissions

### Additional Recommendations

**Use a firewall:**

```bash
# Ubuntu/Debian — only allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Keep Docker updated:**

```bash
sudo apt update && sudo apt upgrade docker-ce docker-ce-cli containerd.io
```

**Use strong passwords:** The `setup.sh` script generates cryptographically random passwords. Don't replace them with weak alternatives.

**Enable automatic security updates:**

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Monitoring & Health Checks

### Built-in System Health Dashboard

Navigate to **Settings → Updates** in your Reqcore instance to view:

- **Service status** — Real-time health of the application, database, and file storage
- **System resources** — Memory usage, uptime, deployment method
- **Version info** — Current version and available updates
- **Changelog** — What changed in each version

### Docker Health Checks

All services include built-in health checks. Check their status:

```bash
# View service health
docker compose ps

# View logs for a specific service
docker compose logs app       # Application logs
docker compose logs db        # Database logs
docker compose logs minio     # Storage logs
```

### Uptime Monitoring (Optional)

For production instances, consider using a free uptime monitoring service:

- [UptimeRobot](https://uptimerobot.com) — Free tier: 50 monitors, 5-minute checks
- [Healthchecks.io](https://healthchecks.io) — Free tier: cron job monitoring

Point the monitor at your Reqcore URL (e.g., `https://ats.yourcompany.com`) and get notified if your instance goes down.

---

## Troubleshooting

### "Cannot connect to the Docker daemon"

Docker isn't running. Start it:

```bash
# Linux
sudo systemctl start docker

# Mac/Windows
# Open Docker Desktop application
```

### "Port 3000 is already in use"

Another application is using port 3000. Either stop that application or change Reqcore's port:

```bash
# In docker-compose.yml, change the ports line for the app service:
ports:
  - "8080:3000"  # Access Reqcore on port 8080 instead
```

### "Database connection refused"

The database container might still be starting. Wait 30 seconds and try again:

```bash
# Check if all services are healthy
docker compose ps

# Restart everything
docker compose down && docker compose up -d
```

### "Permission denied" running setup.sh

```bash
chmod +x setup.sh
./setup.sh
```

### Container keeps restarting

Check the logs to see what's wrong:

```bash
docker compose logs app --tail 50
```

Common causes:
- Missing environment variables — re-run `./setup.sh`
- Database not ready yet — wait 30 seconds and check again

### Update failed

If an update fails mid-way, your previous version is still running safely. To manually recover:

```bash
# Check what went wrong
docker compose logs app --tail 100

# Rebuild from current state
docker compose up --build -d
```

### Need to start fresh

```bash
# ⚠️ This deletes ALL data (database, uploaded files, configuration)
docker compose down -v
rm .env
./setup.sh
docker compose up -d
```

---

## FAQ

### How much does self-hosting cost?

The software is completely free. Your only costs are server hosting ($5–15/month for most teams) and a domain name (~$12/year, optional).

### Can I run Reqcore on my laptop?

Yes. Docker Desktop runs on Mac, Windows, and Linux. Reqcore works fine on a laptop for small teams or evaluation purposes. For production use with a team, a dedicated server is recommended so the system stays online when your laptop is off.

### How many team members can I have?

Unlimited. There are no per-seat limits in self-hosted Reqcore.

### Is my data backed up automatically?

Not by default. See the [Backups & Data Safety](#backups--data-safety) section for automated backup instructions. The UI provides a one-click backup button before updates.

### Can I migrate from another ATS?

Reqcore uses standard PostgreSQL. If you can export your data as CSV or JSON from your current ATS, you can import it using standard database tools. We're working on import wizards for popular ATS platforms.

### How do I know when an update is available?

Go to **Settings → Updates** in your Reqcore dashboard. The page automatically checks for new versions and shows you exactly what changed, with a one-click update button.

### What happens if an update breaks something?

Updates are designed to be safe — database migrations are tested before release, and the update process is designed to fail gracefully. If something does go wrong:
1. Your previous data is always preserved in Docker volumes
2. You can restore from a backup (create one before updating)
3. You can roll back: `git checkout v1.0.0 && docker compose up --build -d`

### Can I move my instance to a different server?

Yes. Back up your data (database dump + MinIO files + `.env`), install Docker on the new server, clone Reqcore, restore your backups, and start the containers. All your data moves with you.

### Do I need to know Linux/command line?

For initial setup: basic familiarity with opening a terminal and copying commands is helpful. After that, day-to-day management (including updates) can be done entirely from the web UI through **Settings → Updates**.

### Can I run multiple instances?

Yes. Each instance needs its own directory, `.env` file, and ports. Change the port mapping in `docker-compose.yml` (e.g., `8080:3000` for the second instance).

### How do I get help?

- **GitHub Issues**: [github.com/reqcore-inc/reqcore/issues](https://github.com/reqcore-inc/reqcore/issues)
- **Discussions**: [github.com/reqcore-inc/reqcore/discussions](https://github.com/reqcore-inc/reqcore/discussions)
- **Documentation**: This guide and the project README

---

## Architecture Overview

For those interested in what's running under the hood:

```
┌─────────────────────────────────────────────────┐
│  Your Server                                    │
│                                                 │
│  ┌────────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  Reqcore    │  │PostgreSQL│  │    MinIO     │ │
│  │  App        │  │    16    │  │  (S3 Storage)│ │
│  │  :3000      │  │  :5432   │  │  :9000/:9001│ │
│  └─────┬──────┘  └────┬─────┘  └──────┬──────┘ │
│        │              │               │         │
│        └──────────────┴───────────────┘         │
│              Docker Network (internal)          │
│                                                 │
│  Only port 3000 is exposed externally           │
└─────────────────────────────────────────────────┘
```

| Component | Purpose | Storage |
|-----------|---------|---------|
| **Reqcore App** | Web application (Nuxt 4, Node.js) | Stateless (rebuilt on update) |
| **PostgreSQL 16** | All application data (jobs, candidates, pipeline) | `postgres_data` Docker volume |
| **MinIO** | Uploaded documents (resumes, cover letters) | `minio_data` Docker volume |

Data lives in Docker volumes, which persist across container restarts and rebuilds. The application container is stateless and can be rebuilt at any time without data loss.

---

## Summary

| Task | How | Difficulty |
|------|-----|------------|
| Install | Clone + `./setup.sh` + `docker compose up` | Easy (5 min) |
| Update (UI) | Settings → Updates → Click "Update" | Easy (2 min) |
| Update (CLI) | `git pull` + `docker compose up --build -d` | Easy (2 min) |
| Backup | Settings → Updates → "Create backup" | Easy (1 click) |
| Custom domain | Add reverse proxy (Caddy recommended) | Medium (15 min) |
| Email | Add Resend API key to `.env` | Easy (5 min) |
| Monitor | Settings → Updates → System Health | Built-in |

Self-hosting Reqcore is designed to be straightforward for anyone comfortable with downloading software and opening a web browser. The built-in update system, backup tools, and health dashboard mean you rarely need to touch the command line after initial setup.
