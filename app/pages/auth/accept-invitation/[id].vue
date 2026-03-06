<script setup lang="ts">
import { Building2, UserPlus, Loader2, AlertTriangle, Check } from 'lucide-vue-next'

definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Accept Invitation — Reqcore',
  description: 'Accept an organization invitation on Reqcore',
  robots: 'noindex, nofollow',
})

const route = useRoute()
const localePath = useLocalePath()

const invitationId = computed(() => route.params.id as string)

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
const isAccepting = ref(false)
const error = ref('')
const success = ref(false)
const joinedOrgName = ref('')

// Check authentication state
const { data: session } = await authClient.useSession(useFetch)
const isAuthenticated = computed(() => !!session.value?.user)

// ─────────────────────────────────────────────
// Auto-accept when authenticated
// ─────────────────────────────────────────────
async function handleAccept() {
  if (!isAuthenticated.value || !invitationId.value) return

  isAccepting.value = true
  error.value = ''

  try {
    const result = await authClient.organization.acceptInvitation({
      invitationId: invitationId.value,
    })

    if (result.error) {
      error.value = result.error.message ?? 'Failed to accept invitation.'
      isAccepting.value = false
      return
    }

    success.value = true
    joinedOrgName.value = result.data?.member?.organizationId ?? ''

    // Set the joined org as active and redirect to dashboard
    if (result.data?.member?.organizationId) {
      await authClient.organization.setActive({
        organizationId: result.data.member.organizationId,
      })
    }

    setTimeout(() => {
      window.location.href = localePath('/dashboard')
    }, 1500)
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to accept invitation'
    error.value = message
  }
  finally {
    isAccepting.value = false
  }
}

// Auto-accept on mount if already authenticated
onMounted(() => {
  if (isAuthenticated.value) {
    handleAccept()
  }
})
</script>

<template>
  <!-- Success state -->
  <div v-if="success" class="flex flex-col items-center gap-4 py-6">
    <div class="flex items-center justify-center size-12 rounded-full bg-success-100 dark:bg-success-950 text-success-600 dark:text-success-400">
      <Check class="size-6" />
    </div>
    <div class="text-center">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1">You're in!</h2>
      <p class="text-sm text-surface-500 dark:text-surface-400">
        Invitation accepted. Redirecting to dashboard…
      </p>
    </div>
  </div>

  <!-- Accepting state (auto-accept in progress) -->
  <div v-else-if="isAccepting" class="flex flex-col items-center gap-3 py-8">
    <div class="size-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    <p class="text-sm text-surface-500 dark:text-surface-400">Accepting invitation…</p>
  </div>

  <!-- Error state -->
  <div v-else-if="error" class="flex flex-col items-center gap-4 py-6">
    <div class="flex items-center justify-center size-12 rounded-full bg-danger-100 dark:bg-danger-950 text-danger-600 dark:text-danger-400">
      <AlertTriangle class="size-6" />
    </div>
    <div class="text-center">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1">Invitation error</h2>
      <p class="text-sm text-surface-500 dark:text-surface-400">{{ error }}</p>
    </div>
    <div class="flex gap-3">
      <button
        class="text-sm text-brand-600 dark:text-brand-400 hover:underline"
        @click="handleAccept"
      >
        Try again
      </button>
      <NuxtLink
        :to="localePath('/auth/sign-in')"
        class="text-sm text-surface-500 dark:text-surface-400 hover:underline no-underline"
      >
        Go to sign in
      </NuxtLink>
    </div>
  </div>

  <!-- Not authenticated — prompt sign in/up -->
  <div v-else class="flex flex-col gap-5">
    <div class="text-center">
      <div class="flex items-center justify-center size-12 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mx-auto mb-4">
        <Building2 class="size-6" />
      </div>
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-1">Accept invitation</h2>
      <p class="text-sm text-surface-500 dark:text-surface-400">
        You've been invited to join an organization on Reqcore.
      </p>
    </div>

    <p class="text-sm text-surface-600 dark:text-surface-400 text-center">
      Sign in or create an account to accept this invitation.
    </p>

    <div class="flex gap-3">
      <NuxtLink
        :to="localePath(`/auth/sign-in?invitation=${invitationId}`)"
        class="flex-1 text-center px-4 py-2.5 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 transition-colors no-underline"
      >
        Sign in
      </NuxtLink>
      <NuxtLink
        :to="localePath(`/auth/sign-up?invitation=${invitationId}`)"
        class="flex-1 text-center px-4 py-2.5 border border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-300 rounded-md text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors no-underline"
      >
        Create account
      </NuxtLink>
    </div>
  </div>
</template>
