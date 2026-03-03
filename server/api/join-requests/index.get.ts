import { eq, and } from 'drizzle-orm'
import { joinRequest, user } from '../../database/schema'

/**
 * GET /api/join-requests
 * List pending join requests for the current organization.
 * Only owners and admins can view join requests.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { invitation: ['create'] })
  const orgId = session.session.activeOrganizationId

  const requests = await db
    .select({
      id: joinRequest.id,
      message: joinRequest.message,
      status: joinRequest.status,
      createdAt: joinRequest.createdAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(joinRequest)
    .innerJoin(user, eq(joinRequest.userId, user.id))
    .where(
      and(
        eq(joinRequest.organizationId, orgId),
        eq(joinRequest.status, 'pending'),
      ),
    )
    .orderBy(joinRequest.createdAt)

  return requests
})
