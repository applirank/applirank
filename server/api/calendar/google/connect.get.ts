/**
 * GET /api/calendar/google/connect
 *
 * Initiates the Google OAuth2 flow by redirecting the user to Google's consent screen.
 * Generates a CSRF state token stored in a secure, httpOnly cookie.
 */
import { randomBytes } from 'node:crypto'
import { getGoogleAuthUrl, isGoogleCalendarConfigured } from '../../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  if (!isGoogleCalendarConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Google Calendar integration is not configured',
    })
  }

  // Generate CSRF state token
  const stateToken = randomBytes(32).toString('hex')

  // Store state in a secure, httpOnly cookie (5 min expiry)
  setCookie(event, 'gcal_oauth_state', stateToken, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    maxAge: 300,
    path: '/api/calendar/google/callback',
  })

  const authUrl = getGoogleAuthUrl(stateToken)
  return sendRedirect(event, authUrl)
})
