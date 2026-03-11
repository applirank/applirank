/**
 * POST /api/calendar/webhook
 *
 * Google Calendar push notification handler.
 * Receives notifications when calendar events change (e.g., candidate
 * accepts/declines via Google Calendar) and syncs the status back.
 *
 * This endpoint is PUBLIC — Google sends unauthenticated POST requests.
 * Security is ensured by validating the X-Goog-Channel-ID header against
 * stored webhook channel IDs in the database.
 */
import { eq } from 'drizzle-orm'
import { calendarIntegration } from '../../database/schema'
import { performIncrementalSync } from '../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  // Google sends these headers with push notifications
  const channelId = getHeader(event, 'x-goog-channel-id')
  const resourceState = getHeader(event, 'x-goog-resource-state')

  // Validate required headers
  if (!channelId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing channel ID' })
  }

  // 'sync' is the initial verification message — just acknowledge
  if (resourceState === 'sync') {
    setResponseStatus(event, 200)
    return { ok: true }
  }

  // Only process 'exists' (event changed) notifications
  if (resourceState !== 'exists') {
    setResponseStatus(event, 200)
    return { ok: true }
  }

  // Find the integration associated with this webhook channel
  const integration = await db.query.calendarIntegration.findFirst({
    where: eq(calendarIntegration.webhookChannelId, channelId),
    columns: { userId: true },
  })

  if (!integration) {
    // Unknown channel — could be a stale webhook or probing
    setResponseStatus(event, 200)
    return { ok: true }
  }

  // Perform incremental sync to pull changes from Google Calendar
  // Run async — Google expects a fast response
  performIncrementalSync(integration.userId).catch(err => {
    console.error(`[Calendar] Webhook sync failed for user ${integration.userId}:`, err)
  })

  setResponseStatus(event, 200)
  return { ok: true }
})
