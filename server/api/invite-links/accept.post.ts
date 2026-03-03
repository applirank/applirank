import { eq, and, isNull, gt, sql } from 'drizzle-orm'
import { inviteLink, member, organization, user } from '../../database/schema'
import { acceptInviteLinkSchema } from '../../utils/schemas/inviteLink'

/**
 * POST /api/invite-links/accept
 * Accept a shareable invite link and join the organization.
 *
 * Security:
 *   - Requires authentication (must be signed in)
 *   - Validates token exists, is not revoked, not expired, not over max uses
 *   - Checks user is not already a member of the org
 *   - Atomically increments use count with a DB-level guard against races
 *   - Records activity to audit log
 */
export default defineEventHandler(async (event) => {
  // ── Step 1: Authenticate (no org required — user may not have one yet) ──
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readValidatedBody(event, acceptInviteLinkSchema.parse)

  // ── Step 2: Validate the token ──
  // Single query to find the link AND check all validity conditions
  const [link] = await db
    .select({
      id: inviteLink.id,
      organizationId: inviteLink.organizationId,
      role: inviteLink.role,
      maxUses: inviteLink.maxUses,
      useCount: inviteLink.useCount,
      expiresAt: inviteLink.expiresAt,
      orgName: organization.name,
    })
    .from(inviteLink)
    .innerJoin(organization, eq(inviteLink.organizationId, organization.id))
    .where(
      and(
        eq(inviteLink.token, body.token),
        isNull(inviteLink.revokedAt),
        gt(inviteLink.expiresAt, new Date()),
      ),
    )
    .limit(1)

  if (!link) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invalid, expired, or revoked invite link',
    })
  }

  // ── Step 3: Check max uses ──
  if (link.maxUses !== null && link.useCount >= link.maxUses) {
    throw createError({
      statusCode: 410,
      statusMessage: 'This invite link has reached its maximum number of uses',
    })
  }

  // ── Step 4: Check if user is already a member ──
  const [existingMember] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, link.organizationId),
      ),
    )
    .limit(1)

  if (existingMember) {
    throw createError({
      statusCode: 409,
      statusMessage: 'You are already a member of this organization',
    })
  }

  // ── Step 5 + 6: Atomically increment use count AND add member in a transaction ──
  // This prevents use count leaks if the member insert fails.
  const safeRole = link.role === 'admin' ? 'admin' : 'member'

  const result = await db.transaction(async (tx) => {
    // Atomically increment use count with race-safe WHERE guard
    const [updatedLink] = await tx
      .update(inviteLink)
      .set({ useCount: sql`${inviteLink.useCount} + 1` })
      .where(
        and(
          eq(inviteLink.id, link.id),
          isNull(inviteLink.revokedAt),
          gt(inviteLink.expiresAt, new Date()),
          // Race-safe: only increment if still under limit
          link.maxUses !== null
            ? sql`${inviteLink.useCount} < ${link.maxUses}`
            : sql`TRUE`,
        ),
      )
      .returning({ id: inviteLink.id, useCount: inviteLink.useCount })

    if (!updatedLink) {
      throw createError({
        statusCode: 410,
        statusMessage: 'This invite link is no longer valid',
      })
    }

    // Add member with conflict guard (unique index on userId+orgId)
    const [newMember] = await tx
      .insert(member)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        organizationId: link.organizationId,
        role: safeRole,
      })
      .onConflictDoNothing({ target: [member.userId, member.organizationId] })
      .returning({
        id: member.id,
        role: member.role,
      })

    if (!newMember) {
      throw createError({
        statusCode: 409,
        statusMessage: 'You are already a member of this organization',
      })
    }

    return newMember
  })

  // ── Step 7: Audit log ──
  recordActivity({
    organizationId: link.organizationId,
    actorId: session.user.id,
    action: 'created',
    resourceType: 'member',
    resourceId: result.id,
    metadata: {
      joinMethod: 'invite_link',
      inviteLinkId: link.id,
      role: safeRole,
    },
  })

  return {
    success: true,
    organizationId: link.organizationId,
    organizationName: link.orgName,
    role: safeRole,
  }
})
