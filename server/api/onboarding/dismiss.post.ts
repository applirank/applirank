import { eq } from 'drizzle-orm'
import { orgOnboarding } from '../../database/schema'

/**
 * POST /api/onboarding/dismiss
 *
 * Marks the onboarding checklist as dismissed for the current organization.
 * Upserts the org_onboarding row (creates on first dismiss, updates if exists).
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { job: ['read'] })
  const orgId = session.session.activeOrganizationId

  const now = new Date()

  await db
    .insert(orgOnboarding)
    .values({
      organizationId: orgId,
      dismissed: true,
      dismissedAt: now,
    })
    .onConflictDoUpdate({
      target: orgOnboarding.organizationId,
      set: {
        dismissed: true,
        dismissedAt: now,
        updatedAt: now,
      },
    })

  return { ok: true }
})
