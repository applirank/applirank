<script setup lang="ts">
const { needsConsent, acceptAnalytics, declineAnalytics } = useAnalyticsConsent()
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="translate-y-4 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="needsConsent"
      class="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur-md sm:right-6 sm:bottom-6"
    >
      <p class="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">A small ask</p>
      <p class="text-[13px] leading-relaxed text-white/70">
        Help us improve reqcore. No ads, no data selling, just product insights.
      </p>
      <p class="mt-1.5 text-[12px] text-white/40">
        <NuxtLink
          to="/docs/legal/privacy-policy"
          class="underline underline-offset-2 transition hover:text-white/70"
        >
          Privacy policy
        </NuxtLink>
      </p>
      <div class="mt-3 flex gap-2">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-xs font-medium text-white/40 transition hover:text-white/70"
          @click="declineAnalytics"
        >
          No thanks
        </button>
        <button
          type="button"
          class="rounded-md bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-400"
          @click="acceptAnalytics"
        >
          Sure, help improve it
        </button>
      </div>
    </div>
  </Transition>
</template>
