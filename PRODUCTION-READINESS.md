# Reqcore Production Readiness Plan

Assessment date: 2026-05-21
Repo: https://github.com/reqcore-inc/reqcore
Baseline commit: `ee89062a847b2b7a237f7878656c5a8d97fa8435`
Release/tag in checkout: `v1.4.0`
License: AGPL-3.0

## Verdict

Reqcore is not production-approved for real candidate data yet.

The codebase is promising and has several strong production signals: active upstream maintenance, a coherent Nuxt/Postgres/S3 architecture, private document serving, centralized RBAC, security headers, dependency automation, release smoke tests, passing core local checks, and passing Docker-backed Playwright flows. The remaining gap is launch readiness depth. Before production with real candidate data, we still need required CI branch protections, a deployment runbook with backup/restore evidence, AGPL review, and production environment/processor decisions.

## What Changed In This Readiness Pass

- Added explicit `test`, `test:unit`, and `typecheck` scripts so CI runs existing checks directly.
- Added Node runtime expectations through `engines.node` and `.nvmrc`.
- Updated PR and e2e workflows to use the pinned Node version.
- Added `.gitleaks.toml` and a `Secret Scan` workflow that runs Gitleaks against full repository history.
- Added a `CodeQL` workflow for JavaScript/TypeScript SAST with security-extended and security-and-quality queries.
- Added an `ops:backup-restore-rehearsal` script and `Backup Restore Rehearsal` workflow so SQL dump/restore proof runs as a CI gate.
- Added an `ops:validate-production-env` preflight with unit coverage for production secret, URL, storage, provider, email, and telemetry configuration.
- Made PR validation report lint as "not configured" instead of silently presenting a skipped lint gate as green.
- Fixed constant-time secret comparison for long cron/OAuth state secrets by adding `timingSafeStringEqual`.
- Added a minimal unauthenticated `/api/healthz` liveness endpoint.
- Added unauthenticated `/api/readyz` readiness endpoint that returns 503 until the database schema is present.
- Fixed e2e CI startup so the app runtime owns migrations instead of double-applying schema after `drizzle-kit push`.
- Added static security coverage tests for route auth gates, direct-resource org scoping, list scoping, and body-supplied `organizationId` ignores.
- Added DB-backed Playwright tenant-isolation checks for interviews, scoring, properties, stale membership/session access, DOCX preview denial, owner document parse/delete, invite-link edge cases, source-tracking stats isolation, activity-log resource filters, and multi-org active-organization switching.
- Added DB-backed Playwright coverage for secondary admin and per-user surfaces: SSO providers, AI config management, email template management, chatbot agent/folder/conversation privacy, and Better Auth member-management endpoints.
- Added RBAC matrix coverage and tightened admin/member permissions so organization deletion is owner-only and comment deletion is admin/owner-only.
- Tightened member access so AI config and email template management are admin/owner-controlled.
- Added `PRODUCTION-RUNBOOK.md` and `scripts/backup-restore-rehearsal.sh` so deployment, monitoring, rollback, and backup/restore expectations are executable and reviewable.
- Fixed the live `requirePermission` gate to reject Better Auth `{ success: false }` permission results instead of only checking for transport/API errors.
- Rejected empty `requirePermission(event, {})` calls instead of treating them as authorized.
- Remediated all npm audit advisories by updating dependencies and pinning runtime expectations to Node 22.22+.

## Production Gates

