/**
 * Guest middleware — redirects authenticated users away from auth pages.
 * Apply to sign-in, sign-up, etc. to prevent logged-in users from seeing them.
 *
 * If the user arrived with a pending invitation (via ?invitation=<id>),
 * redirect to the accept-invitation page so it auto-accepts.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)
  const localePath = useLocalePath()

  if (session.value) {
    const pendingInvitation = to.query.invitation as string | undefined
    if (pendingInvitation) {
      return navigateTo(localePath(`/auth/accept-invitation/${pendingInvitation}`))
    }
    return navigateTo(localePath('/dashboard'))
  }
})
