<script setup lang="ts">
import {
  Briefcase, Plus, Bell,
  ChevronLeft, Kanban, FileText, LogOut, Table2,
  Sun, Moon, MessageSquarePlus, Settings,
} from 'lucide-vue-next'

const route = useRoute()
const localePath = useLocalePath()
const getRouteBaseName = useRouteBaseName()
const { data: session } = await authClient.useSession(useFetch)
const isSigningOut = ref(false)
const { isDark, toggle: toggleColorMode } = useColorMode()

const showFeedbackModal = ref(false)

const userName = computed(() => session.value?.user?.name ?? 'User')
const userEmail = computed(() => session.value?.user?.email ?? '')

async function handleSignOut() {
  isSigningOut.value = true
  await authClient.signOut()
  clearNuxtData()
  await navigateTo(localePath('/auth/sign-in'))
}

// ─────────────────────────────────────────────
// Dynamic job context — detect when viewing a specific job
// ─────────────────────────────────────────────

const activeJobId = computed(() => {
  const baseName = getRouteBaseName(route)
  if (typeof baseName !== 'string' || !baseName.startsWith('dashboard-jobs-id')) return null
  const idParam = route.params.id
  if (typeof idParam !== 'string' || idParam === 'new') return null
  return idParam
})

const showJobsList = computed(() => {
  return !activeJobId.value
})

const {
  data: sidebarJobsData,
  status: sidebarJobsStatus,
} = useFetch('/api/jobs', {
  key: 'sidebar-jobs-list',
  query: { limit: 100 },
  headers: useRequestHeaders(['cookie']),
})

const sidebarJobs = computed(() => sidebarJobsData.value?.data ?? [])

