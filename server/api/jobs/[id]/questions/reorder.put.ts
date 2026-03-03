import { eq, and } from 'drizzle-orm'
import { job, jobQuestion } from '../../../../database/schema'
import { jobIdParamSchema, reorderQuestionsSchema } from '../../../../utils/schemas/jobQuestion'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { job: ['update'] })
  const orgId = session.session.activeOrganizationId

  const { id: jobId } = await getValidatedRouterParams(event, jobIdParamSchema.parse)
  const body = await readValidatedBody(event, reorderQuestionsSchema.parse)

  // Verify the job belongs to the org
  const existingJob = await db.query.job.findFirst({
    where: and(eq(job.id, jobId), eq(job.organizationId, orgId)),
    columns: { id: true },
  })

  if (!existingJob) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  // Update each question's displayOrder inside a transaction for atomicity
  await db.transaction(async (tx) => {
    for (const { id, displayOrder } of body.order) {
      await tx.update(jobQuestion)
        .set({ displayOrder, updatedAt: new Date() })
        .where(and(
          eq(jobQuestion.id, id),
          eq(jobQuestion.jobId, jobId),
          eq(jobQuestion.organizationId, orgId),
        ))
    }
  })

  return { success: true }
})
