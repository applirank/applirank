<script setup lang="ts">
import { Building2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'auth',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Create Organization — Applirank',
  description: 'Create your organization to start recruiting',
  robots: 'noindex, nofollow',
})

const { orgs, isOrgsLoading, switchOrg, createOrg } = useCurrentOrg()

const orgName = ref('')
const slug = ref('')
const slugEdited = ref(false)
const error = ref('')
const isLoading = ref(false)
const showCreateForm = ref(false)

// ─────────────────────────────────────────────
// Auto-switch: if user already belongs to exactly one org, activate it
// ─────────────────────────────────────────────
const autoSwitched = ref(false)

watch([orgs, isOrgsLoading], async ([orgList, loading]) => {
  if (loading || autoSwitched.value || showCreateForm.value) return
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
</script>

<template>
  <!-- Loading / auto-switching state -->
  <div v-if="isLoading || isOrgsLoading" class="flex flex-col items-center gap-3 py-8">
    <div class="size-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    <p class="text-sm text-surface-500 dark:text-surface-400">Setting up your workspace…</p>
  </div>

  <!-- Org picker: user has orgs but none is active -->
  <div v-else-if="orgs.length > 0 && !showCreateForm" class="flex flex-col gap-4">
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

    <button
      class="mt-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
      @click="showCreateForm = true"
    >
      Or create a new organization
    </button>
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

    <button
      v-if="orgs.length > 0"
      type="button"
      class="text-sm text-brand-600 dark:text-brand-400 hover:underline"
      @click="showCreateForm = false"
    >
      Back to organization list
    </button>
  </form>
</template>


