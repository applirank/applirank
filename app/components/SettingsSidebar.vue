<script setup lang="ts">
import {
  Building2, Users, UserCircle, ChevronLeft, Settings,
} from 'lucide-vue-next'

const route = useRoute()
const localePath = useLocalePath()

const settingsNav = [
  {
    label: 'General',
    description: 'Organization profile',
    to: '/dashboard/settings',
    icon: Building2,
    exact: true,
  },
  {
    label: 'Members',
    description: 'Team & invitations',
    to: '/dashboard/settings/members',
    icon: Users,
    exact: true,
  },
  {
    label: 'Account',
    description: 'Profile & security',
    to: '/dashboard/settings/account',
    icon: UserCircle,
    exact: true,
  },
]

function isActive(to: string, exact: boolean) {
  const localizedTo = localePath(to)
  if (exact) return route.path === localizedTo
  return route.path === localizedTo || route.path.startsWith(`${localizedTo}/`)
}
</script>

<template>
  <aside
    class="flex h-full w-56 min-w-56 flex-col border-r border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm overflow-y-auto"
  >
    <!-- Header -->
    <div class="px-4 pt-5 pb-4">
      <NuxtLink
        :to="$localePath('/dashboard')"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors no-underline mb-3"
      >
        <ChevronLeft class="size-3.5" />
        Back to jobs
      </NuxtLink>
      <div class="flex items-center gap-2.5">
        <div class="flex items-center justify-center size-8 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
          <Settings class="size-4" />
        </div>
        <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
          Settings
        </h2>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 pb-5">
      <div class="flex flex-col gap-0.5">
        <NuxtLink
          v-for="item in settingsNav"
          :key="item.to"
          :to="$localePath(item.to)"
          class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all no-underline"
          :class="isActive(item.to, item.exact)
            ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-medium'
            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-surface-100'"
        >
          <div
            class="flex items-center justify-center size-8 rounded-md transition-colors"
            :class="isActive(item.to, item.exact)
              ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300'"
          >
            <component :is="item.icon" class="size-4" />
          </div>
          <div class="min-w-0">
            <div class="truncate leading-tight">{{ item.label }}</div>
            <div
              class="text-[11px] leading-tight mt-0.5 truncate"
              :class="isActive(item.to, item.exact)
                ? 'text-brand-500/70 dark:text-brand-400/60'
                : 'text-surface-400 dark:text-surface-500'"
            >
              {{ item.description }}
            </div>
          </div>
        </NuxtLink>
      </div>
    </nav>
  </aside>
</template>
