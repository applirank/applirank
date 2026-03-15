<script setup lang="ts">
import {
  ArrowUpCircle, Package, Tag, Clock,
  Sparkles, Bug, Zap, Trash2,
  ExternalLink, CheckCircle2, GitCommit,
  RefreshCw, ChevronDown, ChevronRight,
  Download, AlertTriangle, Server,
  HardDrive, Database, Shield, Loader2,
  Cpu, MemoryStick, Info,
} from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

useSeoMeta({
  title: 'Updates — Reqcore',
  description: 'Check for updates and manage your self-hosted instance',
})

const { allowed: isOwner } = usePermission({ organization: ['delete'] })

// ─────────────────────────────────────────────
// Version check
// ─────────────────────────────────────────────
const { data: versionInfo, pending: versionLoading, refresh: recheckVersion } = await useFetch('/api/updates/version', {
  lazy: true,
})

const isChecking = ref(false)
async function handleCheckUpdate() {
  isChecking.value = true
  try {
    await recheckVersion()
  }
  finally {
    isChecking.value = false
  }
}

// ─────────────────────────────────────────────
// System info
// ─────────────────────────────────────────────
const { data: systemInfo, pending: systemLoading } = await useFetch('/api/updates/system', {
  lazy: true,
})

// ─────────────────────────────────────────────
// Backup
// ─────────────────────────────────────────────
const isBackingUp = ref(false)
const backupResult = ref<{ success: boolean; message: string } | null>(null)

async function handleBackup() {
  isBackingUp.value = true
  backupResult.value = null
  try {
    const result = await $fetch('/api/updates/backup', { method: 'POST' })
    backupResult.value = result
  }
  catch (err: unknown) {
    backupResult.value = {
      success: false,
      message: err instanceof Error ? err.message : 'Backup failed',
    }
  }
  finally {
    isBackingUp.value = false
  }
}

// ─────────────────────────────────────────────
// Apply update
// ─────────────────────────────────────────────
const isUpdating = ref(false)
const updateResult = ref<{
  success: boolean
  message: string
  steps: { step: string; status: string; detail?: string }[]
} | null>(null)
const showUpdateConfirm = ref(false)

async function handleApplyUpdate() {
  isUpdating.value = true
  updateResult.value = null
  try {
    const result = await $fetch('/api/updates/apply', { method: 'POST' })
    updateResult.value = result
  }
  catch (err: unknown) {
    updateResult.value = {
      success: false,
      message: err instanceof Error ? err.message : 'Update failed unexpectedly',
      steps: [],
    }
  }
  finally {
    isUpdating.value = false
    showUpdateConfirm.value = false
  }
}

// ─────────────────────────────────────────────
// Changelog
// ─────────────────────────────────────────────
interface ChangelogSection {
  heading: string
  items: string[]
}

interface ChangelogEntry {
  title: string
  date: string | null
  version: string | null
  link: string | null
  sections: ChangelogSection[]
}

const { data, status } = useFetch<{ entries: ChangelogEntry[]; currentVersion: string | null }>('/api/updates/changelog', {
  key: 'updates-changelog',
  headers: useRequestHeaders(['cookie']),
})

const entries = computed(() => data.value?.entries ?? [])
const currentVersion = computed(() => data.value?.currentVersion ?? null)

// Expand/collapse state — first entry expanded by default
const expandedEntries = ref<Set<number>>(new Set([0]))

function toggleEntry(idx: number) {
  if (expandedEntries.value.has(idx)) {
    expandedEntries.value.delete(idx)
  }
  else {
    expandedEntries.value.add(idx)
  }
}

function expandAll() {
  entries.value.forEach((_: unknown, i: number) => expandedEntries.value.add(i))
}

function collapseAll() {
  expandedEntries.value.clear()
}

