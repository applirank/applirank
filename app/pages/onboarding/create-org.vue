<script setup lang="ts">
import { Building2, UserPlus, Search, Loader2, Check, Link2, MessageSquare } from 'lucide-vue-next'

definePageMeta({
  layout: 'auth',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Create Organization — Reqcore',
  description: 'Create your organization to start recruiting',
  robots: 'noindex, nofollow',
})

const { orgs, isOrgsLoading, switchOrg, createOrg } = useCurrentOrg()
const { acceptInviteLink } = useInviteLinks()
const localePath = useLocalePath()

const orgName = ref('')
const slug = ref('')
const slugEdited = ref(false)
const error = ref('')
const isLoading = ref(false)
const showCreateForm = ref(false)

// ─────────────────────────────────────────────
// View mode: 'picker' | 'create' | 'join'
// ─────────────────────────────────────────────
const viewMode = ref<'picker' | 'create' | 'join'>('picker')

// ─────────────────────────────────────────────
// Auto-switch: if user already belongs to exactly one org, activate it
// ─────────────────────────────────────────────
const autoSwitched = ref(false)

watch([orgs, isOrgsLoading], async ([orgList, loading]) => {
  if (loading || autoSwitched.value || viewMode.value !== 'picker') return
  if (orgList.length === 1) {
    const firstOrg = orgList[0]
    if (!firstOrg) return

    autoSwitched.value = true
    isLoading.value = true
    try {
      await switchOrg(firstOrg.id)
    }
    catch {
      isLoading.value = false
      autoSwitched.value = false
    }
  }
}, { immediate: true })

async function handleSwitchOrg(orgId: string) {
  isLoading.value = true
  try {
    await switchOrg(orgId)
  }
  catch {
    isLoading.value = false
  }
}

/** Auto-generate slug from org name unless user has manually edited it */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

watch(orgName, (newName) => {
  if (!slugEdited.value) {
    slug.value = generateSlug(newName)
  }
})

function onSlugInput() {
  slugEdited.value = true
}

async function handleCreateOrg() {
  error.value = ''

  if (!orgName.value.trim()) {
    error.value = 'Organization name is required.'
    return
  }

  if (!slug.value.trim()) {
    error.value = 'Slug is required.'
    return
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug.value)) {
    error.value = 'Slug must be lowercase alphanumeric with hyphens, and cannot start or end with a hyphen.'
    return
  }

  isLoading.value = true

  try {
    await createOrg({ name: orgName.value.trim(), slug: slug.value.trim() })
  }
  catch (err: any) {
    error.value = err?.message ?? 'Failed to create organization. The slug may already be taken.'
    isLoading.value = false
  }
}

// ─────────────────────────────────────────────
// Join existing org — invite code
// ─────────────────────────────────────────────
const inviteCode = ref('')
const inviteCodeError = ref('')
const isAcceptingCode = ref(false)
const inviteCodeSuccess = ref(false)

/**
 * Extract the token from either a full URL or a raw code.
 * Handles:
 *   - Full URL: https://example.com/join/abc123def456...
 *   - Just the token: abc123def456...
 */
function extractToken(input: string): string {
  const trimmed = input.trim()
  // If it looks like a URL, extract the last path segment
  try {
    const url = new URL(trimmed)
    const segments = url.pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] || trimmed
  }
  catch {
    // Not a URL, treat as raw token
    return trimmed
  }
}

async function handleAcceptInviteCode() {
  inviteCodeError.value = ''
  const token = extractToken(inviteCode.value)

  if (!token) {
    inviteCodeError.value = 'Please enter an invite link or code.'
    return
  }

  isAcceptingCode.value = true

  try {
    const result = await acceptInviteLink(token)

    inviteCodeSuccess.value = true

    // Set the new org as active and navigate to dashboard
    await authClient.organization.setActive({
      organizationId: result.organizationId,
    })

    setTimeout(() => {
      window.location.href = localePath('/dashboard')
    }, 1500)
  }
  catch (err: any) {
    inviteCodeError.value = err?.data?.statusMessage || 'Invalid, expired, or already used invite link.'
  }
  finally {
    isAcceptingCode.value = false
  }
}

// ─────────────────────────────────────────────
// Join existing org — search & request
// ─────────────────────────────────────────────
const orgSearch = ref('')
const orgSearchResults = ref<Array<{ id: string; name: string; slug: string }>>([])
const isSearching = ref(false)
const searchError = ref('')
const joinRequestMessage = ref('')
const isSubmittingRequest = ref(false)
const requestSuccess = ref('')
const requestError = ref('')
const selectedOrg = ref<{ id: string; name: string; slug: string } | null>(null)

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

watch(orgSearch, (q) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (q.trim().length < 2) {
    orgSearchResults.value = []
    return
  }
  searchDebounceTimer = setTimeout(() => handleOrgSearch(), 300)
})

async function handleOrgSearch() {
  const q = orgSearch.value.trim()
  if (q.length < 2) return

  isSearching.value = true
  searchError.value = ''

  try {
    const data = await $fetch('/api/org-search', {
      params: { q },
    })
    orgSearchResults.value = data as typeof orgSearchResults.value
  }
  catch (err: any) {
    searchError.value = err?.data?.statusMessage || 'Search failed'
  }
  finally {
    isSearching.value = false
  }
}

