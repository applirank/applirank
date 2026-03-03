import { eq, and } from 'drizzle-orm'
import { application, candidate, job } from '../../database/schema'
import { createApplicationSchema } from '../../utils/schemas/application'

/**
 * POST /api/applications
 * Create an application linking an existing candidate to a job.
 * Both candidate and job must belong to the session's organization.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { application: ['create'] })
  const orgId = session.session.activeOrganizationId

  const body = await readValidatedBody(event, createApplicationSchema.parse)

  // Verify candidate belongs to this org
  const existingCandidate = await db.query.candidate.findFirst({
    where: and(eq(candidate.id, body.candidateId), eq(candidate.organizationId, orgId)),
    columns: { id: true },
  })

  if (!existingCandidate) {
    throw createError({ statusCode: 404, statusMessage: 'Candidate not found' })
  }

  // Verify job belongs to this org
  const existingJob = await db.query.job.findFirst({
    where: and(eq(job.id, body.jobId), eq(job.organizationId, orgId)),
    columns: { id: true },
  })

  if (!existingJob) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  // Check for duplicate application
  const existing = await db.query.application.findFirst({
    where: and(
      eq(application.organizationId, orgId),
      eq(application.candidateId, body.candidateId),
      eq(application.jobId, body.jobId),
    ),
    columns: { id: true },
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This candidate has already been applied to this job',
    })
  }

  const [created] = await db.insert(application).values({
    organizationId: orgId,
    candidateId: body.candidateId,
    jobId: body.jobId,
    notes: body.notes,
    status: 'new',
  }).returning({
    id: application.id,
    candidateId: application.candidateId,
    jobId: application.jobId,
    status: application.status,
    score: application.score,
    notes: application.notes,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  })

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create application' })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'created',
    resourceType: 'application',
    resourceId: created.id,
    metadata: { candidateId: body.candidateId, jobId: body.jobId },
  })

  setResponseStatus(event, 201)
  return created
})