| Gate | Status | Done Criteria |
|---|---|---|
| Core install/test/build | Passing locally | `npm ci`, `npm run test:unit`, `npm run typecheck`, `npm run build`, and `npm audit --audit-level=high` pass on the release candidate. |
| Playwright e2e | Passing locally | 16 Playwright tests passed against a production build, fresh Postgres, and MinIO. CI e2e should be required before merge. |
| Tenant isolation | Covered for core and major secondary IDOR paths | Static tests assert key direct-resource and list-route org scoping; Playwright proves org B cannot read or mutate org A jobs, candidates, applications, interviews, documents, tracking links/stats, scoring, custom properties, comments, uploads, AI config, email templates, SSO providers, chatbot resources, or member-management views. It also proves stale memberships lose protected access. |
| RBAC | Covered at policy and route level | Matrix tests cover owner/admin/member expectations, including owner-only org deletion, admin/owner-only comment deletion, and admin/owner-controlled AI config/email template management. Playwright verifies a live member session can perform expected recruiter work and is denied for job create/update/delete, candidate delete, document delete, comment edit/delete, invite-link creation, org settings update, AI config mutation, email template mutation, SSO provider management, and Better Auth member-management mutation. |
| Unauthenticated access | Covered statically and for core request paths | All non-public API routes must contain an auth/session gate; expected public routes are explicitly allowlisted. Playwright covers 401/403 behavior for the most important direct-resource and document paths. |
| Document security | Covered for core paths | Playwright covers upload accept/reject behavior with S3-backed storage, successful owner download/PDF preview, DOCX inline preview denial, owner parse/delete, cross-org denial, unauthenticated denial, and cross-org/anonymous parse/delete denial. |
| Invite links | Covered for high-risk token edges | Playwright verifies public info does not return the token, anonymous accept is denied, max-use exhaustion returns 410, revoked links return 404, and expired links return 404. |
| Source/activity isolation | Covered for core analytics filters | Playwright verifies source-tracking stats and activity-log resource filters do not leak org A application/job/link/candidate data to org B, and verifies public tracking redirects preserve only the expected `ref` target. |
| Chatbot privacy | Covered for per-user resources | Playwright verifies chatbot folders, agents, and conversations are scoped by both active organization and user, while same-org members can create and manage only their own chatbot resources when the feature flag is enabled. |
| Dependency security | Passing | `npm audit --audit-level=high` and full `npm audit --json` report 0 vulnerabilities after dependency updates. |
| Secrets | Improved | Gitleaks passes locally and in CI. Any real leaked credential requires rotation, not just allowlisting. |
| Static application security testing | Added | CodeQL is configured for JavaScript/TypeScript on PRs, `main`, weekly schedule, and manual dispatch. Before production, require a passing CodeQL result on the exact candidate. |
| Production environment preflight | Partially covered | `npm run ops:validate-production-env -- <env-file>` catches placeholder secrets, non-HTTPS public URLs, partial OIDC/OAuth config, weak cron secrets, S3 path-style mismatches, missing email provider posture, and telemetry processor-review prompts. It still needs to be run against the real production environment values before launch. |
| Legal/license | Open | AGPL-3.0 obligations are reviewed and accepted for the intended deployment and any proprietary integrations. |
| Deployment/runbook | Partially covered | `PRODUCTION-RUNBOOK.md` defines deployment, environment, monitoring, rollback, and incident procedures. `scripts/backup-restore-rehearsal.sh` verifies SQL dump/restore mechanics locally and through the `Backup Restore Rehearsal` CI workflow. Before real candidate data, run the rehearsal against a sanitized production-like backup and confirm object storage restore. |

## P0 Before Real Candidate Data

1. Require PR validation, e2e, secret scan, CodeQL, and backup restore rehearsal checks in branch protection.
2. Run Playwright e2e on the exact production candidate branch in CI before any release decision.
3. Keep npm audit at 0 high/critical and triage any new moderate/low advisories before launch.
4. Confirm production environment configuration:
   - Run `npm run ops:validate-production-env -- <env-file>` against the exact production values or an exported secret-manager snapshot.
   - `BETTER_AUTH_URL` is the public HTTPS URL.
   - `BETTER_AUTH_SECRET`, `S3_SECRET_KEY`, OAuth/SSO secrets, SMTP secrets, and `CRON_SECRET` are generated secrets and not copied from examples.
   - Postgres and MinIO/S3 are private, backed up, and restorable.
   - `S3_FORCE_PATH_STYLE` matches the storage provider.
   - `BETTER_AUTH_TRUSTED_ORIGINS` is explicit for multi-domain deployments.
