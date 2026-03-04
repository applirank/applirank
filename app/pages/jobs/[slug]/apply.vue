<script setup lang="ts">
import { MapPin, Briefcase, Building2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'public',
})

const route = useRoute()
const jobSlug = route.params.slug as string

// Fetch public job data (no auth needed)
const { data: job, status: fetchStatus, error: fetchError } = useFetch(
  `/api/public/jobs/${jobSlug}`,
  { key: `public-job-${jobSlug}` },
)

useSeoMeta({
  title: computed(() => job.value ? `Apply — ${job.value.title}` : 'Apply — Reqcore'),
  description: computed(() => job.value?.description?.slice(0, 160) ?? 'Submit your application'),
  robots: 'noindex, nofollow',
})

// ─────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  website: '', // honeypot
})

// Dynamic question responses: questionId → value
const responses = ref<Record<string, string | string[] | number | boolean>>({})

// File uploads: questionId → File object
const fileUploads = ref<Record<string, File>>({})

// Built-in document uploads (resume) and cover letter text
const resumeFile = ref<File | null>(null)
const coverLetterText = ref('')

const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)

/** Whether the form has any file_upload type questions OR built-in document fields */
const hasFileQuestions = computed(() => {
  const hasCustomFileQ = job.value?.questions?.some((q: { type: string }) => q.type === 'file_upload') ?? false
  const hasBuiltInFiles = !!resumeFile.value
  return hasCustomFileQ || hasBuiltInFiles
})

/**
 * Handle file selection from DynamicField.
 * Stores the File object separately from the model value.
 */
function handleFileSelected(questionId: string, file: File | null) {
  if (file) {
    fileUploads.value[questionId] = file
  } else {
    delete fileUploads.value[questionId]
  }
}

