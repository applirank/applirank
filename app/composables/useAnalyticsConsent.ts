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
  const posthog = (useNuxtApp() as Record<string, unknown>).$posthog as ((() => { opt_in_capturing: () => void, opt_out_capturing: () => void, capture: (event: string, properties?: Record<string, unknown>) => void }) | undefined)
  const ph = posthog?.()

  const consentState = useState<ConsentState>('analytics-consent', () => null)

  // The useState factory only runs on the server: Nuxt serialises the `null`
  // result into the SSR payload and restores it on the client without ever
  // calling the factory again.  We must therefore re-hydrate the persisted
  // choice here — outside the factory — so that returning visitors don't see
  // the banner a second time and PostHog's opt-in/out state is correct on the
  // very first client render.
  if (import.meta.client && consentState.value === null) {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored === 'granted' || stored === 'denied') {
      consentState.value = stored
    }
  }

  const hasConsented = computed(() => consentState.value === 'granted')
  const hasDeclined = computed(() => consentState.value === 'denied')
  const needsConsent = computed(() => consentState.value === null)

  function acceptAnalytics() {
    consentState.value = 'granted'
    if (import.meta.client) {
      localStorage.setItem(CONSENT_KEY, 'granted')
    }
    ph?.opt_in_capturing()
    // Capture the entry-page pageview now that the user has opted in.
    // PostHog's init-time $pageview was suppressed by opt_out_capturing_by_default,
    // and subsequent pushState events only fire after this call, so we must
    // manually send one for the page the user is currently on.
    if (import.meta.client) {
      const url = new URL(window.location.href)
      url.search = ''
      url.hash = ''
      ph?.capture('$pageview', { $current_url: url.toString() })
    }
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
