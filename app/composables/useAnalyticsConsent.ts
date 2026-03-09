/**
 * Composable for managing PostHog analytics consent (GDPR compliance).
 *
 * By default, PostHog captures events. Users can opt out via this composable.
 * The consent state is persisted in localStorage.
 *
 * Usage:
 *   const { hasConsented, acceptAnalytics, declineAnalytics } = useAnalyticsConsent()
 */
const CONSENT_KEY = 'reqcore-analytics-consent'

type ConsentState = 'granted' | 'denied' | null

export function useAnalyticsConsent() {
  // usePostHog() is auto-imported by @posthog/nuxt, but the module is
  // conditionally loaded.  Replicate the safe accessor so this composable
  // works even when PostHog is not configured (CI, self-hosted without key).
  const posthog = (useNuxtApp() as Record<string, unknown>).$posthog as ((() => { opt_in_capturing: () => void, opt_out_capturing: () => void }) | undefined)
  const ph = posthog?.()

  const consentState = useState<ConsentState>('analytics-consent', () => {
    if (import.meta.server) return null
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored === 'granted' || stored === 'denied') return stored
    return null
  })

  const hasConsented = computed(() => consentState.value === 'granted')
  const hasDeclined = computed(() => consentState.value === 'denied')
  const needsConsent = computed(() => consentState.value === null)

  function acceptAnalytics() {
    consentState.value = 'granted'
    if (import.meta.client) {
      localStorage.setItem(CONSENT_KEY, 'granted')
    }
    ph?.opt_in_capturing()
  }

  function declineAnalytics() {
    consentState.value = 'denied'
    if (import.meta.client) {
      localStorage.setItem(CONSENT_KEY, 'denied')
    }
    ph?.opt_out_capturing()
  }

  // Apply stored consent on mount.
  // PostHog defaults to opt_out_capturing_by_default: true (GDPR), so we only
  // need to explicitly opt-in for users who previously granted consent.
  if (import.meta.client) {
    if (consentState.value === 'granted') {
      ph?.opt_in_capturing()
    }
    else {
      ph?.opt_out_capturing()
    }
  }

  return {
    hasConsented,
    hasDeclined,
    needsConsent,
    acceptAnalytics,
    declineAnalytics,
  }
}
