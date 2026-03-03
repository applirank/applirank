import { randomBytes } from 'node:crypto'
import { inviteLink } from '../../database/schema'
import { createInviteLinkSchema } from '../../utils/schemas/inviteLink'

/**
 * POST /api/invite-links
 * Create a shareable invite link for the current organization.
 * Only owners and admins can create invite links.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { invitation: ['create'] })
  const orgId = session.session.activeOrganizationId

  const body = await readValidatedBody(event, createInviteLinkSchema.parse)

  // Generate a cryptographically secure token (32 bytes = 64 hex chars)
  const token = randomBytes(32).toString('hex')

  const expiresAt = new Date(Date.now() + body.expiresInHours * 60 * 60 * 1000)

  const [created] = await db.insert(inviteLink).values({
    organizationId: orgId,
    createdById: session.user.id,
    token,
    role: body.role,
    maxUses: body.maxUses ?? null,
    useCount: 0,
    expiresAt,
  }).returning({
    id: inviteLink.id,
    token: inviteLink.token,
    role: inviteLink.role,
    maxUses: inviteLink.maxUses,
    useCount: inviteLink.useCount,
    expiresAt: inviteLink.expiresAt,
    createdAt: inviteLink.createdAt,
  })

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create invite link' })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'created',
    resourceType: 'invite_link',
    resourceId: created.id,
    metadata: { role: created.role, maxUses: created.maxUses },
  })

  setResponseStatus(event, 201)
  return created
})
