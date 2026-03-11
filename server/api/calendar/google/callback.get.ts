/**
 * GET /api/calendar/google/callback
 *
 * Handles the OAuth2 callback from Google after the user grants consent.
 * Validates the CSRF state token, exchanges the code for tokens,
 * encrypts and stores them, sets up the webhook, then redirects to settings.
 */
import { timingSafeEqual } from 'node:crypto'
import { exchangeCodeForTokens, saveCalendarIntegration, setupCalendarWebhook } from '../../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const query = getQuery(event)
  const code = query.code as string | undefined
  const state = query.state as string | undefined
  const error = query.error as string | undefined

  // Google returns an error param if the user denied consent
  if (error) {
    return sendRedirect(event, '/dashboard/settings/integrations?error=consent_denied')
  }

  if (!code || !state) {
    throw createError({ statusCode: 400, statusMessage: 'Missing authorization code or state' })
  }

  // Validate CSRF state token from cookie
  const storedState = getCookie(event, 'gcal_oauth_state')
  deleteCookie(event, 'gcal_oauth_state', { path: '/api/calendar/google/callback' })

  if (!storedState || storedState.length !== state.length) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid OAuth state — possible CSRF attack' })
  }

  const stateMatch = timingSafeEqual(
    Buffer.from(storedState, 'utf-8'),
    Buffer.from(state, 'utf-8'),
  )

  if (!stateMatch) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid OAuth state — possible CSRF attack' })
  }

  // Exchange authorization code for tokens
  try {
    const tokens = await exchangeCodeForTokens(code)

    // Encrypt and store tokens
    await saveCalendarIntegration(session.user.id, tokens)

    // Set up webhook for two-way sync (non-blocking)
    setupCalendarWebhook(session.user.id).catch(err => {
      console.error('[Calendar] Failed to setup webhook after connect:', err)
    })

    return sendRedirect(event, '/dashboard/settings/integrations?success=connected')
  }
  catch (err) {
    console.error('[Calendar] OAuth callback failed:', err)
    return sendRedirect(event, '/dashboard/settings/integrations?error=oauth_failed')
  }
})
