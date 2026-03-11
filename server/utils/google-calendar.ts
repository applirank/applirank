/**
 * Google Calendar integration utility.
 *
 * Handles OAuth2 flow, token management, event CRUD, and webhook setup
 * for two-way interview scheduling sync.
 */
import { google, type calendar_v3 } from 'googleapis'
import { eq, and } from 'drizzle-orm'
import { encrypt, decrypt } from './encryption'
import { calendarIntegration, interview } from '../database/schema'

// ─────────────────────────────────────────────
// OAuth2 Client
// ─────────────────────────────────────────────

/**
 * Check if Google Calendar integration is configured.
 */
export function isGoogleCalendarConfigured(): boolean {
  return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
}

/**
 * Create a Google OAuth2 client with application credentials.
 */
function createOAuth2Client(redirectUri: string) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured')
  }
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  )
}

/**
 * Get the OAuth2 redirect URI based on the current deployment URL.
 */
function getRedirectUri(): string {
  const baseUrl = env.BETTER_AUTH_URL
    || (env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : '')
    || 'https://reqcore.com'
  return `${baseUrl}/api/calendar/google/callback`
}

/**
 * Generate the Google OAuth2 consent URL for calendar access.
 * Includes a CSRF state parameter to prevent forgery.
 */
export function getGoogleAuthUrl(stateToken: string): string {
  const oauth2Client = createOAuth2Client(getRedirectUri())

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: stateToken,
  })
}

/**
 * Exchange an authorization code for OAuth2 tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string
  refreshToken: string
  email: string | null
}> {
  const oauth2Client = createOAuth2Client(getRedirectUri())
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain OAuth tokens — ensure consent prompt is shown')
  }

  // Fetch the connected Google account email
  oauth2Client.setCredentials(tokens)
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  let email: string | null = null
  try {
    const userInfo = await oauth2.userinfo.get()
    email = userInfo.data.email ?? null
  }
  catch {
    // Non-critical — email is for display only
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    email,
  }
}

// ─────────────────────────────────────────────
// Token Management
// ─────────────────────────────────────────────

/**
 * Get an authenticated Google Calendar client for a user.
 * Decrypts stored tokens and handles automatic refresh.
 */
export async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
  const integration = await db.query.calendarIntegration.findFirst({
    where: eq(calendarIntegration.userId, userId),
  })

  if (!integration) return null

  const secret = env.BETTER_AUTH_SECRET
  const accessToken = decrypt(integration.accessTokenEncrypted, secret)
  const refreshToken = decrypt(integration.refreshTokenEncrypted, secret)

  if (!accessToken || !refreshToken) {
    console.error(`[Calendar] Failed to decrypt tokens for user ${userId}`)
    return null
  }

  const oauth2Client = createOAuth2Client(getRedirectUri())
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  // Listen for token refresh events and persist the new access token
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      try {
        const newAccessTokenEncrypted = encrypt(tokens.access_token, secret)
        await db.update(calendarIntegration)
          .set({
            accessTokenEncrypted: newAccessTokenEncrypted,
            updatedAt: new Date(),
          })
          .where(eq(calendarIntegration.userId, userId))
      }
      catch (err) {
        console.error('[Calendar] Failed to persist refreshed token:', err)
      }
    }
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

/**
 * Save or update calendar integration credentials for a user.
 */
export async function saveCalendarIntegration(userId: string, params: {
  accessToken: string
  refreshToken: string
  email: string | null
}): Promise<void> {
  const secret = env.BETTER_AUTH_SECRET
  const accessTokenEncrypted = encrypt(params.accessToken, secret)
  const refreshTokenEncrypted = encrypt(params.refreshToken, secret)

  // Upsert: update if exists, insert if not
  const existing = await db.query.calendarIntegration.findFirst({
    where: eq(calendarIntegration.userId, userId),
  })

  if (existing) {
    await db.update(calendarIntegration)
      .set({
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accountEmail: params.email,
        updatedAt: new Date(),
      })
      .where(eq(calendarIntegration.userId, userId))
  }
  else {
    await db.insert(calendarIntegration).values({
      userId,
      provider: 'google',
      accessTokenEncrypted,
      refreshTokenEncrypted,
      accountEmail: params.email,
    })
  }
}

