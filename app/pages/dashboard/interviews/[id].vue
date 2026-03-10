<script setup lang="ts">
import {
  ArrowLeft, Calendar, Clock, Video, Phone, Building2, Code2,
  FileText, UsersRound, CheckCircle2, XCircle, AlertTriangle,
  UserRound, Briefcase, Pencil, MapPin, Users, MessageSquare,
  Save, X, Mail, Send, CheckCheck,
} from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

const route = useRoute()
const interviewId = route.params.id as string
const { handlePreviewReadOnlyError } = usePreviewReadOnly()

const { interview, status: fetchStatus, error, updateInterview, deleteInterview, refresh } = useInterview(interviewId)

useSeoMeta({
  title: computed(() =>
    interview.value
      ? `${interview.value.title} — Reqcore`
      : 'Interview — Reqcore',
  ),
  robots: 'noindex, nofollow',
})

// ─── Status config ──────────────────────────────────────────────
type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

const statusConfig: Record<InterviewStatus, { label: string; icon: any; class: string; dot: string }> = {
  scheduled: {
    label: 'Scheduled',
    icon: Calendar,
    class: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-800',
    dot: 'bg-brand-500',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    class: 'bg-success-50 text-success-700 ring-success-200 dark:bg-success-950/50 dark:text-success-300 dark:ring-success-800',
    dot: 'bg-success-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    class: 'bg-surface-100 text-surface-500 ring-surface-200 dark:bg-surface-800/50 dark:text-surface-400 dark:ring-surface-700',
    dot: 'bg-surface-400',
  },
  no_show: {
    label: 'No Show',
    icon: AlertTriangle,
    class: 'bg-danger-50 text-danger-700 ring-danger-200 dark:bg-danger-950/50 dark:text-danger-300 dark:ring-danger-800',
    dot: 'bg-danger-500',
  },
}

const typeIcons: Record<string, any> = {
  video: Video,
  phone: Phone,
  in_person: Building2,
  technical: Code2,
  panel: UsersRound,
  take_home: FileText,
}

const typeLabels: Record<string, string> = {
  video: 'Video',
  phone: 'Phone',
  in_person: 'In Person',
  technical: 'Technical',
  panel: 'Panel',
  take_home: 'Take Home',
}

// ─── Status transitions ─────────────────────────────────────────
const INTERVIEW_STATUS_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> = {
  scheduled: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: ['scheduled'],
  no_show: ['scheduled'],
}

const transitionClasses: Record<InterviewStatus, string> = {
  scheduled: 'border border-surface-300 dark:border-surface-700 bg-white/80 dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:border-surface-400 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800',
  completed: 'bg-success-600 text-white shadow-sm shadow-success-900/20 hover:bg-success-700',
  cancelled: 'bg-surface-500 text-white shadow-sm shadow-surface-900/20 hover:bg-surface-600',
  no_show: 'bg-danger-600 text-white shadow-sm shadow-danger-900/20 hover:bg-danger-700',
}

const allowedTransitions = computed(() => {
  if (!interview.value) return []
  return INTERVIEW_STATUS_TRANSITIONS[interview.value.status as InterviewStatus] ?? []
})

const isTransitioning = ref(false)

async function handleTransition(newStatus: InterviewStatus) {
  isTransitioning.value = true
  try {
    await updateInterview({ status: newStatus })
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    alert(err.data?.statusMessage ?? 'Failed to update status')
  } finally {
    isTransitioning.value = false
  }
}

// ─── Display helpers ─────────────────────────────────────────────
function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) > new Date()
}

function getCandidateInitials(firstName?: string, lastName?: string) {
  const first = firstName?.trim().charAt(0) ?? ''
  const last = lastName?.trim().charAt(0) ?? ''
  return `${first}${last}`.toUpperCase() || 'C'
}

// ─── Notes editing ───────────────────────────────────────────────
const isEditingNotes = ref(false)
const notesInput = ref('')
const isSavingNotes = ref(false)

function startEditNotes() {
  notesInput.value = interview.value?.notes ?? ''
  isEditingNotes.value = true
}

async function saveNotes() {
  isSavingNotes.value = true
  try {
    await updateInterview({ notes: notesInput.value.trim() || null })
    isEditingNotes.value = false
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    alert(err.data?.statusMessage ?? 'Failed to save notes')
  } finally {
    isSavingNotes.value = false
  }
}

