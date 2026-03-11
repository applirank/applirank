/**
 * POST /api/calendar/disconnect
 *
 * Disconnects the user's Google Calendar integration.
 * Stops the webhook channel and deletes encrypted credentials.
 */
import { removeCalendarIntegration, isGoogleCalendarConfigured } from '../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  if (!isGoogleCalendarConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Google Calendar integration is not configured' })
  }

  await removeCalendarIntegration(session.user.id)

  return { success: true }
})
