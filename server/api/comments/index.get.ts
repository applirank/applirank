import { eq, and, desc } from 'drizzle-orm'
import { comment, user } from '../../database/schema'
import { commentQuerySchema } from '../../utils/schemas/comment'

/**
 * GET /api/comments
 * List comments for a specific target (candidate, application, or job).
 * Requires comment:read permission.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { comment: ['read'] })
  const orgId = session.session.activeOrganizationId

  const query = await getValidatedQuery(event, commentQuerySchema.parse)
  const offset = (query.page - 1) * query.limit

  const where = and(
    eq(comment.organizationId, orgId),
    eq(comment.targetType, query.targetType),
    eq(comment.targetId, query.targetId),
  )

  const [data, total] = await Promise.all([
    db
      .select({
        id: comment.id,
        targetType: comment.targetType,
        targetId: comment.targetId,
        body: comment.body,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorId: comment.authorId,
        authorName: user.name,
        authorEmail: user.email,
        authorImage: user.image,
      })
      .from(comment)
      .innerJoin(user, eq(user.id, comment.authorId))
      .where(where)
      .orderBy(desc(comment.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.$count(comment, where),
  ])

  return { data, total, page: query.page, limit: query.limit }
})
