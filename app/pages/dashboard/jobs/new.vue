<script setup lang="ts">
import {
  ArrowLeft,
  Check,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Link2,
  ClipboardCopy,
} from 'lucide-vue-next'
import { z } from 'zod'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

useSeoMeta({
  title: 'Create Job — Reqcore',
  description: 'Create a new job posting',
})

const localePath = useLocalePath()
const { createJob } = useJobs()

type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'single_select'
  | 'multi_select'
  | 'number'
  | 'date'
  | 'url'
  | 'checkbox'
  | 'file_upload'

type DraftQuestion = {
  id: string
  label: string
  type: QuestionType
  description?: string | null
  required: boolean
  options?: string[] | null
}

// Wizard state
const currentStep = ref<1 | 2 | 3>(1)
const steps = [
  { id: 1, title: 'Job details', description: 'Tell applicants about this role.' },
  { id: 2, title: 'Application form', description: 'Design the application form.' },
  { id: 3, title: 'Find candidates', description: 'Post on job boards, engage recruiters.' },
]

// Step 1: Job details (API-supported fields)
const form = ref({
  title: '',
  description: '',
  location: '',
  type: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'internship',
})

// Step 2: Application form (client-only for now)
const applicationForm = ref({
  requireResume: true,
  requireCoverLetter: false,
  questions: [] as DraftQuestion[],
})

// Step 3: Find candidates (client-only for now)
const findCandidates = ref({
  experienceLevel: 'mid' as 'junior' | 'mid' | 'senior' | 'lead',
  skills: [] as string[],
  enableSourcing: true,
  locationPreference: 'anywhere' as 'onsite' | 'hybrid' | 'remote' | 'anywhere',
})

const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)
const showAddForm = ref(false)
const editingQuestion = ref<DraftQuestion | null>(null)
const linkCopied = ref(false)
const questionActionError = ref<string | null>(null)
const nextQuestionId = ref(1)

// Validation (only Step 1 is required to submit)
const formSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(['full_time', 'part_time', 'contract', 'internship']),
})

function validateStep1(): boolean {
  const result = formSchema.safeParse(form.value)
  if (!result.success) {
    errors.value = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString()
      if (field) errors.value[field] = issue.message
    }
    return false
  }
  errors.value = {}
  return true
}

const canGoNext = computed(() => {
  if (currentStep.value === 1) return validateStep1()
  return true
})

