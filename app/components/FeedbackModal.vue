<script setup lang="ts">
import { Bug, Lightbulb, X, ExternalLink, Send, MessageSquarePlus } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
}>()

// ── Form state ────────────────────────────────
const feedbackType = ref<'bug' | 'feature'>('bug')
const title = ref('')
const description = ref('')
const currentUrl = ref('')

// ── Submission state ──────────────────────────
const isSubmitting = ref(false)
const submitError = ref('')
const successUrl = ref('')

// Capture current URL when modal opens
onMounted(() => {
  currentUrl.value = window.location.href
})

const placeholders = computed(() => {
  if (feedbackType.value === 'bug') {
    return {
      title: 'e.g. Pipeline cards not updating after drag',
      description: 'What happened? What did you expect? Steps to reproduce…',
    }
  }
  return {
    title: 'e.g. Add bulk actions on candidate list',
    description: 'Describe the feature and why it would be useful…',
  }
})

const isValid = computed(() =>
  title.value.trim().length >= 5 && description.value.trim().length >= 10,
)

async function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const result = await $fetch<{ issueUrl: string }>('/api/feedback', {
      method: 'POST',
      body: {
        type: feedbackType.value,
        title: title.value.trim(),
        description: description.value.trim(),
        currentUrl: currentUrl.value || undefined,
      },
    })
    successUrl.value = result.issueUrl
  } catch (err: any) {
    submitError.value = err.data?.statusMessage ?? 'Failed to submit feedback. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function resetAndClose() {
  title.value = ''
  description.value = ''
  submitError.value = ''
  successUrl.value = ''
  feedbackType.value = 'bug'
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="resetAndClose" />

      <!-- Modal -->
      <div class="relative bg-white dark:bg-surface-900 rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-800">
          <div class="flex items-center gap-2">
            <MessageSquarePlus class="size-5 text-brand-600 dark:text-brand-400" />
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50">
              Send Feedback
            </h3>
          </div>
          <button
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors cursor-pointer"
            @click="resetAndClose"
          >
            <X class="size-5" />
          </button>
        </div>

        <!-- Success state -->
        <div v-if="successUrl" class="px-5 py-8 text-center">
          <div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg class="size-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">
            Feedback submitted!
          </h4>
          <p class="text-sm text-surface-500 dark:text-surface-400 mb-5">
            Thank you for helping improve Applirank. Your feedback has been recorded.
          </p>
          <div class="flex items-center justify-center gap-3">
            <a
              :href="successUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors no-underline"
            >
              <ExternalLink class="size-4" />
              View on GitHub
            </a>
            <button
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors cursor-pointer"
              @click="resetAndClose"
            >
              Done
            </button>
          </div>
        </div>

        <!-- Form -->
        <form v-else class="flex flex-col" @submit.prevent="handleSubmit">
          <div class="px-5 py-4 space-y-4">
            <!-- Type toggle -->
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Type
              </label>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer"
                  :class="feedbackType === 'bug'
                    ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-750'"
                  @click="feedbackType = 'bug'"
                >
                  <Bug class="size-4" />
                  Bug Report
                </button>
                <button
                  type="button"
                  class="flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer"
                  :class="feedbackType === 'feature'
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-750'"
                  @click="feedbackType = 'feature'"
                >
                  <Lightbulb class="size-4" />
                  Feature Request
                </button>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label for="feedback-title" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Title
              </label>
              <input
                id="feedback-title"
                v-model="title"
                type="text"
                maxlength="200"
                :placeholder="placeholders.title"
                class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="feedback-description" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Description
              </label>
              <textarea
                id="feedback-description"
                v-model="description"
                rows="5"
                maxlength="5000"
                :placeholder="placeholders.description"
                class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-y min-h-[100px]"
              />
              <p class="mt-1 text-xs text-surface-400">
                {{ feedbackType === 'bug' ? 'Include steps to reproduce, what you expected, and what actually happened.' : 'Describe the use case and how this feature would help you.' }}
              </p>
            </div>

            <!-- Error -->
            <div v-if="submitError" class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-3 text-sm text-danger-700 dark:text-danger-400">
              {{ submitError }}
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 border-t border-surface-200 dark:border-surface-800 px-5 py-4">
            <button
              type="button"
              class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors cursor-pointer"
              @click="resetAndClose"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!isValid || isSubmitting"
              class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send class="size-4" />
              {{ isSubmitting ? 'Submitting…' : 'Submit Feedback' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
