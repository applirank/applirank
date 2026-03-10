import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { interview, application, candidate, job } from '../../database/schema'
import { interviewQuerySchema } from '../../utils/schemas/interview'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { interview: ['read'] })
  const orgId = session.session.activeOrganizationId

  const query = await getValidatedQuery(event, interviewQuerySchema.parse)

  const conditions = [eq(interview.organizationId, orgId)]

  if (query.applicationId) {
    conditions.push(eq(interview.applicationId, query.applicationId))
  }
  if (query.jobId) {
    conditions.push(eq(application.jobId, query.jobId))
  }
  if (query.status) {
    conditions.push(eq(interview.status, query.status))
  }
  if (query.from) {
    conditions.push(gte(interview.scheduledAt, new Date(query.from)))
  }
  if (query.to) {
    conditions.push(lte(interview.scheduledAt, new Date(query.to)))
  }

  const whereClause = and(...conditions)

  const [data, total] = await Promise.all([
    db
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
        createdAt: interview.createdAt,
        updatedAt: interview.updatedAt,
        applicationId: interview.applicationId,
        candidateFirstName: candidate.firstName,
        candidateLastName: candidate.lastName,
        candidateEmail: candidate.email,
        jobId: application.jobId,
        jobTitle: job.title,
      })
      .from(interview)
      .innerJoin(application, eq(application.id, interview.applicationId))
      .innerJoin(candidate, eq(candidate.id, application.candidateId))
      .innerJoin(job, eq(job.id, application.jobId))
      .where(whereClause)
      .orderBy(desc(interview.scheduledAt))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit),
    db.$count(interview, whereClause),
  ])

  return { data, total, page: query.page, limit: query.limit }
})
