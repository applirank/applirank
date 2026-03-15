<script setup lang="ts">
import {
  Briefcase, Plus, Bell,
  Kanban, FileText, LogOut, Table2,
  Sun, Moon, MessageSquarePlus, Settings,
  ChevronDown, Menu, X, Users, ChevronLeft,
  LayoutDashboard, Calendar, ArrowUpCircle,
} from 'lucide-vue-next'

const route = useRoute()
const localePath = useLocalePath()
const getRouteBaseName = useRouteBaseName()
const { data: session } = await authClient.useSession(useFetch)
const isSigningOut = ref(false)
const { isDark, toggle: toggleColorMode } = useColorMode()

const showFeedbackModal = ref(false)
const showUserMenu = ref(false)
const showMobileMenu = ref(false)

const userName = computed(() => session.value?.user?.name ?? 'User')
const userEmail = computed(() => session.value?.user?.email ?? '')
const userInitials = computed(() => {
  const name = userName.value
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    const first = parts[0] ?? ''
    const second = parts[1] ?? ''
    return ((first[0] ?? '') + (second[0] ?? '')).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

async function handleSignOut() {
  isSigningOut.value = true
  await authClient.signOut()
  clearNuxtData()
  await navigateTo(localePath('/auth/sign-in'))
}

// ─────────────────────────────────────────────
// Dynamic job context
// ─────────────────────────────────────────────

const activeJobId = computed(() => {
  const baseName = getRouteBaseName(route)
  if (typeof baseName !== 'string' || !baseName.startsWith('dashboard-jobs-id')) return null
  const idParam = route.params.id
  if (typeof idParam !== 'string' || idParam === 'new') return null
  return idParam
})

const {
  data: sidebarJobsData,
} = useFetch('/api/jobs', {
  key: 'sidebar-jobs-list',
  query: { limit: 100 },
  headers: useRequestHeaders(['cookie']),
})

const sidebarJobs = computed(() => sidebarJobsData.value?.data ?? [])

const activeJobTitle = computed(() => {
  if (!activeJobId.value) return null
  const found = sidebarJobs.value.find((j: any) => j.id === activeJobId.value)
  return found?.title ?? 'Job'
})

const activeJobStatus = computed(() => {
  if (!activeJobId.value) return null
  const found = sidebarJobs.value.find((j: any) => j.id === activeJobId.value)
  return (found as any)?.status ?? null
})

const jobStatusBadgeClasses: Record<string, string> = {
  draft: 'bg-surface-50 text-surface-600 ring-surface-200 dark:bg-surface-800/60 dark:text-surface-400 dark:ring-surface-700',
  open: 'bg-success-50 text-success-700 ring-success-200 dark:bg-success-950/60 dark:text-success-400 dark:ring-success-800',
  closed: 'bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-950/60 dark:text-warning-400 dark:ring-warning-800',
  archived: 'bg-surface-50 text-surface-400 ring-surface-200 dark:bg-surface-800/60 dark:text-surface-500 dark:ring-surface-700',
}

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

// ─────────────────────────────────────────────
// Main navigation
// ─────────────────────────────────────────────

const mainNav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Jobs', to: '/dashboard/jobs', icon: Briefcase, exact: false },
  { label: 'Candidates', to: '/dashboard/candidates', icon: Users, exact: false },
  { label: 'Applications', to: '/dashboard/applications', icon: FileText, exact: false },
  { label: 'Interviews', to: '/dashboard/interviews', icon: Calendar, exact: false },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings, exact: false },
]

function isActiveRoute(to: string, exact: boolean) {
  const localizedTo = localePath(to)
  if (exact) return route.path === localizedTo
  return route.path === localizedTo || route.path.startsWith(`${localizedTo}/`)
}

// Close menus on route change
watch(() => route.path, () => {
  showUserMenu.value = false
  showMobileMenu.value = false
})

// Close user menu on outside click
const userMenuRef = useTemplateRef<HTMLElement>('userMenuRoot')
function onClickOutsideUser(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    showUserMenu.value = false
  }
}
onMounted(() => document.addEventListener('click', onClickOutsideUser))
onUnmounted(() => document.removeEventListener('click', onClickOutsideUser))
</script>

