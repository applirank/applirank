<script setup lang="ts">
import { Table2, Users, SlidersHorizontal, X, Check, ChevronsUpDown, ChevronUp, ChevronDown, UserRound } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

const route = useRoute()
const jobId = route.params.id as string

// ─────────────────────────────────────────────
// Fetch job info for page header
// ─────────────────────────────────────────────

const { data: jobData, status: jobFetchStatus, error: jobError } = useFetch(
  () => `/api/jobs/${jobId}`,
  {
    key: `candidates-job-${jobId}`,
    headers: useRequestHeaders(['cookie']),
  },
)

useSeoMeta({
  title: computed(() =>
    jobData.value ? `Table — ${jobData.value.title} — Reqcore` : 'Table — Reqcore',
  ),
})

// ─────────────────────────────────────────────
// Fetch applications for this job
// ─────────────────────────────────────────────

const STATUS_OPTIONS = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const
type Status = typeof STATUS_OPTIONS[number]

// useState scoped to this job so state persists across sub-navigation
const selectedStatuses = useState<Status[]>(`cand-filter-statuses-${jobId}`, () => [])
const scoreMin = useState<number | undefined>(`cand-filter-score-min-${jobId}`, () => undefined)
const scoreMax = useState<number | undefined>(`cand-filter-score-max-${jobId}`, () => undefined)
const visibleCols = useState(`cand-visible-cols-${jobId}`, () => ({
  email: true,
  score: true,
  status: true,
  createdAt: true,
}))

// Only send a single status to the API when exactly one is selected; otherwise fetch all and filter client-side
const apiStatusFilter = computed(() =>
  selectedStatuses.value.length === 1 ? selectedStatuses.value[0] : undefined,
)

const { data: appData, status: appFetchStatus, error: appError, refresh: refreshApps } = useFetch('/api/applications', {
  key: `candidates-table-apps-${jobId}`,
  query: computed(() => ({
    jobId,
    limit: 100,
    ...(apiStatusFilter.value && { status: apiStatusFilter.value }),
  })),
  headers: useRequestHeaders(['cookie']),
})

const applications = computed(() => appData.value?.data ?? [])
const total = computed(() => appData.value?.total ?? 0)

// ─────────────────────────────────────────────
// Status & badge helpers
// ─────────────────────────────────────────────

const statusBadgeClasses: Record<string, string> = {
  new: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-800',
  screening: 'bg-info-50 text-info-700 ring-info-200 dark:bg-info-950/50 dark:text-info-300 dark:ring-info-800',
  interview: 'bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-950/50 dark:text-warning-300 dark:ring-warning-800',
  offer: 'bg-success-50 text-success-700 ring-success-200 dark:bg-success-950/50 dark:text-success-300 dark:ring-success-800',
  hired: 'bg-success-100 text-success-800 ring-success-300 dark:bg-success-900/50 dark:text-success-200 dark:ring-success-700',
  rejected: 'bg-surface-100 text-surface-500 ring-surface-200 dark:bg-surface-800/50 dark:text-surface-400 dark:ring-surface-700',
}

function getCandidateInitials(firstName?: string, lastName?: string) {
  const first = firstName?.trim().charAt(0) ?? ''
  const last = lastName?.trim().charAt(0) ?? ''
  return `${first}${last}`.toUpperCase() || 'C'
}

const statusLabels: Record<Status, string> = {
  new: 'New',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
}

function toggleStatus(s: Status) {
  if (selectedStatuses.value.includes(s)) {
    selectedStatuses.value = selectedStatuses.value.filter(x => x !== s)
  }
  else {
    selectedStatuses.value = [...selectedStatuses.value, s]
  }
}

// ─────────────────────────────────────────────
// Column picker panel
// ─────────────────────────────────────────────

const panelOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)

function handleOutsideClick(e: MouseEvent) {
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    panelOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))

const activeFilterCount = computed(() => {
  let n = selectedStatuses.value.length
  if (scoreMin.value != null) n++
  if (scoreMax.value != null) n++
  return n
})

function clearFilters() {
  selectedStatuses.value = []
  scoreMin.value = undefined
  scoreMax.value = undefined
}

// ─────────────────────────────────────────────
// Sorting
// ─────────────────────────────────────────────

type SortKey = 'name' | 'email' | 'score' | 'status' | 'createdAt'
type SortDir = 'asc' | 'desc'

const sortKey = useState<SortKey>(`cand-sort-key-${jobId}`, () => 'score')
const sortDir = useState<SortDir>(`cand-sort-dir-${jobId}`, () => 'desc')

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  }
  else {
    sortKey.value = key
    sortDir.value = key === 'score' ? 'desc' : 'asc'
  }
}

