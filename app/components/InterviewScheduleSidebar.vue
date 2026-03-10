<script setup lang="ts">
import {
  X, Calendar, Clock, MapPin, Users, Video, Phone,
  Building2, Code2, FileText, UsersRound, ChevronLeft, ChevronRight,
  Plus, Minus, AlertCircle,
} from 'lucide-vue-next'

const props = defineProps<{
  applicationId: string
  candidateName: string
  jobTitle: string
}>()

const emit = defineEmits<{
  close: []
  scheduled: []
}>()

// ─── Form state ───────────────────────────────────────────────────
const form = reactive({
  title: '',
  type: 'video' as 'phone' | 'video' | 'in_person' | 'panel' | 'technical' | 'take_home',
  date: '',
  time: '10:00',
  duration: 60,
  location: '',
  notes: '',
  interviewers: [''] as string[],
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const sendInvitationAfter = ref(false)

// Set a sensible default title
// Helper to extract YYYY-MM-DD from a Date object
function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

onMounted(() => {
  form.title = `Interview — ${props.candidateName}`
  // Default date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  form.date = toDateString(tomorrow)
})

// ─── Interview type config ────────────────────────────────────────
const interviewTypes = [
  { value: 'video', label: 'Video Call', icon: Video, color: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40' },
  { value: 'phone', label: 'Phone', icon: Phone, color: 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-950/40' },
  { value: 'in_person', label: 'In Person', icon: Building2, color: 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-950/40' },
  { value: 'technical', label: 'Technical', icon: Code2, color: 'text-info-600 dark:text-info-400 bg-info-50 dark:bg-info-950/40' },
  { value: 'panel', label: 'Panel', icon: UsersRound, color: 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/40' },
  { value: 'take_home', label: 'Take Home', icon: FileText, color: 'text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800/60' },
] as const

// ─── Duration presets ─────────────────────────────────────────────
const durationPresets = [15, 30, 45, 60, 90, 120]

function adjustDuration(delta: number) {
  const next = form.duration + delta
  if (next >= 5 && next <= 480) {
    form.duration = next
  }
}

// ─── Time slots ───────────────────────────────────────────────────
const timeSlots = computed(() => {
  const slots: string[] = []
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
})

// ─── Calendar ─────────────────────────────────────────────────────
const calendarMonth = ref(new Date())

const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday-start

  const days: { date: string; day: number; isCurrentMonth: boolean; isPast: boolean; isToday: boolean }[] = []

  // Padding from previous month
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({
      date: toDateString(d),
      day: d.getDate(),
      isCurrentMonth: false,
      isPast: d < new Date(toDateString(new Date())),
      isToday: false,
    })
  }

  // Current month days
  const today = toDateString(new Date())
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateObj = new Date(year, month, d)
    const dateStr = toDateString(dateObj)
    days.push({
      date: dateStr,
      day: d,
      isCurrentMonth: true,
      isPast: dateStr < today,
      isToday: dateStr === today,
    })
  }

  // Fill to complete grid (6 rows × 7 columns)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({
      date: toDateString(d),
      day: d.getDate(),
      isCurrentMonth: false,
      isPast: false,
      isToday: false,
    })
  }

  return days
})