function validate(): boolean {
  errors.value = {}
  const maxSize = 10 * 1024 * 1024

  if (!form.value.firstName.trim()) errors.value.firstName = 'First name is required'
  if (!form.value.lastName.trim()) errors.value.lastName = 'Last name is required'
  if (!form.value.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Invalid email address'
  }

  // Validate required resume
  if (job.value?.requireResume && !resumeFile.value) {
    errors.value.resume = 'Resume/CV is required'
  }

  // Validate required cover letter
  if (job.value?.requireCoverLetter && !coverLetterText.value.trim()) {
    errors.value.coverLetter = 'Cover letter is required'
  }

  // Validate resume file size
  if (resumeFile.value && resumeFile.value.size > maxSize) {
    errors.value.resume = 'File too large. Maximum 10 MB.'
  }

  // Validate required custom questions
  if (job.value?.questions) {
    for (const q of job.value.questions) {
      if (q.required) {
        if (q.type === 'file_upload') {
          // For file uploads, check if a File was selected
          if (!fileUploads.value[q.id]) {
            errors.value[`q-${q.id}`] = 'This field is required'
          }
        } else {
          const val = responses.value[q.id]
          const isEmpty = val === undefined || val === null || val === '' ||
            (Array.isArray(val) && val.length === 0)

          if (isEmpty) {
            errors.value[`q-${q.id}`] = 'This field is required'
          }
        }
      }
    }
  }

  // Validate custom file upload sizes
  for (const [questionId, file] of Object.entries(fileUploads.value)) {
    if (file.size > maxSize) {
      errors.value[`q-${questionId}`] = 'File too large. Maximum 10 MB.'
    }
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  submitError.value = null
  if (!validate()) return

  isSubmitting.value = true
  try {
    // Build responses array from the map (exclude file_upload questions — those go as files)
    const fileQuestionIds = new Set(
      job.value?.questions
        ?.filter((q: { type: string }) => q.type === 'file_upload')
        .map((q: { id: string }) => q.id) ?? [],
    )

    const responseArray = Object.entries(responses.value)
      .filter(([questionId, value]) => {
        if (fileQuestionIds.has(questionId)) return false
        if (value === undefined || value === null || value === '') return false
        if (Array.isArray(value) && value.length === 0) return false
        return true
      })
      .map(([questionId, value]) => ({ questionId, value }))

    // Determine if we need FormData (any files present — custom or built-in)
    const hasAnyFiles = Object.keys(fileUploads.value).length > 0
      || !!resumeFile.value

    if (hasAnyFiles) {
      // Use FormData when files are present
      const formData = new FormData()
      formData.append('firstName', form.value.firstName.trim())
      formData.append('lastName', form.value.lastName.trim())
      formData.append('email', form.value.email.trim())
      if (form.value.phone.trim()) {
        formData.append('phone', form.value.phone.trim())
      }
      if (form.value.website) {
        formData.append('website', form.value.website)
      }

      // Serialize non-file responses as JSON
      formData.append('responses', JSON.stringify(responseArray))

      // Append custom question files
      for (const [questionId, file] of Object.entries(fileUploads.value)) {
        formData.append(`file:${questionId}`, file)
      }

      // Append built-in resume
      if (resumeFile.value) {
        formData.append('resume', resumeFile.value)
      }
      // Append cover letter text
      if (coverLetterText.value.trim()) {
        formData.append('coverLetterText', coverLetterText.value.trim())
      }

      await $fetch(`/api/public/jobs/${jobSlug}/apply`, {
        method: 'POST',
        body: formData,
      })
    } else {
      // No files — use JSON as before
      await $fetch(`/api/public/jobs/${jobSlug}/apply`, {
        method: 'POST',
        body: {
          firstName: form.value.firstName.trim(),
          lastName: form.value.lastName.trim(),
          email: form.value.email.trim(),
          phone: form.value.phone.trim() || undefined,
          website: form.value.website, // honeypot
          coverLetterText: coverLetterText.value.trim() || undefined,
          responses: responseArray,
        },
      })
    }

    await navigateTo(`/jobs/${jobSlug}/confirmation`)
  } catch (err: any) {
    submitError.value = err.data?.statusMessage ?? 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// ─────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="fetchStatus === 'pending'" class="animate-pulse space-y-4">
      <div class="h-7 w-48 bg-surface-200 dark:bg-surface-800 rounded-lg" />
      <div class="h-5 w-32 bg-surface-200 dark:bg-surface-800 rounded-full" />
      <div class="h-4 w-64 bg-surface-200 dark:bg-surface-800 rounded" />
      <div class="mt-8 h-48 bg-surface-200 dark:bg-surface-800 rounded-xl" />
    </div>

    <!-- Not found / not open -->
    <div v-else-if="fetchError" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="mb-5 flex size-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
        <Briefcase class="size-7 text-surface-400" />
      </div>
      <h1 class="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">Position Not Found</h1>
      <p class="text-sm text-surface-500 mb-6 max-w-xs">
        This position may have been filled or is no longer accepting applications.
      </p>
      <NuxtLink
        :to="$localePath('/')"
        class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm"
      >
        Back to Home
      </NuxtLink>
    </div>

    <!-- Application form -->
    <template v-else-if="job">

      <!-- Back link -->
      <NuxtLink
        :to="$localePath(`/jobs/${jobSlug}`)"
        class="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 transition-colors mb-6 group"
      >
        <svg class="size-3.5 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to job details
      </NuxtLink>

      <!-- Job hero card -->
      <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm overflow-hidden mb-6">
        <!-- Accent bar -->
        <div class="h-1 bg-gradient-to-r from-brand-500 to-brand-400" />

        <div class="p-6 sm:p-8">
          <!-- Meta chips -->
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span
              v-if="job.organizationName"
              class="inline-flex items-center gap-1.5 rounded-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1 text-xs font-medium text-surface-700 dark:text-surface-300"
            >
              <Building2 class="size-3.5 text-surface-400" />
              {{ job.organizationName }}
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-950 border border-brand-100 dark:border-brand-900 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
              <Briefcase class="size-3.5" />
              {{ typeLabels[job.type] ?? job.type }}
            </span>
            <span
              v-if="job.location"
              class="inline-flex items-center gap-1.5 rounded-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1 text-xs font-medium text-surface-600 dark:text-surface-400"
            >
              <MapPin class="size-3.5 text-surface-400" />
              {{ job.location }}
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            {{ job.title }}
          </h1>

          <div v-if="job.description" class="mt-5 border-t border-surface-100 dark:border-surface-800 pt-5">
            <MarkdownDescription :value="job.description" />
          </div>
        </div>
      </div>

      <!-- Application form card -->
      <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm overflow-hidden">
        <!-- Card header -->
        <div class="border-b border-surface-100 dark:border-surface-800 px-6 sm:px-8 py-5">
          <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">Your application</h2>
          <p class="mt-0.5 text-sm text-surface-500">Fields marked with <span class="text-danger-500">*</span> are required.</p>
        </div>

        <div class="px-6 sm:px-8 py-6 sm:py-8">
          <!-- Server error banner -->
          <div
            v-if="submitError"
            class="rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950/50 px-4 py-3 text-sm text-danger-700 dark:text-danger-400 mb-6 flex items-start gap-3"
            role="alert"
          >
            <svg class="mt-0.5 size-4 shrink-0 text-danger-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ submitError }}</span>
          </div>

          <form class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Honeypot (hidden from humans) -->
            <div class="absolute -left-[9999px]" aria-hidden="true">
              <label for="website">Website</label>
              <input id="website" v-model="form.website" type="text" tabindex="-1" autocomplete="off" />
            </div>

            <!-- Name row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- First Name -->
              <div>
                <label for="firstName" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  First Name <span class="text-danger-500">*</span>
                </label>
                <input
                  id="firstName"
                  v-model="form.firstName"
                  type="text"
                  placeholder="Jane"
                  autocomplete="given-name"
                  class="w-full rounded-xl border px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  :class="errors.firstName ? 'border-danger-300 dark:border-danger-700 focus:ring-danger-500 focus:border-danger-500' : 'border-surface-300 dark:border-surface-700'"
                />
                <p v-if="errors.firstName" class="mt-1.5 flex items-center gap-1 text-xs text-danger-600 dark:text-danger-400">
                  <svg class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ errors.firstName }}
                </p>
              </div>

              <!-- Last Name -->
              <div>
                <label for="lastName" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Last Name <span class="text-danger-500">*</span>
                </label>
                <input
                  id="lastName"
                  v-model="form.lastName"
                  type="text"
                  placeholder="Doe"
                  autocomplete="family-name"
                  class="w-full rounded-xl border px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  :class="errors.lastName ? 'border-danger-300 dark:border-danger-700 focus:ring-danger-500 focus:border-danger-500' : 'border-surface-300 dark:border-surface-700'"
                />
                <p v-if="errors.lastName" class="mt-1.5 flex items-center gap-1 text-xs text-danger-600 dark:text-danger-400">
                  <svg class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ errors.lastName }}
                </p>
              </div>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Email <span class="text-danger-500">*</span>
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="you@example.com"
                autocomplete="email"
                class="w-full rounded-xl border px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                :class="errors.email ? 'border-danger-300 dark:border-danger-700 focus:ring-danger-500 focus:border-danger-500' : 'border-surface-300 dark:border-surface-700'"
              />
              <p v-if="errors.email" class="mt-1.5 flex items-center gap-1 text-xs text-danger-600 dark:text-danger-400">
                <svg class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {{ errors.email }}
              </p>
            </div>

            <!-- Phone -->
            <div>
              <label for="phone" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Phone <span class="text-surface-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                autocomplete="tel"
                class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <!-- Resume / Cover Letter uploads -->
            <template v-if="job.requireResume || job.requireCoverLetter">
              <div class="border-t border-surface-100 dark:border-surface-800 pt-5 space-y-5">
                <!-- Resume -->
                <div v-if="job.requireResume">
                  <label for="resume" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Resume / CV <span class="text-danger-500">*</span>
                  </label>
                  <div
                    class="relative flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors"
                    :class="errors.resume
                      ? 'border-danger-300 dark:border-danger-700 bg-danger-50/50 dark:bg-danger-950/20'
                      : 'border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50'
                    "
                  >
                    <svg class="size-5 shrink-0 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div class="flex-1 min-w-0">
                      <p v-if="resumeFile" class="text-sm text-surface-900 dark:text-surface-100 truncate">{{ resumeFile.name }}</p>
                      <p v-else class="text-sm text-surface-500">PDF, DOC, or DOCX — max 10 MB</p>
                    </div>
                    <label
                      for="resume"
                      class="shrink-0 cursor-pointer rounded-lg bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 px-3 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-600 transition-colors"
                    >
                      {{ resumeFile ? 'Change' : 'Choose file' }}
                    </label>
                    <input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      class="sr-only"
                      @change="(e: Event) => { const t = e.target as HTMLInputElement; resumeFile = t.files?.[0] ?? null; delete errors.resume }"
                    />
                  </div>
                  <p v-if="errors.resume" class="mt-1.5 flex items-center gap-1 text-xs text-danger-600 dark:text-danger-400">
                    <svg class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ errors.resume }}
                  </p>
                </div>

                <!-- Cover Letter -->
                <div v-if="job.requireCoverLetter">
                  <label for="coverLetterText" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Cover Letter <span class="text-danger-500">*</span>
                  </label>
                  <textarea
                    id="coverLetterText"
                    v-model="coverLetterText"
                    rows="6"
                    placeholder="Tell us why you're interested in this role…"
                    class="w-full rounded-xl border px-4 py-3 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    :class="errors.coverLetter ? 'border-danger-300 dark:border-danger-700' : 'border-surface-300 dark:border-surface-700'"
                    @input="delete errors.coverLetter"
                  />
                  <p v-if="errors.coverLetter" class="mt-1.5 flex items-center gap-1 text-xs text-danger-600 dark:text-danger-400">
                    <svg class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ errors.coverLetter }}
                  </p>
                  <p v-else class="mt-1.5 text-xs text-surface-500">Max 10,000 characters.</p>
                </div>
              </div>
            </template>

            <!-- Custom questions -->
            <template v-if="job.questions && job.questions.length > 0">
              <div class="border-t border-surface-100 dark:border-surface-800 pt-5">
                <p class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-4">Additional questions</p>
                <div class="space-y-5">
                  <DynamicField
                    v-for="q in job.questions"
                    :key="q.id"
                    v-model="responses[q.id]"
                    :question="q"
                    :error="errors[`q-${q.id}`]"
                    @file-selected="handleFileSelected"
                  />
                </div>
              </div>
            </template>

            <!-- Submit row -->
            <div class="border-t border-surface-100 dark:border-surface-800 pt-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <!-- Spinner -->
                <svg
                  v-if="isSubmitting"
                  class="size-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ isSubmitting ? 'Submitting…' : 'Submit Application' }}
              </button>
              <p class="text-xs text-surface-400">Your information is kept confidential.</p>
            </div>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>