// ─── Reschedule ──────────────────────────────────────────────────
const showReschedule = ref(false)
const rescheduleForm = reactive({
  date: '',
  time: '',
  duration: 60,
})
const isRescheduling = ref(false)
const rescheduleError = ref('')

function openReschedule() {
  if (!interview.value) return
  const d = new Date(interview.value.scheduledAt)
  rescheduleForm.date = d.toISOString().slice(0, 10)
  rescheduleForm.time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  rescheduleForm.duration = interview.value.duration
  rescheduleError.value = ''
  showReschedule.value = true
}

async function handleReschedule() {
  rescheduleError.value = ''
  if (!rescheduleForm.date || !rescheduleForm.time) {
    rescheduleError.value = 'Date and time are required'
    return
  }

  isRescheduling.value = true
  try {
    const scheduledAt = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`).toISOString()
    await updateInterview({
      scheduledAt,
      duration: rescheduleForm.duration,
      status: 'scheduled',
    })
    showReschedule.value = false
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    rescheduleError.value = err.data?.statusMessage ?? 'Failed to reschedule'
  } finally {
    isRescheduling.value = false
  }
}

// ─── Edit details ────────────────────────────────────────────────
const showEditDetails = ref(false)
const editForm = reactive({
  title: '',
  type: 'video' as string,
  location: '',
  interviewers: [''] as string[],
})
const editErrors = ref<Record<string, string>>({})
const isSavingEdit = ref(false)

function openEditDetails() {
  if (!interview.value) return
  editForm.title = interview.value.title
  editForm.type = interview.value.type
  editForm.location = interview.value.location ?? ''
  editForm.interviewers = interview.value.interviewers?.length ? [...interview.value.interviewers] : ['']
  editErrors.value = {}
  showEditDetails.value = true
}

async function handleSaveDetails() {
  editErrors.value = {}
  if (!editForm.title.trim()) {
    editErrors.value.title = 'Title is required'
    return
  }

  isSavingEdit.value = true
  try {
    const filteredInterviewers = editForm.interviewers.filter(i => i.trim())
    await updateInterview({
      title: editForm.title.trim(),
      type: editForm.type as any,
      location: editForm.location.trim() || null,
      interviewers: filteredInterviewers.length > 0 ? filteredInterviewers : null,
    })
    showEditDetails.value = false
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    editErrors.value.submit = err.data?.statusMessage ?? 'Failed to update'
  } finally {
    isSavingEdit.value = false
  }
}

// ─── Delete ──────────────────────────────────────────────────────
const router = useRouter()
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

async function handleDelete() {
  isDeleting.value = true
  try {
    await deleteInterview()
    await navigateTo(useLocalePath()('/dashboard/interviews'))
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    alert(err.data?.statusMessage ?? 'Failed to delete interview')
  } finally {
    isDeleting.value = false
  }
}

// ─── Email invitation ────────────────────────────────────────────
const showEmailModal = ref(false)

async function handleInvitationSent() {
  showEmailModal.value = false
  await refresh()
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-8">
    <!-- Back link -->
    <NuxtLink
      :to="$localePath('/dashboard/interviews')"
      class="mb-4 inline-flex items-center gap-1 rounded-full border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
    >
      <ArrowLeft class="size-4" />
      Back to Interviews
    </NuxtLink>

    <!-- Loading -->
    <div v-if="fetchStatus === 'pending'" class="flex flex-col items-center justify-center py-20">
      <div class="size-8 rounded-full border-2 border-brand-200 border-t-brand-600 dark:border-brand-800 dark:border-t-brand-400 animate-spin" />
      <p class="mt-3 text-sm text-surface-400">Loading interview…</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-xl border border-danger-200 bg-danger-50 p-5 text-sm text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
    >
      {{ (error as any).statusCode === 404 ? 'Interview not found.' : 'Failed to load interview.' }}
      <NuxtLink :to="$localePath('/dashboard/interviews')" class="underline ml-1">Back to Interviews</NuxtLink>
    </div>

    <!-- Interview detail -->
    <template v-else-if="interview">
      <!-- Header card -->
      <div class="mb-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-4 min-w-0">
            <div
              class="flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
              :class="isUpcoming(interview.scheduledAt)
                ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-500/20 dark:from-brand-500 dark:to-brand-700'
                : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'"
            >
              {{ getCandidateInitials(interview.candidateFirstName, interview.candidateLastName) }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2.5 flex-wrap">
                <h1 class="text-xl font-bold text-surface-900 dark:text-surface-50 truncate">
                  {{ interview.title }}
                </h1>
                <span
                  class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset"
                  :class="statusConfig[interview.status as InterviewStatus]?.class"
                >
                  <span class="size-1.5 rounded-full" :class="statusConfig[interview.status as InterviewStatus]?.dot" />
                  {{ statusConfig[interview.status as InterviewStatus]?.label }}
                </span>
              </div>
              <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-surface-500 dark:text-surface-400">
                <span class="inline-flex items-center gap-1.5">
                  <UserRound class="size-4" />
                  {{ interview.candidateFirstName }} {{ interview.candidateLastName }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <Briefcase class="size-4" />
                  {{ interview.jobTitle }}
                </span>
              </div>
            </div>
          </div>
          <button
            class="cursor-pointer rounded-lg border border-surface-200 dark:border-surface-700 p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-50 dark:hover:text-surface-300 dark:hover:bg-surface-800 transition-all"
            @click="openEditDetails"
          >
            <Pencil class="size-4" />
          </button>
        </div>
        <!-- Invitation status -->
        <div
          v-if="interview.invitationSentAt"
          class="mt-3 flex items-center gap-1.5 text-xs text-success-600 dark:text-success-400"
        >
          <CheckCheck class="size-3.5" />
          Invitation sent {{ formatDate(interview.invitationSentAt) }}
        </div>
      </div>

      <!-- Quick actions -->
      <div
        v-if="allowedTransitions.length > 0"
        class="mb-6 rounded-xl border border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/70 p-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center rounded-full bg-surface-100 dark:bg-surface-800 px-2.5 py-1 text-xs font-medium text-surface-600 dark:text-surface-400">Quick actions</span>
          <button
            v-for="nextStatus in allowedTransitions"
            :key="nextStatus"
            :disabled="isTransitioning"
            class="inline-flex cursor-pointer items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            :class="transitionClasses[nextStatus]"
            @click="handleTransition(nextStatus)"
          >
            <span
              class="mr-2 inline-flex size-1.5 rounded-full"
              :class="nextStatus === 'completed' ? 'bg-success-200' : nextStatus === 'cancelled' ? 'bg-surface-200' : nextStatus === 'no_show' ? 'bg-danger-200' : 'bg-brand-200'"
            />
            {{ nextStatus === 'scheduled' ? 'Re-schedule' : `Mark ${statusConfig[nextStatus]?.label}` }}
          </button>
          <button
            class="inline-flex cursor-pointer items-center rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/30 px-3.5 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-950/50 transition-all duration-150"
            @click="openReschedule"
          >
            <Calendar class="mr-1.5 size-3.5" />
            Reschedule
          </button>
          <button
            v-if="interview.status === 'scheduled'"
            class="inline-flex cursor-pointer items-center rounded-full border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-950/30 px-3.5 py-1.5 text-sm font-medium text-success-700 dark:text-success-300 hover:bg-success-100 dark:hover:bg-success-950/50 transition-all duration-150"
            @click="showEmailModal = true"
          >
            <Mail class="mr-1.5 size-3.5" />
            {{ interview.invitationSentAt ? 'Resend Invitation' : 'Send Invitation' }}
          </button>
        </div>
      </div>

      <!-- Detail cards -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Schedule info -->
        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5">
          <div class="flex items-center gap-2 mb-3">
            <Calendar class="size-4 text-surface-500 dark:text-surface-400" />
            <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Schedule</h2>
          </div>
          <dl class="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt class="text-surface-400">Date & Time</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                {{ formatDateTime(interview.scheduledAt) }}
              </dd>
            </div>
            <div>
              <dt class="text-surface-400">Duration</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">{{ interview.duration }} minutes</dd>
            </div>
            <div>
              <dt class="text-surface-400">Type</dt>
              <dd class="inline-flex items-center gap-1.5 text-surface-700 dark:text-surface-200 font-medium">
                <component :is="typeIcons[interview.type] || Video" class="size-4 text-surface-400" />
                {{ typeLabels[interview.type] ?? interview.type }}
              </dd>
            </div>
            <div v-if="interview.location">
              <dt class="text-surface-400">Location / Link</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium break-all">{{ interview.location }}</dd>
            </div>
          </dl>
        </div>

        <!-- Candidate info -->
        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5">
          <div class="flex items-center gap-2 mb-3">
            <UserRound class="size-4 text-surface-500 dark:text-surface-400" />
            <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Candidate</h2>
          </div>
          <dl class="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt class="text-surface-400">Name</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                {{ interview.candidateFirstName }} {{ interview.candidateLastName }}
              </dd>
            </div>
            <div>
              <dt class="text-surface-400">Email</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">{{ interview.candidateEmail }}</dd>
            </div>
            <div v-if="interview.candidatePhone">
              <dt class="text-surface-400">Phone</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">{{ interview.candidatePhone }}</dd>
            </div>
            <div>
              <dt class="text-surface-400">Job</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">{{ interview.jobTitle }}</dd>
            </div>
          </dl>
        </div>

        <!-- Interviewers -->
        <div v-if="interview.interviewers?.length" class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 md:col-span-2">
          <div class="flex items-center gap-2 mb-3">
            <Users class="size-4 text-surface-500 dark:text-surface-400" />
            <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Interviewers</h2>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(interviewer, idx) in interview.interviewers"
              :key="idx"
              class="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-300"
            >
              <UserRound class="size-3.5 text-surface-400" />
              {{ interviewer }}
            </span>
          </div>
        </div>

        <!-- Timestamps -->
        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 md:col-span-2">
          <dl class="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt class="text-surface-400 inline-flex items-center gap-1"><Clock class="size-3.5" /> Created</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">{{ formatDate(interview.createdAt) }}</dd>
            </div>
            <div>
              <dt class="text-surface-400 inline-flex items-center gap-1"><Clock class="size-3.5" /> Updated</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">{{ formatDate(interview.updatedAt) }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Notes -->
      <div class="mt-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <MessageSquare class="size-4 text-surface-500 dark:text-surface-400" />
            <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Notes</h2>
          </div>
          <button
            v-if="!isEditingNotes"
            class="cursor-pointer text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
            @click="startEditNotes"
          >
            {{ interview.notes ? 'Edit' : 'Add Notes' }}
          </button>
        </div>

        <div v-if="isEditingNotes">
          <textarea
            v-model="notesInput"
            rows="5"
            placeholder="Add notes about this interview — topics to cover, feedback, impressions…"
            class="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-none"
          />
          <div class="flex items-center gap-2 mt-2">
            <button
              :disabled="isSavingNotes"
              class="cursor-pointer rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="saveNotes"
            >
              {{ isSavingNotes ? 'Saving…' : 'Save' }}
            </button>
            <button
              class="cursor-pointer rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="isEditingNotes = false"
            >
              Cancel
            </button>
          </div>
        </div>

        <p
          v-else-if="interview.notes"
          class="text-sm text-surface-600 dark:text-surface-300 whitespace-pre-wrap"
        >
          {{ interview.notes }}
        </p>
        <p v-else class="text-sm text-surface-400 italic">No notes yet.</p>
      </div>

      <!-- Danger zone -->
      <div class="rounded-xl border border-danger-200/60 dark:border-danger-900/40 bg-danger-50/30 dark:bg-danger-950/20 p-5">
        <h3 class="text-sm font-semibold text-danger-700 dark:text-danger-400 mb-1">Danger Zone</h3>
        <p class="text-xs text-danger-600/80 dark:text-danger-400/60 mb-3">Permanently delete this interview. This action cannot be undone.</p>
        <button
          class="cursor-pointer rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-700 transition-colors"
          @click="showDeleteConfirm = true"
        >
          Delete Interview
        </button>
      </div>
    </template>

    <!-- Reschedule Modal -->
    <Teleport to="body">
      <div v-if="showReschedule" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showReschedule = false" />
        <div class="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl shadow-surface-900/10 dark:shadow-black/30 ring-1 ring-surface-200/80 dark:ring-surface-700/60 p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Reschedule Interview</h3>

          <div v-if="rescheduleError" class="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700 dark:border-danger-800 dark:bg-danger-950/40 dark:text-danger-300">
            {{ rescheduleError }}
          </div>

          <form class="space-y-4" @submit.prevent="handleReschedule">
            <div>
              <label for="reschedule-date" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Date <span class="text-danger-500">*</span>
              </label>
              <input
                id="reschedule-date"
                v-model="rescheduleForm.date"
                type="date"
                class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>
            <div>
              <label for="reschedule-time" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Time <span class="text-danger-500">*</span>
              </label>
              <input
                id="reschedule-time"
                v-model="rescheduleForm.time"
                type="time"
                class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>
            <div>
              <label for="reschedule-duration" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Duration (minutes)</label>
              <input
                id="reschedule-duration"
                v-model.number="rescheduleForm.duration"
                type="number"
                min="5"
                max="480"
                class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                class="cursor-pointer rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                @click="showReschedule = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isRescheduling"
                class="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ isRescheduling ? 'Saving…' : 'Reschedule' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Edit Details Modal -->
    <Teleport to="body">
      <div v-if="showEditDetails" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showEditDetails = false" />
        <div class="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl shadow-surface-900/10 dark:shadow-black/30 ring-1 ring-surface-200/80 dark:ring-surface-700/60 p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-5">Edit Interview Details</h3>

          <div v-if="editErrors.submit" class="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700 dark:border-danger-800 dark:bg-danger-950/40 dark:text-danger-300">
            {{ editErrors.submit }}
          </div>

          <form class="space-y-4" @submit.prevent="handleSaveDetails">
            <div>
              <label for="edit-title" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Title <span class="text-danger-500">*</span>
              </label>
              <input
                id="edit-title"
                v-model="editForm.title"
                type="text"
                class="w-full rounded-lg border px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                :class="editErrors.title ? 'border-danger-300' : 'border-surface-300 dark:border-surface-700'"
              />
              <p v-if="editErrors.title" class="mt-1 text-xs text-danger-600">{{ editErrors.title }}</p>
            </div>

            <div>
              <label for="edit-type" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Type</label>
              <select
                id="edit-type"
                v-model="editForm.type"
                class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              >
                <option value="video">Video</option>
                <option value="phone">Phone</option>
                <option value="in_person">In Person</option>
                <option value="technical">Technical</option>
                <option value="panel">Panel</option>
                <option value="take_home">Take Home</option>
              </select>
            </div>

            <div>
              <label for="edit-location" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Location / Link</label>
              <input
                id="edit-location"
                v-model="editForm.location"
                type="text"
                placeholder="Zoom link, office address…"
                class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Interviewers</label>
              <div class="space-y-2">
                <div v-for="(_, idx) in editForm.interviewers" :key="idx" class="flex gap-2">
                  <input
                    v-model="editForm.interviewers[idx]"
                    type="text"
                    placeholder="Interviewer name"
                    class="flex-1 rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                  />
                  <button
                    v-if="editForm.interviewers.length > 1"
                    type="button"
                    class="cursor-pointer rounded-lg border border-surface-300 dark:border-surface-700 p-2 text-surface-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors"
                    @click="editForm.interviewers.splice(idx, 1)"
                  >
                    <X class="size-4" />
                  </button>
                </div>
                <button
                  v-if="editForm.interviewers.length < 20"
                  type="button"
                  class="cursor-pointer text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
                  @click="editForm.interviewers.push('')"
                >
                  + Add interviewer
                </button>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                class="cursor-pointer rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                @click="showEditDetails = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSavingEdit"
                class="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ isSavingEdit ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showDeleteConfirm = false" />
        <div class="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl shadow-surface-900/10 dark:shadow-black/30 ring-1 ring-surface-200/80 dark:ring-surface-700/60 p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Delete Interview</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
            Are you sure you want to delete <strong>{{ interview?.title }}</strong>? This action cannot be undone.
          </p>
          <div class="flex justify-end gap-2">
            <button
              :disabled="isDeleting"
              class="cursor-pointer rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
            <button
              :disabled="isDeleting"
              class="cursor-pointer rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleDelete"
            >
              {{ isDeleting ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Email invitation modal -->
    <InterviewEmailModal
      v-if="showEmailModal && interview"
      :interview="interview"
      @close="showEmailModal = false"
      @sent="handleInvitationSent"
    />
  </div>
</template>
