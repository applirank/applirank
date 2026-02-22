<script setup lang="ts">
import {
  X, User, Calendar, Clock, Hash, MessageSquare, FileText,
  ExternalLink, Mail, Phone, Upload, Download, Eye, Trash2,
  ArrowLeft, AlertTriangle,
} from 'lucide-vue-next'
import { usePreviewReadOnly } from '~/composables/usePreviewReadOnly'

const props = defineProps<{
  applicationId: string
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const { handlePreviewReadOnlyError } = usePreviewReadOnly()

// ─────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────

const activeTab = ref<'overview' | 'documents' | 'responses'>('overview')

// ─────────────────────────────────────────────
// Fetch application detail
// ─────────────────────────────────────────────

const { data: application, status: fetchStatus, refresh } = useFetch(
  () => `/api/applications/${props.applicationId}`,
  {
    key: computed(() => `sidebar-application-${props.applicationId}`),
    headers: useRequestHeaders(['cookie']),
    watch: [() => props.applicationId],
  },
)

// ─────────────────────────────────────────────
// Fetch full candidate detail (for documents)
// ─────────────────────────────────────────────

const candidateId = computed(() => application.value?.candidate?.id ?? null)

const { data: candidateData, refresh: refreshCandidate } = useFetch(
  () => candidateId.value ? `/api/candidates/${candidateId.value}` : null!,
  {
    key: computed(() => `sidebar-candidate-${candidateId.value}`),
    headers: useRequestHeaders(['cookie']),
    watch: [candidateId],
    immediate: false,
  },
)

// Fetch candidate data when application loads
watch(candidateId, (id) => {
  if (id) refreshCandidate()
}, { immediate: true })

const documents = computed(() => candidateData.value?.documents ?? [])

// ─────────────────────────────────────────────
// Status transitions
// ─────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['screening', 'interview', 'rejected'],
  screening: ['interview', 'offer', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [],
  rejected: ['new'],
}

const transitionLabels: Record<string, string> = {
  new: 'Re-open',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Reject',
}

const transitionClasses: Record<string, string> = {
  new: 'border border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800',
  screening: 'bg-info-600 text-white hover:bg-info-700',
  interview: 'bg-warning-600 text-white hover:bg-warning-700',
  offer: 'bg-success-600 text-white hover:bg-success-700',
  hired: 'bg-success-700 text-white hover:bg-success-800',
  rejected: 'bg-danger-600 text-white hover:bg-danger-700',
}

const statusBadgeClasses: Record<string, string> = {
  new: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400',
  screening: 'bg-info-50 text-info-700 dark:bg-info-950 dark:text-info-400',
  interview: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400',
  offer: 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-400',
  hired: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300',
  rejected: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
}

const allowedTransitions = computed(() => {
  if (!application.value) return []
  return STATUS_TRANSITIONS[application.value.status] ?? []
})

const isTransitioning = ref(false)

async function handleTransition(newStatus: string) {
  isTransitioning.value = true
  try {
    await $fetch(`/api/applications/${props.applicationId}`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    await refresh()
    emit('updated')
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    alert(err.data?.statusMessage ?? 'Failed to update status')
  } finally {
    isTransitioning.value = false
  }
}

// ─────────────────────────────────────────────
// Notes editing
// ─────────────────────────────────────────────

const isEditingNotes = ref(false)
const notesInput = ref('')
const isSavingNotes = ref(false)

function startEditNotes() {
  notesInput.value = application.value?.notes ?? ''
  isEditingNotes.value = true
}

async function saveNotes() {
  isSavingNotes.value = true
  try {
    await $fetch(`/api/applications/${props.applicationId}`, {
      method: 'PATCH',
      body: { notes: notesInput.value || null },
    })
    await refresh()
    emit('updated')
    isEditingNotes.value = false
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    alert(err.data?.statusMessage ?? 'Failed to save notes')
  } finally {
    isSavingNotes.value = false
  }
}

// ─────────────────────────────────────────────
// Documents — upload, download, preview, delete
// ─────────────────────────────────────────────

const { uploadDocument, downloadDocument, getPreviewUrl, deleteDocument } = useDocuments()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedDocType = ref<'resume' | 'cover_letter' | 'other'>('resume')
const isUploading = ref(false)
const uploadError = ref<string | null>(null)
const showDocDeleteConfirm = ref<string | null>(null)
const isDeletingDoc = ref(false)

const showPreview = ref(false)
const previewUrl = ref<string | null>(null)
const previewFilename = ref('')
const previewMimeType = ref('')
const previewDocId = ref<string | null>(null)
const isLoadingPreview = ref(false)
const previewError = ref<string | null>(null)

const isPdfPreview = computed(() => previewMimeType.value === 'application/pdf')

const documentTypeLabels: Record<string, string> = {
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  other: 'Other',
}

function triggerFileSelect() {
  fileInput.value?.click()
}

async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !candidateId.value) return

  uploadError.value = null
  isUploading.value = true

  try {
    await uploadDocument(candidateId.value, file, selectedDocType.value)
    await refreshCandidate()
  } catch (err: any) {
    uploadError.value = err.data?.statusMessage ?? err.statusMessage ?? 'Upload failed'
  } finally {
    isUploading.value = false
    input.value = ''
  }
}

