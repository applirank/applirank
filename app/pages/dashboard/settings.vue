<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})
</script>

<template>
  <div class="flex min-w-0 flex-1 -mx-4 -my-6 sm:-mx-6 lg:-mx-8 lg:-my-8">
    <div class="sticky top-14 h-[calc(100vh-3.5rem)] shrink-0">
      <SettingsSidebar />
    </div>
    <div class="flex-1 min-w-0 px-6 py-6 lg:px-8 lg:py-8">
      <NuxtErrorBoundary>
        <NuxtPage />

        <template #error="{ error, clearError }">
          <div class="mx-auto max-w-2xl mt-8">
            <div class="rounded-xl border border-danger-200 dark:border-danger-900 bg-danger-50/50 dark:bg-danger-950/30 p-6">
              <div class="flex items-center gap-3 mb-3">
                <AlertTriangle class="size-5 text-danger-500" />
                <h2 class="text-base font-semibold text-danger-700 dark:text-danger-300">Something went wrong</h2>
              </div>
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
                {{ error?.message || 'An unexpected error occurred while loading this page.' }}
              </p>
              <button
                class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                @click="clearError"
              >
                Try again
              </button>
            </div>
          </div>
        </template>
      </NuxtErrorBoundary>
    </div>
  </div>
</template>