/**
 * Remove calendar integration for a user.
 * Stops the webhook channel and deletes stored credentials.
 */
export async function removeCalendarIntegration(userId: string): Promise<void> {
  const integration = await db.query.calendarIntegration.findFirst({
    where: eq(calendarIntegration.userId, userId),
  })

  if (!integration) return

  // Stop the webhook channel if active
  if (integration.webhookChannelId && integration.webhookResourceId) {
    try {
      const calendar = await getCalendarClient(userId)
      if (calendar) {
        await calendar.channels.stop({
          requestBody: {
            id: integration.webhookChannelId,
            resourceId: integration.webhookResourceId,
          },
        })
      }
    }
    catch (err) {
      // Non-critical — channel may have already expired
      console.warn('[Calendar] Failed to stop webhook channel on disconnect:', err)
    }
  }

  await db.delete(calendarIntegration).where(eq(calendarIntegration.userId, userId))
}

// ─────────────────────────────────────────────
// Calendar Event CRUD
// ─────────────────────────────────────────────

interface InterviewEventData {
  title: string
  description: string
  startTime: Date
  durationMinutes: number
  timezone: string
  location: string | null
  candidateEmail: string | null
  candidateName: string
  interviewerEmails: string[]
  sendUpdates?: boolean
}

/**
 * Create a Google Calendar event for an interview.
 * Adds the candidate and interviewers as attendees for two-way communication.
 * Returns the created event ID and HTML link, or null if creation failed.
 */
export async function createCalendarEvent(
  userId: string,
  data: InterviewEventData,
): Promise<{ id: string; htmlLink: string } | null> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return null

  const integration = await db.query.calendarIntegration.findFirst({
    where: eq(calendarIntegration.userId, userId),
    columns: { calendarId: true },
  })

  const calendarId = integration?.calendarId || 'primary'

  const endTime = new Date(data.startTime.getTime() + data.durationMinutes * 60_000)

  const attendees: calendar_v3.Schema$EventAttendee[] = [
    ...(data.candidateEmail
      ? [{
          email: data.candidateEmail,
          displayName: data.candidateName,
          responseStatus: 'needsAction' as const,
        }]
      : []),
    ...data.interviewerEmails.map(email => ({
      email,
      responseStatus: 'accepted' as const,
    })),
  ]

  try {
    const response = await calendar.events.insert({
      calendarId,
      sendUpdates: data.sendUpdates !== false ? 'all' : 'none',
      requestBody: {
        summary: data.title,
        description: data.description,
        start: {
          dateTime: data.startTime.toISOString(),
          timeZone: data.timezone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: data.timezone,
        },
        location: data.location || undefined,
        attendees,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 15 },
            { method: 'email', minutes: 60 },
          ],
        },
        guestsCanModify: false,
        guestsCanInviteOthers: false,
        transparency: 'opaque',
        status: 'confirmed',
      },
    })

    const id = response.data.id
    const htmlLink = response.data.htmlLink
    if (!id || !htmlLink) return null
    return { id, htmlLink }
  }
  catch (err) {
    console.error('[Calendar] Failed to create event:', err)
    return null
  }
}

/**
 * Update an existing Google Calendar event.
 * Returns the htmlLink if the update succeeded, or null on failure.
 */