5. Run and attach backup/restore evidence from a sanitized production-like database and object-storage backup.
6. Decide data processor posture for optional integrations:
   - Email provider for invitations and resets.
   - AI provider/API keys for scoring or criteria generation.
   - PostHog or any telemetry endpoint, if enabled.
7. Complete AGPL-3.0 review before using this in a proprietary hosted workflow.

## P1 For A Small Production Pilot

- Add a real lint/format gate or formally decide not to have one.
- Wire `/api/healthz` into the production load balancer or uptime monitor.
- Add monitoring and alerting for app availability, error rate, disk usage, backup success, DB availability, and storage availability.
- Add provider-live success-path tests for configured SSO and AI providers before enabling those integrations with production data.
- Define incident response basics: who owns alerts, where credentials live, how to rotate secrets, how to disable risky integrations, and how to roll back a release.
- Define data retention and deletion expectations for candidate resumes, applications, interview notes, and logs.

## Production Candidate Commands

Run these on the release candidate commit and attach the outputs to the launch decision:

```bash
node --version
git rev-parse HEAD
npm ci
npm run test:unit
npm run typecheck
npm run build
npm audit --audit-level=high
gitleaks detect --source . --config .gitleaks.toml --redact --verbose
npm run ops:validate-production-env -- .env.production
npm run ops:backup-restore-rehearsal
npm run test:e2e
```

For Docker/self-hosted release validation:

```bash
./setup.sh
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs app --tail=200
```

## Ownership Risk

Upstream appears active, but the bus factor is still a production concern: GitHub attribution shows one primary human contributor plus Dependabot. If the team builds around Reqcore, we should plan for fork ownership, patch maintenance, dependency updates, and security triage rather than assuming upstream will carry operational risk for us.

## Latest Local Evidence

Collected on 2026-05-21 from this readiness branch:

| Command | Result | Notes |
|---|---|---|
| `npm ci` | Pass | Installed dependencies successfully. |
| `npm run test:unit` | Pass | 24 test files, 385 tests. |
| `npm run typecheck` | Pass with warning | Vue/Volar `vue-router/volar/sfc-route-blocks` export warning remains. |
| `npm run build` | Pass with warnings | Nuxt/Nitro production build completed; Tailwind sourcemap warnings remain. |
| `npm audit --audit-level=high` | Pass | 0 vulnerabilities. |
| `gitleaks detect --source . --config .gitleaks.toml --redact --verbose` | Pass | Full repository history scanned, no leaks found. |
| `npx vitest run tests/unit/production-env-validation.test.ts` | Pass | 6 tests cover complete production-like envs, placeholder rejection, partial provider rejection, HTTPS provider requirements, human-approval warnings, and `.env` parsing. |
| `npm run ops:validate-production-env -- .env.example` | Expected fail | Confirms the preflight rejects documented example credentials and localhost public URLs. |
| `npm run ops:backup-restore-rehearsal` | Pass | Disposable Postgres dump/restore rehearsal passed with `postgres:16-alpine`; verified sentinel row count 1. |
| Workflow YAML parse | Pass | PR validation, e2e, secret-scan, CodeQL, and backup-restore workflow files parse as YAML. |
| `npx playwright test e2e/security/tenant-isolation.spec.ts` | Pass | 3 tests passed against production build, fresh Postgres, and MinIO; verifies cross-org and unauthenticated denial for jobs, candidates, applications, interviews, scores, properties, tracking links/stats, comments, uploads, document download, preview, parse, and delete. Also verifies stale membership/session access is denied, owner DOCX parse/delete, DOCX preview denial, live member RBAC allow/deny paths, invite-link auth/max-use/revocation/expiration edges, source/activity isolation, multi-org active switching, SSO provider isolation, AI config/admin controls, email template/admin controls, chatbot per-user privacy, and Better Auth member-management denial paths. |
| `npx playwright test` | Pass | 16 tests passed against production build on Node 22.22.0, fresh Postgres, and MinIO after the secondary-surface expansion. Local run used ports 15432/19000 because this workstation already had Postgres on 5432. |