<template>
  <header class="sticky top-0 z-50 w-full">
    <!-- Primary navigation bar -->
    <div class="relative z-20 border-b border-surface-200/80 dark:border-surface-800/80 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl">
      <div class="flex h-14 items-center justify-between px-4 lg:px-6">
        <!-- Left: Logo + Nav -->
        <div class="flex items-center gap-1 lg:gap-2">
          <!-- Logo — links to marketing site (reqcore.com), not app root -->
          <a
            :href="useRuntimeConfig().public.marketingUrl"
            class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg no-underline hover:bg-surface-100/60 dark:hover:bg-surface-800/60 transition-colors mr-1 lg:mr-4"
          >
            <img src="/eagle-mascot-logo.png" alt="Reqcore mascot" class="size-7 shrink-0 object-contain" />
            <span class="text-[15px] font-bold text-surface-900 dark:text-surface-100 hidden sm:block tracking-tight">Reqcore</span>
          </a>

          <!-- Desktop nav links -->
          <nav class="hidden md:flex items-center gap-0.5">
            <NuxtLink
              v-for="item in mainNav"
              :key="item.to"
              :to="$localePath(item.to)"
              class="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 no-underline"
              :class="isActiveRoute(item.to, item.exact)
                ? 'text-brand-700 dark:text-brand-300 bg-brand-50/80 dark:bg-brand-950/40'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100/80 dark:hover:bg-surface-800/60'"
            >
              <component :is="item.icon" class="size-4" />
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-1 lg:gap-1.5">
          <!-- New Job button (desktop) -->
          <NuxtLink
            :to="$localePath('/dashboard/jobs/new')"
            class="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 hover:shadow-md hover:shadow-brand-600/25 active:bg-brand-800 transition-all duration-200 no-underline"
          >
            <Plus class="size-3.5" />
            New Job
          </NuxtLink>

          <!-- Org Switcher -->
          <div class="hidden lg:block ml-1">
            <OrgSwitcher />
          </div>

          <!-- Language Switcher -->
          <div class="hidden lg:block">
            <LanguageSwitcher />
          </div>

          <!-- Color mode toggle -->
          <button
            class="flex items-center justify-center size-8 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 cursor-pointer border-0 bg-transparent"
            :title="isDark ? 'Switch to light' : 'Switch to dark'"
            @click="toggleColorMode"
          >
            <Sun v-if="isDark" class="size-4" />
            <Moon v-else class="size-4" />
          </button>

          <!-- Updates button -->
          <NuxtLink
            :to="$localePath('/dashboard/updates')"
            class="hidden sm:flex items-center justify-center size-8 rounded-lg transition-all duration-200 no-underline"
            :class="isActiveRoute('/dashboard/updates', false)
              ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40'
              : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800'"
            title="Updates & changelog"
            aria-label="Updates & changelog"
          >
            <ArrowUpCircle class="size-4" />
          </NuxtLink>

          <!-- Feedback button -->
          <button
            v-if="isFeedbackEnabled"
            class="flex items-center justify-center size-8 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 cursor-pointer border-0 bg-transparent"
            title="Report issue"
            @click="showFeedbackModal = true"
          >
            <MessageSquarePlus class="size-4" />
          </button>

          <!-- Divider -->
          <div class="hidden sm:block w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />

          <!-- User menu -->
          <div ref="userMenuRoot" class="relative">
            <button
              class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-100/80 dark:hover:bg-surface-800/60 transition-all duration-200 cursor-pointer border-0 bg-transparent"
              @click="showUserMenu = !showUserMenu"
            >
              <div class="flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-[11px] font-bold shadow-sm">
                {{ userInitials }}
              </div>
              <ChevronDown
                class="size-3 text-surface-400 transition-transform duration-200"
                :class="showUserMenu ? 'rotate-180' : ''"
              />
            </button>

            <!-- User dropdown -->
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div
                v-if="showUserMenu"
                class="absolute right-0 top-[calc(100%+6px)] w-64 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl shadow-surface-900/8 dark:shadow-surface-950/30 overflow-hidden"
              >
                <!-- User info header -->
                <div class="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                  <div class="text-sm font-semibold text-surface-900 dark:text-surface-100">{{ userName }}</div>
                  <div class="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">{{ userEmail }}</div>
                </div>

                <!-- Mobile-only items -->
                <div class="md:hidden border-b border-surface-100 dark:border-surface-800 py-1">
                  <NuxtLink
                    v-for="item in mainNav"
                    :key="item.to"
                    :to="$localePath(item.to)"
                    class="flex items-center gap-2.5 px-4 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors no-underline"
                    :class="isActiveRoute(item.to, item.exact) ? 'text-brand-600 dark:text-brand-400 font-medium' : ''"
                  >
                    <component :is="item.icon" class="size-4" />
                    {{ item.label }}
                  </NuxtLink>
                </div>

                <!-- Org switcher (mobile) -->
                <div class="lg:hidden border-b border-surface-100 dark:border-surface-800 p-2">
                  <OrgSwitcher />
                </div>

                <!-- Actions -->
                <div class="py-1">
                  <button
                    class="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors cursor-pointer border-0 bg-transparent text-left"
                    :disabled="isSigningOut"
                    @click="handleSignOut"
                  >
                    <LogOut class="size-4" />
                    {{ isSigningOut ? 'Signing out…' : 'Sign out' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Mobile hamburger -->
          <button
            class="flex md:hidden items-center justify-center size-8 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 cursor-pointer border-0 bg-transparent"
            @click="showMobileMenu = !showMobileMenu"
          >
            <X v-if="showMobileMenu" class="size-4" />
            <Menu v-else class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Job context sub-navigation bar -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div
        v-if="activeJobId"
        class="relative z-10 border-b border-surface-200/60 dark:border-surface-800/60 bg-surface-50/90 dark:bg-surface-950/90 backdrop-blur-lg"
      >
        <div class="flex items-center gap-4 px-4 lg:px-6 h-10">
          <NuxtLink
            :to="$localePath('/dashboard/jobs')"
            class="flex items-center gap-1 text-xs font-medium text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors no-underline shrink-0"
          >
            <ChevronLeft class="size-3.5" />
            All Jobs
          </NuxtLink>

          <div class="w-px h-4 bg-surface-200 dark:bg-surface-700" />

          <div class="flex items-center gap-2 shrink-0 min-w-0">
            <Briefcase class="size-3.5 text-brand-500 shrink-0" />
            <span class="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate max-w-48">
              {{ activeJobTitle }}
            </span>
            <span
              v-if="activeJobStatus"
              class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset"
              :class="jobStatusBadgeClasses[activeJobStatus] ?? 'bg-surface-50 text-surface-600 ring-surface-200'"
            >
              {{ activeJobStatus }}
            </span>
          </div>

          <nav class="flex items-center gap-0.5 ml-2">
            <NuxtLink
              v-for="tab in jobTabs"
              :key="tab.to"
              :to="$localePath(tab.to)"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 no-underline"
              :class="isActiveRoute(tab.to, tab.exact)
                ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm'
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-white/60 dark:hover:bg-surface-800/60'"
            >
              <component :is="tab.icon" class="size-3.5" />
              {{ tab.label }}
            </NuxtLink>
          </nav>

          <div class="ml-auto flex items-center gap-2">
            <div id="job-sub-nav-actions" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Mobile navigation menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="showMobileMenu"
        class="relative z-10 md:hidden border-b border-surface-200 dark:border-surface-800 bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl"
      >
        <nav class="px-4 py-3 flex flex-col gap-1">
          <NuxtLink
            v-for="item in mainNav"
            :key="item.to"
            :to="$localePath(item.to)"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all no-underline"
            :class="isActiveRoute(item.to, item.exact)
              ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
              : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'"
          >
            <component :is="item.icon" class="size-4" />
            {{ item.label }}
          </NuxtLink>

          <NuxtLink
            :to="$localePath('/dashboard/jobs/new')"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors no-underline sm:hidden mt-1"
          >
            <Plus class="size-4" />
            New Job
          </NuxtLink>
        </nav>

        <div class="px-4 pb-3 flex flex-col gap-2 border-t border-surface-100 dark:border-surface-800 pt-3 lg:hidden">
          <OrgSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </Transition>
  </header>

  <!-- Feedback modal -->
  <FeedbackModal v-if="showFeedbackModal" @close="showFeedbackModal = false" />
</template>
