import { eq, and } from 'drizzle-orm'
import { candidate } from '../../database/schema'
import { candidateIdParamSchema, updateCandidateSchema } from '../../utils/schemas/candidate'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { candidate: ['update'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, candidateIdParamSchema.parse)
  const body = await readValidatedBody(event, updateCandidateSchema.parse)

  // If email is being changed, check uniqueness within the org
  if (body.email) {
    const emailConflict = await db.query.candidate.findFirst({
      where: and(
        eq(candidate.organizationId, orgId),
        eq(candidate.email, body.email),
      ),
      columns: { id: true },
    })

    if (emailConflict && emailConflict.id !== id) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A candidate with this email already exists',
      })
    }
  }

  const [updated] = await db.update(candidate)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(candidate.id, id), eq(candidate.organizationId, orgId)))
    .returning({
      id: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    })

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'updated',
    resourceType: 'candidate',
    resourceId: id,
    metadata: { name: `${updated.firstName} ${updated.lastName}` },
  })

  return updated
})