// ─────────────────────────────────────────────
// Filtered + sorted list
// ─────────────────────────────────────────────

const sorted = computed(() => {
  return [...applications.value]
    .filter((app) => {
      if (selectedStatuses.value.length > 1 && !selectedStatuses.value.includes(app.status as Status)) return false
      if (scoreMin.value != null && (app.score ?? 0) < scoreMin.value) return false
      if (scoreMax.value != null && (app.score ?? 0) > scoreMax.value) return false
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      switch (sortKey.value) {
        case 'name':
          cmp = `${a.candidateFirstName} ${a.candidateLastName}`.localeCompare(`${b.candidateFirstName} ${b.candidateLastName}`)
          break
        case 'email':
          cmp = (a.candidateEmail ?? '').localeCompare(b.candidateEmail ?? '')
          break
        case 'score':
          cmp = (a.score ?? -1) - (b.score ?? -1)
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDir.value === 'asc' ? cmp : -cmp
    })
})

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

function scoreClass(score: number) {
  if (score >= 75) return 'bg-success-50 text-success-700 ring-success-200 dark:bg-success-950/60 dark:text-success-400 dark:ring-success-800'
  if (score >= 40) return 'bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-950/60 dark:text-warning-400 dark:ring-warning-800'
  return 'bg-danger-50 text-danger-700 ring-danger-200 dark:bg-danger-950/60 dark:text-danger-400 dark:ring-danger-800'
}

// ─────────────────────────────────────────────
// Row selection → sidebar
// ─────────────────────────────────────────────

const selectedAppId = ref<string | null>(null)
const sidebarOpen = computed(() => Boolean(selectedAppId.value))

function selectRow(appId: string) {
  selectedAppId.value = appId
}

function closeSidebar() {
  selectedAppId.value = null
}

async function handleSidebarUpdated() {
  await refreshApps()
}

// ─────────────────────────────────────────────
// Computed
// ─────────────────────────────────────────────

const isLoading = computed(() => jobFetchStatus.value === 'pending' || appFetchStatus.value === 'pending')
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-12 gap-3">
      <div class="size-8 rounded-full border-2 border-brand-200 border-t-brand-600 dark:border-brand-800 dark:border-t-brand-400 animate-spin" />
      <p class="text-sm font-medium text-surface-400 dark:text-surface-500">Loading candidates…</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="jobError || appError"
      class="rounded-xl border border-danger-200/80 bg-danger-50 p-5 text-sm text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
    >
      {{ jobError ? 'Job not found or failed to load.' : 'Failed to load candidates.' }}
      <NuxtLink :to="$localePath('/dashboard')" class="ml-1 font-medium underline hover:no-underline">Back to Jobs</NuxtLink>
    </div>

    <template v-else-if="jobData">
      <!-- Header -->
      <div class="flex items-center gap-3.5 mb-6">
        <div class="flex size-9 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100 dark:bg-brand-950/60 dark:ring-brand-900/40">
          <Table2 class="size-4.5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 class="text-lg font-semibold tracking-tight text-surface-900 dark:text-surface-50">
            {{ jobData.title }}
          </h1>
          <p class="mt-0.5 text-[13px] text-surface-500 dark:text-surface-400">
            {{ total }} candidate{{ total === 1 ? '' : 's' }} applied
          </p>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex items-center gap-3 mb-4">
        <!-- Column / filter picker -->
        <div ref="panelRef" class="relative">
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-surface-200 dark:border-surface-700/80 bg-white dark:bg-surface-900 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 hover:border-surface-300 dark:hover:bg-surface-800 dark:hover:border-surface-600 transition-all duration-150 shadow-sm"
            @click="panelOpen = !panelOpen"
          >
            <SlidersHorizontal class="size-4" />
            View
            <span
              v-if="activeFilterCount > 0"
              class="inline-flex items-center justify-center size-4 rounded-full bg-brand-500 text-white text-[10px] font-semibold"
            >
              {{ activeFilterCount }}
            </span>
          </button>

          <!-- Dropdown panel -->
          <div
            v-if="panelOpen"
            class="absolute left-0 top-full mt-2 z-20 w-72 rounded-xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-900 shadow-xl shadow-surface-900/5 dark:shadow-black/20 p-4 space-y-5"
          >
            <!-- Columns -->
            <div>
              <p class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">Columns</p>
              <div class="space-y-1.5">
                <label
                  v-for="col in ([
                    { key: 'email', label: 'Email' },
                    { key: 'score', label: 'Score' },
                    { key: 'status', label: 'Status' },
                    { key: 'createdAt', label: 'Applied' },
                  ] as const)"
                  :key="col.key"
                  class="flex items-center gap-2.5 cursor-pointer select-none group"
                >
                  <input type="checkbox" class="sr-only" :checked="visibleCols[col.key]" @change="visibleCols[col.key] = !visibleCols[col.key]" />
                  <span
                    class="size-4 shrink-0 rounded border flex items-center justify-center transition-colors"
                    :class="visibleCols[col.key]
                      ? 'bg-brand-500 border-brand-500'
                      : 'bg-white dark:bg-surface-800 border-surface-300 dark:border-surface-600'"
                  >
                    <Check v-if="visibleCols[col.key]" class="size-3 text-white" :stroke-width="3" />
                  </span>
                  <span class="text-sm text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-surface-100 transition-colors">
                    {{ col.label }}
                  </span>
                </label>
              </div>
            </div>

            <div class="border-t border-surface-100 dark:border-surface-800" />

            <!-- Filter by status -->
            <div>
              <p class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">Filter by Status</p>
              <div class="space-y-1.5">
                <label
                  v-for="s in STATUS_OPTIONS"
                  :key="s"
                  class="flex items-center gap-2.5 cursor-pointer select-none group"
                >
                  <input type="checkbox" class="sr-only" :checked="selectedStatuses.includes(s)" @change="toggleStatus(s)" />
                  <span
                    class="size-4 shrink-0 rounded border flex items-center justify-center transition-colors"
                    :class="selectedStatuses.includes(s)
                      ? 'bg-brand-500 border-brand-500'
                      : 'bg-white dark:bg-surface-800 border-surface-300 dark:border-surface-600'"
                  >
                    <Check v-if="selectedStatuses.includes(s)" class="size-3 text-white" :stroke-width="3" />
                  </span>
                  <span
                  class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset"
                    :class="statusBadgeClasses[s]"
                  >
                    {{ statusLabels[s] }}
                  </span>
                </label>
              </div>
            </div>

            <div class="border-t border-surface-100 dark:border-surface-800" />

            <!-- Score range -->
            <div>
              <p class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">Score Range</p>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="scoreMin"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min"
                  class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span class="text-surface-400 text-xs shrink-0">to</span>
                <input
                  v-model.number="scoreMax"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Max"
                  class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>

            <!-- Clear -->
            <button
              v-if="activeFilterCount > 0"
              class="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-danger-600 transition-colors"
              @click="clearFilters"
            >
              <X class="size-3" />
              Clear filters
            </button>
          </div>
        </div>

        <!-- Active filter pills -->
        <template v-if="selectedStatuses.length > 0">
          <span
            v-for="s in selectedStatuses"
            :key="s"
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize cursor-pointer"
            :class="statusBadgeClasses[s]"
            @click="toggleStatus(s as Status)"
          >
            {{ statusLabels[s] }}
            <X class="size-2.5" />
          </span>
        </template>
        <span
          v-if="scoreMin != null || scoreMax != null"
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 cursor-pointer"
          @click="scoreMin = undefined; scoreMax = undefined"
        >
          Score {{ scoreMin ?? '0' }}–{{ scoreMax ?? '100' }}
          <X class="size-2.5" />
        </span>
      </div>

      <!-- Empty state (no applications at all) -->
      <div
        v-if="applications.length === 0"
        class="rounded-xl border border-surface-200/80 dark:border-surface-800/60 bg-white dark:bg-surface-900 p-12 text-center shadow-sm shadow-surface-900/[0.03] dark:shadow-none"
      >
        <div class="flex size-14 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800/60 mx-auto mb-3">
          <Users class="size-6 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 class="text-base font-semibold text-surface-700 dark:text-surface-200 mb-1">
          No candidates yet
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-400 max-w-xs mx-auto">
          Candidates will appear here when they apply to this job or when you link candidates from the Overview tab.
        </p>
      </div>

      <!-- Data table -->
      <div
        v-else
        class="rounded-xl border border-surface-200/80 dark:border-surface-800/60 overflow-hidden shadow-sm shadow-surface-900/[0.03] dark:shadow-none"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-200/80 dark:border-surface-800/60 bg-surface-50/80 dark:bg-surface-900">
                <!-- Name always visible -->
                <th class="px-4 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide select-none">
                  <button
                    class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
                    @click="toggleSort('name')"
                  >
                    Name
                    <ChevronUp v-if="sortKey === 'name' && sortDir === 'asc'" class="size-3" />
                    <ChevronDown v-else-if="sortKey === 'name' && sortDir === 'desc'" class="size-3" />
                    <ChevronsUpDown v-else class="size-3 opacity-40" />
                  </button>
                </th>
                <th v-if="visibleCols.email" class="px-4 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide select-none">
                  <button class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors" @click="toggleSort('email')">
                    Email
                    <ChevronUp v-if="sortKey === 'email' && sortDir === 'asc'" class="size-3" />
                    <ChevronDown v-else-if="sortKey === 'email' && sortDir === 'desc'" class="size-3" />
                    <ChevronsUpDown v-else class="size-3 opacity-40" />
                  </button>
                </th>
                <th v-if="visibleCols.score" class="px-4 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide select-none">
                  <button class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors" @click="toggleSort('score')">
                    Score
                    <ChevronUp v-if="sortKey === 'score' && sortDir === 'asc'" class="size-3" />
                    <ChevronDown v-else-if="sortKey === 'score' && sortDir === 'desc'" class="size-3" />
                    <ChevronsUpDown v-else class="size-3 opacity-40" />
                  </button>
                </th>
                <th v-if="visibleCols.status" class="px-4 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide select-none">
                  <button class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors" @click="toggleSort('status')">
                    Status
                    <ChevronUp v-if="sortKey === 'status' && sortDir === 'asc'" class="size-3" />
                    <ChevronDown v-else-if="sortKey === 'status' && sortDir === 'desc'" class="size-3" />
                    <ChevronsUpDown v-else class="size-3 opacity-40" />
                  </button>
                </th>
                <th v-if="visibleCols.createdAt" class="px-4 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide select-none">
                  <button class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors" @click="toggleSort('createdAt')">
                    Applied
                    <ChevronUp v-if="sortKey === 'createdAt' && sortDir === 'asc'" class="size-3" />
                    <ChevronDown v-else-if="sortKey === 'createdAt' && sortDir === 'desc'" class="size-3" />
                    <ChevronsUpDown v-else class="size-3 opacity-40" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800/60 bg-white dark:bg-surface-950">
              <!-- No results after filtering -->
              <tr v-if="sorted.length === 0">
                <td
                  :colspan="1 + Object.values(visibleCols).filter(Boolean).length"
                  class="px-4 py-10 text-center text-sm text-surface-400"
                >
                  No candidates match the current filters.
                </td>
              </tr>
              <tr
                v-for="app in sorted"
                :key="app.id"
                class="cursor-pointer transition-all duration-150"
                :class="selectedAppId === app.id
                  ? 'bg-brand-50/70 dark:bg-brand-950/20'
                  : 'hover:bg-surface-50/80 dark:hover:bg-surface-900/60'"
                @click="selectRow(app.id)"
              >
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-150"
                      :class="selectedAppId === app.id
                        ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20 dark:bg-brand-600 dark:shadow-brand-500/10'
                        : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'"
                    >
                      {{ getCandidateInitials(app.candidateFirstName, app.candidateLastName) }}
                    </div>
                    <span class="font-medium text-surface-900 dark:text-surface-100">
                      {{ app.candidateFirstName }} {{ app.candidateLastName }}
                    </span>
                  </div>
                </td>
                <td v-if="visibleCols.email" class="px-4 py-3 text-surface-600 dark:text-surface-300 max-w-[220px] truncate">
                  {{ app.candidateEmail }}
                </td>
                <td v-if="visibleCols.score" class="px-4 py-3">
                  <span
                    v-if="app.score != null"
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset"
                    :class="scoreClass(app.score)"
                  >
                    {{ app.score }} pts
                  </span>
                  <span v-else class="text-surface-400 dark:text-surface-500 text-xs">—</span>
                </td>
                <td v-if="visibleCols.status" class="px-4 py-3">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset"
                    :class="statusBadgeClasses[app.status] ?? 'bg-surface-100 text-surface-600 ring-surface-200'"
                  >
                    {{ app.status }}
                  </span>
                </td>
                <td v-if="visibleCols.createdAt" class="px-4 py-3 text-surface-500 dark:text-surface-400 whitespace-nowrap text-xs font-medium">
                  {{ timeAgo(app.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer / count -->
        <div class="px-4 py-3 border-t border-surface-200/80 dark:border-surface-800/60 bg-surface-50/80 dark:bg-surface-900">
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400">
            {{ sorted.length }} of {{ total }} candidate{{ total === 1 ? '' : 's' }}
          </p>
        </div>
      </div>
    </template>

    <!-- Detail sidebar -->
    <CandidateDetailSidebar
      v-if="selectedAppId"
      :application-id="selectedAppId"
      :open="sidebarOpen"
      @close="closeSidebar"
      @updated="handleSidebarUpdated"
    />
  </div>
</template>
