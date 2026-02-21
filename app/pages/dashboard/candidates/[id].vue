<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2, Mail, Phone, Calendar, Clock, Briefcase, FileText, Plus, Upload, Download, Eye, X, AlertTriangle } from 'lucide-vue-next'
import { z } from 'zod'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

const route = useRoute()
const candidateId = route.params.id as string

const { candidate, status: fetchStatus, error, refresh, updateCandidate, deleteCandidate } = useCandidate(candidateId)

useSeoMeta({
  title: computed(() =>
    candidate.value
      ? `${candidate.value.firstName} ${candidate.value.lastName} — Applirank`
      : 'Candidate — Applirank',
  ),
})

// ─────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────

const activeTab = ref<'applications' | 'documents'>('applications')

// ─────────────────────────────────────────────
// Edit mode
// ─────────────────────────────────────────────

const isEditing = ref(false)
const editForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

function startEdit() {
  if (!candidate.value) return
  editForm.value = {
    firstName: candidate.value.firstName,
    lastName: candidate.value.lastName,
    email: candidate.value.email,
    phone: candidate.value.phone ?? '',
  }
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  editErrors.value = {}
}

const editSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address').max(255),
  phone: z.string().max(50).optional(),
})

const isSaving = ref(false)
const editErrors = ref<Record<string, string>>({})

async function handleSave() {
  const result = editSchema.safeParse(editForm.value)
  if (!result.success) {
    editErrors.value = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString()
      if (field) editErrors.value[field] = issue.message
    }
    return
  }
  editErrors.value = {}

  isSaving.value = true
  try {
    await updateCandidate({
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      email: editForm.value.email,
      phone: editForm.value.phone || null,
    })
    isEditing.value = false
  } catch (err: any) {
    const message = err.data?.statusMessage ?? 'Failed to save changes'
    if (err.statusCode === 409 || err.data?.statusCode === 409) {
      editErrors.value.email = message
    } else {
      alert(message)
    }
  } finally {
    isSaving.value = false
  }
}

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────

const isDeleting = ref(false)
const showDeleteConfirm = ref(false)

