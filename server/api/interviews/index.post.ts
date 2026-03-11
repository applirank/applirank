import { and, eq } from 'drizzle-orm'
import { interview, application, candidate, job, organization } from '../../database/schema'
import { createInterviewSchema } from '../../utils/schemas/interview'
import { createCalendarEvent } from '../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { interview: ['create'] })
  const orgId = session.session.activeOrganizationId

  const body = await readValidatedBody(event, createInterviewSchema.parse)

  // Verify the application exists and belongs to this org
  const app = await db.query.application.findFirst({
    where: and(
      eq(application.id, body.applicationId),
      eq(application.organizationId, orgId),
    ),
    with: {
      candidate: { columns: { email: true, firstName: true, lastName: true } },
      job: { columns: { title: true } },
    },
  })

  if (!app) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Application not found',
    })
  }

  const [created] = await db.insert(interview).values({
    organizationId: orgId,
    applicationId: body.applicationId,
    title: body.title,
    type: body.type,
    scheduledAt: new Date(body.scheduledAt),
    duration: body.duration,
    location: body.location ?? null,
    notes: body.notes ?? null,
    interviewers: body.interviewers ?? null,
    timezone: body.timezone ?? 'UTC',
    createdById: session.user.id,
  }).returning()

  if (!created) throw createError({ statusCode: 500, statusMessage: 'Failed to create interview' })

  // Sync to Google Calendar (non-blocking)
  if (app.candidate && app.job) {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
      columns: { name: true },
    })

    const candidateName = `${app.candidate.firstName} ${app.candidate.lastName}`
    createCalendarEvent(session.user.id, {
      title: body.title,
      description: [
        `Interview: ${body.title}`,
        `Position: ${app.job.title}`,
        `Candidate: ${candidateName}`,
        `Duration: ${body.duration} minutes`,
        ...(body.location ? [`Location: ${body.location}`] : []),
        ...(body.notes ? [`\nNotes: ${body.notes}`] : []),
        '',
        `Scheduled via ${org?.name || 'Reqcore'}`,
      ].join('\n'),
      startTime: new Date(body.scheduledAt),
      durationMinutes: body.duration,
      timezone: body.timezone ?? 'UTC',
      location: body.location ?? null,
      candidateEmail: app.candidate.email,
      candidateName,
      interviewerEmails: body.interviewers ?? [],
    }).then(async (eventId) => {
      if (eventId) {
        await db.update(interview)
          .set({ googleCalendarEventId: eventId })
          .where(eq(interview.id, created.id))
      }
    }).catch(err => {
      console.error('[Calendar] Failed to create event for interview:', err)
    })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'created',
    resourceType: 'interview',
    resourceId: created.id,
    metadata: {
      applicationId: body.applicationId,
      title: body.title,
      scheduledAt: body.scheduledAt,
    },
  })

  setResponseStatus(event, 201)
  return created
})
