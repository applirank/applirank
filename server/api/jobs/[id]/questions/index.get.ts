import { eq, and, asc } from 'drizzle-orm'
import { job, jobQuestion } from '../../../../database/schema'
import { jobIdParamSchema } from '../../../../utils/schemas/jobQuestion'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { job: ['read'] })
  const orgId = session.session.activeOrganizationId

  const { id: jobId } = await getValidatedRouterParams(event, jobIdParamSchema.parse)

  // Verify the job belongs to the org
  const existingJob = await db.query.job.findFirst({
    where: and(eq(job.id, jobId), eq(job.organizationId, orgId)),
    columns: { id: true },
  })

  if (!existingJob) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  const questions = await db.query.jobQuestion.findMany({
    where: and(eq(jobQuestion.jobId, jobId), eq(jobQuestion.organizationId, orgId)),
    orderBy: [asc(jobQuestion.displayOrder), asc(jobQuestion.createdAt)],
    columns: {
      id: true,
      jobId: true,
      type: true,
      label: true,
      description: true,
      required: true,
      options: true,
      displayOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return questions
})
