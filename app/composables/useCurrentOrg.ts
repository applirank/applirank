/**
 * Composable for managing the current user's organization context.
 * Provides org list, active org, and org switch/create actions.
 *
 * For session data, use `authClient.useSession(useFetch)` directly.
 * Must be called in `<script setup>` context.
 */
export function useCurrentOrg() {
  const localePath = useLocalePath()

  // ═══════════════════════════════════════════
  // 1. ORG LIST — reactive hook from Better Auth
  // ═══════════════════════════════════════════
  const orgListState = authClient.useListOrganizations()
  const orgs = computed(() => orgListState.value.data ?? [])
  const isOrgsLoading = computed(() => orgListState.value.isPending ?? false)

  // ═══════════════════════════════════════════
  // 2. ACTIVE ORG — reactive hook from Better Auth
  // ═══════════════════════════════════════════
  const activeOrgState = authClient.useActiveOrganization()
  const activeOrg = computed(() => activeOrgState.value.data)

  // ═══════════════════════════════════════════
  // 3. ACTIONS
  // ═══════════════════════════════════════════

  /**
   * Switch the active organization for the current session.
   * Reloads the app to reset all cached data.
   */
  async function switchOrg(orgId: string) {
    await authClient.organization.setActive({ organizationId: orgId })
    // Hard navigation ensures all component state is fully reset.
    // reloadNuxtApp() without force can soft-reload and leak stale state.
    window.location.href = localePath('/dashboard')
  }

  /**
   * Create a new organization and set it as active.
   * Navigates to the dashboard after creation.
   */
  async function createOrg(data: { name: string; slug: string }) {
    const result = await authClient.organization.create({
      name: data.name,
      slug: data.slug,
    })

    if (result.error) {
      throw result.error
    }

    // Explicitly set the new org as active to ensure the session reflects it
    if (result.data?.id) {
      await authClient.organization.setActive({ organizationId: result.data.id })
    }

    // Hard navigation ensures fresh session state is loaded (same pattern as switchOrg)
    window.location.href = localePath('/dashboard')
  }

  // ═══════════════════════════════════════════
  // 4. RETURN
  // ═══════════════════════════════════════════
  return {
    orgs,
    isOrgsLoading,
    activeOrg,
    switchOrg,
    createOrg,
  }
}
