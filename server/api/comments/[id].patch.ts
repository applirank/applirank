import { eq, and } from 'drizzle-orm'
import { comment } from '../../database/schema'
import { commentIdParamSchema, updateCommentSchema } from '../../utils/schemas/comment'

/**
 * PATCH /api/comments/:id
 * Update a comment's body.
 * Requires comment:update permission.
 * Only the original author may edit their own comment.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { comment: ['update'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, commentIdParamSchema.parse)
  const body = await readValidatedBody(event, updateCommentSchema.parse)

  // ── Fetch comment & verify ownership ──
  const existing = await db.query.comment.findFirst({
    where: and(
      eq(comment.id, id),
      eq(comment.organizationId, orgId),
    ),
    columns: { id: true, authorId: true },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
  }

  // Only the author can edit their own comment
  if (existing.authorId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'You can only edit your own comments' })
  }

  const [updated] = await db
    .update(comment)
    .set({ body: body.body, updatedAt: new Date() })
    .where(eq(comment.id, id))
    .returning({
      id: comment.id,
      targetType: comment.targetType,
      targetId: comment.targetId,
      body: comment.body,
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    })

  return updated
})
