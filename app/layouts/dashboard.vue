<script setup lang="ts">
import { Eye } from 'lucide-vue-next'
import { usePreviewReadOnly } from '~/composables/usePreviewReadOnly'

const { data: session } = await authClient.useSession(useFetch)

const config = useRuntimeConfig()
const { activeOrg } = useCurrentOrg()
const { isUpsellOpen, closeUpsell } = usePreviewReadOnly()

const isDemo = computed(() => {
  const slug = config.public.demoOrgSlug
  return slug && activeOrg.value?.slug === slug
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface-50 dark:bg-surface-950">
    <AppTopBar />
    <PreviewUpsellModal v-if="isUpsellOpen" @close="closeUpsell" />
    <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <!-- Demo mode banner -->
      <div
        v-if="isDemo"
        class="mx-auto mb-6 flex max-w-5xl items-center gap-3 rounded-lg border border-brand-200 dark:border-brand-900 bg-brand-50 dark:bg-brand-950/40 px-4 py-2.5 text-sm text-brand-700 dark:text-brand-300"
      >
        <Eye class="size-4 shrink-0" />
        <span>
          <strong>Live demo</strong> — Explore freely with sample data. Editing is disabled here.
          <a
            href="https://github.com/reqcore-inc/reqcore#quick-start"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-1 font-semibold underline decoration-brand-400/40 underline-offset-2 hover:decoration-brand-400"
          >Deploy your own free instance →</a>
        </span>
      </div>
      <slot />
    </main>
  </div>
</template>