// Section heading → icon + color mapping
function sectionMeta(heading: string) {
  const lower = heading.toLowerCase()
  if (lower.includes('feature') || lower.includes('added') || lower.includes('✨'))
    return { icon: Sparkles, color: 'text-success-500', bg: 'bg-success-50 dark:bg-success-950/40', ring: 'ring-success-200 dark:ring-success-800' }
  if (lower.includes('fix') || lower.includes('🐛'))
    return { icon: Bug, color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-950/40', ring: 'ring-warning-200 dark:ring-warning-800' }
  if (lower.includes('changed') || lower.includes('improved'))
    return { icon: Zap, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950/40', ring: 'ring-brand-200 dark:ring-brand-800' }
  if (lower.includes('removed') || lower.includes('deprecated'))
    return { icon: Trash2, color: 'text-danger-500', bg: 'bg-danger-50 dark:bg-danger-950/40', ring: 'ring-danger-200 dark:ring-danger-800' }
  return { icon: GitCommit, color: 'text-surface-500', bg: 'bg-surface-50 dark:bg-surface-800/40', ring: 'ring-surface-200 dark:ring-surface-700' }
}

// Strip markdown links from item text for cleaner display
function cleanItem(text: string) {
  return text
    .replace(/\[(.+?)]\(.+?\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
}

// Extract commit links from item text
function extractLink(text: string) {
  const match = text.match(/\[[\da-f]{7}]\((https:\/\/.+?)\)/)
  return match?.[1] ?? null
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${Math.floor(seconds)}s`
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <!-- Page header -->
    <div class="mb-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
            Updates
          </h1>
          <p class="mt-1.5 text-sm text-surface-500 dark:text-surface-400">
            Check for new versions and manage your self-hosted instance.
          </p>
        </div>

        <!-- Version badge -->
        <div
          v-if="currentVersion"
          class="flex items-center gap-2 shrink-0 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-4 py-2.5 shadow-sm"
        >
          <Package class="size-4 text-brand-500" />
          <div class="flex flex-col">
            <span class="text-[11px] font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider leading-none">Current version</span>
            <span class="text-sm font-bold text-surface-900 dark:text-surface-100 tabular-nums mt-0.5">v{{ currentVersion }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- Version status card                        -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="mb-6 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
      <div class="px-6 py-5 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center size-10 rounded-lg"
            :class="versionInfo?.updateAvailable
              ? 'bg-warning-50 dark:bg-warning-950 text-warning-600 dark:text-warning-400'
              : !versionInfo && !versionLoading
                ? 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400'
                : 'bg-success-50 dark:bg-success-950 text-success-600 dark:text-success-400'"
          >
            <ArrowUpCircle v-if="versionInfo?.updateAvailable" class="size-5" />
            <AlertTriangle v-else-if="!versionInfo && !versionLoading" class="size-5" />
            <CheckCircle2 v-else class="size-5" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">
              {{ versionInfo?.updateAvailable ? 'Update available' : !versionInfo && !versionLoading ? 'Unable to check' : 'Up to date' }}
            </h2>
            <p class="text-sm text-surface-500 dark:text-surface-400">
              <template v-if="versionLoading">
                Checking for updates…
              </template>
              <template v-else-if="!versionInfo">
                Could not check for updates. Verify your network connection and try again.
              </template>
              <template v-else-if="versionInfo.updateAvailable">
                Version {{ versionInfo.latestVersion }} is available (you're on {{ versionInfo.currentVersion }})
              </template>
              <template v-else>
                You're running the latest version ({{ versionInfo.currentVersion }})
              </template>
            </p>
          </div>
        </div>
      </div>

      <div class="px-6 py-5 space-y-4">
        <!-- Version details -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">
              Installed version
            </p>
            <p class="text-sm font-semibold text-surface-900 dark:text-surface-100 mt-1">
              v{{ versionInfo?.currentVersion ?? '…' }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">
              Latest version
            </p>
            <p class="text-sm font-semibold text-surface-900 dark:text-surface-100 mt-1">
              <template v-if="versionInfo?.latestVersion">
                v{{ versionInfo.latestVersion }}
              </template>
              <template v-else>
                <span class="text-surface-400">—</span>
              </template>
            </p>
          </div>
        </div>

        <!-- Release info -->
        <div v-if="versionInfo?.updateAvailable && versionInfo?.publishedAt" class="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
          <Clock class="size-3.5 shrink-0" />
          Released {{ formatDate(versionInfo.publishedAt) }}
        </div>

        <!-- Action buttons -->
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <button
            :disabled="isChecking || versionLoading"
            class="inline-flex items-center gap-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleCheckUpdate"
          >
            <RefreshCw :class="['size-4', (isChecking || versionLoading) && 'animate-spin']" />
            {{ (isChecking || versionLoading) ? 'Checking…' : 'Check for updates' }}
          </button>

          <a
            v-if="versionInfo?.releaseUrl"
            :href="versionInfo.releaseUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors no-underline"
          >
            <ExternalLink class="size-4" />
            View release notes
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════ -->
    <!-- One-click update section (owner only)      -->
    <!-- ═══════════════════════════════════════════ -->
    <section v-if="isOwner && versionInfo?.updateAvailable" class="mb-6 rounded-xl border border-brand-200 dark:border-brand-900 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
      <div class="px-6 py-5 border-b border-brand-200 dark:border-brand-900 bg-brand-50/50 dark:bg-brand-950/20">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-10 rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400">
            <Download class="size-5" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">
              Install update
            </h2>
            <p class="text-sm text-surface-500 dark:text-surface-400">
              Update to v{{ versionInfo.latestVersion }} with one click. Your data is preserved.
            </p>
          </div>
        </div>
      </div>

      <div class="px-6 py-5 space-y-4">
        <!-- Safety info -->
        <div class="flex items-start gap-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-800 px-4 py-3">
          <Shield class="size-4 shrink-0 text-surface-500 mt-0.5" />
          <div class="text-sm text-surface-600 dark:text-surface-400">
            <p class="font-medium text-surface-700 dark:text-surface-300 mb-1">Before updating</p>
            <ul class="list-disc list-inside space-y-0.5 text-xs">
              <li>Database migrations run automatically — your data is safe</li>
              <li>The app will be briefly unavailable during the restart (under 1 minute)</li>
              <li>We recommend creating a backup first (button below)</li>
            </ul>
          </div>
        </div>

        <!-- Backup button -->
        <div class="flex flex-wrap items-center gap-3">
          <button
            :disabled="isBackingUp"
            class="inline-flex items-center gap-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleBackup"
          >
            <Loader2 v-if="isBackingUp" class="size-4 animate-spin" />
            <Database v-else class="size-4" />
            {{ isBackingUp ? 'Creating backup…' : 'Create backup first' }}
          </button>
        </div>

        <!-- Backup result -->
        <div
          v-if="backupResult"
          class="rounded-lg px-4 py-3 text-sm"
          :class="backupResult.success
            ? 'bg-success-50 dark:bg-success-950/40 border border-success-200 dark:border-success-900 text-success-700 dark:text-success-400'
            : 'bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-900 text-danger-700 dark:text-danger-400'"
        >
          {{ backupResult.message }}
        </div>

        <!-- Update button -->
        <div v-if="!showUpdateConfirm">
          <button
            :disabled="isUpdating"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="showUpdateConfirm = true"
          >
            <Download class="size-4" />
            Update to v{{ versionInfo.latestVersion }}
          </button>
        </div>

        <!-- Update confirmation -->
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="showUpdateConfirm" class="rounded-lg border border-warning-200 dark:border-warning-800 bg-warning-50/50 dark:bg-warning-950/30 px-4 py-4 space-y-3">
            <p class="text-sm text-surface-700 dark:text-surface-300">
              This will update your Reqcore instance from <strong>v{{ versionInfo.currentVersion }}</strong> to <strong>v{{ versionInfo.latestVersion }}</strong>. The app will restart during the update.
            </p>
            <div class="flex items-center gap-2">
              <button
                :disabled="isUpdating"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click="handleApplyUpdate"
              >
                <Loader2 v-if="isUpdating" class="size-4 animate-spin" />
                <Download v-else class="size-4" />
                {{ isUpdating ? 'Updating…' : 'Confirm update' }}
              </button>
              <button
                :disabled="isUpdating"
                class="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
                @click="showUpdateConfirm = false"
              >
                Cancel
              </button>
            </div>
          </div>
        </Transition>

        <!-- Update result -->
        <div v-if="updateResult" class="space-y-3">
          <div
            class="rounded-lg px-4 py-3 text-sm"
            :class="updateResult.success
              ? 'bg-success-50 dark:bg-success-950/40 border border-success-200 dark:border-success-900 text-success-700 dark:text-success-400'
              : 'bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-900 text-danger-700 dark:text-danger-400'"
          >
            {{ updateResult.message }}
          </div>

          <!-- Step details -->
          <div v-if="updateResult.steps.length > 0" class="space-y-1.5">
            <div
              v-for="step in updateResult.steps"
              :key="step.step"
              class="flex items-center gap-2 text-sm"
            >
              <CheckCircle2 v-if="step.status === 'success'" class="size-4 text-success-500 shrink-0" />
              <AlertTriangle v-else class="size-4 text-danger-500 shrink-0" />
              <span class="text-surface-700 dark:text-surface-300">{{ step.step }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Read-only notice for non-owner users -->
    <div v-if="!isOwner && versionInfo?.updateAvailable" class="mb-6 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-800 px-4 py-3 text-sm text-surface-500 dark:text-surface-400">
      Only organization owners can apply updates. Contact the owner to update your instance.
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- System health                              -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="mb-6 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
      <div class="px-6 py-5 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
            <Server class="size-5" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">System health</h2>
            <p class="text-sm text-surface-500 dark:text-surface-400">Status of your self-hosted instance services.</p>
          </div>
        </div>
      </div>

      <div v-if="systemLoading" class="px-6 py-8 text-center">
        <Loader2 class="size-5 animate-spin mx-auto text-surface-400" />
        <p class="text-sm text-surface-400 mt-2">Loading system info…</p>
      </div>

      <div v-else-if="systemInfo" class="px-6 py-5 space-y-5">
        <!-- Service status grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- App -->
          <div class="rounded-lg border border-surface-200 dark:border-surface-800 px-4 py-3">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="size-2 rounded-full bg-success-500" />
              <span class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">App</span>
            </div>
            <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">Running</p>
            <p class="text-xs text-surface-400 mt-0.5">v{{ systemInfo.version }}</p>
          </div>

          <!-- Database -->
          <div class="rounded-lg border border-surface-200 dark:border-surface-800 px-4 py-3">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="size-2 rounded-full" :class="systemInfo.database.connected ? 'bg-success-500' : 'bg-danger-500'" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Database</span>
            </div>
            <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {{ systemInfo.database.connected ? 'Connected' : 'Disconnected' }}
            </p>
            <p class="text-xs text-surface-400 mt-0.5">PostgreSQL</p>
          </div>

          <!-- Storage -->
          <div class="rounded-lg border border-surface-200 dark:border-surface-800 px-4 py-3">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="size-2 rounded-full" :class="systemInfo.storage.connected ? 'bg-success-500' : 'bg-danger-500'" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Storage</span>
            </div>
            <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {{ systemInfo.storage.connected ? 'Connected' : 'Disconnected' }}
            </p>
            <p class="text-xs text-surface-400 mt-0.5">MinIO / S3</p>
          </div>
        </div>

        <!-- System details -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <Clock class="size-3 text-surface-400" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Uptime</span>
            </div>
            <p class="text-sm text-surface-700 dark:text-surface-300">{{ formatUptime(systemInfo.uptime) }}</p>
          </div>

          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <Cpu class="size-3 text-surface-400" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Platform</span>
            </div>
            <p class="text-sm text-surface-700 dark:text-surface-300">{{ systemInfo.platform }}/{{ systemInfo.arch }}</p>
          </div>

          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <MemoryStick class="size-3 text-surface-400" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Memory</span>
            </div>
            <p class="text-sm text-surface-700 dark:text-surface-300">{{ systemInfo.memoryUsage.percentage }}% used</p>
          </div>

          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <HardDrive class="size-3 text-surface-400" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Deployment</span>
            </div>
            <p class="text-sm text-surface-700 dark:text-surface-300">
              {{ systemInfo.deployment.isRailway ? 'Railway' : systemInfo.deployment.method === 'docker' ? 'Docker' : 'Standalone' }}
            </p>
          </div>
        </div>

        <!-- Node version -->
        <div class="flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
          <Info class="size-3 shrink-0" />
          Node.js {{ systemInfo.nodeVersion }}
        </div>
      </div>

      <div v-else class="px-6 py-8 text-center">
        <AlertTriangle class="size-5 mx-auto text-surface-400 mb-2" />
        <p class="text-sm text-surface-500 dark:text-surface-400">Failed to load system information.</p>
      </div>
    </section>

    <!-- Expand / Collapse controls -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
        Changelog
      </h2>
      <div class="flex items-center gap-2 text-xs">
        <button
          class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors cursor-pointer bg-transparent border-0"
          @click="expandAll"
        >
          Expand all
        </button>
        <span class="text-surface-300 dark:text-surface-600">·</span>
        <button
          class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors cursor-pointer bg-transparent border-0"
          @click="collapseAll"
        >
          Collapse all
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="status === 'pending'" class="space-y-4">
      <div v-for="i in 4" :key="i" class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5">
        <div class="flex items-center gap-3 animate-pulse">
          <div class="size-8 rounded-lg bg-surface-100 dark:bg-surface-800" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-32 rounded bg-surface-100 dark:bg-surface-800" />
            <div class="h-3 w-48 rounded bg-surface-100 dark:bg-surface-800" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="entries.length === 0"
      class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-12 text-center"
    >
      <RefreshCw class="size-8 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
      <div class="text-sm font-medium text-surface-500 dark:text-surface-400">No changelog entries found</div>
      <div class="text-xs text-surface-400 dark:text-surface-500 mt-1">The CHANGELOG.md file may be missing or empty.</div>
    </div>

    <!-- Changelog timeline -->
    <div v-else class="relative">
      <!-- Timeline line -->
      <div class="absolute left-[19px] top-6 bottom-6 w-px bg-surface-200 dark:bg-surface-700" />

      <div class="space-y-3">
        <div
          v-for="(entry, idx) in entries"
          :key="`${entry.title}-${idx}`"
          class="relative"
        >
          <!-- Timeline dot -->
          <div
            class="absolute left-2.5 top-[22px] z-10 size-3 rounded-full border-2 transition-colors duration-200"
            :class="entry.version
              ? 'bg-brand-500 border-brand-200 dark:border-brand-800'
              : entry.title === 'Unreleased'
                ? 'bg-accent-500 border-accent-200 dark:border-accent-800'
                : 'bg-surface-300 dark:bg-surface-600 border-surface-200 dark:border-surface-700'"
          />

          <!-- Entry card -->
          <div
            class="ml-10 rounded-xl border transition-all duration-200"
            :class="expandedEntries.has(idx)
              ? 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-sm'
              : 'border-transparent hover:border-surface-200 dark:hover:border-surface-700 bg-white/60 dark:bg-surface-900/60 hover:bg-white dark:hover:bg-surface-900 hover:shadow-sm'"
          >
            <!-- Entry header -->
            <button
              class="flex items-center gap-3 w-full px-5 py-4 text-left cursor-pointer border-0 bg-transparent"
              @click="toggleEntry(idx)"
            >
              <!-- Version / date icon -->
              <div
                v-if="entry.version"
                class="flex items-center justify-center size-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 shrink-0"
              >
                <Tag class="size-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div
                v-else-if="entry.title === 'Unreleased'"
                class="flex items-center justify-center size-8 rounded-lg bg-accent-50 dark:bg-accent-950/40 shrink-0"
              >
                <Sparkles class="size-4 text-accent-600 dark:text-accent-400" />
              </div>
              <div
                v-else
                class="flex items-center justify-center size-8 rounded-lg bg-surface-100 dark:bg-surface-800 shrink-0"
              >
                <Clock class="size-4 text-surface-500" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-surface-900 dark:text-surface-100">
                    {{ entry.title }}
                  </span>
                  <span
                    v-if="entry.version && entry.version === currentVersion"
                    class="inline-flex items-center rounded-md bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-300 ring-1 ring-inset ring-brand-200 dark:ring-brand-800"
                  >
                    Current
                  </span>
                  <span
                    v-if="entry.title === 'Unreleased'"
                    class="inline-flex items-center rounded-md bg-accent-50 dark:bg-accent-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700 dark:text-accent-300 ring-1 ring-inset ring-accent-200 dark:ring-accent-800"
                  >
                    Next
                  </span>
                </div>
                <div v-if="entry.date" class="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                  {{ entry.date }}
                </div>
              </div>

              <!-- Section count summary -->
              <div class="hidden sm:flex items-center gap-1.5 shrink-0">
                <span
                  v-for="section in entry.sections.slice(0, 3)"
                  :key="section.heading"
                  class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset"
                  :class="`${sectionMeta(section.heading).bg} ${sectionMeta(section.heading).ring} ${sectionMeta(section.heading).color}`"
                >
                  <component :is="sectionMeta(section.heading).icon" class="size-2.5" />
                  {{ section.items.length }}
                </span>
              </div>

              <ChevronDown
                class="size-4 text-surface-400 transition-transform duration-200 shrink-0"
                :class="expandedEntries.has(idx) ? '' : '-rotate-90'"
              />
            </button>

            <!-- Entry content -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[2000px]"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 max-h-[2000px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-if="expandedEntries.has(idx)" class="overflow-hidden">
                <div class="border-t border-surface-100 dark:border-surface-800 px-5 pb-5 pt-4 space-y-5">
                  <div v-for="section in entry.sections" :key="section.heading">
                    <!-- Section heading -->
                    <div class="flex items-center gap-2 mb-3">
                      <component
                        :is="sectionMeta(section.heading).icon"
                        class="size-3.5"
                        :class="sectionMeta(section.heading).color"
                      />
                      <h4 class="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                        {{ section.heading.replace(/[✨🐛]/g, '').trim() }}
                      </h4>
                    </div>

                    <!-- Items list -->
                    <ul class="space-y-2 ml-0 list-none p-0">
                      <li
                        v-for="(item, itemIdx) in section.items"
                        :key="itemIdx"
                        class="flex items-start gap-2.5 text-sm text-surface-600 dark:text-surface-400 leading-relaxed"
                      >
                        <div class="mt-1.5 size-1.5 rounded-full shrink-0" :class="sectionMeta(section.heading).color.replace('text-', 'bg-')" />
                        <span class="flex-1 min-w-0">{{ cleanItem(item) }}</span>
                        <a
                          v-if="extractLink(item)"
                          :href="extractLink(item)!"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="mt-0.5 shrink-0 text-surface-300 dark:text-surface-600 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                          title="View commit"
                        >
                          <GitCommit class="size-3.5" />
                        </a>
                      </li>
                    </ul>
                  </div>

                  <!-- View on GitHub link for versioned releases -->
                  <div v-if="entry.link" class="pt-2 border-t border-surface-100 dark:border-surface-800">
                    <a
                      :href="entry.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                    >
                      View full release on GitHub
                      <ExternalLink class="size-3" />
                    </a>
                  </div>

                  <!-- Empty section fallback -->
                  <div v-if="entry.sections.length === 0" class="text-sm text-surface-400 dark:text-surface-500 italic">
                    No detailed changes recorded for this entry.
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- Manual update instructions                 -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="mt-6 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
      <details class="group">
        <summary class="flex items-center gap-3 px-6 py-5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
          <div class="flex items-center justify-center size-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
            <Info class="size-5" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">Manual update</h2>
            <p class="text-sm text-surface-500 dark:text-surface-400">If you prefer to update from the command line.</p>
          </div>
          <ChevronRight class="size-4 text-surface-400 transition-transform duration-200 group-open:rotate-90" />
        </summary>
        <div class="border-t border-surface-100 dark:border-surface-800 px-6 py-5 space-y-4">
          <div>
            <h4 class="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-2">Docker Compose</h4>
            <div class="rounded-lg bg-surface-900 dark:bg-surface-950 px-4 py-3 font-mono text-sm text-surface-100 space-y-1 overflow-x-auto">
              <p class="text-surface-500"># Pull the latest image and restart</p>
              <p>docker compose pull</p>
              <p>docker compose up -d</p>
            </div>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-2">Manual / Git deployment</h4>
            <div class="rounded-lg bg-surface-900 dark:bg-surface-950 px-4 py-3 font-mono text-sm text-surface-100 space-y-1 overflow-x-auto">
              <p class="text-surface-500"># Navigate to your Reqcore directory</p>
              <p>cd /path/to/reqcore</p>
              <p class="text-surface-500 mt-3"># Pull the latest version</p>
              <p>git pull origin main</p>
              <p class="text-surface-500 mt-3"># Rebuild and restart</p>
              <p>docker compose up --build -d</p>
            </div>
          </div>
          <p class="text-xs text-surface-400 dark:text-surface-500">
            Database migrations run automatically on startup. Your data is preserved across updates.
          </p>
        </div>
      </details>
    </section>

    <!-- Footer link -->
    <div class="mt-8 mb-4 text-center">
      <a
        href="https://github.com/reqcore-inc/reqcore/releases"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-surface-400 dark:text-surface-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        View all releases on GitHub
        <ExternalLink class="size-3" />
      </a>
    </div>
  </div>
</template>
