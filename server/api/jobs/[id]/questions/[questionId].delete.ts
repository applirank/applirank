import { eq, and } from 'drizzle-orm'
import { jobQuestion } from '../../../../database/schema'
import { questionIdParamSchema } from '../../../../utils/schemas/jobQuestion'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { job: ['update'] })
  const orgId = session.session.activeOrganizationId

  const { id: jobId, questionId } = await getValidatedRouterParams(event, questionIdParamSchema.parse)

  const [deleted] = await db.delete(jobQuestion)
    .where(and(
      eq(jobQuestion.id, questionId),
      eq(jobQuestion.jobId, jobId),
      eq(jobQuestion.organizationId, orgId),
    ))
    .returning({ id: jobQuestion.id })

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Question not found' })
  }

  setResponseStatus(event, 204)
  return null
})
