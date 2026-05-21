# Reqcore Production Operations Runbook

This runbook is for a production candidate release. It does not approve use with
real candidate data by itself; it defines the checks and evidence that must be
attached to the launch decision.

## Release Gate

Record these before deploying:

- Repository and branch.
- Commit SHA.
- Node version from `.nvmrc`.
- `npm ci`, `npm run test:unit`, `npm run typecheck`, `npm run build`.
- `npm audit --audit-level=high`.
- `gitleaks detect --source . --config .gitleaks.toml --redact --verbose`.
- `npm run ops:validate-production-env -- <production-env-file-or-export>`.
- `npm run ops:backup-restore-rehearsal`.
- `npm run test:e2e` against Postgres and S3-compatible storage.
- CI run URL for PR validation, secret scan, CodeQL, backup restore rehearsal, and e2e on the exact candidate commit.

## Environment

Required production settings:

- `DATABASE_URL` points to a private PostgreSQL instance.
- `BETTER_AUTH_URL` is the public HTTPS app URL.
- `BETTER_AUTH_SECRET` is a generated secret with at least 32 characters.
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, and `S3_BUCKET` point to private object storage.
- `S3_FORCE_PATH_STYLE` matches the provider: `true` for MinIO, normally `false` for managed S3 providers.
- `BETTER_AUTH_TRUSTED_ORIGINS` is explicit when more than one domain can reach the app.
- `CRON_SECRET`, OAuth, SSO, SMTP, Resend, AI provider, and telemetry secrets are generated per environment.

Never copy example credentials into production.

Before launch, export the exact production values into a local file or run the
preflight inside the deployment environment:

```bash
npm run ops:validate-production-env -- .env.production
```

This preflight fails on placeholder secrets, localhost or HTTP public URLs,
partial OAuth/OIDC provider config, invalid S3 path-style values, and other
configuration that should not reach real candidate data.

## Deployment

For Docker/self-hosted deployments:

```bash
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs app --tail=200
```

Confirm:

- App responds on `/api/healthz`.
- App responds on `/api/readyz`.
- Logs show migrations completed.
- Logs show S3 bucket readiness or managed-provider detection.
- The database and object storage ports are not publicly exposed.

## Backup

Database backup:

```bash
mkdir -p ./backups
docker compose -f docker-compose.production.yml exec -T db \
  pg_dump -U reqcore --no-owner --no-acl reqcore > ./backups/reqcore-$(date +%Y%m%d-%H%M%S).sql
```

Object storage backup for MinIO volume deployments:

```bash
docker run --rm \
  -v reqcore_minio_data:/data \
  -v "$PWD/backups:/backup" \
  alpine tar czf /backup/minio-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

Configuration backup:

```bash
cp .env ./backups/env-$(date +%Y%m%d-%H%M%S).backup
```

Store backups somewhere separate from the app host.

## Restore Rehearsal

Run the local rehearsal before approving a production candidate:

```bash
npm run ops:backup-restore-rehearsal
```

Attach the output to the launch decision. This proves the SQL dump/restore
mechanics work on the workstation or CI runner. The same check runs in the
`Backup Restore Rehearsal` workflow for pull requests and manual release
validation. A real production launch also needs a restore rehearsal using a
sanitized production-like backup and a separate restore target.

Restore to a clean Docker database:

```bash
docker compose -f docker-compose.production.yml down
docker volume rm reqcore_postgres_data
docker compose -f docker-compose.production.yml up -d db
cat ./backups/reqcore-YYYYMMDD-HHMMSS.sql | \
  docker compose -f docker-compose.production.yml exec -T db psql -U reqcore reqcore
docker compose -f docker-compose.production.yml up -d app
```

Confirm `/api/readyz` returns 200 and spot-check auth, jobs, candidates, and
document download/preview.

## Monitoring

At minimum, monitor:

- `/api/healthz` for liveness.
- `/api/readyz` for database readiness.
- App 5xx rate.
- Postgres availability and disk usage.
- Object storage availability.
- Backup job success and backup age.
- Certificate expiration.

Alerts need an owner, escalation path, and credential access procedure.

## Rollback

Rollback requires both code and data awareness:

1. Stop new deployments.
2. Identify the last known good commit or image tag.
3. Check whether the failed release applied migrations.
4. If migrations are backward-compatible, redeploy the last known good app.
5. If data restore is required, restore database and object storage from the
   same timestamped backup set.
6. Verify `/api/readyz`, sign-in, candidate list, job list, and document access.
7. Record the incident, root cause, and any credential rotation performed.

## Incident Basics

For suspected data exposure or auth bypass:

1. Disable public access at the load balancer or platform level.
2. Preserve logs and the deployed commit SHA.
3. Rotate affected secrets.
4. Run Gitleaks against the candidate branch and relevant logs/artifacts.
5. Identify affected organizations, candidates, documents, and integrations.
6. Re-enable only after the failing path is reproduced, fixed, tested, and
   reviewed.
