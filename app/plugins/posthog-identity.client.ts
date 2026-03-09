/**
 * Client-only plugin that identifies the current user and organization
 * in PostHog whenever the auth session is available.
 *
 * - Applies stored consent from localStorage BEFORE any identity events fire,
 *   preventing the race condition where identify() is discarded because PostHog
 *   is still in opt_out_capturing_by_default mode when ConsentBanner hasn't
 *   mounted yet.
 * - Calls posthog.identify() with the user's ID and safe properties
 * - Calls posthog.group() for the active organization (group analytics)
 * - Resets PostHog on sign-out to avoid cross-user data leakage
 */

// Must match the key used in useAnalyticsConsent.ts
const CONSENT_STORAGE_KEY = 'reqcore-analytics-consent'

// URL properties that may carry tokens or invitation IDs — always sanitized.
// Includes referrer properties: if a user navigated from /jobs?invite_token=xxx,
// the next page's $referrer would expose that token without sanitization.
const SENSITIVE_URL_PROPS = ['$current_url', '$initial_current_url', '$referrer', '$initial_referrer'] as const

export default defineNuxtPlugin({
  name: 'posthog-identity',
  setup() {
    // usePostHog() is auto-imported by @posthog/nuxt, but the module is
    // conditionally loaded (only when POSTHOG_PUBLIC_KEY is set).  In CI and
    // local-dev without the key the auto-import doesn't exist, so we replicate
    // its safe accessor here: $posthog is a function provided by the module's
    // plugin — when the module isn't loaded it simply won't be on NuxtApp.
    const $ph = (useNuxtApp() as Record<string, unknown>).$posthog as (() => import('posthog-js').PostHog) | undefined
    const posthog = $ph?.()
    if (!posthog) return

    // ── Apply stored consent BEFORE any events fire ──
    // PostHog starts with opt_out_capturing_by_default: true.  If the user has
    // already consented, we must call opt_in_capturing() here — before the
    // identity watchers in usePostHogIdentity fire — otherwise identify() and
    // group() calls are silently discarded while PostHog is still opted-out.
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (storedConsent === 'granted') {
      posthog.opt_in_capturing()
    }
    else {
      // Ensure opt-out state is explicit for new visitors and users who declined.
      posthog.opt_out_capturing()
    }

    // ── Privacy: strip query params and hashes from captured URLs ──
    // These may contain tokens, invitation IDs, or other PII.
    const originalCapture = posthog.capture.bind(posthog)
    posthog.capture = (eventName: string, properties?: Record<string, unknown>, options?: unknown) => {
      const props = { ...properties }
      for (const key of SENSITIVE_URL_PROPS) {
        if (typeof props[key] === 'string') {
          try {
            const url = new URL(props[key] as string)
            url.search = ''
            url.hash = ''
            props[key] = url.toString()
          }
          catch { /* keep original if parsing fails */ }
        }
      }
      return originalCapture(eventName, props, options as never)
    }

    // Provide a hook that components/composables can use to identify the user
    // after the app has mounted and auth session is available.
    return {
      provide: {
        // Only the user ID (UUID) is sent — name and createdAt are omitted to
        // satisfy GDPR data minimisation (Art. 5(1)(c)): a stable distinct_id
        // is sufficient for product analytics without exposing personal data.
        posthogIdentifyUser: (userId: string) => {
          posthog.identify(userId)
        },
        // Only id and human-readable name are forwarded.  slug is redundant
        // for analytics purposes and is omitted to minimise data collection.
        posthogSetOrganization: (org: { id: string, name?: string }) => {
          posthog.group('organization', org.id, {
            name: org.name || undefined,
          })
        },
        posthogReset: () => {
          posthog.reset()
        },
        posthogResetGroups: () => {
          posthog.resetGroups()
        },
      },
    }
  },
})
