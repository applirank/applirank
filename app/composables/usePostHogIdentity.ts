/**
 * Composable that syncs the Better Auth session with PostHog identity.
 * Call once in a root-level layout or app.vue to enable automatic
 * user identification and organization group analytics.
 *
 * Must be called in `<script setup>` context (not in a plugin).
 *
 * Identity and group calls are gated on analytics consent so that events are
 * never sent before the user has opted in.  When a user grants consent during
 * their session (ConsentBanner), the watchers re-fire and identify them
 * immediately without requiring a page reload.
 */
export async function usePostHogIdentity() {
  const { $posthogIdentifyUser, $posthogSetOrganization, $posthogReset, $posthogResetGroups } = useNuxtApp()

  if (!$posthogIdentifyUser) return

  const { data: session } = await authClient.useSession(useFetch)
  const activeOrgState = authClient.useActiveOrganization()

  // Share the consent reactive state.  useAnalyticsConsent also applies the
  // stored consent flag to PostHog on the client, so calling it here means
  // consent is active before the immediate watchers fire below.
  const { hasConsented } = useAnalyticsConsent()

  // Watch session AND consent so identify re-fires when a new user accepts
  // consent during their visit, and is skipped when PostHog is opted-out.
  watch(
    [() => session.value, hasConsented] as const,
    ([currentSession, consented], prev) => {
      const user = currentSession?.user
      const previousUser = (prev?.[0] as typeof session.value)?.user

      if (user?.id && consented) {
        // Only the user ID is forwarded — name and createdAt are intentionally
        // omitted so PostHog receives the minimal data needed for analytics.
        ;($posthogIdentifyUser as (userId: string) => void)(user.id)
      }
      else if (previousUser?.id && !user?.id) {
        // Always reset on log-out regardless of consent state so that
        // no user identity leaks into the next anonymous session.
        ($posthogReset as () => void)()
      }
    },
    { immediate: true },
  )

  // Watch org AND consent for group analytics — same gating logic as above.
  watch(
    [() => activeOrgState.value?.data, hasConsented] as const,
    ([org, consented]) => {
      if (consented) {
        if (org?.id) {
          // Only org id and name are forwarded; slug is omitted to minimise data.
          ;($posthogSetOrganization as (org: { id: string, name?: string }) => void)({
            id: org.id,
            name: org.name || undefined,
          })
        }
        else {
          // Clear org group when user has no active organization to avoid
          // attributing events to the previously selected org.
          ($posthogResetGroups as (() => void) | undefined)?.()
        }
      }
    },
    { immediate: true },
  )
}
