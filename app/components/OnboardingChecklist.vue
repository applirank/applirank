<script setup lang="ts">
import {
  CheckCircle2, Circle, X, Zap, Star, ChevronRight,
  Building2, Briefcase, Globe, UserPlus, ArrowRight,
  Users, Sparkles, Trophy,
} from 'lucide-vue-next'
import { LEVELS } from '~/composables/useOnboarding'

const {
  steps,
  completedCount,
  totalCount,
  progressPercent,
  earnedXp,
  totalXp,
  currentLevel,
  allComplete,
  shouldShow,
  isDismissing,
  dismiss,
  localePath,
} = useOnboarding()

// ─────────────────────────────────────────────
// Step icons — one lucide icon per step
// ─────────────────────────────────────────────

const stepIcons: Record<string, typeof Building2> = {
  workspace_created: Building2,
  first_job: Briefcase,
  publish_job: Globe,
  first_candidate: UserPlus,
  pipeline_action: ArrowRight,
  invite_team: Users,
  configure_ai: Sparkles,
}

// ─────────────────────────────────────────────
// Celebrate completion with a brief confetti burst
// ─────────────────────────────────────────────

const showConfetti = ref(false)
watch(allComplete, (val) => {
  if (val) {
    showConfetti.value = true
    setTimeout(() => { showConfetti.value = false }, 3500)
  }
})

// ─────────────────────────────────────────────
// Level-up flash: detect when level changes
// ─────────────────────────────────────────────
const levelFlash = ref(false)
const prevLevelLabel = ref(currentLevel.value.label)
watch(currentLevel, (next) => {
  if (next.label !== prevLevelLabel.value) {
    levelFlash.value = true
    prevLevelLabel.value = next.label
    setTimeout(() => { levelFlash.value = false }, 1200)
  }
})

// Next level info for progress-to-next display
const nextLevel = computed(() => {
  const idx = LEVELS.findIndex(l => l.label === currentLevel.value.label)
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
})

const xpToNextLevel = computed(() => {
  if (!nextLevel.value) return null
  return nextLevel.value.minXp - earnedXp.value
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-500 ease-out"
    leave-active-class="transition-all duration-300 ease-in"
    enter-from-class="opacity-0 -translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-4"
  >
    <div
      v-if="shouldShow"
      class="relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm mb-8"
    >
      <!-- Confetti particles (CSS-only) -->
      <Transition name="confetti-fade">
        <div v-if="showConfetti" class="pointer-events-none absolute inset-0 overflow-hidden z-20" aria-hidden="true">
          <span
            v-for="i in 24"
            :key="i"
            class="confetti-particle absolute block size-2 rounded-sm"
            :style="{
              left: `${(i * 4.17) % 100}%`,
              animationDelay: `${(i * 0.07) % 0.8}s`,
              background: ['#6366f1','#a78bfa','#f59e0b','#34d399','#fb7185','#38bdf8'][ i % 6],
            }"
          />
        </div>
      </Transition>

      <!-- Accent gradient stripe -->
      <div
        class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-400 via-violet-400 to-brand-600"
        :style="{ width: `${progressPercent}%`, transition: 'width 0.6s ease' }"
      />

      <!-- Header -->
      <div class="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/40 shrink-0">
            <Trophy class="size-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100 leading-tight">
              Get set up
            </h2>
            <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              {{ completedCount }}/{{ totalCount }} steps done
            </p>
          </div>
        </div>

        <!-- XP + Level badge -->
        <div class="flex items-center gap-2 shrink-0">
          <div
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300"
            :class="[
              levelFlash
                ? 'scale-110 border-brand-400 bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400',
            ]"
          >
            <Zap class="size-3" />
            <span>{{ earnedXp }} / {{ totalXp }} XP</span>
          </div>
          <div
            class="px-2.5 py-1 rounded-full text-xs font-semibold border"
            :class="currentLevel.color"
            :style="{ borderColor: 'currentColor', opacity: 0.9 }"
          >
            {{ currentLevel.label }}
          </div>
          <button
            class="size-7 flex items-center justify-center rounded-full text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
            :disabled="isDismissing"
            title="Dismiss checklist"
            aria-label="Dismiss onboarding checklist"
            @click="dismiss"
          >
            <X class="size-4" />
          </button>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mx-5 mb-4">
        <div class="h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-700 ease-out"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
        <div v-if="xpToNextLevel" class="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
          {{ xpToNextLevel }} XP to reach <span class="font-medium" :class="nextLevel?.color">{{ nextLevel?.label }}</span>
        </div>
      </div>

      <!-- Steps list -->
      <ul class="px-3 pb-4 space-y-1">
        <li
          v-for="step in steps"
          :key="step.id"
          class="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
          :class="step.completed
            ? 'opacity-60'
            : 'hover:bg-surface-50 dark:hover:bg-surface-800/60 cursor-pointer'"
        >
          <!-- Step icon / check indicator -->
          <div
            class="shrink-0 flex items-center justify-center size-8 rounded-lg transition-all duration-300"
            :class="step.completed
              ? 'bg-success-50 dark:bg-success-950/30 border border-success-200/60 dark:border-success-800/40'
              : 'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700'"
          >
            <CheckCircle2
              v-if="step.completed"
              class="size-4 text-success-500"
            />
            <component
              :is="stepIcons[step.id] ?? Circle"
              v-else
              class="size-4 text-surface-400 dark:text-surface-500"
            />
          </div>

          <!-- Step text -->
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium leading-snug"
              :class="step.completed
                ? 'line-through text-surface-400 dark:text-surface-600'
                : 'text-surface-800 dark:text-surface-200'"
            >
              {{ step.title }}
            </p>
            <p
              v-if="!step.completed"
              class="text-xs text-surface-400 dark:text-surface-500 mt-0.5 truncate"
            >
              {{ step.description }}
            </p>
          </div>

          <!-- XP badge -->
          <div
            class="shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
            :class="step.completed
              ? 'text-success-500 bg-success-50 dark:bg-success-950/30'
              : 'text-surface-400 bg-surface-100 dark:bg-surface-800'"
          >
            <Star class="size-3" />
            {{ step.xp }}
          </div>

          <!-- CTA arrow (only for incomplete steps) -->
          <NuxtLink
            v-if="!step.completed"
            :to="localePath(step.ctaPath)"
            class="shrink-0 flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            @click.stop
          >
            {{ step.cta }}
            <ChevronRight class="size-3.5" />
          </NuxtLink>
        </li>
      </ul>
    </div>
  </Transition>
</template>

<style scoped>
/* CSS-only confetti burst */
@keyframes confettiFall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(220px) rotate(720deg);
    opacity: 0;
  }
}

.confetti-particle {
  animation: confettiFall 1.6s ease-in forwards;
}

.confetti-fade-enter-active,
.confetti-fade-leave-active {
  transition: opacity 0.4s;
}
.confetti-fade-enter-from,
.confetti-fade-leave-to {
  opacity: 0;
}
</style>