// Active jobs sorted by urgency (most new applications first)
const activeJobsSorted = computed(() => {
  return [...sidebarJobs.value].sort((a, b) => {
    const aNew = a.pipeline?.new ?? 0
    const bNew = b.pipeline?.new ?? 0
    if (aNew !== bNew) return bNew - aNew
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

// Currently-viewed job title (for context header)
const activeJobTitle = computed(() => {
  if (!activeJobId.value) return null
  const found = sidebarJobs.value.find((j: any) => j.id === activeJobId.value)
  return found?.title ?? 'Job'
})

const { data: feedbackConfig } = useFetch('/api/feedback/config', {
  key: 'feedback-config',
  headers: useRequestHeaders(['cookie']),
})

const isFeedbackEnabled = computed(() => feedbackConfig.value?.enabled === true)

const jobTabs = computed(() => {
  if (!activeJobId.value) return []
  const base = `/dashboard/jobs/${activeJobId.value}`
  return [
    { label: 'Pipeline', to: base, icon: Kanban, exact: true },
    { label: 'Table', to: `${base}/candidates`, icon: Table2, exact: true },
    { label: 'Application Form', to: `${base}/application-form`, icon: FileText, exact: true },
  ]
})

function isActiveTab(to: string, exact: boolean) {
  const localizedTo = localePath(to)
  if (exact) return route.path === localizedTo
  return route.path === localizedTo || route.path.startsWith(`${localizedTo}/`)
}
</script>

<template>
  <aside
    class="sticky top-0 self-start flex h-screen max-h-screen flex-col justify-between w-60 min-w-60 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 py-5 px-3 overflow-y-auto"
  >
    <!-- Top -->
    <div class="flex flex-col gap-4">
      <!-- Logo -->
      <NuxtLink :to="$localePath('/')" class="flex items-center gap-2 px-2 no-underline">
        <img src="/eagle-mascot-logo.png" alt="Reqcore mascot" class="size-7 shrink-0 object-contain" />
        <span class="text-lg font-bold text-surface-900 dark:text-surface-100">Reqcore</span>
      </NuxtLink>

      <div class="px-2">
        <LanguageSwitcher />
      </div>

      <!-- Org Switcher -->
      <div>
        <OrgSwitcher />
      </div>

      <!-- New Job button -->
      <NuxtLink
        :to="$localePath('/dashboard/jobs/new')"
        class="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors no-underline"
      >
        <Plus class="size-4" />
        New Job
      </NuxtLink>

      <!-- Job context sub-nav (when viewing a specific job) -->
      <div v-if="activeJobId" class="border-t border-surface-200 dark:border-surface-800 pt-3">
        <NuxtLink
          :to="$localePath('/dashboard')"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors no-underline mb-2"
        >
          <ChevronLeft class="size-3.5" />
          All Jobs
        </NuxtLink>

        <!-- Active job title -->
        <div class="px-3 pb-2">
          <div class="flex items-center gap-2">
            <Briefcase class="size-3.5 text-brand-500 shrink-0" />
            <span class="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
              {{ activeJobTitle }}
            </span>
          </div>
        </div>

        <nav class="flex flex-col gap-0.5">
          <NuxtLink
            v-for="tab in jobTabs"
            :key="tab.to"
            :to="$localePath(tab.to)"
            class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors no-underline"
            :class="isActiveTab(tab.to, tab.exact)
              ? 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 font-medium'
              : ''"
          >
            <component :is="tab.icon" class="size-4 shrink-0" />
            {{ tab.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Jobs list (when not viewing a specific job) -->
      <div v-if="showJobsList" class="border-t border-surface-200 dark:border-surface-800 pt-3">
        <div class="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">
          My Jobs
        </div>

        <div v-if="sidebarJobsStatus === 'pending'" class="px-3 py-2 text-xs text-surface-400">
          Loading jobs…
        </div>

        <nav v-else class="flex flex-col gap-0.5 overflow-y-auto max-h-[calc(100vh-24rem)]">
          <NuxtLink
            v-for="job in activeJobsSorted"
            :key="job.id"
            :to="$localePath(`/dashboard/jobs/${job.id}`)"
            class="flex items-center justify-between px-3 py-2 rounded-md text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors no-underline group"
          >
            <span class="truncate flex-1 mr-2">{{ job.title }}</span>
            <span
              v-if="(job.pipeline?.new ?? 0) > 0"
              class="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-warning-100 dark:bg-warning-950 text-warning-700 dark:text-warning-400 text-[11px] font-semibold px-1.5 shrink-0"
              :title="`${job.pipeline!.new} new application${job.pipeline!.new === 1 ? '' : 's'}`"
            >
              {{ job.pipeline!.new }}
            </span>
          </NuxtLink>

          <div v-if="sidebarJobs.length === 0" class="px-3 py-4 text-center">
            <p class="text-xs text-surface-400 mb-2">No jobs yet</p>
          </div>
        </nav>
      </div>

      <!-- Settings link -->
      <div class="border-t border-surface-200 dark:border-surface-800 pt-3">
        <NuxtLink
          :to="$localePath('/dashboard/settings')"
          class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors no-underline"
          :class="isActiveTab('/dashboard/settings', false)
            ? 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 font-medium'
            : ''"
        >
          <Settings class="size-4 shrink-0" />
          Settings
        </NuxtLink>
      </div>
    </div>

    <!-- Bottom -->
    <div class="border-t border-surface-200 dark:border-surface-800 pt-4 flex flex-col gap-3">
      <div class="px-2">
        <div class="text-sm font-medium text-surface-900 dark:text-surface-100">{{ userName }}</div>
        <div class="text-xs text-surface-500 dark:text-surface-400 truncate">{{ userEmail }}</div>
      </div>
      <button
        v-if="isFeedbackEnabled"
        class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
        @click="showFeedbackModal = true"
      >
        <MessageSquarePlus class="size-4 shrink-0" />
        Report issue (GitHub)
      </button>
      <button
        class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
        @click="toggleColorMode"
      >
        <Sun v-if="isDark" class="size-4 shrink-0" />
        <Moon v-else class="size-4 shrink-0" />
        {{ isDark ? 'Light mode' : 'Dark mode' }}
      </button>
      <button
        class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors cursor-pointer border-0 bg-transparent w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isSigningOut"
        @click="handleSignOut"
      >
        <LogOut class="size-4 shrink-0" />
        {{ isSigningOut ? 'Signing out…' : 'Sign out' }}
      </button>
    </div>
  </aside>

  <!-- Feedback modal -->
  <FeedbackModal v-if="showFeedbackModal" @close="showFeedbackModal = false" />
</template>
