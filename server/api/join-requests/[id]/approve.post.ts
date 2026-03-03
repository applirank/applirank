import { eq, and } from 'drizzle-orm'
import { joinRequest, member, user } from '../../../database/schema'

/**
 * POST /api/join-requests/:id/approve
 * Approve a pending join request, adding the user as a member.
 * Only owners and admins can approve join requests.
 *
 * Security:
 *   - Request must be pending and belong to current org
 *   - User must not already be a member (re-checked at approval time)
 *   - Atomic status update prevents double-approval
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { invitation: ['create'] })
  const orgId = session.session.activeOrganizationId
  const requestId = getRouterParam(event, 'id')

  if (!requestId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing request ID' })
  }

  // ── Find the pending request ──
  const [request] = await db
    .select({
      id: joinRequest.id,
      userId: joinRequest.userId,
      organizationId: joinRequest.organizationId,
      status: joinRequest.status,
      userName: user.name,
    })
    .from(joinRequest)
    .innerJoin(user, eq(joinRequest.userId, user.id))
    .where(
      and(
        eq(joinRequest.id, requestId),
        eq(joinRequest.organizationId, orgId),
        eq(joinRequest.status, 'pending'),
      ),
    )
    .limit(1)

  if (!request) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Join request not found or already processed',
    })
  }

  // ── Check if user is already a member (race guard) ──
  const [existingMember] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(
        eq(member.userId, request.userId),
        eq(member.organizationId, orgId),
      ),
    )
    .limit(1)

  if (existingMember) {
    // Auto-reject the request since user is already a member
    await db
      .update(joinRequest)
      .set({
        status: 'rejected',
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      })
      .where(eq(joinRequest.id, requestId))

    throw createError({
      statusCode: 409,
      statusMessage: 'User is already a member of this organization',
    })
  }

  // ── Approve + add member in a transaction ──
  let result: { id: string; role: string }
  try {
    result = await db.transaction(async (tx) => {
      // Mark request as approved
      const [approved] = await tx
        .update(joinRequest)
        .set({
          status: 'approved',
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(joinRequest.id, requestId),
            eq(joinRequest.status, 'pending'),
          ),
        )
        .returning({ id: joinRequest.id })

      if (!approved) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Request was already processed',
        })
      }

      // Add user as member with conflict guard (unique index on userId+orgId)
      const [newMember] = await tx
        .insert(member)
        .values({
          id: crypto.randomUUID(),
          userId: request.userId,
          organizationId: orgId!,
          role: 'member',
          createdAt: new Date(),
        })
        .onConflictDoNothing({ target: [member.userId, member.organizationId] })
        .returning({
          id: member.id,
          role: member.role,
        })

      if (!newMember) {
        throw createError({
          statusCode: 409,
          statusMessage: 'User is already a member of this organization',
        })
      }

      return newMember
    })
  }
  catch (error: unknown) {
    // Re-throw H3 errors (our own createError calls)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    // Wrap unexpected database errors with a descriptive message
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to approve join request:', message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to approve join request. Please try again.',
    })
  }

  // ── Audit log ──
  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'created',
    resourceType: 'member',
    resourceId: result.id,
    metadata: {
      joinMethod: 'join_request',
      joinRequestId: requestId,
      approvedUser: request.userName,
    },
  })

  return {
    success: true,
    memberId: result.id,
    role: result.role,
  }
})