async function handleDelete() {
  isDeleting.value = true
  try {
    await deleteCandidate()
  } catch (err: any) {
    alert(err.data?.statusMessage ?? 'Failed to delete candidate')
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

// ─────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────

const applicationStatusClasses: Record<string, string> = {
  new: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400',
  screening: 'bg-info-50 text-info-700 dark:bg-info-950 dark:text-info-400',
  interview: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400',
  offer: 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-400',
  hired: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300',
  rejected: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
}

const documentTypeLabels: Record<string, string> = {
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  other: 'Other',
}

// ─────────────────────────────────────────────
// Apply to job modal
// ─────────────────────────────────────────────

const showApplyModal = ref(false)

function handleApplied() {
  showApplyModal.value = false
  refresh()
}

// ─────────────────────────────────────────────
// Documents — upload, download, delete
// ─────────────────────────────────────────────

const { uploadDocument, downloadDocument, getPreviewUrl, deleteDocument } = useDocuments()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedDocType = ref<'resume' | 'cover_letter' | 'other'>('resume')
const isUploading = ref(false)
const uploadError = ref<string | null>(null)
const showDocDeleteConfirm = ref<string | null>(null)
const isDeletingDoc = ref(false)

// Preview state
const showPreview = ref(false)
const previewUrl = ref<string | null>(null)
const previewFilename = ref('')
const previewMimeType = ref('')
const previewDocId = ref<string | null>(null)
const isLoadingPreview = ref(false)
const previewError = ref<string | null>(null)

/** Whether the current preview file is a PDF (renderable in iframe) */
const isPdfPreview = computed(() => previewMimeType.value === 'application/pdf')

async function handlePreview(docId: string, mimeType?: string) {
  // Only PDFs can be previewed inline — for DOC/DOCX, download directly
  if (mimeType && mimeType !== 'application/pdf') {
    await handleDownload(docId)
    return
  }

  previewError.value = null
  showPreview.value = true
  previewDocId.value = docId

  // Find the document name from the candidate data
  const doc = candidate.value?.documents?.find((d: any) => d.id === docId)
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

function triggerFileSelect() {
  fileInput.value?.click()
}

async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadError.value = null
  isUploading.value = true

  try {
    await uploadDocument(candidateId, file, selectedDocType.value)
  } catch (err: any) {
    const msg = err.data?.statusMessage ?? err.statusMessage ?? 'Upload failed'
    uploadError.value = msg
  } finally {
    isUploading.value = false
    // Reset input so the same file can be re-selected
    input.value = ''
  }
}

async function handleDownload(docId: string) {
  try {
    await downloadDocument(docId)
  } catch {
    alert('Failed to download document')
  }
}

async function handleDeleteDoc(docId: string) {
  isDeletingDoc.value = true
  try {
    await deleteDocument(docId, candidateId)
    showDocDeleteConfirm.value = null
  } catch (err: any) {
    alert(err.data?.statusMessage ?? 'Failed to delete document')
  } finally {
    isDeletingDoc.value = false
  }
}

/** Format bytes into a human-readable string */
function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- Back link -->
    <NuxtLink
      to="/dashboard/candidates"
      class="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-6 transition-colors"
    >
      <ArrowLeft class="size-4" />
      Back to Candidates
    </NuxtLink>

    <!-- Loading -->
    <div v-if="fetchStatus === 'pending'" class="text-center py-12 text-surface-400">
      Loading candidate…
    </div>

    <!-- Error / not found -->
    <div
      v-else-if="error"
      class="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700"
    >
      {{ error.statusCode === 404 ? 'Candidate not found.' : 'Failed to load candidate.' }}
      <NuxtLink to="/dashboard/candidates" class="underline ml-1">Back to Candidates</NuxtLink>
    </div>

    <!-- Candidate detail -->
    <template v-else-if="candidate">
      <!-- VIEW MODE -->
      <div v-if="!isEditing">
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 mb-6">
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50 truncate mb-1">
              {{ candidate.firstName }} {{ candidate.lastName }}
            </h1>
            <div class="flex items-center gap-4 text-sm text-surface-500">
              <span class="inline-flex items-center gap-1">
                <Mail class="size-3.5" />
                {{ candidate.email }}
              </span>
              <span v-if="candidate.phone" class="inline-flex items-center gap-1">
                <Phone class="size-3.5" />
                {{ candidate.phone }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="startEdit"
            >
              <Pencil class="size-3.5" />
              Edit
            </button>
            <button
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-danger-300 dark:border-danger-700 px-3 py-1.5 text-sm font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950 transition-colors"
              @click="showDeleteConfirm = true"
            >
              <Trash2 class="size-3.5" />
              Delete
            </button>
          </div>
        </div>

        <!-- Contact details -->
        <div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 mb-4">
          <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3">Details</h2>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-surface-400">Email</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">{{ candidate.email }}</dd>
            </div>
            <div>
              <dt class="text-surface-400">Phone</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                {{ candidate.phone || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-surface-400 inline-flex items-center gap-1">
                <Calendar class="size-3.5" />
                Created
              </dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                {{ new Date(candidate.createdAt).toLocaleDateString() }}
              </dd>
            </div>
            <div>
              <dt class="text-surface-400 inline-flex items-center gap-1">
                <Clock class="size-3.5" />
                Updated
              </dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                {{ new Date(candidate.updatedAt).toLocaleDateString() }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Tabs -->
        <div class="border-b border-surface-200 dark:border-surface-800 mb-4">
          <div class="flex gap-1">
            <button
              class="cursor-pointer px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
              :class="activeTab === 'applications'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:hover:text-surface-300'"
              @click="activeTab = 'applications'"
            >
              Applications ({{ candidate.applications?.length ?? 0 }})
            </button>
            <button
              class="cursor-pointer px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
              :class="activeTab === 'documents'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:hover:text-surface-300'"
              @click="activeTab = 'documents'"
            >
              Documents ({{ candidate.documents?.length ?? 0 }})
            </button>
          </div>
        </div>

        <!-- Applications tab -->
        <div v-if="activeTab === 'applications'">
          <!-- Apply to Job button -->
          <div class="flex justify-end mb-3">
            <button
              class="inline-flex items-center gap-1.5 rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="showApplyModal = true"
            >
              <Plus class="size-3.5" />
              Apply to Job
            </button>
          </div>

          <div
            v-if="!candidate.applications?.length"
            class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-8 text-center"
          >
            <Briefcase class="size-8 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
            <p class="text-sm text-surface-500 dark:text-surface-400">No applications yet.</p>
          </div>

          <div v-else class="space-y-2">
            <NuxtLink
              v-for="app in candidate.applications"
              :key="app.id"
              :to="`/dashboard/applications/${app.id}`"
              class="flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-3 hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-sm transition-all group"
            >
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-semibold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 transition-colors truncate">
                  {{ app.job.title }}
                </h4>
                <span class="text-xs text-surface-400">
                  Applied {{ new Date(app.createdAt).toLocaleDateString() }}
                </span>
              </div>
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
                :class="applicationStatusClasses[app.status] ?? 'bg-surface-100 text-surface-600'"
              >
                {{ app.status }}
              </span>
            </NuxtLink>
          </div>
        </div>

        <!-- Apply to Job Modal -->
        <ApplyToJobModal
          v-if="showApplyModal"
          :candidate-id="candidateId"
          @close="showApplyModal = false"
          @created="handleApplied"
        />

        <!-- Documents tab -->
        <div v-if="activeTab === 'documents'">
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
            <div class="flex items-center justify-between mb-3">
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
            <div v-if="previewFilename" class="flex items-center gap-2 mb-3">
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
              style="height: 70vh;"
              title="Document preview"
            />
          </template>

          <!-- ── Document list (normal state) ── -->
          <template v-else>
            <!-- Upload controls -->
            <div class="flex items-center justify-between mb-3">
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
              class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-3 text-sm text-danger-700 dark:text-danger-400 mb-3"
            >
              {{ uploadError }}
              <button class="underline ml-1" @click="uploadError = null">Dismiss</button>
            </div>

            <!-- Empty state -->
            <div
              v-if="!candidate.documents?.length"
              class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-8 text-center"
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
                v-for="doc in candidate.documents"
                :key="doc.id"
                class="group flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-3 transition-colors"
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
        </div>
      </div>

      <!-- EDIT MODE -->
      <div v-else>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-6">Edit Candidate</h1>

        <form class="space-y-5" @submit.prevent="handleSave">
          <!-- First Name -->
          <div>
            <label for="edit-firstName" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              First Name <span class="text-danger-500">*</span>
            </label>
            <input
              id="edit-firstName"
              v-model="editForm.firstName"
              type="text"
              class="w-full rounded-lg border px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              :class="editErrors.firstName ? 'border-danger-300' : 'border-surface-300 dark:border-surface-700'"
            />
            <p v-if="editErrors.firstName" class="mt-1 text-xs text-danger-600 dark:text-danger-400">{{ editErrors.firstName }}</p>
          </div>

          <!-- Last Name -->
          <div>
            <label for="edit-lastName" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Last Name <span class="text-danger-500">*</span>
            </label>
            <input
              id="edit-lastName"
              v-model="editForm.lastName"
              type="text"
              class="w-full rounded-lg border px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              :class="editErrors.lastName ? 'border-danger-300' : 'border-surface-300 dark:border-surface-700'"
            />
            <p v-if="editErrors.lastName" class="mt-1 text-xs text-danger-600 dark:text-danger-400">{{ editErrors.lastName }}</p>
          </div>

          <!-- Email -->
          <div>
            <label for="edit-email" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Email <span class="text-danger-500">*</span>
            </label>
            <input
              id="edit-email"
              v-model="editForm.email"
              type="email"
              class="w-full rounded-lg border px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              :class="editErrors.email ? 'border-danger-300' : 'border-surface-300 dark:border-surface-700'"
            />
            <p v-if="editErrors.email" class="mt-1 text-xs text-danger-600 dark:text-danger-400">{{ editErrors.email }}</p>
          </div>

          <!-- Phone -->
          <div>
            <label for="edit-phone" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Phone
            </label>
            <input
              id="edit-phone"
              v-model="editForm.phone"
              type="tel"
              class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              :disabled="isSaving"
              class="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSaving ? 'Saving…' : 'Save Changes' }}
            </button>
            <button
              type="button"
              class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="cancelEdit"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Delete confirmation dialog -->
      <Teleport to="body">
        <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showDeleteConfirm = false" />
          <div class="relative bg-white dark:bg-surface-900 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">Delete Candidate</h3>
            <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
              Are you sure you want to delete <strong>{{ candidate.firstName }} {{ candidate.lastName }}</strong>?
              This will also delete all their applications and documents. This action cannot be undone.
            </p>
            <div class="flex justify-end gap-2">
              <button
                :disabled="isDeleting"
                class="rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                @click="showDeleteConfirm = false"
              >
                Cancel
              </button>
              <button
                :disabled="isDeleting"
                class="rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50 transition-colors"
                @click="handleDelete"
              >
                {{ isDeleting ? 'Deleting…' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>
