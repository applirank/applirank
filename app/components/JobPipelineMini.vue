<script setup lang="ts">
/**
 * A compact, premium pipeline visualization for job cards.
 * Shows application counts per stage as colored segments with totals.
 */

const props = defineProps<{
  pipeline: {
    new: number
    screening: number
    interview: number
    offer: number
    hired: number
    rejected: number
  }
}>()

const stages = [
  { key: 'new', label: 'New', dotClass: 'bg-blue-500', barClass: 'bg-blue-500', textClass: 'text-blue-700 dark:text-blue-400' },
  { key: 'screening', label: 'Screen', dotClass: 'bg-violet-500', barClass: 'bg-violet-500', textClass: 'text-violet-700 dark:text-violet-400' },
  { key: 'interview', label: 'Interview', dotClass: 'bg-amber-500', barClass: 'bg-amber-500', textClass: 'text-amber-700 dark:text-amber-400' },
  { key: 'offer', label: 'Offer', dotClass: 'bg-teal-500', barClass: 'bg-teal-500', textClass: 'text-teal-700 dark:text-teal-400' },
  { key: 'hired', label: 'Hired', dotClass: 'bg-green-600', barClass: 'bg-green-600', textClass: 'text-green-700 dark:text-green-400' },
] as const

const totalActive = computed(() => {
  return props.pipeline.new
    + props.pipeline.screening
    + props.pipeline.interview
    + props.pipeline.offer
    + props.pipeline.hired
})

const totalAll = computed(() => totalActive.value + props.pipeline.rejected)

/** Segments for the stacked bar (only active stages, no rejected) */
const barSegments = computed(() => {
  if (totalActive.value === 0) return []
  return stages
    .map((s) => ({
      ...s,
      count: props.pipeline[s.key],
      pct: (props.pipeline[s.key] / totalActive.value) * 100,
    }))
    .filter((s) => s.count > 0)
})
</script>

<template>
  <div class="space-y-1.5">
    <!-- Stacked progress bar -->
    <div class="flex items-center gap-2">
      <div
        class="relative flex h-1.5 flex-1 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800"
      >
        <div
          v-for="seg in barSegments"
          :key="seg.key"
          class="h-full transition-all duration-500 ease-out first:rounded-l-full last:rounded-r-full"
          :class="seg.barClass"
          :style="{ width: `${seg.pct}%` }"
          :title="`${seg.label}: ${seg.count}`"
        />
      </div>
      <span class="text-[10px] font-semibold tabular-nums text-surface-500 dark:text-surface-400 shrink-0">
        {{ totalAll }}
      </span>
    </div>

    <!-- Stage dots with counts -->
    <div class="flex items-center gap-3">
      <div
        v-for="s in stages"
        :key="s.key"
        class="flex items-center gap-1"
        :title="s.label"
      >
        <span class="size-1.5 rounded-full shrink-0" :class="s.dotClass" />
        <span
          class="text-[10px] font-medium tabular-nums leading-none"
          :class="pipeline[s.key] > 0 ? s.textClass : 'text-surface-300 dark:text-surface-600'"
        >
          {{ pipeline[s.key] }}
        </span>
      </div>
      <!-- Rejected (shown separately with ×) -->
      <div
        v-if="pipeline.rejected > 0"
        class="flex items-center gap-1 ml-auto"
        title="Rejected"
      >
        <span class="size-1.5 rounded-full shrink-0 bg-surface-300 dark:bg-surface-600" />
        <span class="text-[10px] font-medium tabular-nums leading-none text-surface-400 dark:text-surface-500">
          {{ pipeline.rejected }}
        </span>
      </div>
    </div>
  </div>
</template>
