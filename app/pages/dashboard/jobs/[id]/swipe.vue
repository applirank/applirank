<script setup lang="ts">
import { ArrowLeft, ArrowRight, Briefcase, Clock, Hash, UserRound, Mail, MessageSquare, Hand, FileText, Paperclip, Download, Eye, Phone } from 'lucide-vue-next'
import { usePreviewReadOnly } from '~/composables/usePreviewReadOnly'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

const route = useRoute()
const jobId = route.params.id as string

const { data: jobData, status: jobFetchStatus, error: jobError } = useFetch(
  () => `/api/jobs/${jobId}`,
  {
    key: `swipe-job-${jobId}`,
    headers: useRequestHeaders(['cookie']),
  },
)

const {
  data: appData,
  status: appFetchStatus,
  error: appError,
  refresh: refreshApps,
} = useFetch('/api/applications', {
  key: `swipe-apps-${jobId}`,
  query: { jobId, limit: 100 },
  headers: useRequestHeaders(['cookie']),
})

const PIPELINE_STATUSES = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const
type PipelineStatus = typeof PIPELINE_STATUSES[number]

const applications = computed(() => appData.value?.data ?? [])
const focusStatus = ref<PipelineStatus>('new')

const focusedApplications = computed(() =>
  applications.value.filter((application) => application.status === focusStatus.value),
)
const totalApplications = computed(() => focusedApplications.value.length)

type StatusCountMap = {
  new: number
  screening: number
  interview: number
  offer: number
  hired: number
  rejected: number
}

const statusCounts = computed(() => {
  const counts: StatusCountMap = {
    new: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    hired: 0,
    rejected: 0,
  }

  for (const application of applications.value) {
    switch (application.status) {
      case 'new':
        counts.new += 1
        break
      case 'screening':
        counts.screening += 1
        break
      case 'interview':
        counts.interview += 1
        break
      case 'offer':
        counts.offer += 1
        break
      case 'hired':
        counts.hired += 1
        break
      case 'rejected':
        counts.rejected += 1
        break
      default:
        break
    }
  }

  return counts
})

const currentIndex = ref(0)

watch(focusedApplications, () => {
  if (focusedApplications.value.length === 0) {
    currentIndex.value = 0
    return
  }

  if (currentIndex.value >= focusedApplications.value.length) {
    currentIndex.value = focusedApplications.value.length - 1
  }
}, { immediate: true })

watch(focusStatus, () => {
  currentIndex.value = 0
})

const currentSummary = computed(() => focusedApplications.value[currentIndex.value] ?? null)

type SwipeDocument = {
  id: string
  type: 'resume' | 'cover_letter' | 'other'
  originalFilename: string
  mimeType: string
  createdAt: string | Date
}

type SwipeResponse = {
  id: string
  value: unknown
  question: {
    id: string
    label: string
    type: string
    options: string[] | null
  } | null
}

type SwipeApplicationDetail = {
  id: string
  status: string
  score: number | null
  notes: string | null
  createdAt: string | Date
  updatedAt: string | Date
  candidate: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    documents: SwipeDocument[]
  }
  responses: SwipeResponse[]
}

const currentApplicationId = computed(() => currentSummary.value?.id ?? '')

const {
  data: currentApplication,
  status: detailFetchStatus,
  execute: executeDetailFetch,
} = useFetch<SwipeApplicationDetail | null>(
  () => `/api/applications/${currentApplicationId.value}`,
  {
    key: computed(() => `swipe-application-${currentApplicationId.value || 'none'}`),
    immediate: false,
    headers: useRequestHeaders(['cookie']),
  },
)

watch(currentApplicationId, async (id) => {
  if (!id) {
    currentApplication.value = null
    return
  }

  await executeDetailFetch()
}, { immediate: true })

useSeoMeta({
  title: computed(() =>
    jobData.value ? `Swipe Review — ${jobData.value.title} — Applirank` : 'Swipe Review — Applirank',
  ),
  robots: 'noindex, nofollow',
})

const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['screening', 'interview', 'rejected'],
  screening: ['interview', 'offer', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [],
  rejected: ['new'],
}

const statusBadgeClasses: Record<string, string> = {
  new: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400',
  screening: 'bg-info-50 text-info-700 dark:bg-info-950 dark:text-info-400',
  interview: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400',
  offer: 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-400',
  hired: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300',
  rejected: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
}

function formatStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatResponseValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value ?? '—')
}

function formatDocumentType(value: SwipeDocument['type']) {
  if (value === 'cover_letter') return 'Cover Letter'
  if (value === 'resume') return 'Resume'
  return 'Other'
}

