<script setup lang="ts">
import {
  LayoutDashboard, Briefcase, Users, Inbox,
  ChevronLeft, Eye, Kanban, FileText, LogOut, Table2,
  Sun, Moon, MessageSquarePlus,
} from 'lucide-vue-next'

const route = useRoute()
const { data: session } = await authClient.useSession(useFetch)
const isSigningOut = ref(false)
const { isDark, toggle: toggleColorMode } = useColorMode()

const config = useRuntimeConfig()
const feedbackEnabled = computed(() => config.public.feedbackEnabled)
const showFeedbackModal = ref(false)

const userName = computed(() => session.value?.user?.name ?? 'User')
const userEmail = computed(() => session.value?.user?.email ?? '')

async function handleSignOut() {
  isSigningOut.value = true
  await authClient.signOut()
  await navigateTo('/auth/sign-in')
}

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Jobs', to: '/dashboard/jobs', icon: Briefcase, exact: false },
  { label: 'Candidates', to: '/dashboard/candidates', icon: Users, exact: false },
  { label: 'Applications', to: '/dashboard/applications', icon: Inbox, exact: false },
]

// ─────────────────────────────────────────────
// Dynamic job context — detect when viewing a specific job
// ─────────────────────────────────────────────

const activeJobId = computed(() => {
  const match = route.path.match(/^\/dashboard\/jobs\/([^/]+)/)
  if (match && match[1] !== 'new') return match[1]
  return null
})

const jobTabs = computed(() => {
  if (!activeJobId.value) return []
  const base = `/dashboard/jobs/${activeJobId.value}`
  return [
    { label: 'Overview', to: base, icon: Eye, exact: true },
    { label: 'Pipeline', to: `${base}/pipeline`, icon: Kanban, exact: true },
    { label: 'Candidates', to: `${base}/candidates`, icon: Table2, exact: true },
    { label: 'Application Form', to: `${base}/application-form`, icon: FileText, exact: true },
  ]
})

function isActiveTab(to: string, exact: boolean) {
  if (exact) return route.path === to
  return route.path.startsWith(to)
}
</script>

<template>
  <aside
    class="flex flex-col justify-between w-60 min-w-60 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 py-5 px-3 overflow-y-auto"
  >
    <!-- Top -->
    <div class="flex flex-col gap-5">
      <!-- Logo -->
      <div class="px-2 text-lg font-bold text-surface-900 dark:text-surface-100">Applirank</div>

      <!-- Org Switcher -->
      <div>
        <OrgSwitcher />
      </div>

      <!-- Main navigation -->
      <nav class="flex flex-col gap-0.5">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors no-underline"
          :class="isActiveTab(item.to, item.exact)
            ? 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 font-medium'
            : ''"
        >
          <component :is="item.icon" class="size-4 shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Job context sub-nav (when viewing a specific job) -->
      <div v-if="activeJobId" class="border-t border-surface-200 dark:border-surface-800 pt-4">
        <NuxtLink
          to="/dashboard/jobs"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors no-underline mb-2"
        >
          <ChevronLeft class="size-3.5" />
          All Jobs
        </NuxtLink>

        <nav class="flex flex-col gap-0.5">
          <NuxtLink
            v-for="tab in jobTabs"
            :key="tab.to"
            :to="tab.to"
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
    </div>

    <!-- Bottom -->
    <div class="border-t border-surface-200 dark:border-surface-800 pt-4 flex flex-col gap-3">
      <div class="px-2">
        <div class="text-sm font-medium text-surface-900 dark:text-surface-100">{{ userName }}</div>
        <div class="text-xs text-surface-500 dark:text-surface-400 truncate">{{ userEmail }}</div>
      </div>
      <button
        v-if="feedbackEnabled"
        class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
        @click="showFeedbackModal = true"
      >
        <MessageSquarePlus class="size-4 shrink-0" />
        Feedback
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
