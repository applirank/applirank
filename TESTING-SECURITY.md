# Testing & Security Plan — Team Collaboration Features

> Threat model, vulnerability analysis, and comprehensive test plan for the RBAC, comments, activity log, and organization features in Reqcore.

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Authentication Vulnerabilities](#2-authentication-vulnerabilities)
3. [Authorization & RBAC Vulnerabilities](#3-authorization--rbac-vulnerabilities)
4. [Organization Isolation Vulnerabilities](#4-organization-isolation-vulnerabilities)
5. [Comments — Attack Surface](#5-comments--attack-surface)
6. [Activity Log — Attack Surface](#6-activity-log--attack-surface)
7. [Invitation System — Attack Surface](#7-invitation-system--attack-surface)
8. [Input Validation Vulnerabilities](#8-input-validation-vulnerabilities)
9. [Rate Limiting & Denial of Service](#9-rate-limiting--denial-of-service)
10. [Data Leakage & Information Disclosure](#10-data-leakage--information-disclosure)
11. [Race Conditions & TOCTOU](#11-race-conditions--toctou)
12. [Integration Test Plan](#12-integration-test-plan)
13. [E2E Test Plan](#13-e2e-test-plan)
14. [Security Checklist](#14-security-checklist)
15. [Test Data Setup](#15-test-data-setup)

---

## 1. Threat Model

### Actors

| Actor | Description | Motivation |
|-------|-------------|------------|
| **Unauthenticated attacker** | No account. Probing endpoints. | Data theft, enumeration, denial of service. |
| **Authenticated user (no org)** | Has an account but hasn't created or joined an organization. | Bypass org requirement, access other users' data. |
| **Member** | Lowest-privilege org role. | Privilege escalation — try to create/delete jobs, delete comments or candidates they shouldn't touch. |
| **Admin** | Mid-privilege. | Escalate to owner, delete org, access other orgs. |
| **Owner** | Full privilege in their org. | Access other organizations' data (cross-tenant). |
| **Former member** | Was removed from org but still authenticated. | Stale session — access data after removal. |
| **Multi-org user** | Belongs to Org A and Org B. | Cross-tenant access — use Org A session to read Org B data. |

### Assets to Protect

| Asset | Impact if Compromised |
|-------|----------------------|
| Candidate PII (name, email, phone) | Privacy violation, legal liability (GDPR). |
| Job postings (draft/unpublished) | Competitive intelligence leak. |
| Internal comments | Reputational damage, legal exposure. |
| Activity log | Audit integrity — if tampered, incident response fails. |
| Organization membership | Unauthorized access to all org data. |
| Invitation tokens | Account takeover of invited users. |

---

## 2. Authentication Vulnerabilities

### 2.1 Missing session cookie

**What could go wrong:** An API route forgets to call `requirePermission()` and processes the request without authentication.

**How to test:**

```
TEST-AUTH-001: Hit every API route without a session cookie → expect 401 on all.
```

| # | Test Case | Method | URL | Expected |
|---|-----------|--------|-----|----------|
| A001 | No cookie — list jobs | GET | `/api/jobs` | 401 |
| A002 | No cookie — create job | POST | `/api/jobs` | 401 |
| A003 | No cookie — list comments | GET | `/api/comments?targetType=job&targetId=<uuid>` | 401 |
| A004 | No cookie — create comment | POST | `/api/comments` | 401 |
| A005 | No cookie — update comment | PATCH | `/api/comments/<uuid>` | 401 |
| A006 | No cookie — delete comment | DELETE | `/api/comments/<uuid>` | 401 |
| A007 | No cookie — list activity | GET | `/api/activity-log` | 401 |
| A008 | No cookie — list candidates | GET | `/api/candidates` | 401 |
| A009 | No cookie — create candidate | POST | `/api/candidates` | 401 |
| A010 | No cookie — list applications | GET | `/api/applications` | 401 |
| A011 | No cookie — create application | POST | `/api/applications` | 401 |
| A012 | No cookie — dashboard stats | GET | `/api/dashboard/stats` | 401 |
| A013 | No cookie — upload document | POST | `/api/candidates/<uuid>/documents` | 401 |
| A014 | No cookie — delete document | DELETE | `/api/documents/<uuid>` | 401 |
| A015 | No cookie — download document | GET | `/api/documents/<uuid>/download` | 401 |
| A016 | No cookie — preview document | GET | `/api/documents/<uuid>/preview` | 401 |

### 2.2 Invalid/expired session

**What could go wrong:** A tampered or expired session cookie is accepted.

```
TEST-AUTH-002: Send a request with a garbage session cookie → expect 401.
TEST-AUTH-003: Send a request with an expired session → expect 401.
TEST-AUTH-004: Log out, then reuse the old session cookie → expect 401.
```

### 2.3 Session after org removal

**What could go wrong:** A user is removed from an org but their session still has `activeOrganizationId` set to that org. They continue making API calls.

```
TEST-AUTH-005: Remove a member from Org A. Before they refresh their session,
              send a request with their old session → expect 403.
              Better Auth's hasPermission should reject because they're no longer a member.
```

---

## 3. Authorization & RBAC Vulnerabilities

### 3.1 Privilege escalation — member tries admin/owner actions

This is the most critical category. Every action that members cannot do must be tested.

```
TEST-RBAC-001: Member tries to create a job → expect 403.
TEST-RBAC-002: Member tries to update a job → expect 403.
TEST-RBAC-003: Member tries to delete a job → expect 403.
TEST-RBAC-004: Member tries to delete a candidate → expect 403.
TEST-RBAC-005: Member tries to delete an application → expect 403.
TEST-RBAC-006: Member tries to delete a document → expect 403.
TEST-RBAC-007: Member tries to update a comment → expect 403.
TEST-RBAC-008: Member tries to delete a comment → expect 403.
TEST-RBAC-009: Member tries to invite a new member → expect 403.
TEST-RBAC-010: Member tries to remove a member → expect 403.
TEST-RBAC-011: Member tries to change a member's role → expect 403.
TEST-RBAC-012: Member tries to delete the organization → expect 403.
TEST-RBAC-013: Member tries to update org settings → expect 403.
```

### 3.2 Privilege escalation — admin tries owner-only actions

```
TEST-RBAC-014: Admin tries to delete the organization → expect 403.
TEST-RBAC-015: Admin tries to transfer ownership → expect 403.
```

### 3.3 Positive authorization tests (confirm allowed actions work)

```
TEST-RBAC-016: Member can read jobs → expect 200.
TEST-RBAC-017: Member can create a candidate → expect 201.
TEST-RBAC-018: Member can read candidates → expect 200.
TEST-RBAC-019: Member can update a candidate → expect 200.
TEST-RBAC-020: Member can create an application → expect 201.
TEST-RBAC-021: Member can update an application → expect 200.
TEST-RBAC-022: Member can create a comment → expect 201.
TEST-RBAC-023: Member can read comments → expect 200.
TEST-RBAC-024: Member can read the activity log → expect 200.
TEST-RBAC-025: Member can upload a document → expect 201.
TEST-RBAC-026: Member can read/download a document → expect 200.
TEST-RBAC-027: Admin can do everything a member can, plus create/update/delete jobs → expect 2xx.
TEST-RBAC-028: Owner can do everything, including org deletion → expect 2xx.
```

### 3.4 No active organization

**What could go wrong:** A user is authenticated but has no `activeOrganizationId` set. They try to access data.

```
TEST-RBAC-029: Authenticated user with no active org → hit any API route → expect 403 "No active organization".
```

### 3.5 Fabricated permission claims

**What could go wrong:** The `requirePermission` utility receives an empty permission object `{}` and passes because there's nothing to deny.

```
TEST-RBAC-030: Verify that requirePermission with empty permissions {} still enforces
              authentication and active org checks.
              (Note: This is a code-level concern — ensure no route accidentally passes {}.)
```

---

## 4. Organization Isolation Vulnerabilities

This is the second most critical category. All data is scoped to an organization. If the scoping is broken, users in Org A can see data from Org B.

### 4.1 Cross-tenant data access (IDOR)

**What could go wrong:** A user in Org A knows the UUID of a resource in Org B. They request it directly.

```
TEST-IDOR-001: User in Org A fetches GET /api/jobs/<org-b-job-id> → expect 404 (not 200 with Org B data).
TEST-IDOR-002: User in Org A fetches GET /api/candidates/<org-b-candidate-id> → expect 404.
TEST-IDOR-003: User in Org A fetches GET /api/applications/<org-b-application-id> → expect 404.
TEST-IDOR-004: User in Org A fetches GET /api/documents/<org-b-document-id>/download → expect 404.
TEST-IDOR-005: User in Org A fetches GET /api/documents/<org-b-document-id>/preview → expect 404.
TEST-IDOR-006: User in Org A tries PATCH /api/comments/<org-b-comment-id> → expect 404.
TEST-IDOR-007: User in Org A tries DELETE /api/comments/<org-b-comment-id> → expect 404.
```

### 4.2 Cross-tenant list leakage

**What could go wrong:** A list endpoint doesn't filter by `organizationId` and returns data from all orgs.

```
TEST-IDOR-008: Create jobs in Org A and Org B. User in Org A lists jobs → only Org A jobs returned.
TEST-IDOR-009: Create comments in Org A and Org B on same target type. User in Org A lists comments → only Org A comments.
TEST-IDOR-010: Create activity in Org A and Org B. User in Org A lists activity → only Org A activity.
TEST-IDOR-011: Create candidates in Org A and Org B. List in Org A → only Org A candidates.
```

### 4.3 Cross-tenant write via request body manipulation

**What could go wrong:** The POST body includes an `organizationId` field and the server uses it instead of the session's `activeOrganizationId`.

```
TEST-IDOR-012: POST /api/jobs with body { organizationId: "<org-b-id>", title: "Hacked" }
              → job should be created in Org A (from session), not Org B.
TEST-IDOR-013: POST /api/comments with body { organizationId: "<org-b-id>", ... }
              → comment should be created in Org A.
TEST-IDOR-014: POST /api/candidates with body { organizationId: "<org-b-id>", ... }
              → candidate should be created in Org A.
```

### 4.4 Comment on cross-tenant target

**What could go wrong:** A user in Org A creates a comment on a candidate that belongs to Org B. The comment `targetId` is a valid UUID, but in the wrong org.

```
TEST-IDOR-015: User in Org A posts comment with targetType=candidate, targetId=<org-b-candidate-id>
              → expect 404 "candidate not found" (the target existence check filters by orgId).
TEST-IDOR-016: Same test for targetType=application with Org B application ID → expect 404.
TEST-IDOR-017: Same test for targetType=job with Org B job ID → expect 404.
```

### 4.5 Activity log cross-tenant resource filter

**What could go wrong:** The activity log `resourceId` filter parameter is used to probe for existence of resources in other orgs.

```
TEST-IDOR-018: GET /api/activity-log?resourceType=job&resourceId=<org-b-job-id>
              → expect empty results (not an error that leaks "resource exists in another org").
```

---

## 5. Comments — Attack Surface

### 5.1 Authorization edge cases

```
TEST-CMT-001: Member creates a comment → expect 201.
TEST-CMT-002: Member tries to PATCH their own comment → expect 403 (member role lacks comment:update).
TEST-CMT-003: Admin edits their OWN comment → expect 200.
TEST-CMT-004: Admin tries to edit ANOTHER user's comment → expect 403 "You can only edit your own comments".
              (This is the authorship check, not the role check.)
TEST-CMT-005: Owner tries to edit another user's comment → expect 403 "You can only edit your own comments".
              (Even owners can't edit other people's words — but they CAN delete them.)
TEST-CMT-006: Admin deletes another user's comment → expect 204 (admin has comment:delete).
TEST-CMT-007: Owner deletes another user's comment → expect 204.
TEST-CMT-008: Member tries to delete their own comment → expect 403 (member lacks comment:delete).
```

### 5.2 Comment on deleted target

**What could go wrong:** A candidate is deleted, but existing comments referencing that candidate remain queryable. Or a user tries to post a comment on a deleted target.

```
TEST-CMT-009: Delete a candidate. Then POST a comment with targetType=candidate, targetId=<deleted-id>
             → expect 404 "candidate not found".
TEST-CMT-010: Delete a candidate that has comments. GET comments for that target
             → decide on expected behavior:
             Option A: return empty (comments cascade-deleted with candidate)
             Option B: return comments (orphaned but still visible)
             NOTE: Currently, comments are NOT cascade-deleted with the target because
             targetId is not a foreign key — it's a plain text field. This is a design
             decision to consider. Orphaned comments won't cause errors but may confuse users.
```

### 5.3 Comment body content

**What could go wrong:** Malicious content in the comment body.

```
TEST-CMT-011: Create comment with HTML: <script>alert('xss')</script>
             → stored body should contain the raw string (no execution).
             → when rendered on the client, must be escaped (Vue's {{ }} does this by default).
TEST-CMT-012: Create comment with SQL injection payload: '; DROP TABLE comment; --
             → expect 201 (Drizzle uses parameterized queries — payload is stored as literal text).
TEST-CMT-013: Create comment with 10,000 characters (max allowed) → expect 201.
TEST-CMT-014: Create comment with 10,001 characters → expect 422 (Zod rejects).
TEST-CMT-015: Create comment with empty body "" → expect 422 (min 1 char).
TEST-CMT-016: Create comment with body of only whitespace "   " → expect 201 (currently allowed).
             Consider: Should we trim and reject whitespace-only bodies?
TEST-CMT-017: Create comment with unicode/emoji: "Great candidate! 🎉👍" → expect 201.
TEST-CMT-018: Create comment with zero-width characters → expect 201 (stored as-is).
             Consider: Should we strip zero-width characters?
```

### 5.4 Comment ID manipulation

```
TEST-CMT-019: PATCH /api/comments/<non-existent-uuid> → expect 404.
TEST-CMT-020: PATCH /api/comments/not-a-uuid → expect 422 (Zod UUID validation).
TEST-CMT-021: DELETE /api/comments/<non-existent-uuid> → expect 404.
TEST-CMT-022: DELETE /api/comments/not-a-uuid → expect 422.
```

### 5.5 Comment pagination edge cases

```
TEST-CMT-023: GET /api/comments with page=0 → expect 422 (positive integer required).
TEST-CMT-024: GET /api/comments with page=-1 → expect 422.
TEST-CMT-025: GET /api/comments with limit=0 → expect 422 (min 1).
TEST-CMT-026: GET /api/comments with limit=101 → expect 422 (max 100).
TEST-CMT-027: GET /api/comments with page=999999 (beyond data) → expect 200 with empty data array and correct total.
TEST-CMT-028: GET /api/comments without targetType → expect 422.
TEST-CMT-029: GET /api/comments without targetId → expect 422.
TEST-CMT-030: GET /api/comments with targetType=invalid → expect 422.
TEST-CMT-031: GET /api/comments with targetId=not-a-uuid → expect 422.
```

---

## 6. Activity Log — Attack Surface

### 6.1 Immutability

**What could go wrong:** Someone creates, modifies, or deletes activity log entries.

```
TEST-ACT-001: Verify there is no POST /api/activity-log endpoint → expect 404 or 405.
TEST-ACT-002: Verify there is no PATCH /api/activity-log/:id endpoint → expect 404 or 405.
TEST-ACT-003: Verify there is no DELETE /api/activity-log/:id endpoint → expect 404 or 405.
TEST-ACT-004: Attempt to POST to /api/activity-log with a valid body → expect 404/405 (no route).
```

### 6.2 Completeness

**What could go wrong:** An action happens but no activity log entry is recorded.

```
TEST-ACT-005: Create a job → verify activity_log has entry: action=created, resourceType=job.
TEST-ACT-006: Update a job → verify activity_log has entry: action=updated, resourceType=job.
TEST-ACT-007: Delete a job → verify activity_log has entry: action=deleted, resourceType=job.
TEST-ACT-008: Change job status (draft → published) → verify activity_log: action=status_changed, metadata contains from/to.
TEST-ACT-009: Create a candidate → verify activity_log: action=created, resourceType=candidate.
TEST-ACT-010: Update a candidate → verify activity_log: action=updated, resourceType=candidate.
TEST-ACT-011: Delete a candidate → verify activity_log: action=deleted, resourceType=candidate.
TEST-ACT-012: Create an application → verify activity_log: action=created, resourceType=application.
TEST-ACT-013: Change application status → verify activity_log: action=status_changed, metadata has from/to.
TEST-ACT-014: Upload a document → verify activity_log: action=created, resourceType=document.
TEST-ACT-015: Delete a document → verify activity_log: action=deleted, resourceType=document.
TEST-ACT-016: Create a comment → verify activity_log: action=comment_added, resourceType matches targetType.
TEST-ACT-017: Delete a comment → verify activity_log: action=deleted, resourceType=comment.
```

### 6.3 Actor accuracy

**What could go wrong:** The `actorId` in the log entry doesn't match the user who performed the action.

```
TEST-ACT-018: User A creates a job. Verify actorId === User A's ID, not some default or null.
TEST-ACT-019: User B (different user, same org) deletes that job. Verify actorId === User B's ID.
```

### 6.4 Fire-and-forget resilience

**What could go wrong:** If `recordActivity()` throws, the primary operation fails.

```
TEST-ACT-020: Simulate a database error during activity logging (e.g., constraint violation).
             Verify the primary operation (e.g., job creation) still succeeds.
             Verify the error is logged to stderr.
```

### 6.5 Activity log pagination and filtering

```
TEST-ACT-021: GET /api/activity-log with page=0 → expect 422.
TEST-ACT-022: GET /api/activity-log with limit=101 → expect 422.
TEST-ACT-023: GET /api/activity-log with resourceId=not-a-uuid → expect 422.
TEST-ACT-024: GET /api/activity-log with resourceType=job&resourceId=<valid-uuid> → returns only matching entries.
TEST-ACT-025: GET /api/activity-log with resourceType only (no resourceId) → returns all entries for that type.
```

### 6.6 Metadata injection

**What could go wrong:** The JSONB `metadata` field could contain unexpectedly large payloads or malicious content.

```
TEST-ACT-026: Verify metadata values are derived from server-side data (not user input).
             The metadata is set by the server routes, not from request bodies.
             This is a code review check, not a runtime test.
```

---

## 7. Invitation System — Attack Surface

### 7.1 Invitation enumeration

**What could go wrong:** An attacker can enumerate valid invitation IDs to discover which emails have been invited.

```
TEST-INV-001: Call GET /organization/get-invitation with a random UUID → expect 404 (not a different error that leaks info).
TEST-INV-002: Call GET /organization/get-invitation with a valid but expired invitation → expect appropriate error.
```

### 7.2 Invitation acceptance by wrong user

**What could go wrong:** User X receives an invitation email for user@example.com, but User Y (with a different email) tries to accept it.

```
TEST-INV-003: Send invitation to alice@example.com. Log in as bob@example.com.
             Try to accept the invitation → expect rejection (Better Auth should enforce email match).
```

### 7.3 Invitation replay

**What could go wrong:** An invitation is accepted, but the attacker replays the accept request to get re-added after removal.

```
TEST-INV-004: Accept invitation → becomes member. Get removed from org.
             Try to accept the same invitation again → expect failure (invitation status is no longer pending).
```

### 7.4 Invitation expiration

```
TEST-INV-005: Create invitation. Wait for expiration (or manipulate timestamp in test DB).
             Try to accept → expect failure.
```

### 7.5 Role escalation via invitation

**What could go wrong:** An admin invites someone as "owner" to escalate their own privileges.

```
TEST-INV-006: Admin invites a new user with role=owner → expect 403 (admins can't create owners).
             Verify Better Auth enforces this at the plugin level.
```

### 7.6 Re-invitation cancellation

```
TEST-INV-007: Invite alice@example.com. Invite alice@example.com again.
             Verify the first invitation is cancelled (cancelPendingInvitationsOnReInvite: true).
             Old invitation ID should no longer be acceptable.
```

---

## 8. Input Validation Vulnerabilities

### 8.1 UUID parameter tampering

**What could go wrong:** Route parameters or query strings accept non-UUID values, potentially causing SQL errors or unexpected behavior.

```
TEST-VAL-001: GET /api/jobs/not-a-uuid → expect 422 (or 404 if no param validation — check both).
TEST-VAL-002: PATCH /api/comments/../../etc/passwd → expect 422.
TEST-VAL-003: DELETE /api/comments/' OR '1'='1 → expect 422.
TEST-VAL-004: GET /api/comments?targetId=null → expect 422.
TEST-VAL-005: GET /api/comments?targetId=undefined → expect 422.
```

### 8.2 Request body type coercion

**What could go wrong:** Sending unexpected types (number instead of string, array instead of object).

```
TEST-VAL-006: POST /api/comments with body: 123 (number, not object) → expect 422.
TEST-VAL-007: POST /api/comments with body: [1, 2, 3] (array) → expect 422.
TEST-VAL-008: POST /api/comments with body: { body: 123 } (number instead of string) → expect 422.
TEST-VAL-009: POST /api/comments with body: { targetType: "user" } (invalid enum value) → expect 422.
TEST-VAL-010: POST /api/comments with extra fields: { body: "hi", evil: true } → extra fields should be stripped by Zod.
```

### 8.3 Content-Type manipulation

```
TEST-VAL-011: POST /api/comments with Content-Type: text/plain → expect 400 or 422.
TEST-VAL-012: POST /api/comments with Content-Type: application/xml → expect 400 or 422.
```

### 8.4 Prototype pollution

```
TEST-VAL-013: POST /api/comments with body: { "__proto__": { "isAdmin": true }, "body": "test", ... }
             → __proto__ should be ignored. Zod's strict parsing should strip unknown keys.
TEST-VAL-014: POST /api/comments with body: { "constructor": { "prototype": { ... } } }
             → should be stripped or rejected.
```

---

## 9. Rate Limiting & Denial of Service

### 9.1 Comment spam

**What could go wrong:** An authenticated user creates thousands of comments in a loop.

```
TEST-DOS-001: Create 100 comments in rapid succession → expect rate limiter to kick in (429) in production.
             Note: Rate limiting is disabled in development (NODE_ENV !== 'production').
TEST-DOS-002: Verify the write rate limiter (80/min) applies to POST /api/comments.
```

### 9.2 Large pagination requests

**What could go wrong:** Requesting limit=100 with deeply nested joins on large datasets causes slow queries.

```
TEST-DOS-003: GET /api/activity-log?limit=100 on an org with 100,000 activity entries → measure response time.
             Should return in < 500ms with proper indexing.
TEST-DOS-004: GET /api/comments?limit=100&page=1 with many comments → measure response time.
```

### 9.3 Activity log flooding

**What could go wrong:** Since `recordActivity` is fire-and-forget, a flood of mutations could fill the activity_log table.

```
TEST-DOS-005: Consider whether activity_log needs a retention policy (e.g., delete entries older than 1 year).
             This is a design concern, not a code bug — but monitor table size.
```

---

## 10. Data Leakage & Information Disclosure

### 10.1 Error message leakage

**What could go wrong:** Error responses include stack traces, SQL queries, or internal details.

```
TEST-LEAK-001: Trigger a 404 on /api/comments/<org-b-comment-id> → response body must NOT leak
              the comment exists in another org. Should just say "Comment not found".
TEST-LEAK-002: Trigger a 422 with invalid input → error should describe the validation issue
              but not include internal paths, table names, or schema details.
TEST-LEAK-003: Trigger a 500 (e.g., database connection failure) → response must NOT include
              the database connection string or stack trace in production.
```

### 10.2 Response body leakage

**What could go wrong:** API responses include fields the user shouldn't see.

```
TEST-LEAK-004: GET /api/comments → verify response does NOT include organizationId
              (it's implicit from the session — exposing it aids cross-tenant attacks).
              Currently: organizationId IS included in the response. Consider removing it.
TEST-LEAK-005: GET /api/activity-log → verify metadata doesn't contain sensitive data
              (passwords, tokens, PII beyond what's needed for the audit trail).
TEST-LEAK-006: GET /api/comments → verify authorEmail is appropriate to expose.
              In a team tool, showing email is fine. But if comments are ever
              visible to external parties, this leaks internal email addresses.
```

### 10.3 Timing attacks on resource existence

**What could go wrong:** The response time for "resource not found in this org" vs "resource doesn't exist at all" differs, allowing an attacker to enumerate valid UUIDs.

```
TEST-LEAK-007: Measure response time for:
              (a) PATCH /api/comments/<org-b-comment-id> → 404 (exists in other org)
              (b) PATCH /api/comments/<completely-fake-uuid> → 404 (doesn't exist at all)
              Both should take approximately equal time (within noise).
              Currently: Both go through the same db.query.comment.findFirst() path, so timing should be similar.
```

---

## 11. Race Conditions & TOCTOU

### 11.1 Double-submit comment creation

**What could go wrong:** A user double-clicks "Post Comment" and two identical comments are created.

```
TEST-RACE-001: Send two POST /api/comments requests simultaneously with identical bodies.
             Both should succeed (no unique constraint on body+target).
             Decision: Is this acceptable? Options:
             - Accept duplicates (current behavior)
             - Add client-side debounce
             - Add a deduplication window on the server (e.g., same author+target+body within 5 seconds)
```

### 11.2 Edit-while-delete race

**What could go wrong:** User A starts editing a comment. User B deletes it. User A submits the edit.

```
TEST-RACE-002: Delete a comment. Then immediately PATCH the same comment ID.
             → expect 404 (the findFirst check will not find the deleted comment).
             Currently correct: the PATCH route fetches the comment first.
```

### 11.3 TOCTOU on comment ownership

**What could go wrong:** The PATCH route checks `authorId === session.user.id`, then updates. But between the check and the update, the comment's ownership hypothetically changes.

```
TEST-RACE-003: This is a theoretical concern. Comment authorId is immutable (never updated).
             No action needed — but document the invariant: authorId must never be updateable.
             Verify: The updateCommentSchema only allows { body: string }. authorId cannot be sent.
```

### 11.4 Organization deletion during request processing

**What could go wrong:** Org A is deleted while a member of Org A is mid-request creating a comment.

```
TEST-RACE-004: Delete Org A. Simultaneously create a comment from Org A.
             → expect either 201 (created before cascade) or a DB error caught by the route.
             The FK cascade will eventually clean up, but the in-flight request might fail.
             This is acceptable — the user will see an error, and the data will be consistent.
```

---

## 12. Integration Test Plan

These tests run against a real database (test PostgreSQL instance) with the Nitro server, testing the full request → middleware → handler → DB → response pipeline.

### Test file structure

```
test/
  integration/
    auth/
      require-permission.test.ts      # Tests for the requirePermission utility
    comments/
      comments-crud.test.ts           # Happy path CRUD
      comments-authorization.test.ts  # RBAC enforcement
      comments-isolation.test.ts      # Cross-org isolation
      comments-validation.test.ts     # Input validation edge cases
    activity-log/
      activity-log-read.test.ts       # Happy path + pagination
      activity-log-completeness.test.ts # Verify all mutations log activity
      activity-log-immutability.test.ts # Verify no write endpoints exist
    rbac/
      role-permissions.test.ts        # Each role × each action matrix
      cross-tenant.test.ts            # Org isolation for all resources
```

### Test helpers needed

```ts
// Create test users with specific roles in specific orgs
async function createTestUser(role: 'owner' | 'admin' | 'member', orgId: string): Promise<TestUser>

// Create a full org with one of each resource for testing
async function seedOrg(): Promise<{ org, owner, admin, member, job, candidate, application, comment }>

// Make authenticated requests as a specific user
async function apiAs(user: TestUser, method: string, url: string, body?: object): Promise<Response>
```

### Test execution order

1. Seed two orgs (Org A and Org B) with users at each role level.
2. Run all tests against both orgs to verify isolation.
3. Tear down test data.

---

## 13. E2E Test Plan

End-to-end tests using Playwright that verify the full user flow through the browser.

### E2E-COLLAB-001: Comment lifecycle

```
1. Sign up → create org → create job → create candidate.
2. Navigate to candidate detail page.
3. Type a comment in the comment box → click "Post".
4. Verify comment appears in the list with author name and timestamp.
5. Click "Edit" on the comment → change text → save.
6. Verify updated text appears.
7. Click "Delete" → confirm.
8. Verify comment is removed from the list.
```

### E2E-COLLAB-002: Activity log visibility

```
1. As owner: create a job, create a candidate, create an application.
2. Navigate to activity log page.
3. Verify entries appear: "created job", "created candidate", "created application".
4. Click filter by resourceType=job → only job entries shown.
```

### E2E-COLLAB-003: Member permission restrictions

```
1. As owner: create org, create job, invite member@test.com with role=member.
2. Log in as member.
3. Verify: can see jobs list, but "New Job" button is hidden.
4. Navigate to candidates → verify can create a candidate.
5. Post a comment on the candidate.
6. Verify: "Edit" and "Delete" buttons are NOT shown on the comment (usePermission gates them).
7. Verify: navigating directly to /api/jobs (POST) via fetch returns 403.
```

### E2E-COLLAB-004: Org switching isolation

```
1. Create Org A with job "Alpha".
2. Create Org B with job "Beta".
3. Switch to Org A → verify only "Alpha" visible.
4. Switch to Org B → verify only "Beta" visible.
5. Ensure no data leaks between orgs during switching.
```

### E2E-COLLAB-005: Invitation flow

```
1. As owner: invite alice@test.com with role=admin.
2. Sign up as alice@test.com.
3. Accept the invitation.
4. Verify: alice appears in the member list with role=admin.
5. As alice: create a job → succeeds.
6. As alice: try to delete the org → fails (admin can't delete org).
```

---

## 14. Security Checklist

A pre-deploy checklist for every PR that touches auth, permissions, or collaboration features.

### Code Review Checklist

- [ ] **Every new API route calls `requirePermission()` as its first line.** No exceptions.
- [ ] **The `organizationId` used in queries comes from `session.session.activeOrganizationId`**, never from request params/body.
- [ ] **New permissions are added to `shared/permissions.ts`** and assigned to all three roles explicitly.
- [ ] **Zod schemas validate all user input** — params, query, body.
- [ ] **UUID format is validated** on all ID parameters (route params and query strings).
- [ ] **No raw SQL** — all queries use Drizzle's query builder with parameterized values.
- [ ] **Error responses don't leak internals** — no stack traces, no table names, no connection strings.
- [ ] **Mutating routes call `recordActivity()`** after the primary operation.
- [ ] **New resources have test coverage** for all three roles × all actions in the permission matrix.

### Infrastructure Checklist

- [ ] **Rate limiting is enabled** in production (`NODE_ENV === 'production'`).
- [ ] **HTTPS is enforced** — no plain HTTP in production.
- [ ] **CORS is configured** — only trusted origins can make requests.
- [ ] **`BETTER_AUTH_SECRET` is a strong random string** (at least 32 characters).
- [ ] **Database backups** — activity log is immutable but the database isn't; ensure backups.
- [ ] **Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax`** (Better Auth defaults).
- [ ] **`trustedOrigins`** in auth config matches only the actual domain.

### Dependency Checklist

- [ ] **`better-auth`** is on a stable release (currently v1.4.18).
- [ ] **No known vulnerabilities** in `better-auth`, `drizzle-orm`, or `zod` (run `npm audit`).
- [ ] **`postgres.js`** driver is up to date (handles parameterized queries to prevent SQL injection).

---

## 15. Test Data Setup

### Seed script concept

For integration tests, set up two complete organizations:

```ts
// Org A ("Acme Corp")
const orgA = {
  org:     { name: 'Acme Corp', slug: 'acme-corp' },
  owner:   { email: 'owner-a@test.local', role: 'owner' },
  admin:   { email: 'admin-a@test.local', role: 'admin' },
  member:  { email: 'member-a@test.local', role: 'member' },
  job:     { title: 'Senior Engineer', status: 'published' },
  candidate: { firstName: 'Alice', lastName: 'Test', email: 'alice@candidate.test' },
  application: { status: 'applied' },
  comment: { body: 'Great candidate!', targetType: 'candidate' },
}

// Org B ("Beta Inc") — for cross-tenant isolation testing
const orgB = {
  org:     { name: 'Beta Inc', slug: 'beta-inc' },
  owner:   { email: 'owner-b@test.local', role: 'owner' },
  admin:   { email: 'admin-b@test.local', role: 'admin' },
  member:  { email: 'member-b@test.local', role: 'member' },
  job:     { title: 'Product Manager', status: 'draft' },
  candidate: { firstName: 'Bob', lastName: 'Test', email: 'bob@candidate.test' },
  application: { status: 'interview' },
  comment: { body: 'Needs follow-up.', targetType: 'candidate' },
}
```

### Cross-org test user

For the most dangerous scenarios, also create a **multi-org user** who is a member of both Org A and Org B. This user is used to test that switching active orgs properly isolates data and that there's no session bleed.

```ts
const multiOrgUser = {
  email: 'multi@test.local',
  roleInOrgA: 'member',
  roleInOrgB: 'admin',
}
```

---

## Summary of Risk Priorities

| Priority | Category | Count | Why |
|----------|----------|-------|-----|
| **P0 — Critical** | Cross-tenant isolation (IDOR) | 18 tests | Data breach across organizations. |
| **P0 — Critical** | RBAC enforcement | 30 tests | Privilege escalation. |
| **P1 — High** | Authentication bypass | 16 tests | Unauthenticated data access. |
| **P1 — High** | Comment authorization edge cases | 8 tests | Editing/deleting other users' comments. |
| **P1 — High** | Activity log immutability | 4 tests | Audit trail integrity. |
| **P2 — Medium** | Input validation | 14 tests | Application errors, potential injection. |
| **P2 — Medium** | Invitation security | 7 tests | Unauthorized org access. |
| **P2 — Medium** | Activity log completeness | 17 tests | Missing audit entries. |
| **P3 — Low** | Race conditions | 4 tests | Data consistency edge cases. |
| **P3 — Low** | Rate limiting / DoS | 5 tests | Availability under abuse. |
| **P3 — Low** | Information disclosure | 7 tests | Leaking internal details. |

**Total: ~130 test cases** across integration and E2E layers.

Implement P0 tests first. If P0 passes, the system is secure against the most dangerous attacks. P1 and P2 tests should be added before any public release. P3 tests are polish for hardening.
