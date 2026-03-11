/**
 * GET /api/calendar/status
 *
 * Returns the current user's calendar integration status.
 * Never exposes raw tokens — only connection metadata.
 */
import { eq } from 'drizzle-orm'
import { calendarIntegration } from '../../database/schema'
import { isGoogleCalendarConfigured } from '../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  if (!isGoogleCalendarConfigured()) {
    return {
      available: false,
      connected: false,
      provider: null,
      accountEmail: null,
      calendarId: null,
      webhookActive: false,
    }
  }

  const integration = await db.query.calendarIntegration.findFirst({
    where: eq(calendarIntegration.userId, session.user.id),
    columns: {
      provider: true,
      accountEmail: true,
      calendarId: true,
      webhookChannelId: true,
      webhookExpiration: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!integration) {
    return {
      available: true,
      connected: false,
      provider: null,
      accountEmail: null,
      calendarId: null,
      webhookActive: false,
    }
  }

  const webhookActive = !!(
    integration.webhookChannelId
    && integration.webhookExpiration
    && new Date(integration.webhookExpiration) > new Date()
  )

  return {
    available: true,
    connected: true,
    provider: integration.provider,
    accountEmail: integration.accountEmail,
    calendarId: integration.calendarId,
    webhookActive,
    connectedAt: integration.createdAt,
  }
})
