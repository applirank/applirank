<script setup lang="ts">
import { Bug, Lightbulb, X, ExternalLink, Send, MessageSquarePlus, ImagePlus, ChevronDown, ChevronRight } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
}>()

// ── Form state ────────────────────────────────
const feedbackType = ref<'bug' | 'feature'>('bug')
const title = ref('')
const description = ref('')
const currentUrl = ref('')
const includeReporterContext = ref(true)
const includeEmail = ref(false)
const includeScreenshot = ref(false)
const includeDiagnostics = ref(true)
const screenshotDataUrl = ref('')
const screenshotFileName = ref('')
const featureUserProblem = ref('')
const featureDesiredWorkflow = ref('')
const featureExpectedImpact = ref('')
const bugStepsToReproduce = ref('')
const bugExpectedResult = ref('')
const bugActualResult = ref('')
const showOptionalContext = ref(false)
const MAX_SCREENSHOT_DATA_URL_CHARS = 45000

// ── Submission state ──────────────────────────
const isSubmitting = ref(false)
const submitError = ref('')
const successUrl = ref('')
const diagnostics = ref({
  userAgent: '',
  language: '',
  platform: '',
  timezone: '',
  viewport: '',
  screen: '',
})

// Capture current URL when modal opens
onMounted(() => {
  currentUrl.value = window.location.href
  diagnostics.value = {
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    platform: window.navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${window.screen.width}x${window.screen.height}`,
  }
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
  title.value.trim().length >= 5
  && description.value.trim().length >= 10
  && (!includeScreenshot.value || !!screenshotDataUrl.value),
)

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Failed to read screenshot file'))
    reader.readAsDataURL(file)
  })
}

async function compressImageDataUrl(dataUrl: string) {
  const image = new Image()

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Failed to load screenshot image'))
    image.src = dataUrl
  })

  const maxDimension = 1280
  const widthRatio = maxDimension / image.width
  const heightRatio = maxDimension / image.height
  const ratio = Math.min(1, widthRatio, heightRatio)

  const targetWidth = Math.max(1, Math.round(image.width * ratio))
  const targetHeight = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Failed to process screenshot')
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight)
  return canvas.toDataURL('image/jpeg', 0.78)
}

function resetScreenshot() {
  screenshotDataUrl.value = ''
  screenshotFileName.value = ''
}

async function handleScreenshotSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    resetScreenshot()
    return
  }

  if (!file.type.startsWith('image/')) {
    submitError.value = 'Screenshot must be an image file.'
    resetScreenshot()
    return
  }

  submitError.value = ''

  try {
    const sourceDataUrl = await fileToDataUrl(file)
    const compressedDataUrl = await compressImageDataUrl(sourceDataUrl)

    if (compressedDataUrl.length > MAX_SCREENSHOT_DATA_URL_CHARS) {
      submitError.value = 'Screenshot is too large for GitHub issue body. Please use a smaller image.'
      resetScreenshot()
      return
    }

    screenshotDataUrl.value = compressedDataUrl
    screenshotFileName.value = file.name
  } catch {
    submitError.value = 'Failed to process screenshot. Please try another file.'
    resetScreenshot()
  }
}

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
        includeReporterContext: includeReporterContext.value,
        includeEmail: includeEmail.value,
        includeScreenshot: includeScreenshot.value,
        screenshotDataUrl: includeScreenshot.value ? screenshotDataUrl.value : undefined,
        screenshotFileName: includeScreenshot.value ? screenshotFileName.value : undefined,
        diagnostics: includeDiagnostics.value ? diagnostics.value : undefined,
        featureContext: feedbackType.value === 'feature'
          ? {
              userProblem: featureUserProblem.value.trim() || undefined,
              desiredWorkflow: featureDesiredWorkflow.value.trim() || undefined,
              expectedImpact: featureExpectedImpact.value.trim() || undefined,
            }
          : undefined,
        bugContext: feedbackType.value === 'bug'
          ? {
              stepsToReproduce: bugStepsToReproduce.value.trim() || undefined,
              expectedResult: bugExpectedResult.value.trim() || undefined,
              actualResult: bugActualResult.value.trim() || undefined,
            }
          : undefined,
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
  includeReporterContext.value = true
  includeEmail.value = false
  includeScreenshot.value = false
  includeDiagnostics.value = true
  featureUserProblem.value = ''
  featureDesiredWorkflow.value = ''
  featureExpectedImpact.value = ''
  bugStepsToReproduce.value = ''
  bugExpectedResult.value = ''
  bugActualResult.value = ''
  showOptionalContext.value = false
  resetScreenshot()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="resetAndClose" />

      <!-- Modal -->
      <div class="relative bg-white dark:bg-surface-900 rounded-xl shadow-xl w-full max-w-lg flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-800">
          <div class="flex items-center gap-2">
            <MessageSquarePlus class="size-5 text-brand-600 dark:text-brand-400" />
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50">
              Create GitHub Issue
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
        <form v-else class="flex min-h-0 flex-col" @submit.prevent="handleSubmit">
          <div class="min-h-0 overflow-y-auto px-5 py-4 space-y-4">
            <div class="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 px-3 py-2 text-xs text-surface-600 dark:text-surface-300">
              Submitting this form creates a GitHub issue for the Applirank maintainers.
            </div>

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
                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'"
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
                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'"
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

            <div class="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
              <button
                type="button"
                class="flex w-full items-center justify-between px-3 py-2 text-left"
                @click="showOptionalContext = !showOptionalContext"
              >
                <span class="text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">
                  Add More Context (Optional)
                </span>
                <component :is="showOptionalContext ? ChevronDown : ChevronRight" class="size-4 text-surface-500 dark:text-surface-400" />
              </button>

              <div v-if="showOptionalContext" class="space-y-3 border-t border-surface-200 dark:border-surface-700 p-3">
                <div v-if="feedbackType === 'bug'" class="space-y-3">
                  <p class="text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">
                    Bug Context
                  </p>

                  <div>
                    <label for="bug-steps-to-reproduce" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Steps to reproduce
                    </label>
                    <textarea
                      id="bug-steps-to-reproduce"
                      v-model="bugStepsToReproduce"
                      rows="2"
                      maxlength="1500"
                      placeholder="Step-by-step instructions to reproduce the issue"
                      class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-y"
                    />
                  </div>

                  <div>
                    <label for="bug-expected-result" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Expected result
                    </label>
                    <textarea
                      id="bug-expected-result"
                      v-model="bugExpectedResult"
                      rows="2"
                      maxlength="1000"
                      placeholder="What did you expect to happen?"
                      class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-y"
                    />
                  </div>

                  <div>
                    <label for="bug-actual-result" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Actual result
                    </label>
                    <textarea
                      id="bug-actual-result"
                      v-model="bugActualResult"
                      rows="2"
                      maxlength="1000"
                      placeholder="What actually happened?"
                      class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-y"
                    />
                  </div>
                </div>

                <div v-if="feedbackType === 'feature'" class="space-y-3">
                  <p class="text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">
                    Feature Context
                  </p>

                  <div>
                    <label for="feature-user-problem" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      User problem
                    </label>
                    <textarea
                      id="feature-user-problem"
                      v-model="featureUserProblem"
                      rows="2"
                      maxlength="1000"
                      placeholder="What problem are you trying to solve?"
                      class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-y"
                    />
                  </div>

                  <div>
                    <label for="feature-desired-workflow" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Desired workflow
                    </label>
                    <textarea
                      id="feature-desired-workflow"
                      v-model="featureDesiredWorkflow"
                      rows="2"
                      maxlength="1000"
                      placeholder="How should this work in Applirank?"
                      class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-y"
                    />
                  </div>

                  <div>
                    <label for="feature-expected-impact" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Expected impact
                    </label>
                    <textarea
                      id="feature-expected-impact"
                      v-model="featureExpectedImpact"
                      rows="2"
                      maxlength="1000"
                      placeholder="What improves if this feature exists?"
                      class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-3 space-y-2.5">
              <p class="text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">
                Share Additional Context
              </p>

              <label class="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                <input
                  v-model="includeReporterContext"
                  type="checkbox"
                  class="mt-0.5 size-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Share my name and current page</span>
              </label>

              <label class="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                <input
                  v-model="includeEmail"
                  type="checkbox"
                  class="mt-0.5 size-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Share my email address with this issue</span>
              </label>

              <label class="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                <input
                  v-model="includeDiagnostics"
                  type="checkbox"
                  class="mt-0.5 size-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Share technical diagnostics (browser, screen size, timezone)</span>
              </label>

              <label class="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                <input
                  v-model="includeScreenshot"
                  type="checkbox"
                  class="mt-0.5 size-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                  @change="!includeScreenshot && resetScreenshot()"
                />
                <span>Share a screenshot</span>
              </label>

              <div v-if="includeScreenshot" class="space-y-2">
                <label class="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors cursor-pointer">
                  <ImagePlus class="size-4" />
                  Choose image
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    type="file"
                    class="hidden"
                    @change="handleScreenshotSelect"
                  />
                </label>
                <p class="text-xs text-surface-400">
                  {{ screenshotFileName ? `Selected: ${screenshotFileName}` : 'No screenshot selected' }}
                </p>
              </div>
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
              class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors cursor-pointer"
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
              {{ isSubmitting ? 'Creating issue…' : 'Create GitHub Issue' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
