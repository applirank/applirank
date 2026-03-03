import { job } from '../../database/schema'
import { createJobSchema } from '../../utils/schemas/job'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { job: ['create'] })
  const orgId = session.session.activeOrganizationId

  const body = await readValidatedBody(event, createJobSchema.parse)

  // Generate a deterministic ID upfront so we can build the slug
  const jobId = crypto.randomUUID()
  const slug = generateJobSlug(body.title, jobId, body.slug)

  const [created] = await db.insert(job).values({
    id: jobId,
    organizationId: orgId,
    title: body.title,
    slug,
    description: body.description,
    location: body.location,
    type: body.type,
    salaryMin: body.salaryMin,
    salaryMax: body.salaryMax,
    salaryCurrency: body.salaryCurrency,
    salaryUnit: body.salaryUnit,
    remoteStatus: body.remoteStatus,
    validThrough: body.validThrough,
  }).returning({
    id: job.id,
    title: job.title,
    slug: job.slug,
    description: job.description,
    location: job.location,
    type: job.type,
    status: job.status,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryUnit: job.salaryUnit,
    remoteStatus: job.remoteStatus,
    validThrough: job.validThrough,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  })

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create job' })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'created',
    resourceType: 'job',
    resourceId: created.id,
    metadata: { title: created.title },
  })

  setResponseStatus(event, 201)
  return created
})
