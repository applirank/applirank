import { eq, and, isNull } from 'drizzle-orm'
import { inviteLink, user } from '../../database/schema'

/**
 * GET /api/invite-links
 * List active invite links for the current organization.
 * Only owners and admins can view invite links.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { invitation: ['create'] })
  const orgId = session.session.activeOrganizationId

  const links = await db
    .select({
      id: inviteLink.id,
      token: inviteLink.token,
      role: inviteLink.role,
      maxUses: inviteLink.maxUses,
      useCount: inviteLink.useCount,
      expiresAt: inviteLink.expiresAt,
      revokedAt: inviteLink.revokedAt,
      createdAt: inviteLink.createdAt,
      createdByName: user.name,
    })
    .from(inviteLink)
    .leftJoin(user, eq(inviteLink.createdById, user.id))
    .where(
      and(
        eq(inviteLink.organizationId, orgId),
        isNull(inviteLink.revokedAt),
      ),
    )
    .orderBy(inviteLink.createdAt)

  return links
})
