import { eq, and } from 'drizzle-orm'
import { joinRequest } from '../../../database/schema'

/**
 * POST /api/join-requests/:id/reject
 * Reject a pending join request.
 * Only owners and admins can reject join requests.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { invitation: ['cancel'] })
  const orgId = session.session.activeOrganizationId
  const requestId = getRouterParam(event, 'id')

  if (!requestId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing request ID' })
  }

  const [rejected] = await db
    .update(joinRequest)
    .set({
      status: 'rejected',
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    })
    .where(
      and(
        eq(joinRequest.id, requestId),
        eq(joinRequest.organizationId, orgId),
        eq(joinRequest.status, 'pending'),
      ),
    )
    .returning({ id: joinRequest.id })

  if (!rejected) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Join request not found or already processed',
    })
  }

  // ── Audit log ──
  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'deleted',
    resourceType: 'member',
    resourceId: rejected.id,
    metadata: {
      decision: 'rejected',
      joinRequestId: rejected.id,
    },
  })

  return { success: true }
})