export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  data: Partial<InterviewEventData>,
): Promise<string | null> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return false

  const integration = await db.query.calendarIntegration.findFirst({
    where: eq(calendarIntegration.userId, userId),
    columns: { calendarId: true },
  })

  const calendarId = integration?.calendarId || 'primary'

  const patch: calendar_v3.Schema$Event = {}

  if (data.title) patch.summary = data.title
  if (data.description) patch.description = data.description
  if (data.location !== undefined) patch.location = data.location || undefined

  if (data.startTime && data.durationMinutes) {
    const endTime = new Date(data.startTime.getTime() + data.durationMinutes * 60_000)
    patch.start = {
      dateTime: data.startTime.toISOString(),
      timeZone: data.timezone || 'UTC',
    }
    patch.end = {
      dateTime: endTime.toISOString(),
      timeZone: data.timezone || 'UTC',
    }
  }

  if (data.candidateEmail || data.interviewerEmails) {
    const attendees: calendar_v3.Schema$EventAttendee[] = []
    if (data.candidateEmail) {
      attendees.push({
        email: data.candidateEmail,
        displayName: data.candidateName,
        responseStatus: 'needsAction',
      })
    }
    if (data.interviewerEmails) {
      attendees.push(...data.interviewerEmails.map(email => ({
        email,
        responseStatus: 'accepted' as const,
      })))
    }
    patch.attendees = attendees
  }

  try {
    const response = await calendar.events.patch({
      calendarId,
      eventId,
      sendUpdates: 'all',
      requestBody: patch,
    })
    return response.data.htmlLink ?? null
  }
  catch (err) {
    console.error('[Calendar] Failed to update event:', err)
    return null
  }
}

/**
 * Cancel a Google Calendar event (set status to cancelled).
 * Sends cancellation notifications to all attendees.
 */
export async function cancelCalendarEvent(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return false

  const integration = await db.query.calendarIntegration.findFirst({
    where: eq(calendarIntegration.userId, userId),
    columns: { calendarId: true },
  })

  const calendarId = integration?.calendarId || 'primary'

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all',
    })
    return true
  }
  catch (err) {
    console.error('[Calendar] Failed to cancel event:', err)
    return false
  }
}

// ─────────────────────────────────────────────
// Webhook (Push Notifications) for Two-Way Sync
// ─────────────────────────────────────────────

/**
 * Set up a Google Calendar webhook to receive push notifications
 * when events change (e.g., candidate accepts/declines via Google Calendar).
 */
export async function setupCalendarWebhook(userId: string): Promise<boolean> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return false

  const integration = await db.query.calendarIntegration.findFirst({
    where: eq(calendarIntegration.userId, userId),
    columns: { calendarId: true, webhookChannelId: true, webhookResourceId: true },
  })

  if (!integration) return false

  // Stop existing channel if any
  if (integration.webhookChannelId && integration.webhookResourceId) {
    try {
      await calendar.channels.stop({
        requestBody: {
          id: integration.webhookChannelId,
          resourceId: integration.webhookResourceId,
        },
      })
    }
    catch {
      // Ignore — may have already expired
    }
  }

  const baseUrl = env.BETTER_AUTH_URL
    || (env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : '')
    || 'https://reqcore.com'

  const channelId = crypto.randomUUID()
  const calendarId = integration.calendarId || 'primary'

  try {
    const response = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: `${baseUrl}/api/calendar/webhook`,
        // Google allows max ~7 days (604800 seconds)
        params: {
          ttl: '604800',
        },
      },
    })

    // Store the channel info for later stop/renewal
    await db.update(calendarIntegration)
      .set({
        webhookChannelId: channelId,
        webhookResourceId: response.data.resourceId ?? null,
        webhookExpiration: response.data.expiration
          ? new Date(Number(response.data.expiration))
          : null,
        updatedAt: new Date(),
      })
      .where(eq(calendarIntegration.userId, userId))

    // Do an initial sync to get the syncToken
    await performIncrementalSync(userId)

    return true
  }
  catch (err) {
    console.error('[Calendar] Failed to setup webhook:', err)
    return false
  }
}

/**
 * Perform an incremental sync to process changes from Google Calendar.
 * Updates interview candidateResponse based on attendee RSVP status.
 */
