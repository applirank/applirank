<script setup lang="ts">
import { Search, MapPin, Briefcase, ChevronLeft, ChevronRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'public',
})

useSeoMeta({
  title: 'Open Positions — Job Board',
  description:
    'Browse open job positions on Reqcore and apply directly. Find your next career opportunity with companies that value transparency.',
  ogTitle: 'Open Positions — Reqcore Job Board',
  ogDescription:
    'Browse open job positions and apply directly. Powered by the open-source ATS you actually own.',
  ogType: 'website',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Open Positions — Reqcore Job Board',
  twitterDescription:
    'Browse open job positions and apply directly.',
})

// ─────────────────────────────────────────────
// Query state
// ─────────────────────────────────────────────

const page = ref(1)
const searchInput = ref('')
const searchQuery = ref('')
const typeFilter = ref<string | undefined>(undefined)

// Debounce search input
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(searchInput, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchQuery.value = val.trim()
    page.value = 1
  }, 300)
})

// Reset page when filters change
watch(typeFilter, () => {
  page.value = 1
})

const queryParams = computed(() => ({
  page: page.value,
  limit: 20,
  ...(searchQuery.value && { search: searchQuery.value }),
  ...(typeFilter.value && { type: typeFilter.value }),
}))

const { data, status: fetchStatus, error, refresh } = useFetch('/api/public/jobs', {
  key: 'public-jobs',
  query: queryParams,
})

const jobs = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / 20))

// ─────────────────────────────────────────────
// i18n-aware display helpers
// ─────────────────────────────────────────────
const { locale } = useI18n()

const typeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

const typeOptions = [
  { label: 'All types', value: undefined },
  { label: 'Full-time', value: 'full_time' },
  { label: 'Part-time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
] as const

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">Open Positions</h1>
      <p class="text-sm text-surface-500 mt-1">
        Browse our current openings and find your next opportunity.
      </p>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-400 pointer-events-none" />
        <input
          v-model="searchInput"
          type="text"
          placeholder="Search jobs by title or location…"
          class="w-full rounded-lg border border-surface-300 dark:border-surface-700 pl-9 pr-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
        />
      </div>

      <!-- Type filter -->
      <select
        :value="typeFilter ?? ''"
        class="rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
        @change="typeFilter = ($event.target as HTMLSelectElement).value || undefined"
      >
        <option v-for="opt in typeOptions" :key="String(opt.value)" :value="opt.value ?? ''">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Loading state -->
    <div v-if="fetchStatus === 'pending'" class="text-center py-16 text-surface-400">
      Loading positions…
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-4 text-sm text-danger-700 dark:text-danger-400"
    >
      Failed to load jobs. Please try again.
      <button class="underline ml-1 cursor-pointer" @click="refresh()">Retry</button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="jobs.length === 0"
      class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-12 text-center"
    >
      <Briefcase class="size-10 text-surface-300 mx-auto mb-3" />
      <h3 class="text-base font-semibold text-surface-700 dark:text-surface-300 mb-1">No open positions</h3>
      <p class="text-sm text-surface-500">
        <template v-if="searchQuery || typeFilter">
          No jobs match your current filters. Try adjusting your search.
        </template>
        <template v-else>
          There are no open positions right now. Check back soon!
        </template>
      </p>
    </div>

    <!-- Job list -->
    <div v-else class="space-y-3">
      <NuxtLink
        v-for="j in jobs"
        :key="j.id"
        :to="$localePath(`/jobs/${j.slug}`)"
        class="block rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-5 py-4 hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-sm transition-all group"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <!-- Title -->
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {{ j.title }}
            </h2>

            <!-- Meta -->
            <div class="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-surface-500">
              <span class="inline-flex items-center gap-1">
                <Briefcase class="size-3.5" />
                {{ typeLabels[j.type] ?? j.type }}
              </span>
              <span v-if="j.location" class="inline-flex items-center gap-1">
                <MapPin class="size-3.5" />
                {{ j.location }}
              </span>
              <span class="text-surface-400">
                Posted {{ formatDate(j.createdAt) }}
              </span>
            </div>

            <!-- Description preview -->
            <p v-if="j.description" class="mt-2 text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
              {{ j.description }}
            </p>
          </div>

          <!-- Arrow -->
          <ChevronRight class="size-5 text-surface-300 group-hover:text-brand-500 shrink-0 mt-1 transition-colors" />
        </div>
      </NuxtLink>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <button
          :disabled="page <= 1"
          class="inline-flex items-center gap-1 rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          @click="page--"
        >
          <ChevronLeft class="size-4" />
          Previous
        </button>

        <span class="text-sm text-surface-500">
          Page {{ page }} of {{ totalPages }}
        </span>

        <button
          :disabled="page >= totalPages"
          class="inline-flex items-center gap-1 rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          @click="page++"
        >
          Next
          <ChevronRight class="size-4" />
        </button>
      </div>

      <!-- Total count -->
      <p class="text-xs text-surface-400 pt-1">
        {{ total }} open position{{ total === 1 ? '' : 's' }}
      </p>
    </div>
  </div>
</template>