function nextStep() {
  if (currentStep.value < 3) {
    if (currentStep.value === 1 && !validateStep1()) return
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

function handleAddQuestion(data: {
  label: string
  type: string
  description?: string
  required: boolean
  options?: string[]
}) {
  applicationForm.value.questions.push({
    id: `draft-${nextQuestionId.value++}`,
    label: data.label,
    type: data.type as QuestionType,
    description: data.description ?? null,
    required: data.required,
    options: data.options ?? null,
  })
  showAddForm.value = false
  questionActionError.value = null
}

function handleUpdateQuestion(data: {
  label: string
  type: string
  description?: string
  required: boolean
  options?: string[]
}) {
  if (!editingQuestion.value) return

  const index = applicationForm.value.questions.findIndex((q) => q.id === editingQuestion.value?.id)
  if (index === -1) return

  const existingQuestion = applicationForm.value.questions[index]
  if (!existingQuestion) return

  applicationForm.value.questions[index] = {
    id: existingQuestion.id,
    label: data.label,
    type: data.type as QuestionType,
    description: data.description ?? null,
    required: data.required,
    options: data.options ?? null,
  }
  editingQuestion.value = null
  questionActionError.value = null
}

function handleDeleteQuestion(questionId: string) {
  const index = applicationForm.value.questions.findIndex((q) => q.id === questionId)
  if (index === -1) return
  applicationForm.value.questions.splice(index, 1)
  if (editingQuestion.value?.id === questionId) {
    editingQuestion.value = null
  }
  questionActionError.value = null
}

function moveQuestion(index: number, direction: 'up' | 'down') {
  const list = applicationForm.value.questions
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= list.length) return
  ;[list[index], list[targetIndex]] = [list[targetIndex]!, list[index]!]
}

function slugifyTitle(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

const requestUrl = useRequestURL()
const applicationLink = computed(() => {
  const base = `${requestUrl.protocol}//${requestUrl.host}`
  const slugBase = slugifyTitle(form.value.title) || 'new-job'
  return `${base}/jobs/${slugBase}-xxxxxxxx/apply`
})

async function copyApplicationLink() {
  try {
    await navigator.clipboard.writeText(applicationLink.value)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch {
    // ignore clipboard issues silently
  }
}

function addSkillFromInput(e: Event) {
  const input = e.target as HTMLInputElement
  const value = input.value.trim()
  if (!value) return
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((skill) => {
      if (!findCandidates.value.skills.includes(skill)) {
        findCandidates.value.skills.push(skill)
      }
    })
  input.value = ''
}

function removeSkill(index: number) {
  findCandidates.value.skills.splice(index, 1)
}

async function handleSubmit() {
  submitError.value = null
  // Ensure step 1 is valid before submit
  if (!validateStep1()) {
    currentStep.value = 1
    return
  }

  isSubmitting.value = true
  try {
    const created = await createJob({
      title: form.value.title,
      description: form.value.description || undefined,
      location: form.value.location || undefined,
      type: form.value.type,
    })

    if (applicationForm.value.questions.length > 0 && created?.id) {
      await Promise.all(
        applicationForm.value.questions.map((question, index) => (
          $fetch(`/api/jobs/${created.id}/questions`, {
            method: 'POST',
            body: {
              label: question.label,
              type: question.type,
              description: question.description || undefined,
              required: question.required,
              options: question.options || undefined,
              displayOrder: index,
            },
          })
        )),
      )
    }

    await navigateTo(localePath('/dashboard'))
  } catch (err: any) {
    submitError.value = err?.data?.statusMessage ?? 'Something went wrong'
  } finally {
    isSubmitting.value = false
  }
}

const typeOptions = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const questionTypeLabels: Record<QuestionType, string> = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  single_select: 'Single Select',
  multi_select: 'Multi Select',
  number: 'Number',
  date: 'Date',
  url: 'URL',
  checkbox: 'Checkbox',
  file_upload: 'File Upload',
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <!-- Header with top actions -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <NuxtLink
          :to="$localePath('/dashboard')"
          class="inline-flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 mb-2 transition-colors"
        >
          <ArrowLeft class="size-4" />
          Back to Jobs
        </NuxtLink>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100">New Job</h1>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        >
          Save draft
        </button>
        <button
          v-if="currentStep < 3"
          type="button"
          :disabled="!canGoNext"
          @click="nextStep"
          class="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Save & continue
        </button>
        <button
          v-else
          type="button"
          :disabled="isSubmitting"
          @click="handleSubmit"
          class="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {{ isSubmitting ? 'Creating...' : 'Create job' }}
        </button>
      </div>
    </div>

    <!-- Stepper -->
    <div class="mb-10 overflow-x-auto pb-4">
      <ol class="flex items-start gap-8 min-w-max">
        <li v-for="step in steps" :key="step.id" class="flex-1 flex flex-col gap-3 min-w-[180px]">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <div
                class="flex items-center justify-center size-8 rounded-full border text-sm font-medium shrink-0 transition-all"
                :class="[
                  currentStep === step.id
                    ? 'bg-brand-600 text-white border-brand-600 ring-4 ring-brand-100 dark:ring-brand-950'
                    : currentStep > step.id
                      ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
                      : 'bg-white dark:bg-surface-900 text-surface-500 dark:text-surface-400 border-surface-200 dark:border-surface-800'
                ]"
              >
                <span v-if="currentStep > step.id">✓</span>
                <span v-else>{{ step.id }}</span>
              </div>
              <span 
                class="text-sm font-semibold" 
                :class="currentStep >= step.id ? 'text-surface-900 dark:text-surface-100' : 'text-surface-400 dark:text-surface-500'"
              >
                {{ step.title }}
              </span>
            </div>
            <p class="text-xs leading-relaxed text-surface-500 dark:text-surface-400 pl-11">
              {{ step.description }}
            </p>
          </div>
          <div 
            class="h-1 rounded-full transition-colors mt-1" 
            :class="currentStep >= step.id ? 'bg-brand-600' : 'bg-surface-200 dark:bg-surface-800'" 
          />
        </li>
      </ol>
    </div>

    <!-- Main Layout: Form + Tips -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Left side: Form -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Server error -->
        <div
          v-if="submitError"
          class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-4 text-sm text-danger-700 dark:text-danger-400 mb-4"
        >
          {{ submitError }}
        </div>

        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm overflow-hidden">
          <form @submit.prevent="handleSubmit" class="p-6 md:p-8">
            <!-- Step 1: Job details -->
            <section v-if="currentStep === 1" class="space-y-10">
              <!-- Section: Job title and department -->
              <div class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6 pb-2 border-b border-surface-100 dark:border-surface-800">Job title and department</h2>
                  <label for="title" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Job title <span class="text-danger-500">*</span>
                  </label>
                  <input
                    id="title"
                    v-model="form.title"
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    class="w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    :class="errors.title ? 'border-danger-300 ring-1 ring-danger-100' : 'border-surface-300 dark:border-surface-700'"
                  />
                  <p v-if="errors.title" class="mt-1.5 text-xs text-danger-600 dark:text-danger-400 font-medium">{{ errors.title }}</p>
                  <p v-else class="mt-1.5 text-xs text-surface-500">80 characters left. No special characters.</p>
                </div>
              </div>

              <!-- Section: Location -->
              <div class="space-y-6">
                <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6 pb-2 border-b border-surface-100 dark:border-surface-800">Location</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="location" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Office location
                    </label>
                    <input
                      id="location"
                      v-model="form.location"
                      type="text"
                      placeholder="e.g. New York, NY 10019, United States"
                      class="w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors border-surface-300 dark:border-surface-700"
                    />
                  </div>
                  <div>
                    <label for="type" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Workplace type
                    </label>
                    <select
                      id="type"
                      v-model="form.type"
                      class="w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors bg-white dark:bg-surface-900 border-surface-300 dark:border-surface-700"
                    >
                      <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Section: Description -->
              <div class="space-y-6">
                <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6 pb-2 border-b border-surface-100 dark:border-surface-800">Description</h2>
                <div>
                  <label for="description" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    About the role
                  </label>
                  <textarea
                    id="description"
                    v-model="form.description"
                    rows="10"
                    placeholder="Describe the role, responsibilities, and requirements…"
                    class="w-full rounded-lg border px-4 py-3 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors border-surface-300 dark:border-surface-700"
                  />
                  <p class="mt-2 text-xs text-surface-500">Minimum 700 characters recommended.</p>
                </div>
              </div>
            </section>

            <!-- Step 2: Application form -->
            <section v-else-if="currentStep === 2" class="space-y-8">
              <div class="rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950 p-5">
                <div class="flex items-center gap-2 mb-2">
                  <Link2 class="size-4 text-brand-600 dark:text-brand-400" />
                  <h2 class="text-sm font-semibold text-brand-700 dark:text-brand-300">Application Link</h2>
                </div>
                <p class="text-xs text-surface-600 dark:text-surface-400 mb-3">
                  This preview link will be generated when the job is created.
                </p>
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    readonly
                    :value="applicationLink"
                    class="flex-1 rounded-lg border border-brand-200 dark:border-brand-800 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-300 select-all"
                  />
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                    @click="copyApplicationLink"
                  >
                    <ClipboardCopy class="size-3.5" />
                    {{ linkCopied ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
              </div>

              <div>
                <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6 pb-2 border-b border-surface-100 dark:border-surface-800">Application requirements</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    class="relative flex items-center gap-3 p-4 rounded-xl border text-left transition-colors"
                    :class="applicationForm.requireResume
                      ? 'border-brand-300 dark:border-brand-700 bg-brand-50/70 dark:bg-brand-950/30'
                      : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50'"
                    :aria-pressed="applicationForm.requireResume"
                    @click="applicationForm.requireResume = !applicationForm.requireResume"
                  >
                    <span
                      v-if="applicationForm.requireResume"
                      class="absolute top-3 right-3 inline-flex items-center justify-center size-5 rounded-full bg-brand-600 text-white"
                      aria-hidden="true"
                    >
                      <Check class="size-3" />
                    </span>
                    <div>
                      <span class="block text-sm font-medium text-surface-900 dark:text-surface-100">Require resume/CV</span>
                      <span class="text-xs text-surface-500">Candidates must upload a file.</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    class="relative flex items-center gap-3 p-4 rounded-xl border text-left transition-colors"
                    :class="applicationForm.requireCoverLetter
                      ? 'border-brand-300 dark:border-brand-700 bg-brand-50/70 dark:bg-brand-950/30'
                      : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50'"
                    :aria-pressed="applicationForm.requireCoverLetter"
                    @click="applicationForm.requireCoverLetter = !applicationForm.requireCoverLetter"
                  >
                    <span
                      v-if="applicationForm.requireCoverLetter"
                      class="absolute top-3 right-3 inline-flex items-center justify-center size-5 rounded-full bg-brand-600 text-white"
                      aria-hidden="true"
                    >
                      <Check class="size-3" />
                    </span>
                    <div>
                      <span class="block text-sm font-medium text-surface-900 dark:text-surface-100">Ask for cover letter</span>
                      <span class="text-xs text-surface-500">Optional for candidates.</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-6 pb-2 border-b border-surface-100 dark:border-surface-800">
                  <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">Custom questions</h2>
                </div>
                <div
                  v-if="questionActionError"
                  class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-3 text-sm text-danger-700 dark:text-danger-400 mb-4"
                >
                  {{ questionActionError }}
                  <button class="ml-2 underline" @click="questionActionError = null">Dismiss</button>
                </div>

                <div v-if="applicationForm.questions.length > 0" class="space-y-2 mb-4">
                  <div
                    v-for="(q, index) in applicationForm.questions"
                    :key="q.id"
                    class="flex items-center gap-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 group"
                  >
                    <div class="text-surface-300">
                      <GripVertical class="size-4" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{{ q.label }}</span>
                        <span v-if="q.required" class="text-xs text-danger-500 font-medium">Required</span>
                      </div>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs text-surface-400">{{ questionTypeLabels[q.type] ?? q.type }}</span>
                        <span v-if="q.description" class="text-xs text-surface-400 truncate">
                          - {{ q.description }}
                        </span>
                        <span
                          v-if="(q.type === 'single_select' || q.type === 'multi_select') && q.options"
                          class="text-xs text-surface-400"
                        >
                          · {{ q.options.length }} options
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        :disabled="index === 0"
                        class="rounded p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-30"
                        title="Move up"
                        @click="moveQuestion(index, 'up')"
                      >
                        <ChevronUp class="size-4" />
                      </button>
                      <button
                        type="button"
                        :disabled="index === applicationForm.questions.length - 1"
                        class="rounded p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-30"
                        title="Move down"
                        @click="moveQuestion(index, 'down')"
                      >
                        <ChevronDown class="size-4" />
                      </button>
                      <button
                        type="button"
                        class="rounded p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        title="Edit"
                        @click="editingQuestion = q; showAddForm = false"
                      >
                        <Pencil class="size-4" />
                      </button>
                      <button
                        type="button"
                        class="rounded p-1 text-surface-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950 transition-colors"
                        title="Delete"
                        @click="handleDeleteQuestion(q.id)"
                      >
                        <Trash2 class="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <p v-else class="text-sm text-surface-400 py-4">
                  No custom questions yet. Applicants will see only the standard fields (name, email, phone).
                </p>

                <QuestionForm
                  v-if="editingQuestion"
                  :question="editingQuestion"
                  class="mb-4"
                  @save="handleUpdateQuestion"
                  @cancel="editingQuestion = null"
                />

                <QuestionForm
                  v-if="showAddForm && !editingQuestion"
                  class="mb-4"
                  @save="handleAddQuestion"
                  @cancel="showAddForm = false"
                />

                <button
                  v-if="!showAddForm && !editingQuestion"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-surface-300 dark:border-surface-700 px-3 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:border-brand-400 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                  @click="showAddForm = true"
                >
                  <Plus class="size-4" />
                  Add Question
                </button>
              </div>
            </section>

            <!-- Step 3: Find candidates -->
            <section v-else class="space-y-8">
              <div>
                <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6 pb-2 border-b border-surface-100 dark:border-surface-800">Targeting details</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Experience level</label>
                    <select v-model="findCandidates.experienceLevel" class="w-full rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                      <option value="junior">Junior</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Location preference</label>
                    <select v-model="findCandidates.locationPreference" class="w-full rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                      <option value="anywhere">Anywhere</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">Onsite</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6 pb-2 border-b border-surface-100 dark:border-surface-800">Key skills</h2>
                <div class="rounded-lg border border-surface-300 dark:border-surface-700 p-3 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
                  <div class="flex flex-wrap gap-2 mb-2">
                    <span
                      v-for="(skill, idx) in findCandidates.skills"
                      :key="skill + idx"
                      class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200 border border-brand-100 dark:border-brand-900 px-2.5 py-1 text-xs font-medium"
                    >
                      {{ skill }}
                      <button type="button" class="text-brand-400 hover:text-brand-600 dark:hover:text-brand-100 transition-colors" @click="removeSkill(idx)">×</button>
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Type a skill and press Enter..."
                    class="w-full border-0 focus:ring-0 bg-transparent text-sm placeholder:text-surface-400"
                    @keydown.enter.prevent="addSkillFromInput"
                    @blur="addSkillFromInput"
                  />
                </div>
                <p class="mt-2 text-xs text-surface-500">Examples: Vue, TypeScript, Tailwind, GraphQL, AWS</p>
              </div>

              <div class="pt-4">
                <button
                  type="button"
                  class="relative w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors"
                  :class="findCandidates.enableSourcing
                    ? 'border-brand-300 dark:border-brand-700 bg-brand-50/70 dark:bg-brand-950/30'
                    : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50'"
                  :aria-pressed="findCandidates.enableSourcing"
                  @click="findCandidates.enableSourcing = !findCandidates.enableSourcing"
                >
                  <span
                    v-if="findCandidates.enableSourcing"
                    class="absolute top-3 right-3 inline-flex items-center justify-center size-5 rounded-full bg-brand-600 text-white"
                    aria-hidden="true"
                  >
                    <Check class="size-3" />
                  </span>
                  <div>
                    <span class="block text-sm font-medium text-surface-900 dark:text-surface-100">Enable candidate sourcing recommendations</span>
                    <span class="text-xs text-surface-500">Let AI help you find the best matches.</span>
                  </div>
                </button>
              </div>
            </section>

            <!-- Actions Footer -->
            <div class="flex items-center justify-between mt-12 pt-8 border-t border-surface-100 dark:border-surface-800">
              <NuxtLink
                :to="$localePath('/dashboard')"
                class="px-6 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              >
                Cancel
              </NuxtLink>

              <div class="flex items-center gap-3">
                <button
                  v-if="currentStep > 1"
                  type="button"
                  @click="prevStep"
                  class="px-6 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  Back
                </button>
                <button
                  v-if="currentStep < 3"
                  type="button"
                  :disabled="!canGoNext"
                  @click="nextStep"
                  class="px-8 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Save & continue
                </button>
                <button
                  v-else
                  type="submit"
                  :disabled="isSubmitting"
                  class="px-8 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {{ isSubmitting ? 'Creating...' : 'Create job' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Right side: Tips -->
      <aside class="lg:col-span-4 space-y-6">
        <div class="sticky top-8 space-y-6">
          <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 p-6">
            <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider mb-4">Tips</h3>
            <ul class="space-y-4">
              <li v-if="currentStep === 1" class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                <p class="font-medium text-surface-900 dark:text-surface-100 mb-1">Use common job titles</p>
                Advertise for just one job e.g. 'Nurse', not 'nurses'.
              </li>
              <li v-if="currentStep === 1" class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                <p class="font-medium text-surface-900 dark:text-surface-100 mb-1">Office location</p>
                Use a location to attract the most appropriate candidates. Some job boards require a location.
              </li>
              <li v-if="currentStep === 1" class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                <p class="font-medium text-surface-900 dark:text-surface-100 mb-1">Format description</p>
                Format into sections and lists to improve readability.
              </li>
              <li v-if="currentStep === 2" class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                <p class="font-medium text-surface-900 dark:text-surface-100 mb-1">Keep it short</p>
                Too many questions can deter candidates. Stick to 3-5 essential questions.
              </li>
              <li v-if="currentStep === 3" class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                <p class="font-medium text-surface-900 dark:text-surface-100 mb-1">Be specific with skills</p>
                Adding specific skills helps our AI better match candidates to your role.
              </li>
            </ul>
          </div>
          
          <div v-if="currentStep === 1" class="p-6 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30">
            <h4 class="text-sm font-semibold text-brand-900 dark:text-brand-100 mb-2">Need help?</h4>
            <p class="text-xs text-brand-700 dark:text-brand-300 leading-relaxed">
              Our AI can help you write a compelling job description. Click the magic wand icon in the editor.
            </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
button:not(:disabled) {
  cursor: pointer;
}
</style>
