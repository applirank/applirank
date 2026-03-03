import { eq, and } from 'drizzle-orm'
import { job, jobQuestion } from '../../../../database/schema'
import { jobIdParamSchema, createQuestionSchema } from '../../../../utils/schemas/jobQuestion'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { job: ['update'] })
  const orgId = session.session.activeOrganizationId

  const { id: jobId } = await getValidatedRouterParams(event, jobIdParamSchema.parse)
  const body = await readValidatedBody(event, createQuestionSchema.parse)

  // Verify the job belongs to the org
  const existingJob = await db.query.job.findFirst({
    where: and(eq(job.id, jobId), eq(job.organizationId, orgId)),
    columns: { id: true },
  })

  if (!existingJob) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  const [created] = await db.insert(jobQuestion).values({
    organizationId: orgId,
    jobId,
    type: body.type,
    label: body.label,
    description: body.description,
    required: body.required,
    options: body.options,
    displayOrder: body.displayOrder,
  }).returning({
    id: jobQuestion.id,
    jobId: jobQuestion.jobId,
    type: jobQuestion.type,
    label: jobQuestion.label,
    description: jobQuestion.description,
    required: jobQuestion.required,
    options: jobQuestion.options,
    displayOrder: jobQuestion.displayOrder,
    createdAt: jobQuestion.createdAt,
    updatedAt: jobQuestion.updatedAt,
  })

  setResponseStatus(event, 201)
  return created
})