export async function performIncrementalSync(userId: string): Promise<void> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return

  const integration = await db.query.calendarIntegration.findFirst({
    where: eq(calendarIntegration.userId, userId),
  })

  if (!integration) return

  const calendarId = integration.calendarId || 'primary'

  try {
    let pageToken: string | undefined
    let nextSyncToken: string | undefined

    do {
      const params: calendar_v3.Params$Resource$Events$List = {
        calendarId,
        singleEvents: true,
        maxResults: 50,
      }

      if (integration.syncToken && !pageToken) {
        params.syncToken = integration.syncToken
      }
      else if (!integration.syncToken && !pageToken) {
        // First sync — only look at future events
        params.timeMin = new Date().toISOString()
      }

      if (pageToken) {
        params.pageToken = pageToken
      }

      let data: { items?: { id?: string | null, attendees?: { email?: string | null, responseStatus?: string | null }[], status?: string | null }[], nextPageToken?: string | null, nextSyncToken?: string | null }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- googleapis overloads resolve to void
        const response = await (calendar.events.list(params) as any)
        data = response.data
        data = response.data
      }
      catch (err: unknown) {
        // If syncToken is invalid (410 Gone), do a full re-sync
        if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 410) {
          await db.update(calendarIntegration)
            .set({ syncToken: null, updatedAt: new Date() })
            .where(eq(calendarIntegration.userId, userId))
          return performIncrementalSync(userId)
        }
        throw err
      }

      const events = data.items ?? []

      for (const event of events) {
        if (!event.id) continue
        await syncEventAttendeeStatus(event)
      }

      pageToken = data.nextPageToken ?? undefined
      nextSyncToken = data.nextSyncToken ?? undefined
    } while (pageToken)

    // Save the sync token for next incremental sync
    if (nextSyncToken) {
      await db.update(calendarIntegration)
        .set({ syncToken: nextSyncToken, updatedAt: new Date() })
        .where(eq(calendarIntegration.userId, userId))
    }
  }
  catch (err) {
    console.error('[Calendar] Incremental sync failed:', err)
  }
}

/**
 * Map a Google Calendar attendee RSVP status to our candidateResponse enum.
 */
function mapAttendeeStatus(
  googleStatus: string | null | undefined,
): 'accepted' | 'declined' | 'tentative' | 'pending' | null {
  switch (googleStatus) {
    case 'accepted': return 'accepted'
    case 'declined': return 'declined'
    case 'tentative': return 'tentative'
    case 'needsAction': return 'pending'
    default: return null
  }
}

/**
 * Sync a single Google Calendar event's attendee status back to the interview.
 */
async function syncEventAttendeeStatus(event: calendar_v3.Schema$Event): Promise<void> {
  if (!event.id) return

  // Find the interview linked to this Google Calendar event
  const interviewRecord = await db.query.interview.findFirst({
    where: eq(interview.googleCalendarEventId, event.id),
    with: {
      application: {
        with: {
          candidate: { columns: { email: true } },
        },
      },
    },
  })

  if (!interviewRecord) return

  // Find the candidate's attendee status
  const candidateEmail = interviewRecord.application?.candidate?.email
  if (!candidateEmail || !event.attendees) return

  const candidateAttendee = event.attendees.find(
    a => a.email?.toLowerCase() === candidateEmail.toLowerCase(),
  )

  if (!candidateAttendee) return

  const newStatus = mapAttendeeStatus(candidateAttendee.responseStatus)
  if (!newStatus || newStatus === interviewRecord.candidateResponse) return

  // Update the interview with the new candidate response
  await db.update(interview)
    .set({
      candidateResponse: newStatus,
      candidateRespondedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(interview.id, interviewRecord.id))

  console.info(
    `[Calendar] Synced candidate response for interview ${interviewRecord.id}: ` +
    `${interviewRecord.candidateResponse} → ${newStatus}`,
  )
}