function getCandidateInitials(firstName?: string, lastName?: string) {
  const first = firstName?.trim().charAt(0) ?? ''
  const last = lastName?.trim().charAt(0) ?? ''
  return `${first}${last}`.toUpperCase() || 'C'
}

const allowedTransitions = computed(() => {
  if (!currentSummary.value) return []
  return STATUS_TRANSITIONS[currentSummary.value.status] ?? []
})

function isCurrentStatus(status: string) {
  return currentSummary.value?.status === status
}

function isStatusActionEnabled(status: string) {
  if (!currentSummary.value) return false
  if (isCurrentStatus(status)) return false
  return allowedTransitions.value.includes(status)
}

function isFocusStatus(status: PipelineStatus) {
  return focusStatus.value === status
}

function setFocusStatus(status: PipelineStatus) {
  focusStatus.value = status
}

const isMutating = ref(false)
const { handlePreviewReadOnlyError } = usePreviewReadOnly()

async function changeStatus(status: string) {
  if (!currentSummary.value || isMutating.value) return
  const applicationId = currentSummary.value.id

  isMutating.value = true
  const nextIndex = Math.min(currentIndex.value + 1, Math.max(focusedApplications.value.length - 1, 0))

  try {
    await $fetch(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      body: { status },
    })

    await refreshApps()

    if (focusedApplications.value.length > 1) {
      currentIndex.value = Math.min(nextIndex, focusedApplications.value.length - 1)
    }
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    alert(err?.data?.statusMessage ?? 'Failed to update status')
  } finally {
    isMutating.value = false
  }
}

function goToPreviousCard() {
  if (currentIndex.value === 0) return
  currentIndex.value -= 1
}

function goToNextCard() {
  if (currentIndex.value >= focusedApplications.value.length - 1) return
  currentIndex.value += 1
}

function handleKeyNavigation(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    goToPreviousCard()
  }

  if (event.key === 'ArrowRight') {
    goToNextCard()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyNavigation)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyNavigation)
})

const isLoading = computed(() => {
  return jobFetchStatus.value === 'pending' || appFetchStatus.value === 'pending'
})
</script>