async function handlePreview(docId: string, mimeType?: string) {
  // Only PDFs can be previewed inline — for DOC/DOCX, download directly
  if (mimeType && mimeType !== 'application/pdf') {
    await handleDownload(docId)
    return
  }

  previewError.value = null
  showPreview.value = true
  previewDocId.value = docId

  // Find the document name from the loaded data
  const doc = documents.value?.find((d: any) => d.id === docId)
  previewFilename.value = doc?.originalFilename ?? 'Document'
  previewMimeType.value = doc?.mimeType ?? 'application/pdf'

  // Use the API endpoint URL directly — server streams the PDF (same-origin)
  previewUrl.value = getPreviewUrl(docId)
}

function closePreview() {
  showPreview.value = false
  previewUrl.value = null
  previewFilename.value = ''
  previewMimeType.value = ''
  previewDocId.value = null
  previewError.value = null
}

async function handleDownload(docId: string) {
  try {
    await downloadDocument(docId)
  } catch {
    alert('Failed to download document')
  }
}

async function handleDeleteDoc(docId: string) {
  if (!candidateId.value) return
  isDeletingDoc.value = true
  try {
    await deleteDocument(docId, candidateId.value)
    await refreshCandidate()
    showDocDeleteConfirm.value = null
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    alert(err.data?.statusMessage ?? 'Failed to delete document')
  } finally {
    isDeletingDoc.value = false
  }
}

// ─────────────────────────────────────────────
// Escape key to close (layered: preview → delete → sidebar)
// ─────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showPreview.value) {
      closePreview()
    } else if (showDocDeleteConfirm.value) {
      showDocDeleteConfirm.value = null
    } else {
      emit('close')
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// Reset state when switching to a different application
watch(() => props.applicationId, () => {
  isEditingNotes.value = false
  activeTab.value = 'overview'
  uploadError.value = null
  showDocDeleteConfirm.value = null
  closePreview()
})

// ─────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────

function formatResponseValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value ?? '—')
}

const responsesCount = computed(() => application.value?.responses?.length ?? 0)
</script>

