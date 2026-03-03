<script setup lang="ts">
import {
  Briefcase, Bell, Plus, ArrowRight, Kanban,
  MapPin, FileText,
} from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

useSeoMeta({
  title: 'My Jobs — Reqcore',
  description: 'Your active job postings',
})

const { activeOrg } = useCurrentOrg()

// ─────────────────────────────────────────────
// Fetch jobs with pipeline data
// ─────────────────────────────────────────────

const { jobs, total, fetchStatus, error, refresh } = useJobs()

// ─────────────────────────────────────────────
// Job status config
// ─────────────────────────────────────────────

const statusBadgeClasses: Record<string, string> = {
  draft: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  open: 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-400',
  closed: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400',
  archived: 'bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500',
}

const typeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

// ─────────────────────────────────────────────
// Sort jobs by urgency: open jobs with new apps first,
//   then open jobs, drafts, closed, archived
// ─────────────────────────────────────────────

const statusPriority: Record<string, number> = {
  open: 0,
  draft: 1,
  closed: 2,
  archived: 3,
}

const sortedJobs = computed(() => {
  return [...jobs.value].sort((a, b) => {
    // First: by status priority
    const aPriority = statusPriority[a.status] ?? 9
    const bPriority = statusPriority[b.status] ?? 9
    if (aPriority !== bPriority) return aPriority - bPriority

    // Within same status: jobs with new applications first
    const aNew = a.pipeline?.new ?? 0
    const bNew = b.pipeline?.new ?? 0
    if (aNew !== bNew) return bNew - aNew

    // Then by total active candidates
    const aActive = (a.pipeline?.new ?? 0) + (a.pipeline?.screening ?? 0) + (a.pipeline?.interview ?? 0) + (a.pipeline?.offer ?? 0)
    const bActive = (b.pipeline?.new ?? 0) + (b.pipeline?.screening ?? 0) + (b.pipeline?.interview ?? 0) + (b.pipeline?.offer ?? 0)
    if (aActive !== bActive) return bActive - aActive

    // Finally by creation date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

// ─────────────────────────────────────────────
// Group jobs: needs attention + others
// ─────────────────────────────────────────────

const jobsNeedingAttention = computed(() =>
  sortedJobs.value.filter(j => j.status === 'open' && (j.pipeline?.new ?? 0) > 0),
)

const otherJobs = computed(() =>
  sortedJobs.value.filter(j => !(j.status === 'open' && (j.pipeline?.new ?? 0) > 0)),
)

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function totalActive(pipeline: any) {
  return (pipeline?.new ?? 0) + (pipeline?.screening ?? 0) + (pipeline?.interview ?? 0) + (pipeline?.offer ?? 0) + (pipeline?.hired ?? 0)
}

const isEmpty = computed(() => jobs.value.length === 0)
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <!-- ─── Header ─── -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">My Jobs</h1>
        <p v-if="activeOrg" class="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {{ activeOrg.name }}
        </p>
      </div>
      <NuxtLink
        :to="$localePath('/dashboard/jobs/new')"
        class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors no-underline"
      >
        <Plus class="size-4" />
        New Job
      </NuxtLink>
    </div>

    <!-- ─── Loading ─── -->
    <div v-if="fetchStatus === 'pending'">
      <div class="space-y-4">
        <div
          v-for="i in 3"
          :key="i"
          class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 animate-pulse"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="h-5 w-48 bg-surface-200 dark:bg-surface-700 rounded" />
            <div class="h-5 w-16 bg-surface-200 dark:bg-surface-700 rounded-full" />
          </div>
          <div class="h-2 w-full bg-surface-200 dark:bg-surface-700 rounded mb-3" />
          <div class="flex gap-4">
            <div class="h-4 w-20 bg-surface-200 dark:bg-surface-700 rounded" />
            <div class="h-4 w-20 bg-surface-200 dark:bg-surface-700 rounded" />
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Error ─── -->
    <div
      v-else-if="error"
      class="rounded-lg border border-danger-200 dark:border-danger-900 bg-danger-50 dark:bg-danger-950 p-4 text-sm text-danger-700 dark:text-danger-400"
    >
      Failed to load jobs.
      <button class="underline ml-1 cursor-pointer" @click="refresh()">Retry</button>
    </div>

    <!-- ─── Empty state ─── -->
    <div v-else-if="isEmpty" class="flex flex-col items-center justify-center py-20">
      <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-10 text-center max-w-md">
        <Briefcase class="size-12 text-brand-400 mx-auto mb-4" />
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
          Welcome to Reqcore
        </h2>
        <p class="text-sm text-surface-500 dark:text-surface-400 mb-6 leading-relaxed">
          Create your first job posting to start receiving and managing candidates.
        </p>
        <NuxtLink
          :to="$localePath('/dashboard/jobs/new')"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors no-underline"
        >
          <Plus class="size-4" />
          Create Your First Job
        </NuxtLink>
      </div>
    </div>

    <!-- ─── Jobs content ─── -->
    <template v-else>
      <!-- ─── Needs attention section ─── -->
      <div v-if="jobsNeedingAttention.length > 0" class="mb-8">
        <div class="flex items-center gap-2 mb-3 px-1">
          <Bell class="size-4 text-warning-500" />
          <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
            Needs your attention
          </h2>
          <span class="text-xs text-surface-400 dark:text-surface-500">
            {{ jobsNeedingAttention.length }} job{{ jobsNeedingAttention.length === 1 ? '' : 's' }}
          </span>
        </div>

        <div class="space-y-3">
          <div
            v-for="j in jobsNeedingAttention"
            :key="j.id"
            class="rounded-xl border border-warning-200 dark:border-warning-900/50 bg-white dark:bg-surface-900 overflow-hidden"
          >
            <!-- Card header — job info -->
            <NuxtLink
              :to="$localePath(`/dashboard/jobs/${j.id}`)"
              class="block px-5 pt-4 pb-3 no-underline group"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2.5 mb-1">
                    <h3 class="text-base font-semibold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                      {{ j.title }}
                    </h3>
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 capitalize"
                      :class="statusBadgeClasses[j.status]"
                    >
                      {{ j.status }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-surface-400">
                    <span>{{ typeLabels[j.type] ?? j.type }}</span>
                    <span v-if="j.location" class="inline-flex items-center gap-1">
                      <MapPin class="size-3" />
                      {{ j.location }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Pipeline mini bar -->
              <div class="mt-2">
                <JobPipelineMini :pipeline="j.pipeline" />
              </div>
            </NuxtLink>

            <!-- Action bar -->
            <div class="flex items-center gap-2 px-5 py-3 bg-warning-50/50 dark:bg-warning-950/20 border-t border-warning-100 dark:border-warning-900/30">
              <span class="text-xs font-medium text-warning-700 dark:text-warning-400 mr-auto">
                {{ j.pipeline.new }} new application{{ j.pipeline.new === 1 ? '' : 's' }} to review
              </span>
              <NuxtLink
                :to="$localePath(`/dashboard/jobs/${j.id}`)"
                class="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors no-underline"
              >
                <Kanban class="size-3" />
                Review in Pipeline
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── All other jobs ─── -->
      <div>
        <div v-if="jobsNeedingAttention.length > 0" class="flex items-center gap-2 mb-3 px-1">
          <Briefcase class="size-4 text-surface-400" />
          <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
            All jobs
          </h2>
          <span class="text-xs text-surface-400 dark:text-surface-500">
            {{ otherJobs.length }} job{{ otherJobs.length === 1 ? '' : 's' }}
          </span>
        </div>

        <div class="space-y-2">
          <NuxtLink
            v-for="j in otherJobs"
            :key="j.id"
            :to="$localePath(`/dashboard/jobs/${j.id}`)"
            class="flex items-center gap-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-5 py-4 hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-sm transition-all no-underline group"
          >
            <!-- Left: job info -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2.5 mb-1">
                <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                  {{ j.title }}
                </h3>
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 capitalize"
                  :class="statusBadgeClasses[j.status] ?? 'bg-surface-100 text-surface-600'"
                >
                  {{ j.status }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-xs text-surface-400">
                <span>{{ typeLabels[j.type] ?? j.type }}</span>
                <span v-if="j.location" class="inline-flex items-center gap-1">
                  <MapPin class="size-3" />
                  {{ j.location }}
                </span>
                <span v-if="totalActive(j.pipeline) > 0" class="font-medium text-surface-600 dark:text-surface-300">
                  {{ totalActive(j.pipeline) }} active candidate{{ totalActive(j.pipeline) === 1 ? '' : 's' }}
                </span>
                <span v-if="j.status === 'draft'" class="text-surface-400 italic">
                  Not published yet
                </span>
              </div>
            </div>

            <!-- Right: pipeline mini -->
            <div v-if="totalActive(j.pipeline) > 0" class="w-48 shrink-0">
              <JobPipelineMini :pipeline="j.pipeline" />
            </div>

            <!-- Arrow -->
            <ArrowRight class="size-4 text-surface-300 dark:text-surface-600 group-hover:text-brand-500 transition-colors shrink-0" />
          </NuxtLink>
        </div>
      </div>

      <!-- Total count -->
      <p class="text-xs text-surface-400 pt-4 px-1">
        {{ total }} job{{ total === 1 ? '' : 's' }} total
      </p>
    </template>
  </div>
</template>
