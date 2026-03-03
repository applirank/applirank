import type { statements } from '~~/shared/permissions'

/**
 * Permission descriptor — same shape as the server-side PermissionRequest.
 * Maps a resource to the actions being checked.
 *
 * Example: `{ job: ['create'] }` or `{ candidate: ['read', 'update'] }`
 */
type PermissionRequest = {
  [K in keyof typeof statements]?: ReadonlyArray<(typeof statements)[K][number]>
}

/**
 * ─────────────────────────────────────────────
 * usePermission — client-side permission gating
 * ─────────────────────────────────────────────
 *
 * Returns reactive `allowed` (boolean ref) indicating whether the
 * current user's role satisfies the given permission set.
 *
 * Uses Better Auth's `checkRolePermission` which runs synchronously
 * on the client against the AC config — no server roundtrip required.
 *
 * **Important:** client-side checks are cosmetic only.  They control
 * UI visibility (hide buttons, disable inputs).  The real enforcement
 * happens on the server via `requirePermission()`.
 *
 * Usage:
 * ```vue
 * <script setup>
 * const { allowed: canCreateJob } = usePermission({ job: ['create'] })
 * </script>
 *
 * <template>
 *   <UButton v-if="canCreateJob" @click="createJob">New Job</UButton>
 * </template>
 * ```
 */
export function usePermission(permissions: PermissionRequest) {
  const role = ref<string | null>(null)

  // Fetch the active member's role and re-fetch when org changes
  const activeOrgState = authClient.useActiveOrganization()

  async function fetchRole() {
    // Reset immediately to avoid stale role from previous org (race condition)
    role.value = null

    const { data, error } = await authClient.organization.getActiveMemberRole()
    if (!error) {
      role.value = data?.role ?? null
    }
  }

  // Only fetch on the client — during SSR there is no window.location,
  // so the Better Auth client cannot resolve relative API URLs.
  // Permission checks are cosmetic (UI gating); real enforcement is server-side.
  if (import.meta.client) {
    watch(
      () => activeOrgState.value.data?.id,
      () => fetchRole(),
      { immediate: true },
    )
  }

  const allowed = computed(() => {
    if (!role.value) return false

    return authClient.organization.checkRolePermission({
      permissions: permissions as Record<string, string[]>,
      role: role.value as 'owner' | 'admin' | 'member',
    })
  })

  return { allowed, role: readonly(role) }
}