<template>
  <Transition name="slide">
    <aside
      v-if="open"
      class="fixed top-0 right-0 z-40 h-full w-[640px] max-w-[calc(100vw-4rem)] border-l border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-xl flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 px-6 py-4 shrink-0">
        <div v-if="application" class="min-w-0 flex-1">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center size-10 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 font-semibold text-sm shrink-0">
              {{ application.candidate.firstName[0] }}{{ application.candidate.lastName[0] }}
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50 truncate">
                {{ application.candidate.firstName }} {{ application.candidate.lastName }}
              </h2>
              <div class="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
                <span class="inline-flex items-center gap-1 truncate">
                  <Mail class="size-3.5 shrink-0" />
                  {{ application.candidate.email }}
                </span>
                <span v-if="application.candidate.phone" class="inline-flex items-center gap-1">
                  <Phone class="size-3.5 shrink-0" />
                  {{ application.candidate.phone }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="min-w-0">
          <h2 class="text-lg font-semibold text-surface-400">Loading…</h2>
        </div>
        <button
          class="rounded-md p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-800 transition-colors shrink-0 ml-3"
          title="Close (Esc)"
          @click="emit('close')"
        >
          <X class="size-5" />
        </button>
      </div>

      <!-- Tabs -->
      <div v-if="application" class="border-b border-surface-200 dark:border-surface-800 px-6 shrink-0">
        <div class="flex gap-1">
          <button
            class="cursor-pointer px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            :class="activeTab === 'overview'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:hover:text-surface-300'"
            @click="activeTab = 'overview'"
          >
            Overview
          </button>
          <button
            class="cursor-pointer px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            :class="activeTab === 'documents'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:hover:text-surface-300'"
            @click="activeTab = 'documents'"
          >
            Documents ({{ documents.length }})
          </button>
          <button
            v-if="responsesCount > 0"
            class="cursor-pointer px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            :class="activeTab === 'responses'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:hover:text-surface-300'"
            @click="activeTab = 'responses'"
          >
            Responses ({{ responsesCount }})
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-6 py-5">
        <!-- Loading -->
        <div v-if="fetchStatus === 'pending'" class="text-center py-12 text-surface-400">
          Loading details…
        </div>

        <template v-else-if="application">

          <!-- ═══════════════════════════════════════ -->
          <!-- OVERVIEW TAB                            -->
          <!-- ═══════════════════════════════════════ -->
          <div v-if="activeTab === 'overview'" class="space-y-5">
            <!-- Status & transitions -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :class="statusBadgeClasses[application.status] ?? 'bg-surface-100 text-surface-600'"
                >
                  {{ application.status }}
                </span>
                <span class="text-sm text-surface-400">
                  Applied {{ new Date(application.createdAt).toLocaleDateString() }}
                </span>
              </div>

              <div v-if="allowedTransitions.length > 0" class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-medium text-surface-500 dark:text-surface-400 mr-0.5">Move to:</span>
                <button
                  v-for="nextStatus in allowedTransitions"
                  :key="nextStatus"
                  :disabled="isTransitioning"
                  class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                  :class="transitionClasses[nextStatus] ?? 'border border-surface-300 text-surface-600 hover:bg-surface-50'"
                  @click="handleTransition(nextStatus)"
                >
                  {{ transitionLabels[nextStatus] ?? nextStatus }}
                </button>
              </div>
            </div>

            <!-- Candidate info -->
            <div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 p-5">
              <div class="flex items-center gap-2 mb-3">
                <User class="size-4 text-surface-500 dark:text-surface-400" />
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Candidate</h3>
              </div>
              <dl class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="text-surface-400">Name</dt>
                  <dd class="text-surface-700 dark:text-surface-200 font-medium">
                    {{ application.candidate.firstName }} {{ application.candidate.lastName }}
                  </dd>
                </div>
                <div>
                  <dt class="text-surface-400">Email</dt>
                  <dd class="text-surface-700 dark:text-surface-200 font-medium truncate">
                    {{ application.candidate.email }}
                  </dd>
                </div>
                <div v-if="application.candidate.phone">
                  <dt class="text-surface-400">Phone</dt>
                  <dd class="text-surface-700 dark:text-surface-200 font-medium">
                    {{ application.candidate.phone }}
                  </dd>
                </div>
              </dl>
            </div>

            <!-- Application details -->
            <div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 p-5">
              <div class="flex items-center gap-2 mb-3">
                <Hash class="size-4 text-surface-500 dark:text-surface-400" />
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Details</h3>
              </div>
              <dl class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="text-surface-400">Score</dt>
                  <dd class="text-surface-700 dark:text-surface-200 font-medium">
                    {{ application.score ?? '—' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-surface-400">Status</dt>
                  <dd class="text-surface-700 dark:text-surface-200 font-medium capitalize">
                    {{ application.status }}
                  </dd>
                </div>
                <div>
                  <dt class="text-surface-400 inline-flex items-center gap-1">
                    <Calendar class="size-3.5" />
                    Applied
                  </dt>
                  <dd class="text-surface-700 dark:text-surface-200 font-medium">
                    {{ new Date(application.createdAt).toLocaleDateString() }}
                  </dd>
                </div>
                <div>
                  <dt class="text-surface-400 inline-flex items-center gap-1">
                    <Clock class="size-3.5" />
                    Updated
                  </dt>
                  <dd class="text-surface-700 dark:text-surface-200 font-medium">
                    {{ new Date(application.updatedAt).toLocaleDateString() }}
                  </dd>
                </div>
              </dl>
            </div>

            <!-- Notes -->
            <div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <MessageSquare class="size-4 text-surface-500 dark:text-surface-400" />
                  <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Notes</h3>
                </div>
                <button
                  v-if="!isEditingNotes"
                  class="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
                  @click="startEditNotes"
                >
                  {{ application.notes ? 'Edit' : 'Add Notes' }}
                </button>
              </div>

              <div v-if="isEditingNotes">
                <textarea
                  v-model="notesInput"
                  rows="4"
                  placeholder="Add notes about this application…"
                  class="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
                <div class="flex items-center gap-2 mt-2">
                  <button
                    :disabled="isSavingNotes"
                    class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                    @click="saveNotes"
                  >
                    {{ isSavingNotes ? 'Saving…' : 'Save' }}
                  </button>
                  <button
                    class="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    @click="isEditingNotes = false"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <p
                v-else-if="application.notes"
                class="text-sm text-surface-600 dark:text-surface-300 whitespace-pre-wrap"
              >
                {{ application.notes }}
              </p>
              <p v-else class="text-sm text-surface-400 italic">No notes yet.</p>
            </div>

            <!-- Quick links -->
            <div class="flex items-center gap-4 pt-1">
              <NuxtLink
                :to="`/dashboard/candidates/${application.candidate.id}`"
                class="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
              >
                <ExternalLink class="size-3.5" />
                Full candidate profile
              </NuxtLink>
              <NuxtLink
                :to="`/dashboard/applications/${application.id}`"
                class="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
              >
                <ExternalLink class="size-3.5" />
                Full application page
              </NuxtLink>
            </div>
          </div>

          <!-- ═══════════════════════════════════════ -->
          <!-- DOCUMENTS TAB                           -->
          <!-- ═══════════════════════════════════════ -->
          <div v-if="activeTab === 'documents'" class="space-y-4">
            <!-- Hidden file input -->
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.doc,.docx"
              class="hidden"
              @change="handleFileSelected"
            />

            <!-- ── Inline PDF preview (replaces document list when active) ── -->
            <template v-if="showPreview">
              <!-- Preview toolbar -->
              <div class="flex items-center justify-between">
                <button
                  class="inline-flex items-center gap-1.5 text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  @click="closePreview"
                >
                  <ArrowLeft class="size-3.5" />
                  Back to documents
                </button>
                <div class="flex items-center gap-1">
                  <button
                    v-if="previewDocId"
                    class="rounded-lg p-1.5 text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    title="Download"
                    @click="handleDownload(previewDocId!)"
                  >
                    <Download class="size-4" />
                  </button>
                </div>
              </div>

              <!-- Filename -->
              <div v-if="previewFilename" class="flex items-center gap-2">
                <FileText class="size-4 text-surface-400 shrink-0" />
                <span class="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">
                  {{ previewFilename }}
                </span>
              </div>

              <!-- Error state -->
              <div
                v-if="previewError"
                class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-6 text-center"
              >
                <AlertTriangle class="size-8 text-danger-400 mx-auto mb-2" />
                <p class="text-sm text-danger-700 dark:text-danger-400">{{ previewError }}</p>
                <button
                  class="mt-3 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
                  @click="closePreview"
                >
                  Go back
                </button>
              </div>

              <!-- PDF iframe — same-origin, server streams the bytes -->
              <iframe
                v-else-if="previewUrl && isPdfPreview"
                :src="previewUrl"
                class="w-full rounded-lg border border-surface-200 dark:border-surface-800"
                style="height: calc(100vh - 280px);"
                title="Document preview"
              />
            </template>

            <!-- ── Document list (normal state) ── -->
            <template v-else>
              <!-- Upload controls -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <select
                    v-model="selectedDocType"
                    class="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-2.5 py-1.5 text-sm text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="resume">Resume</option>
                    <option value="cover_letter">Cover Letter</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button
                  :disabled="isUploading"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  @click="triggerFileSelect"
                >
                  <Upload class="size-3.5" />
                  {{ isUploading ? 'Uploading…' : 'Upload Document' }}
                </button>
              </div>

              <!-- Upload error -->
              <div
                v-if="uploadError"
                class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-3 text-sm text-danger-700 dark:text-danger-400"
              >
                {{ uploadError }}
                <button class="underline ml-1" @click="uploadError = null">Dismiss</button>
              </div>

              <!-- Empty state -->
              <div
                v-if="documents.length === 0"
                class="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 p-8 text-center"
              >
                <FileText class="size-8 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
                <p class="text-sm text-surface-500 dark:text-surface-400">No documents yet.</p>
                <p class="text-xs text-surface-400 mt-1">
                  Upload a resume, cover letter, or other document (PDF, DOC, DOCX — max 10 MB).
                </p>
              </div>

              <!-- Document list -->
              <div v-else class="space-y-2">
                <div
                  v-for="doc in documents"
                  :key="doc.id"
                  class="group flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 px-4 py-3 transition-colors"
                  :class="doc.mimeType === 'application/pdf' ? 'cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-950/30' : ''"
                  @click="doc.mimeType === 'application/pdf' ? handlePreview(doc.id, doc.mimeType) : undefined"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <FileText class="size-4 shrink-0" :class="doc.mimeType === 'application/pdf' ? 'text-danger-500 dark:text-danger-400' : 'text-surface-400'" />
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">
                        {{ doc.originalFilename }}
                      </p>
                      <span class="text-xs text-surface-400">
                        {{ documentTypeLabels[doc.type] ?? doc.type }}
                        · {{ new Date(doc.createdAt).toLocaleDateString() }}
                        <template v-if="doc.mimeType === 'application/pdf'"> · <span class="text-brand-500 dark:text-brand-400">Click to preview</span></template>
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0" @click.stop>
                    <button
                      v-if="doc.mimeType === 'application/pdf'"
                      class="rounded-lg p-1.5 text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      title="Preview PDF"
                      @click="handlePreview(doc.id, doc.mimeType)"
                    >
                      <Eye class="size-4" />
                    </button>
                    <button
                      class="rounded-lg p-1.5 text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      title="Download"
                      @click="handleDownload(doc.id)"
                    >
                      <Download class="size-4" />
                    </button>
                    <button
                      class="rounded-lg p-1.5 text-surface-400 hover:text-danger-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      title="Delete"
                      @click="showDocDeleteConfirm = doc.id"
                    >
                      <Trash2 class="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <!-- ═══════════════════════════════════════ -->
          <!-- RESPONSES TAB                           -->
          <!-- ═══════════════════════════════════════ -->
          <div v-if="activeTab === 'responses'" class="space-y-3">
            <div
              v-if="responsesCount === 0"
              class="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 p-8 text-center"
            >
              <FileText class="size-8 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
              <p class="text-sm text-surface-500 dark:text-surface-400">No application responses.</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="response in application.responses"
                :key="response.id"
                class="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 p-4"
              >
                <dt class="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wide">
                  {{ response.question?.label ?? 'Unknown question' }}
                </dt>
                <dd class="text-sm text-surface-700 dark:text-surface-200">
                  {{ formatResponseValue(response.value) }}
                </dd>
              </div>
            </div>
          </div>

        </template>
      </div>
    </aside>
  </Transition>



  <!-- Document delete confirmation dialog -->
  <Teleport to="body">
    <div v-if="showDocDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showDocDeleteConfirm = null" />
      <div class="relative bg-white dark:bg-surface-900 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">Delete Document</h3>
        <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
          Are you sure you want to delete this document? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <button
            :disabled="isDeletingDoc"
            class="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
            @click="showDocDeleteConfirm = null"
          >
            Cancel
          </button>
          <button
            :disabled="isDeletingDoc"
            class="rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50 transition-colors"
            @click="handleDeleteDoc(showDocDeleteConfirm!)"
          >
            {{ isDeletingDoc ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
