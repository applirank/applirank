import { eq, and } from 'drizzle-orm'
import { candidate } from '../../database/schema'
import { candidateIdParamSchema } from '../../utils/schemas/candidate'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { candidate: ['delete'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, candidateIdParamSchema.parse)

  const [deleted] = await db.delete(candidate)
    .where(and(eq(candidate.id, id), eq(candidate.organizationId, orgId)))
    .returning({ id: candidate.id })

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'deleted',
    resourceType: 'candidate',
    resourceId: id,
  })

  setResponseStatus(event, 204)
  return null
})