<template>
  <div class="mx-auto max-w-6xl pb-44">
    <div v-if="isLoading" class="py-12 text-center text-surface-400">
      Loading swipe review…
    </div>

    <div
      v-else-if="jobError || appError"
      class="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700"
    >
      {{ jobError ? 'Job not found or failed to load.' : 'Failed to load applications.' }}
      <NuxtLink to="/dashboard/jobs" class="ml-1 underline">Back to Jobs</NuxtLink>
    </div>

    <template v-else-if="jobData">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3 dark:border-surface-800 dark:bg-surface-900">
        <div class="flex items-center gap-3">
          <Hand class="size-5 text-surface-500 dark:text-surface-400" />
          <div>
            <h1 class="text-xl font-bold text-surface-900 dark:text-surface-50 md:text-2xl">
              {{ jobData.title }}
            </h1>
            <p class="text-sm text-surface-500 dark:text-surface-400">
              Focus: {{ formatStatusLabel(focusStatus) }} · {{ totalApplications }} candidate{{ totalApplications === 1 ? '' : 's' }}
            </p>
          </div>
        </div>

        <div class="rounded-md bg-surface-100 px-2.5 py-1 text-xs text-surface-500 dark:bg-surface-800 dark:text-surface-400">
          Use ← and → keys to navigate cards
        </div>
      </div>

      <div
        v-if="!currentSummary"
        class="rounded-lg border border-surface-200 bg-white p-12 text-center dark:border-surface-800 dark:bg-surface-900"
      >
        <p class="text-base font-medium text-surface-700 dark:text-surface-200">No candidates left in {{ formatStatusLabel(focusStatus) }}</p>
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">Switch status to continue reviewing other candidates.</p>
      </div>

      <template v-else>
        <div class="mb-3 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
          <span class="font-medium">Candidate {{ currentIndex + 1 }} of {{ focusedApplications.length }} in {{ formatStatusLabel(focusStatus) }}</span>
          <span class="rounded-full bg-surface-100 px-2.5 py-1 dark:bg-surface-800">
            Current status: {{ formatStatusLabel(currentSummary.status) }}
          </span>
        </div>

        <div class="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <div class="flex flex-wrap items-start justify-between gap-4 border-b border-surface-200 bg-surface-50 px-5 py-4 dark:border-surface-800 dark:bg-surface-950">
            <div class="flex items-start gap-3">
              <div class="inline-flex size-11 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {{ getCandidateInitials(currentSummary.candidateFirstName, currentSummary.candidateLastName) }}
              </div>
              <div>
                <p class="mb-1 text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">Candidate profile</p>
                <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {{ currentSummary.candidateFirstName }} {{ currentSummary.candidateLastName }}
                </h2>
                <p class="mt-1 flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
                  <Mail class="size-3.5" />
                  {{ currentSummary.candidateEmail }}
                </p>
                <NuxtLink
                  :to="`/dashboard/applications/${currentSummary.id}`"
                  class="mt-2 inline-flex items-center rounded-md border border-surface-200 bg-white px-2.5 py-1 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-100"
                >
                  Open full application
                </NuxtLink>
              </div>
            </div>

            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize"
              :class="statusBadgeClasses[currentSummary.status] ?? 'bg-surface-100 text-surface-600'"
            >
              {{ currentSummary.status }}
            </span>
          </div>

          <div class="grid gap-4 p-5 md:grid-cols-2">
            <div class="rounded-lg border border-surface-200 p-4 dark:border-surface-800">
              <div class="mb-2 flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-200">
                <UserRound class="size-4 text-surface-500 dark:text-surface-400" /> Candidate
              </div>
              <dl class="space-y-2 text-sm">
                <div class="flex items-start gap-2 text-surface-600 dark:text-surface-300">
                  <Mail class="mt-0.5 size-3.5 text-surface-400" />
                  <span>{{ currentSummary.candidateEmail }}</span>
                </div>
                <div class="flex items-start gap-2 text-surface-600 dark:text-surface-300">
                  <Hash class="mt-0.5 size-3.5 text-surface-400" />
                  <span>Score: {{ currentSummary.score ?? '—' }}</span>
                </div>
                <div v-if="currentApplication?.candidate.phone" class="flex items-start gap-2 text-surface-600 dark:text-surface-300">
                  <Phone class="mt-0.5 size-3.5 text-surface-400" />
                  <span>Phone: {{ currentApplication.candidate.phone }}</span>
                </div>
              </dl>
            </div>

            <div class="rounded-lg border border-surface-200 p-4 dark:border-surface-800">
              <div class="mb-2 flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-200">
                <Briefcase class="size-4 text-surface-500 dark:text-surface-400" /> Application
              </div>
              <dl class="space-y-2 text-sm text-surface-600 dark:text-surface-300">
                <div class="flex items-start gap-2">
                  <Clock class="mt-0.5 size-3.5 text-surface-400" />
                  <span>Applied {{ new Date(currentSummary.createdAt).toLocaleDateString() }}</span>
                </div>
                <div class="flex items-start gap-2">
                  <Clock class="mt-0.5 size-3.5 text-surface-400" />
                  <span>Updated {{ new Date(currentSummary.updatedAt).toLocaleDateString() }}</span>
                </div>
              </dl>
            </div>

            <div class="rounded-lg border border-surface-200 p-4 dark:border-surface-800 md:col-span-2">
              <div class="mb-2 flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-200">
                <MessageSquare class="size-4 text-surface-500 dark:text-surface-400" /> Notes
              </div>
              <p class="text-sm text-surface-600 dark:text-surface-300 whitespace-pre-wrap">
                {{ currentSummary.notes || 'No notes yet.' }}
              </p>
            </div>

            <div class="rounded-lg border border-surface-200 p-4 dark:border-surface-800 md:col-span-2">
              <div class="mb-3 flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-200">
                <Paperclip class="size-4 text-surface-500 dark:text-surface-400" /> Documents
              </div>

              <div v-if="detailFetchStatus === 'pending'" class="text-sm text-surface-500 dark:text-surface-400">
                Loading documents…
              </div>

              <div v-else-if="currentApplication?.candidate.documents?.length" class="space-y-2.5">
                <div
                  v-for="doc in currentApplication.candidate.documents"
                  :key="doc.id"
                  class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:hover:bg-surface-700"
                >
                  <div>
                    <p class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ doc.originalFilename }}</p>
                    <p class="text-xs text-surface-500 dark:text-surface-400">
                      {{ formatDocumentType(doc.type) }} · {{ new Date(doc.createdAt).toLocaleDateString() }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <a
                      :href="`/api/documents/${doc.id}/preview`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 rounded-md border border-surface-200 px-2.5 py-1.5 text-xs font-medium text-surface-700 hover:bg-white dark:border-surface-600 dark:text-surface-200 dark:hover:bg-surface-600"
                    >
                      <Eye class="size-3.5" />
                      Preview
                    </a>
                    <a
                      :href="`/api/documents/${doc.id}/download`"
                      class="inline-flex items-center gap-1 rounded-md border border-surface-200 px-2.5 py-1.5 text-xs font-medium text-surface-700 hover:bg-white dark:border-surface-600 dark:text-surface-200 dark:hover:bg-surface-600"
                    >
                      <Download class="size-3.5" />
                      Download
                    </a>
                  </div>
                </div>
              </div>

              <p v-else class="text-sm text-surface-500 dark:text-surface-400">No documents uploaded.</p>
            </div>

            <div class="rounded-lg border border-surface-200 p-4 dark:border-surface-800 md:col-span-2">
              <div class="mb-3 flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-200">
                <FileText class="size-4 text-surface-500 dark:text-surface-400" /> Answered questions
              </div>

              <div v-if="detailFetchStatus === 'pending'" class="text-sm text-surface-500 dark:text-surface-400">
                Loading answers…
              </div>

              <div v-else-if="currentApplication?.responses?.length" class="space-y-2.5">
                <div
                  v-for="response in currentApplication.responses"
                  :key="response.id"
                  class="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 dark:border-surface-700 dark:bg-surface-800"
                >
                  <p class="text-xs font-medium text-surface-500 dark:text-surface-400">
                    {{ response.question?.label ?? 'Unknown question' }}
                  </p>
                  <p class="mt-0.5 text-sm text-surface-700 dark:text-surface-200">
                    {{ formatResponseValue(response.value) }}
                  </p>
                </div>
              </div>

              <p v-else class="text-sm text-surface-500 dark:text-surface-400">No answered questions.</p>
            </div>
          </div>
        </div>

      </template>

      <div class="fixed bottom-0 left-60 right-0 z-30">
        <div class="mx-auto max-w-6xl px-6 pb-3">
          <div class="rounded-xl border border-surface-200 bg-white/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/85 dark:border-surface-800 dark:bg-surface-900/95 dark:supports-[backdrop-filter]:bg-surface-900/85">
            <div class="mb-2">
              <p class="mb-1 text-[10px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">Focus status</p>
              <div class="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  v-for="status in PIPELINE_STATUSES"
                  :key="`focus-bottom-${status}`"
                  class="inline-flex min-h-8 shrink-0 cursor-pointer items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-300 dark:focus-visible:ring-surface-600"
                  :class="[
                    isFocusStatus(status)
                      ? 'border-brand-500'
                      : '',
                    isFocusStatus(status)
                      ? statusBadgeClasses[status]
                      : 'border-surface-200 bg-surface-100 text-surface-600 hover:bg-surface-200 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700',
                  ]"
                  @click="setFocusStatus(status)"
                >
                  {{ formatStatusLabel(status) }}
                  <span
                    class="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold dark:bg-white/10"
                  >
                    {{ statusCounts[status] ?? 0 }}
                  </span>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 border-t border-surface-100 pt-2 dark:border-surface-800">
              <div class="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
                <button
                  v-for="status in PIPELINE_STATUSES"
                  :key="status"
                  :disabled="isMutating || !isStatusActionEnabled(status)"
                  class="inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-300 dark:focus-visible:ring-surface-600"
                  :class="[
                    isCurrentStatus(status)
                      ? 'border-brand-500'
                      : '',
                    isCurrentStatus(status) || isStatusActionEnabled(status)
                      ? statusBadgeClasses[status] ?? 'bg-surface-100 text-surface-600'
                      : 'border-surface-200 bg-surface-100 text-surface-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-500',
                    isStatusActionEnabled(status) ? 'hover:brightness-95' : '',
                  ]"
                  @click="changeStatus(status)"
                >
                  {{ formatStatusLabel(status) }}
                  <span v-if="isCurrentStatus(status)" class="ml-1.5 text-[10px] uppercase tracking-wide">Current</span>
                </button>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <button
                  :disabled="currentIndex === 0"
                  class="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs text-surface-600 transition-colors hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-300 dark:focus-visible:ring-surface-600"
                  @click="goToPreviousCard"
                >
                  <ArrowLeft class="size-4" />
                  Previous
                </button>
                <button
                  :disabled="currentIndex >= focusedApplications.length - 1"
                  class="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs text-surface-600 transition-colors hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-300 dark:focus-visible:ring-surface-600"
                  @click="goToNextCard"
                >
                  Next
                  <ArrowRight class="size-4" />
                </button>
              </div>
            </div>

            <p
              v-if="currentSummary && allowedTransitions.length === 0"
              class="mt-2 rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-1.5 text-xs text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
            >
              No status changes available for this candidate.
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
