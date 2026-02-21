<script setup lang="ts">
import { Eye } from 'lucide-vue-next'

const { data: session } = await authClient.useSession(useFetch)

const config = useRuntimeConfig()
const { activeOrg } = useCurrentOrg()

const isDemo = computed(() => {
  const slug = config.public.demoOrgSlug
  return slug && activeOrg.value?.slug === slug
})
</script>

<template>
  <div class="flex min-h-screen">
    <AppSidebar />
    <main class="flex-1 overflow-y-auto bg-surface-50 dark:bg-surface-950 px-6 py-8">
      <!-- Demo mode banner -->
      <div
        v-if="isDemo"
        class="mx-auto mb-6 flex max-w-4xl items-center gap-3 rounded-lg border border-brand-200 dark:border-brand-900 bg-brand-50 dark:bg-brand-950/40 px-4 py-2.5 text-sm text-brand-700 dark:text-brand-300"
      >
        <Eye class="size-4 shrink-0" />
        <span>
          <strong>Preview mode</strong> — You're exploring with sample data in read-only mode. Changes are disabled.
          <a
            href="https://github.com/applirank/applirank"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-1 font-semibold underline decoration-brand-400/40 underline-offset-2 hover:decoration-brand-400"
          >Deploy your own instance →</a>
        </span>
      </div>
      <slot />
    </main>
  </div>
</template>