const calendarMonthLabel = computed(() => {
  return calendarMonth.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

function prevMonth() {
  const d = new Date(calendarMonth.value)
  d.setMonth(d.getMonth() - 1)
  calendarMonth.value = d
}
function nextMonth() {
  const d = new Date(calendarMonth.value)
  d.setMonth(d.getMonth() + 1)
  calendarMonth.value = d
}

function selectDate(date: string) {
  form.date = date
}

// ─── Interviewers ─────────────────────────────────────────────────
function addInterviewer() {
  form.interviewers.push('')
}
function removeInterviewer(idx: number) {
  form.interviewers.splice(idx, 1)
}

// ─── Formatted preview ───────────────────────────────────────────
const formattedDateTime = computed(() => {
  if (!form.date || !form.time) return ''
  const d = new Date(`${form.date}T${form.time}`)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
})

const endTime = computed(() => {
  if (!form.date || !form.time) return ''
  const d = new Date(`${form.date}T${form.time}`)
  d.setMinutes(d.getMinutes() + form.duration)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
})

// ─── Submit ───────────────────────────────────────────────────────
async function handleSubmit() {
  errors.value = {}

  if (!form.title.trim()) errors.value.title = 'Title is required'
  if (!form.date) errors.value.date = 'Date is required'
  if (!form.time) errors.value.time = 'Time is required'

  const scheduledDate = new Date(`${form.date}T${form.time}`)
  if (isNaN(scheduledDate.getTime())) {
    errors.value.date = 'Invalid date/time'
  }

  if (Object.keys(errors.value).length > 0) return

  isSubmitting.value = true
  try {
    const filteredInterviewers = form.interviewers.filter(i => i.trim())

    const created = await $fetch('/api/interviews', {
      method: 'POST',
      body: {
        applicationId: props.applicationId,
        title: form.title.trim(),
        type: form.type,
        scheduledAt: scheduledDate.toISOString(),
        duration: form.duration,
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
        interviewers: filteredInterviewers.length > 0 ? filteredInterviewers : undefined,
      },
    })

    // Optionally send invitation email immediately
    if (sendInvitationAfter.value && created?.id) {
      try {
        await $fetch(`/api/interviews/${created.id}/send-invitation`, {
          method: 'POST',
          body: { templateId: 'system-standard' },
        })
      } catch {
        // Interview was created successfully — don't block on email failure.
        // The user can always resend from the interview detail page.
      }
    }

    await refreshNuxtData('interviews')
    emit('scheduled')
  } catch (err: any) {
    errors.value.submit = err?.data?.statusMessage ?? 'Failed to schedule interview'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="emit('close')" />
      </Transition>

      <!-- Sidebar panel -->
      <Transition
        enter-active-class="transition duration-300 ease-out transform"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-200 ease-in transform"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div class="relative w-full max-w-lg bg-white dark:bg-surface-900 shadow-2xl shadow-surface-900/20 dark:shadow-black/40 overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="shrink-0 border-b border-surface-200/80 dark:border-surface-800/60 px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="min-w-0">
                <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">
                  Schedule Interview
                </h2>
                <p class="mt-0.5 text-sm text-surface-500 dark:text-surface-400 truncate">
                  {{ candidateName }} · {{ jobTitle }}
                </p>
              </div>
              <button
                class="flex items-center justify-center rounded-lg p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:text-surface-500 dark:hover:text-surface-300 dark:hover:bg-surface-800 transition-all cursor-pointer"
                @click="emit('close')"
              >
                <X class="size-5" />
              </button>
            </div>
          </div>

          <!-- Form content -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <!-- Error banner -->
            <div v-if="errors.submit" class="flex items-start gap-2.5 rounded-xl border border-danger-200/80 bg-danger-50 p-3.5 text-sm text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300">
              <AlertCircle class="size-4 shrink-0 mt-0.5" />
              {{ errors.submit }}
            </div>

            <!-- Interview Type -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2.5">
                Interview Type
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="t in interviewTypes"
                  :key="t.value"
                  type="button"
                  class="flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-medium transition-all duration-150 cursor-pointer"
                  :class="form.type === t.value
                    ? 'border-brand-500 bg-brand-50/50 text-brand-700 dark:border-brand-400 dark:bg-brand-950/30 dark:text-brand-300 shadow-sm'
                    : 'border-surface-200 dark:border-surface-700/80 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800/40'"
                  @click="form.type = t.value"
                >
                  <div class="flex size-8 items-center justify-center rounded-lg" :class="t.color">
                    <component :is="t.icon" class="size-4" />
                  </div>
                  {{ t.label }}
                </button>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label for="interview-title" class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1.5">
                Title
              </label>
              <input
                id="interview-title"
                v-model="form.title"
                type="text"
                placeholder="e.g., Technical Interview Round 1"
                class="w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                :class="errors.title ? 'border-danger-300 dark:border-danger-700' : 'border-surface-200 dark:border-surface-700'"
              />
              <p v-if="errors.title" class="mt-1 text-xs text-danger-600 dark:text-danger-400">{{ errors.title }}</p>
            </div>

            <!-- Calendar Date Picker -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2.5">
                <Calendar class="inline size-3.5 mr-1 -mt-0.5" />
                Date
              </label>
              <div class="rounded-xl border border-surface-200 dark:border-surface-700/80 bg-white dark:bg-surface-800/60 overflow-hidden">
                <!-- Month navigation -->
                <div class="flex items-center justify-between px-4 py-2.5 border-b border-surface-100 dark:border-surface-700/60">
                  <button
                    type="button"
                    class="flex items-center justify-center rounded-lg p-1 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-700 transition-all cursor-pointer"
                    @click="prevMonth"
                  >
                    <ChevronLeft class="size-4" />
                  </button>
                  <span class="text-sm font-semibold text-surface-800 dark:text-surface-200">{{ calendarMonthLabel }}</span>
                  <button
                    type="button"
                    class="flex items-center justify-center rounded-lg p-1 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-700 transition-all cursor-pointer"
                    @click="nextMonth"
                  >
                    <ChevronRight class="size-4" />
                  </button>
                </div>

                <!-- Weekday headers -->
                <div class="grid grid-cols-7 text-center border-b border-surface-100 dark:border-surface-700/60">
                  <div v-for="day in ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']" :key="day" class="py-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                    {{ day }}
                  </div>
                </div>

                <!-- Days grid -->
                <div class="grid grid-cols-7 p-1.5 gap-0.5">
                  <button
                    v-for="d in calendarDays"
                    :key="d.date"
                    type="button"
                    :disabled="d.isPast"
                    class="relative flex items-center justify-center rounded-lg py-2 text-sm transition-all duration-100 cursor-pointer"
                    :class="[
                      d.date === form.date
                        ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-500/30'
                        : d.isToday
                          ? 'bg-brand-50 text-brand-700 font-semibold dark:bg-brand-950/40 dark:text-brand-300'
                          : d.isCurrentMonth
                            ? 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/60'
                            : 'text-surface-300 dark:text-surface-600',
                      d.isPast ? 'opacity-40 cursor-not-allowed' : '',
                    ]"
                    @click="!d.isPast && selectDate(d.date)"
                  >
                    {{ d.day }}
                  </button>
                </div>
              </div>
              <p v-if="errors.date" class="mt-1 text-xs text-danger-600 dark:text-danger-400">{{ errors.date }}</p>
            </div>

            <!-- Time Picker -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2.5">
                <Clock class="inline size-3.5 mr-1 -mt-0.5" />
                Time
              </label>
              <div class="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-700/80 bg-white dark:bg-surface-800/60 p-2">
                <button
                  v-for="slot in timeSlots"
                  :key="slot"
                  type="button"
                  class="rounded-lg py-1.5 text-xs font-medium transition-all duration-100 cursor-pointer"
                  :class="form.time === slot
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/60'"
                  @click="form.time = slot"
                >
                  {{ slot }}
                </button>
              </div>
              <p v-if="errors.time" class="mt-1 text-xs text-danger-600 dark:text-danger-400">{{ errors.time }}</p>
            </div>

            <!-- Duration -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2.5">
                Duration
              </label>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    :disabled="form.duration <= 5"
                    class="flex items-center justify-center rounded-lg border border-surface-200 dark:border-surface-700 p-1.5 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    @click="adjustDuration(-15)"
                  >
                    <Minus class="size-3.5" />
                  </button>
                  <span class="w-16 text-center text-sm font-semibold text-surface-800 dark:text-surface-200 tabular-nums">
                    {{ form.duration }} min
                  </span>
                  <button
                    type="button"
                    :disabled="form.duration >= 480"
                    class="flex items-center justify-center rounded-lg border border-surface-200 dark:border-surface-700 p-1.5 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    @click="adjustDuration(15)"
                  >
                    <Plus class="size-3.5" />
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="preset in durationPresets"
                    :key="preset"
                    type="button"
                    class="rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer"
                    :class="form.duration === preset
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                      : 'bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'"
                    @click="form.duration = preset"
                  >
                    {{ preset }}m
                  </button>
                </div>
              </div>
            </div>

            <!-- Location -->
            <div>
              <label for="interview-location" class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1.5">
                <MapPin class="inline size-3.5 mr-1 -mt-0.5" />
                Location / Link
              </label>
              <input
                id="interview-location"
                v-model="form.location"
                type="text"
                placeholder="Zoom link, office address, or phone number"
                class="w-full rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              />
            </div>

            <!-- Interviewers -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2.5">
                <Users class="inline size-3.5 mr-1 -mt-0.5" />
                Interviewers
                <span class="font-normal normal-case tracking-normal text-surface-400 dark:text-surface-500">(optional)</span>
              </label>
              <div class="space-y-2">
                <div v-for="(_, idx) in form.interviewers" :key="idx" class="flex items-center gap-2">
                  <input
                    v-model="form.interviewers[idx]"
                    type="text"
                    :placeholder="`Interviewer ${idx + 1} name`"
                    class="flex-1 rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  />
                  <button
                    v-if="form.interviewers.length > 1"
                    type="button"
                    class="flex items-center justify-center rounded-lg p-1.5 text-surface-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-all cursor-pointer"
                    @click="removeInterviewer(idx)"
                  >
                    <X class="size-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/30 transition-all cursor-pointer"
                  @click="addInterviewer"
                >
                  <Plus class="size-3.5" />
                  Add Interviewer
                </button>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label for="interview-notes" class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1.5">
                Notes
                <span class="font-normal normal-case tracking-normal text-surface-400 dark:text-surface-500">(optional)</span>
              </label>
              <textarea
                id="interview-notes"
                v-model="form.notes"
                rows="3"
                placeholder="Topics to cover, preparation notes…"
                class="w-full rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none"
              />
            </div>
          </div>

          <!-- Footer with preview + submit -->
          <div class="shrink-0 border-t border-surface-200/80 dark:border-surface-800/60 bg-surface-50/80 dark:bg-surface-950/60 px-6 py-4">
            <!-- Preview -->
            <div v-if="form.date && form.time" class="mb-3 rounded-lg bg-white dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/40 px-3.5 py-2.5">
              <p class="text-xs font-medium text-surface-500 dark:text-surface-400 mb-0.5">Scheduled for</p>
              <p class="text-sm font-semibold text-surface-800 dark:text-surface-200">{{ formattedDateTime }}</p>
              <p class="text-xs text-surface-500 dark:text-surface-400">{{ form.duration }} min · ends at {{ endTime }}</p>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                class="flex-1 rounded-xl border border-surface-200 dark:border-surface-700 px-4 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all cursor-pointer"
                @click="emit('close')"
              >
                Cancel
              </button>
              <button
                type="button"
                :disabled="isSubmitting"
                class="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-brand-500/20"
                @click="handleSubmit"
              >
                {{ isSubmitting ? 'Scheduling…' : 'Schedule Interview' }}
              </button>
            </div>

            <!-- Send invitation checkbox -->
            <label class="flex items-center gap-2 mt-3 cursor-pointer group">
              <input
                v-model="sendInvitationAfter"
                type="checkbox"
                class="size-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500/30 cursor-pointer"
              />
              <span class="text-xs text-surface-500 dark:text-surface-400 group-hover:text-surface-700 dark:group-hover:text-surface-300 transition-colors">
                Send invitation email to candidate after scheduling
              </span>
            </label>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
