import { eq, and } from 'drizzle-orm'
import { comment, candidate, application, job } from '../../database/schema'
import { createCommentSchema } from '../../utils/schemas/comment'

/**
 * POST /api/comments
 * Create a comment on a candidate, application, or job.
 * Requires comment:create permission.
 * The target must belong to the same organization (prevents IDOR).
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { comment: ['create'] })
  const orgId = session.session.activeOrganizationId

  const body = await readValidatedBody(event, createCommentSchema.parse)

  // ── Verify the target belongs to this org ──
  let targetExists: { id: string } | undefined

  if (body.targetType === 'candidate') {
    targetExists = await db.query.candidate.findFirst({
      where: and(eq(candidate.id, body.targetId), eq(candidate.organizationId, orgId)),
      columns: { id: true },
    })
  } else if (body.targetType === 'application') {
    targetExists = await db.query.application.findFirst({
      where: and(eq(application.id, body.targetId), eq(application.organizationId, orgId)),
      columns: { id: true },
    })
  } else {
    targetExists = await db.query.job.findFirst({
      where: and(eq(job.id, body.targetId), eq(job.organizationId, orgId)),
      columns: { id: true },
    })
  }

  if (!targetExists) {
    throw createError({
      statusCode: 404,
      statusMessage: `${body.targetType} not found`,
    })
  }

  const [created] = await db.insert(comment).values({
    organizationId: orgId,
    authorId: session.user.id,
    targetType: body.targetType,
    targetId: body.targetId,
    body: body.body,
  }).returning({
    id: comment.id,
    targetType: comment.targetType,
    targetId: comment.targetId,
    body: comment.body,
    authorId: comment.authorId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  })

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create comment' })
  }

  // Record activity (fire-and-forget)
  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'comment_added',
    resourceType: body.targetType,
    resourceId: body.targetId,
    metadata: { commentId: created.id },
  })

  setResponseStatus(event, 201)
  return created
})