async function handleSubmitJoinRequest() {
  if (!selectedOrg.value) return

  isSubmittingRequest.value = true
  requestError.value = ''
  requestSuccess.value = ''

  try {
    await $fetch('/api/join-requests', {
      method: 'POST',
      body: {
        organizationId: selectedOrg.value.id,
        message: joinRequestMessage.value.trim() || undefined,
      },
    })
    requestSuccess.value = `Join request sent to ${selectedOrg.value.name}! An admin will review it.`
    selectedOrg.value = null
    joinRequestMessage.value = ''
  }
  catch (err: any) {
    requestError.value = err?.data?.statusMessage || 'Failed to send join request'
  }
  finally {
    isSubmittingRequest.value = false
  }
}
</script>

<template>
  <!-- Loading / auto-switching state -->
  <div v-if="isLoading || isOrgsLoading" class="flex flex-col items-center gap-3 py-8">
    <div class="size-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    <p class="text-sm text-surface-500 dark:text-surface-400">Setting up your workspace…</p>
  </div>

  <!-- Invite code accepted success -->
  <div v-else-if="inviteCodeSuccess" class="flex flex-col items-center gap-4 py-6">
    <div class="flex items-center justify-center size-12 rounded-full bg-success-100 dark:bg-success-950 text-success-600 dark:text-success-400">
      <Check class="size-6" />
    </div>
    <div class="text-center">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1">You're in!</h2>
      <p class="text-sm text-surface-500 dark:text-surface-400">Redirecting to dashboard…</p>
    </div>
  </div>

  <!-- Org picker: user has orgs but none is active -->
  <div v-else-if="orgs.length > 0 && viewMode === 'picker'" class="flex flex-col gap-4">
    <h2 class="text-xl font-semibold text-center text-surface-900 dark:text-surface-100">Select an organization</h2>
    <p class="text-sm text-surface-500 dark:text-surface-400 text-center mb-2">
      Choose which workspace to open.
    </p>

    <button
      v-for="org in orgs"
      :key="org.id"
      class="flex items-center gap-3 px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-md text-left text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors cursor-pointer"
      @click="handleSwitchOrg(org.id)"
    >
      <Building2 class="size-5 text-surface-400" />
      <div class="flex flex-col">
        <span class="font-medium">{{ org.name }}</span>
        <span class="text-xs text-surface-400">{{ org.slug }}</span>
      </div>
    </button>

    <div class="flex flex-col gap-2 mt-2 pt-2 border-t border-surface-200 dark:border-surface-800">
      <button
        class="text-sm text-brand-600 dark:text-brand-400 hover:underline"
        @click="viewMode = 'create'"
      >
        Create a new organization
      </button>
      <button
        class="text-sm text-brand-600 dark:text-brand-400 hover:underline"
        @click="viewMode = 'join'"
      >
        Join an existing organization
      </button>
    </div>
  </div>

  <!-- Join existing org -->
  <div v-else-if="viewMode === 'join'" class="flex flex-col gap-5">
    <div class="text-center">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">Join an organization</h2>
      <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
        Enter an invite link/code, or search for an organization to request access.
      </p>
    </div>

    <!-- Invite code input -->
    <div class="rounded-lg border border-surface-200 dark:border-surface-800 p-4 bg-white dark:bg-surface-800/50">
      <div class="flex items-center gap-2 mb-3">
        <Link2 class="size-4 text-brand-600 dark:text-brand-400" />
        <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Have an invite link?</h3>
      </div>
      <div class="flex gap-2">
        <input
          v-model="inviteCode"
          type="text"
          placeholder="Paste invite link or code"
          class="flex-1 px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
          @keydown.enter="handleAcceptInviteCode"
        />
        <button
          :disabled="isAcceptingCode || !inviteCode.trim()"
          class="px-4 py-2 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          @click="handleAcceptInviteCode"
        >
          <Loader2 v-if="isAcceptingCode" class="size-4 animate-spin" />
          Join
        </button>
      </div>
      <div v-if="inviteCodeError" class="mt-2 text-xs text-danger-600 dark:text-danger-400">{{ inviteCodeError }}</div>
    </div>

    <!-- Divider -->
    <div class="flex items-center gap-3">
      <div class="flex-1 border-t border-surface-200 dark:border-surface-800" />
      <span class="text-xs text-surface-400 dark:text-surface-500">or</span>
      <div class="flex-1 border-t border-surface-200 dark:border-surface-800" />
    </div>

    <!-- Org search -->
    <div class="rounded-lg border border-surface-200 dark:border-surface-800 p-4 bg-white dark:bg-surface-800/50">
      <div class="flex items-center gap-2 mb-3">
        <Search class="size-4 text-brand-600 dark:text-brand-400" />
        <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Request to join</h3>
      </div>
      <p class="text-xs text-surface-500 dark:text-surface-400 mb-3">
        Search by organization name or slug. An admin must approve your request.
      </p>

      <div class="relative">
        <input
          v-model="orgSearch"
          type="text"
          placeholder="Search organizations…"
          class="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 pl-9"
        />
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-400" />
        <Loader2 v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-surface-400" />
      </div>

      <div v-if="searchError" class="mt-2 text-xs text-danger-600 dark:text-danger-400">{{ searchError }}</div>

      <!-- Search results -->
      <div v-if="orgSearchResults.length > 0 && !selectedOrg" class="mt-2 border border-surface-200 dark:border-surface-700 rounded-md overflow-hidden">
        <button
          v-for="org in orgSearchResults"
          :key="org.id"
          class="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm bg-transparent border-0 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors border-b border-surface-100 dark:border-surface-800 last:border-b-0"
          @click="selectedOrg = org"
        >
          <Building2 class="size-4 text-surface-400 flex-shrink-0" />
          <div>
            <div class="font-medium text-surface-900 dark:text-surface-100">{{ org.name }}</div>
            <div class="text-xs text-surface-400">{{ org.slug }}</div>
          </div>
        </button>
      </div>

      <div v-if="orgSearch.trim().length >= 2 && !isSearching && orgSearchResults.length === 0 && !selectedOrg" class="mt-2 text-xs text-surface-500 dark:text-surface-400 text-center py-2">
        No organizations found
      </div>

      <!-- Selected org — request form -->
      <div v-if="selectedOrg" class="mt-3 rounded-md border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/30 p-3">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Building2 class="size-4 text-brand-600 dark:text-brand-400" />
            <span class="text-sm font-medium text-surface-900 dark:text-surface-100">{{ selectedOrg.name }}</span>
          </div>
          <button
            class="text-xs text-surface-400 hover:text-surface-600 transition-colors"
            @click="selectedOrg = null"
          >
            Change
          </button>
        </div>

        <label class="flex flex-col gap-1 text-xs text-surface-600 dark:text-surface-400">
          <span>Message (optional)</span>
          <textarea
            v-model="joinRequestMessage"
            placeholder="Tell the admin why you'd like to join…"
            rows="2"
            maxlength="500"
            class="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 resize-none"
          />
        </label>

        <button
          :disabled="isSubmittingRequest"
          class="mt-2 w-full px-4 py-2 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          @click="handleSubmitJoinRequest"
        >
          <Loader2 v-if="isSubmittingRequest" class="size-4 animate-spin" />
          <UserPlus v-else class="size-4" />
          {{ isSubmittingRequest ? 'Sending…' : 'Send join request' }}
        </button>
      </div>

      <div v-if="requestError" class="mt-2 text-xs text-danger-600 dark:text-danger-400">{{ requestError }}</div>

      <!-- Request success -->
      <div v-if="requestSuccess" class="mt-2 rounded-md bg-success-50 dark:bg-success-950/40 border border-success-200 dark:border-success-900 p-3 text-xs text-success-700 dark:text-success-400 flex items-center gap-2">
        <Check class="size-4 flex-shrink-0" />
        {{ requestSuccess }}
      </div>
    </div>

    <!-- Back links -->
    <div class="flex flex-col items-center gap-2">
      <button
        class="text-sm text-brand-600 dark:text-brand-400 hover:underline"
        @click="viewMode = orgs.length > 0 ? 'picker' : 'create'"
      >
        {{ orgs.length > 0 ? 'Back to organization list' : 'Create a new organization instead' }}
      </button>
    </div>
  </div>

  <!-- Create org form -->
  <form v-else class="flex flex-col gap-4" @submit.prevent="handleCreateOrg">
    <h2 class="text-xl font-semibold text-center text-surface-900 dark:text-surface-100">Create your organization</h2>
    <p class="text-sm text-surface-500 dark:text-surface-400 text-center mb-2">
      Set up your workspace to start managing candidates and jobs.
    </p>

    <div v-if="error" class="rounded-md border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-3 text-sm text-danger-700 dark:text-danger-400">{{ error }}</div>

    <label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
      <span>Organization name</span>
      <input
        v-model="orgName"
        type="text"
        placeholder="Acme Corp"
        required
        class="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
      />
    </label>

    <label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
      <span>Slug</span>
      <input
        v-model="slug"
        type="text"
        placeholder="acme-corp"
        required
        class="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
        @input="onSlugInput"
      />
      <span class="text-xs font-normal text-surface-400">Used in URLs. Lowercase letters, numbers, and hyphens only.</span>
    </label>

    <button
      type="submit"
      :disabled="isLoading"
      class="mt-2 px-4 py-2.5 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {{ isLoading ? 'Creating…' : 'Create organization' }}
    </button>

    <div class="flex flex-col items-center gap-2 mt-1">
      <button
        v-if="orgs.length > 0"
        type="button"
        class="text-sm text-brand-600 dark:text-brand-400 hover:underline"
        @click="viewMode = 'picker'"
      >
        Back to organization list
      </button>
      <button
        type="button"
        class="text-sm text-brand-600 dark:text-brand-400 hover:underline"
        @click="viewMode = 'join'"
      >
        Join an existing organization instead
      </button>
    </div>
  </form>
</template>