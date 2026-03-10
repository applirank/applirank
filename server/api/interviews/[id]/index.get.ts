import { and, eq } from 'drizzle-orm'
import { interview, application, candidate, job } from '../../../database/schema'
import { interviewIdParamSchema } from '../../../utils/schemas/interview'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { interview: ['read'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, interviewIdParamSchema.parse)

  const [data] = await db
    .select({
      id: interview.id,
      title: interview.title,
      type: interview.type,
      status: interview.status,
      scheduledAt: interview.scheduledAt,
      duration: interview.duration,
      location: interview.location,
      notes: interview.notes,
      interviewers: interview.interviewers,
      invitationSentAt: interview.invitationSentAt,
      createdById: interview.createdById,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
      applicationId: interview.applicationId,
      candidateFirstName: candidate.firstName,
      candidateLastName: candidate.lastName,
      candidateEmail: candidate.email,
      candidatePhone: candidate.phone,
      jobId: application.jobId,
      jobTitle: job.title,
    })
    .from(interview)
    .innerJoin(application, eq(application.id, interview.applicationId))
    .innerJoin(candidate, eq(candidate.id, application.candidateId))
    .innerJoin(job, eq(job.id, application.jobId))
    .where(and(eq(interview.id, id), eq(interview.organizationId, orgId)))

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Interview not found' })
  }

  return data
})
