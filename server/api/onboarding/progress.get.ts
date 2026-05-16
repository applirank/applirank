import { eq, and, ne, sql } from 'drizzle-orm'
import { job, candidate, application, aiConfig, orgOnboarding } from '../../database/schema'
import { member, invitation } from '../../database/schema'

/**
 * GET /api/onboarding/progress
 *
 * Computes the onboarding checklist state for the current organization.
 * Step completion is derived from real domain data — nothing is stored per-step.
 * Only the dismissal flag is persisted in `org_onboarding`.
 *
 * Returns the array of steps with their completion status plus the
 * dismissal flag so the client can decide whether to render the checklist.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { job: ['read'] })
  const orgId = session.session.activeOrganizationId

  const [
    jobCount,
    openJobCount,
    candidateCount,
    movedApplicationCount,
    memberCount,
    invitationCount,
    aiConfigCount,
    onboardingRow,
  ] = await Promise.all([
    // 1. Any job created?
    db.$count(job, eq(job.organizationId, orgId)),

    // 2. Any job published (status = 'open')?
    db.$count(job, and(eq(job.organizationId, orgId), eq(job.status, 'open'))),

    // 3. Any candidate added?
    db.$count(candidate, eq(candidate.organizationId, orgId)),

    // 4. Any candidate moved through the pipeline (status ≠ 'new')?
    db.$count(application, and(
      eq(application.organizationId, orgId),
      ne(application.status, 'new'),
    )),

    // 5a. Team size (> 1 means someone was invited and joined)?
    db.$count(member, eq(member.organizationId, orgId)),

    // 5b. Any invitation sent (pending or accepted)?
    db.$count(invitation, eq(invitation.organizationId, orgId)),

    // 6. AI configured?
    db.$count(aiConfig, eq(aiConfig.organizationId, orgId)),

    // 7. Dismissal state
    db.query.orgOnboarding.findFirst({
      where: eq(orgOnboarding.organizationId, orgId),
      columns: { dismissed: true, dismissedAt: true },
    }),
  ])

  const steps = [
    {
      id: 'workspace_created',
      completed: true, // Always done — they're logged in with an org
      xp: 100,
    },
    {
      id: 'first_job',
      completed: jobCount > 0,
      xp: 150,
    },
    {
      id: 'publish_job',
      completed: openJobCount > 0,
      xp: 200,
    },
    {
      id: 'first_candidate',
      completed: candidateCount > 0,
      xp: 150,
    },
    {
      id: 'pipeline_action',
      completed: movedApplicationCount > 0,
      xp: 200,
    },
    {
      id: 'invite_team',
      completed: memberCount > 1 || invitationCount > 0,
      xp: 150,
    },
    {
      id: 'configure_ai',
      completed: aiConfigCount > 0,
      xp: 200,
    },
  ]

  return {
    steps,
    dismissed: onboardingRow?.dismissed ?? false,
    dismissedAt: onboardingRow?.dismissedAt ?? null,
  }
})
