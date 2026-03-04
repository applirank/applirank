<script setup lang="ts">
import { FileText, Link2, ClipboardCopy, Check } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

const route = useRoute()
const jobId = route.params.id as string

const { job, status: fetchStatus, error, updateJob } = useJob(jobId)

useSeoMeta({
  title: computed(() =>
    job.value ? `Application Form — ${job.value.title} — Reqcore` : 'Application Form — Reqcore',
  ),
})

// ─────────────────────────────────────────────
// Application link
// ─────────────────────────────────────────────

const requestUrl = useRequestURL()
const applicationUrl = computed(() => {
  const base = `${requestUrl.protocol}//${requestUrl.host}`
  return `${base}/jobs/${job.value?.slug ?? jobId}/apply`
})

const linkCopied = ref(false)

async function copyApplicationLink() {
  try {
    await navigator.clipboard.writeText(applicationUrl.value)
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  } catch {
    // Fallback for non-HTTPS contexts
    alert(applicationUrl.value)
  }
}

// ─────────────────────────────────────────────
// Application requirements (resume / cover letter)
// ─────────────────────────────────────────────

const requireResume = ref(false)
const requireCoverLetter = ref(false)
const isSavingRequirements = ref(false)
const requirementsSaved = ref(false)

// Sync with fetched job data
watch(job, (j) => {
  if (j) {
    requireResume.value = j.requireResume ?? false
    requireCoverLetter.value = j.requireCoverLetter ?? false
  }
}, { immediate: true })

async function saveRequirements() {
  isSavingRequirements.value = true
  try {
    await updateJob({ requireResume: requireResume.value, requireCoverLetter: requireCoverLetter.value })
    requirementsSaved.value = true
    setTimeout(() => { requirementsSaved.value = false }, 2000)
  } finally {
    isSavingRequirements.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- Loading -->
    <div v-if="fetchStatus === 'pending'" class="text-center py-12 text-surface-400">
      Loading…
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-4 text-sm text-danger-700 dark:text-danger-400"
    >
      {{ error.statusCode === 404 ? 'Job not found.' : 'Failed to load job.' }}
      <NuxtLink :to="$localePath('/dashboard')" class="underline ml-1">Back to Jobs</NuxtLink>
    </div>

    <template v-else-if="job">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Application Form</h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Configure the application experience for <strong>{{ job.title }}</strong>.
        </p>
      </div>

      <!-- Shareable application link (only when job is open) -->
      <div v-if="job.status === 'open'" class="rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950 p-5 mb-6">
        <div class="flex items-center gap-2 mb-2">
          <Link2 class="size-4 text-brand-600 dark:text-brand-400" />
          <h2 class="text-sm font-semibold text-brand-700 dark:text-brand-300">Application Link</h2>
        </div>
        <p class="text-xs text-surface-600 dark:text-surface-400 mb-3">
          Share this link with candidates so they can apply to this position.
        </p>
        <div class="flex items-center gap-2">
          <input
            type="text"
            readonly
            :value="applicationUrl"
            class="flex-1 rounded-lg border border-brand-200 dark:border-brand-800 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-300 select-all"
          />
          <button
            class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            @click="copyApplicationLink"
          >
            <ClipboardCopy class="size-3.5" />
            {{ linkCopied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>

      <div v-else class="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 p-4 mb-6 text-sm text-surface-500 dark:text-surface-400">
        The application link will be available when this job is published (status: <strong>open</strong>).
      </div>

      <!-- Application Requirements -->
      <div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 mb-6">
        <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Application requirements</h2>
        <p class="text-xs text-surface-400 dark:text-surface-500 mb-4">
          Choose what candidates must provide when applying.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            class="relative flex items-center gap-3 p-4 rounded-xl border text-left transition-colors"
            :class="requireResume
              ? 'border-brand-300 dark:border-brand-700 bg-brand-50/70 dark:bg-brand-950/30'
              : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50'"
            :aria-pressed="requireResume"
            @click="requireResume = !requireResume"
          >
            <span
              v-if="requireResume"
              class="absolute top-3 right-3 inline-flex items-center justify-center size-5 rounded-full bg-brand-600 text-white"
              aria-hidden="true"
            >
              <Check class="size-3" />
            </span>
            <div>
              <span class="block text-sm font-medium text-surface-900 dark:text-surface-100">Require resume/CV</span>
              <span class="text-xs text-surface-500">Candidates must upload a file.</span>
            </div>
          </button>
          <button
            type="button"
            class="relative flex items-center gap-3 p-4 rounded-xl border text-left transition-colors"
            :class="requireCoverLetter
              ? 'border-brand-300 dark:border-brand-700 bg-brand-50/70 dark:bg-brand-950/30'
              : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50'"
            :aria-pressed="requireCoverLetter"
            @click="requireCoverLetter = !requireCoverLetter"
          >
            <span
              v-if="requireCoverLetter"
              class="absolute top-3 right-3 inline-flex items-center justify-center size-5 rounded-full bg-brand-600 text-white"
              aria-hidden="true"
            >
              <Check class="size-3" />
            </span>
            <div>
              <span class="block text-sm font-medium text-surface-900 dark:text-surface-100">Ask for cover letter</span>
              <span class="text-xs text-surface-500">Candidates can write a cover letter.</span>
            </div>
          </button>
        </div>
        <button
          type="button"
          :disabled="isSavingRequirements"
          class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          @click="saveRequirements"
        >
          {{ requirementsSaved ? 'Saved!' : isSavingRequirements ? 'Saving…' : 'Save requirements' }}
        </button>
      </div>

      <!-- Application Form Questions -->
      <div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5">
        <div class="flex items-center gap-2 mb-3">
          <FileText class="size-4 text-surface-500 dark:text-surface-400" />
          <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-300">Custom Questions</h2>
        </div>
        <p class="text-xs text-surface-400 dark:text-surface-500 mb-4">
          Customize the questions applicants must answer when applying. All applications include name, email, and phone by default.
        </p>
        <JobQuestions :job-id="jobId" />
      </div>
    </template>
  </div>
</template>
