import { and, eq } from 'drizzle-orm'
import { interview, application } from '../../../database/schema'
import { interviewIdParamSchema, updateInterviewSchema } from '../../../utils/schemas/interview'
import { INTERVIEW_STATUS_TRANSITIONS } from '~~/shared/status-transitions'
import { updateCalendarEvent, cancelCalendarEvent } from '../../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { interview: ['update'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, interviewIdParamSchema.parse)
  const body = await readValidatedBody(event, updateInterviewSchema.parse)

  // Fetch current interview for validation
  const current = await db.query.interview.findFirst({
    where: and(eq(interview.id, id), eq(interview.organizationId, orgId)),
    columns: { id: true, status: true, googleCalendarEventId: true, createdById: true, timezone: true },
  })

  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Interview not found' })
  }

  // Validate status transition
  if (body.status && body.status !== current.status) {
    const allowed = INTERVIEW_STATUS_TRANSITIONS[current.status] ?? []
    if (!allowed.includes(body.status)) {
      throw createError({
        statusCode: 422,
        statusMessage: `Cannot transition from "${current.status}" to "${body.status}"`,
      })
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title !== undefined) updateData.title = body.title
  if (body.type !== undefined) updateData.type = body.type
  if (body.status !== undefined) updateData.status = body.status
  if (body.scheduledAt !== undefined) updateData.scheduledAt = new Date(body.scheduledAt)
  if (body.duration !== undefined) updateData.duration = body.duration
  if (body.location !== undefined) updateData.location = body.location
  if (body.notes !== undefined) updateData.notes = body.notes
  if (body.interviewers !== undefined) updateData.interviewers = body.interviewers
  if (body.timezone !== undefined) updateData.timezone = body.timezone

  const [updated] = await db
    .update(interview)
    .set(updateData)
    .where(and(eq(interview.id, id), eq(interview.organizationId, orgId)))
    .returning()

  // Sync changes to Google Calendar (non-blocking)
  if (current.googleCalendarEventId) {
    const isCancelling = body.status === 'cancelled'

    if (isCancelling) {
      cancelCalendarEvent(current.createdById, current.googleCalendarEventId).catch(err => {
        console.error('[Calendar] Failed to cancel event:', err)
      })
    }
    else {
      // Fetch candidate info for attendee update
      const interviewWithApp = await db.query.interview.findFirst({
        where: eq(interview.id, id),
        with: {
          application: {
            with: {
              candidate: { columns: { email: true, firstName: true, lastName: true } },
            },
          },
        },
      })

      const candidate = interviewWithApp?.application?.candidate
      updateCalendarEvent(current.createdById, current.googleCalendarEventId, {
        ...(body.title ? { title: body.title } : {}),
        ...(body.scheduledAt ? {
          startTime: new Date(body.scheduledAt),
          durationMinutes: body.duration ?? updated?.duration ?? 60,
          timezone: body.timezone ?? current.timezone ?? 'UTC',
        } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(candidate ? {
          candidateEmail: candidate.email,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
        } : {}),
        ...(body.interviewers ? { interviewerEmails: body.interviewers } : {}),
      }).catch(err => {
        console.error('[Calendar] Failed to update event:', err)
      })
    }
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: body.status && body.status !== current.status ? 'status_changed' : 'updated',
    resourceType: 'interview',
    resourceId: id,
    metadata: {
      ...(body.status && body.status !== current.status
        ? { from: current.status, to: body.status }
        : {}),
    },
  })

  return updated
})
