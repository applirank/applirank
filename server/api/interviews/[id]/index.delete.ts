import { and, eq } from 'drizzle-orm'
import { interview } from '../../../database/schema'
import { interviewIdParamSchema } from '../../../utils/schemas/interview'
import { cancelCalendarEvent } from '../../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { interview: ['delete'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, interviewIdParamSchema.parse)

  const current = await db.query.interview.findFirst({
    where: and(eq(interview.id, id), eq(interview.organizationId, orgId)),
    columns: { id: true, googleCalendarEventId: true, createdById: true },
  })

  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Interview not found' })
  }

  // Cancel Google Calendar event (non-blocking)
  if (current.googleCalendarEventId) {
    cancelCalendarEvent(current.createdById, current.googleCalendarEventId).catch(err => {
      console.error('[Calendar] Failed to cancel event on delete:', err)
    })
  }

  await db.delete(interview).where(
    and(eq(interview.id, id), eq(interview.organizationId, orgId)),
  )

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'deleted',
    resourceType: 'interview',
    resourceId: id,
  })

  setResponseStatus(event, 204)
  return null
})
