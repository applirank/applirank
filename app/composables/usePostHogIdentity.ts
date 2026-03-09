/**
 * Composable that syncs the Better Auth session with PostHog identity.
 * Call once in a root-level layout or app.vue to enable automatic
 * user identification and organization group analytics.
 *
 * Must be called in `<script setup>` context (not in a plugin).
 */
export async function usePostHogIdentity() {
  const { $posthogIdentifyUser, $posthogSetOrganization, $posthogReset, $posthogResetGroups } = useNuxtApp()

  if (!$posthogIdentifyUser) return

  const { data: session } = await authClient.useSession(useFetch)
  const activeOrgState = authClient.useActiveOrganization()

  // Watch session changes to identify/reset user
  watch(
    () => session.value,
    (currentSession, previousSession) => {
      const user = currentSession?.user

      if (user?.id) {
        ($posthogIdentifyUser as (user: { id: string, name?: string, createdAt?: string }) => void)({
          id: user.id,
          name: user.name || undefined,
          createdAt: user.createdAt ? String(user.createdAt) : undefined,
        })
      }
      else if (previousSession?.user?.id) {
        ($posthogReset as () => void)()
      }
    },
    { immediate: true },
  )

  // Watch active organization for group analytics
  watch(
    () => activeOrgState.value?.data,
    (org) => {
      if (org?.id) {
        ($posthogSetOrganization as (org: { id: string, name?: string, slug?: string }) => void)({
          id: org.id,
          name: org.name || undefined,
          slug: org.slug || undefined,
        })
      }
      else {
        // Clear org group when user has no active organization to avoid
        // attributing events to the previously selected org.
        ($posthogResetGroups as (() => void) | undefined)?.()
      }
    },
    { immediate: true },
  )
}
