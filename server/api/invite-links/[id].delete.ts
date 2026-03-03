import { eq, and, isNull } from 'drizzle-orm'
import { inviteLink } from '../../database/schema'

/**
 * DELETE /api/invite-links/:id
 * Revoke an invite link (soft delete).
 * Only owners and admins can revoke invite links.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { invitation: ['cancel'] })
  const orgId = session.session.activeOrganizationId
  const linkId = getRouterParam(event, 'id')

  if (!linkId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing invite link ID' })
  }

  const [revoked] = await db
    .update(inviteLink)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(inviteLink.id, linkId),
        eq(inviteLink.organizationId, orgId),
        isNull(inviteLink.revokedAt),
      ),
    )
    .returning({ id: inviteLink.id })

  if (!revoked) {
    throw createError({ statusCode: 404, statusMessage: 'Invite link not found or already revoked' })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'deleted',
    resourceType: 'invite_link',
    resourceId: revoked.id,
  })

  return { success: true }
})
