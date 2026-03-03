<script setup lang="ts">
import { Building2, UserPlus, Shield, ShieldCheck, Loader2, AlertTriangle, Check } from 'lucide-vue-next'

definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Join Organization — Reqcore',
  description: 'Accept an invitation to join an organization on Reqcore',
  robots: 'noindex, nofollow',
})

const route = useRoute()
const localePath = useLocalePath()
const { acceptInviteLink, fetchInviteLinkInfo } = useInviteLinks()
const token = computed(() => route.params.token as string)

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
const isLoading = ref(true)
const isAccepting = ref(false)
const error = ref('')
const success = ref(false)
const linkInfo = ref<{
  organizationName: string
  organizationSlug: string
  role: string
  invitedByName: string | null
  expiresAt: string
} | null>(null)

// Check authentication state
const { data: session } = await authClient.useSession(useFetch)
const isAuthenticated = computed(() => !!session.value?.user)

// ─────────────────────────────────────────────
// Fetch link info
// ─────────────────────────────────────────────
async function fetchLinkInfo() {
  isLoading.value = true
  error.value = ''

  try {
    const data = await fetchInviteLinkInfo(token.value)
    linkInfo.value = data
  }
  catch (err: any) {
    const msg = err?.data?.statusMessage || err?.statusMessage || 'This invite link is invalid or has expired.'
    error.value = msg
  }
  finally {
    isLoading.value = false
  }
}

onMounted(fetchLinkInfo)

// ─────────────────────────────────────────────
// Accept invite link
// ─────────────────────────────────────────────
async function handleAccept() {
  if (!isAuthenticated.value || !token.value) return

  isAccepting.value = true
  error.value = ''

  try {
    const result = await acceptInviteLink(token.value)

    success.value = true

    // Set the new org as active and navigate to dashboard
    await authClient.organization.setActive({
      organizationId: result.organizationId,
    })

    setTimeout(() => {
      window.location.href = localePath('/dashboard')
    }, 1500)
  }
  catch (err: any) {
    const msg = err?.data?.statusMessage || err?.statusMessage || 'Failed to join organization'
    error.value = msg
  }
  finally {
    isAccepting.value = false
  }
}

function getRoleLabel(role: string) {
  if (role === 'admin') return 'Admin'
  return 'Member'
}

function getRoleIcon(role: string) {
  return role === 'admin' ? ShieldCheck : Shield
}
</script>

<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex flex-col items-center gap-3 py-8">
    <div class="size-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    <p class="text-sm text-surface-500 dark:text-surface-400">Loading invite details…</p>
  </div>

  <!-- Error state (invalid/expired link) -->
  <div v-else-if="error && !linkInfo" class="flex flex-col items-center gap-4 py-6">
    <div class="flex items-center justify-center size-12 rounded-full bg-danger-100 dark:bg-danger-950 text-danger-600 dark:text-danger-400">
      <AlertTriangle class="size-6" />
    </div>
    <div class="text-center">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1">Invalid invite link</h2>
      <p class="text-sm text-surface-500 dark:text-surface-400">{{ error }}</p>
    </div>
    <NuxtLink
      :to="localePath('/auth/sign-in')"
      class="text-sm text-brand-600 dark:text-brand-400 hover:underline no-underline"
    >
      Go to sign in
    </NuxtLink>
  </div>

  <!-- Success state -->
  <div v-else-if="success" class="flex flex-col items-center gap-4 py-6">
    <div class="flex items-center justify-center size-12 rounded-full bg-success-100 dark:bg-success-950 text-success-600 dark:text-success-400">
      <Check class="size-6" />
    </div>
    <div class="text-center">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1">You're in!</h2>
      <p class="text-sm text-surface-500 dark:text-surface-400">
        You've joined <strong>{{ linkInfo?.organizationName }}</strong>. Redirecting to dashboard…
      </p>
    </div>
  </div>

  <!-- Link info + accept form -->
  <div v-else-if="linkInfo" class="flex flex-col gap-5">
    <div class="text-center">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-1">Join organization</h2>
      <p class="text-sm text-surface-500 dark:text-surface-400">You've been invited to join a team on Reqcore.</p>
    </div>

    <!-- Org info card -->
    <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 p-5">
      <div class="flex items-center gap-3 mb-3">
        <div class="flex items-center justify-center size-10 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
          <Building2 class="size-5" />
        </div>
        <div>
          <div class="font-semibold text-surface-900 dark:text-surface-100">{{ linkInfo.organizationName }}</div>
          <div class="text-xs text-surface-400">{{ linkInfo.organizationSlug }}</div>
        </div>
      </div>

      <div class="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
        <div class="flex items-center gap-1.5">
          <component :is="getRoleIcon(linkInfo.role)" class="size-3.5" />
          <span>Join as <strong class="text-surface-700 dark:text-surface-300">{{ getRoleLabel(linkInfo.role) }}</strong></span>
        </div>
        <div v-if="linkInfo.invitedByName" class="flex items-center gap-1.5">
          <UserPlus class="size-3.5" />
          <span>Invited by <strong class="text-surface-700 dark:text-surface-300">{{ linkInfo.invitedByName }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="rounded-md border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-3 text-sm text-danger-700 dark:text-danger-400">
      {{ error }}
    </div>

    <!-- Not authenticated — prompt sign in/up -->
    <div v-if="!isAuthenticated" class="flex flex-col gap-3">
      <p class="text-sm text-surface-600 dark:text-surface-400 text-center">
        Sign in or create an account to accept this invitation.
      </p>
      <div class="flex gap-3">
        <NuxtLink
          :to="localePath('/auth/sign-in')"
          class="flex-1 text-center px-4 py-2.5 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 transition-colors no-underline"
        >
          Sign in
        </NuxtLink>
        <NuxtLink
          :to="localePath('/auth/sign-up')"
          class="flex-1 text-center px-4 py-2.5 border border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-300 rounded-md text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors no-underline"
        >
          Create account
        </NuxtLink>
      </div>
    </div>

    <!-- Authenticated — accept button -->
    <button
      v-else
      :disabled="isAccepting"
      class="w-full px-4 py-2.5 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      @click="handleAccept"
    >
      <Loader2 v-if="isAccepting" class="size-4 animate-spin" />
      <UserPlus v-else class="size-4" />
      {{ isAccepting ? 'Joining…' : `Join ${linkInfo.organizationName}` }}
    </button>
  </div>
</template>
