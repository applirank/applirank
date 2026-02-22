<script setup lang="ts">
import { Kanban } from 'lucide-vue-next'
import { usePreviewReadOnly } from '~/composables/usePreviewReadOnly'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

const route = useRoute()
const jobId = route.params.id as string

// Fetch job info for the header
const { data: jobData, status: jobFetchStatus, error: jobError } = useFetch(
  () => `/api/jobs/${jobId}`,
  {
    key: `pipeline-job-${jobId}`,
    headers: useRequestHeaders(['cookie']),
  },
)

useSeoMeta({
  title: computed(() =>
    jobData.value ? `Pipeline — ${jobData.value.title} — Applirank` : 'Pipeline — Applirank',
  ),
})

// Fetch all applications for this job
const { data: appData, status: appFetchStatus, refresh: refreshApps } = useFetch('/api/applications', {
  key: `pipeline-apps-${jobId}`,
  query: { jobId, limit: 100 },
  headers: useRequestHeaders(['cookie']),
})

const applications = computed(() => appData.value?.data ?? [])

// ─────────────────────────────────────────────
// Pipeline columns
// ─────────────────────────────────────────────

const columns = [
  { key: 'new', label: 'New', color: 'brand' },
  { key: 'screening', label: 'Screening', color: 'info' },
  { key: 'interview', label: 'Interview', color: 'warning' },
  { key: 'offer', label: 'Offer', color: 'success' },
  { key: 'hired', label: 'Hired', color: 'success' },
  { key: 'rejected', label: 'Rejected', color: 'surface' },
] as const

const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['screening', 'interview', 'rejected'],
  screening: ['interview', 'offer', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [],
  rejected: ['new'],
}

function getColumnApps(status: string) {
  return applications.value.filter((a: any) => a.status === status)
}

const columnHeaderClasses: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400',
  info: 'bg-info-50 text-info-700 dark:bg-info-950 dark:text-info-400',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400',
  success: 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-400',
  surface: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
}

// ─────────────────────────────────────────────
// Status transitions via card buttons
// ─────────────────────────────────────────────

const transitioningId = ref<string | null>(null)
const { handlePreviewReadOnlyError } = usePreviewReadOnly()

async function handleTransition(appId: string, newStatus: string) {
  transitioningId.value = appId
  try {
    await $fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    await refreshApps()
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    alert(err.data?.statusMessage ?? 'Failed to update status')
  } finally {
    transitioningId.value = null
  }
}

const isLoading = computed(() => jobFetchStatus.value === 'pending' || appFetchStatus.value === 'pending')
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-surface-400">
      Loading pipeline…
    </div>

    <!-- Error -->
    <div
      v-else-if="jobError"
      class="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700"
    >
      Job not found or failed to load.
      <NuxtLink to="/dashboard/jobs" class="underline ml-1">Back to Jobs</NuxtLink>
    </div>

    <template v-else-if="jobData">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <Kanban class="size-5 text-surface-500 dark:text-surface-400" />
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {{ jobData.title }}
          </h1>
          <p class="text-sm text-surface-500 dark:text-surface-400">
            {{ applications.length }} application{{ applications.length === 1 ? '' : 's' }} in pipeline
          </p>
        </div>
      </div>

      <!-- Pipeline columns -->
      <div class="flex gap-4 overflow-x-auto pb-4">
        <div
          v-for="col in columns"
          :key="col.key"
          class="flex-shrink-0 w-64"
        >
          <!-- Column header -->
          <div
            class="rounded-t-lg px-3 py-2 text-xs font-semibold flex items-center justify-between"
            :class="columnHeaderClasses[col.color]"
          >
            <span>{{ col.label }}</span>
            <span class="rounded-full bg-white/50 dark:bg-black/20 px-1.5 py-0.5 text-[10px] font-bold">
              {{ getColumnApps(col.key).length }}
            </span>
          </div>

          <!-- Column body -->
          <div class="rounded-b-lg border border-t-0 border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 p-2 min-h-[200px] space-y-2">
            <PipelineCard
              v-for="app in getColumnApps(col.key)"
              :key="app.id"
              :id="app.id"
              :candidate-first-name="app.candidateFirstName"
              :candidate-last-name="app.candidateLastName"
              :candidate-email="app.candidateEmail"
              :created-at="app.createdAt"
              :score="app.score"
              :allowed-transitions="STATUS_TRANSITIONS[app.status] ?? []"
              :is-transitioning="transitioningId === app.id"
              @transition="handleTransition(app.id, $event)"
            />

            <!-- Empty column -->
            <div
              v-if="getColumnApps(col.key).length === 0"
              class="flex items-center justify-center h-24 text-xs text-surface-400 dark:text-surface-500"
            >
              No applications
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
