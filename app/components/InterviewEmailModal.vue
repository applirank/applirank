<script setup lang="ts">
import {
  X, Mail, Send, ChevronDown, Eye, Pencil, FileText,
  Check, AlertCircle, Plus, Trash2, Save, Sparkles,
} from 'lucide-vue-next'
import type { Interview } from '~/composables/useInterviews'
import type { EmailTemplate } from '~/composables/useEmailTemplates'

const props = defineProps<{
  interview: Interview
}>()

const emit = defineEmits<{
  close: []
  sent: []
}>()

const { templates, createTemplate, deleteTemplate, sendInvitation } = useEmailTemplates()

// ─── System templates (embedded, not from DB) ─────────────────────
const systemTemplates = [
  {
    id: 'system-standard',
    name: 'Standard Interview Invitation',
    subject: 'Interview Invitation: {{jobTitle}} at {{organizationName}}',
    body: `Dear {{candidateName}},

We are pleased to invite you to an interview for the {{jobTitle}} position at {{organizationName}}.

Interview Details:
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Duration: {{interviewDuration}} minutes
- Type: {{interviewType}}
- Location: {{interviewLocation}}

Interviewers: {{interviewers}}

Please confirm your availability by replying to this email. If you need to reschedule, let us know as soon as possible.

We look forward to speaking with you!

Best regards,
{{organizationName}}`,
  },
  {
    id: 'system-friendly',
    name: 'Friendly & Casual',
    subject: "Let's chat! Interview for {{jobTitle}}",
    body: `Hi {{candidateFirstName}},

Great news — we'd love to meet you for the {{jobTitle}} role at {{organizationName}}!

Here are the details:
- When: {{interviewDate}} at {{interviewTime}} ({{interviewDuration}} min)
- How: {{interviewType}}
- Where: {{interviewLocation}}

You'll be speaking with: {{interviewers}}

If this time doesn't work for you, just let us know and we'll find something that does.

Looking forward to it!

The {{organizationName}} Team`,
  },
  {
    id: 'system-technical',
    name: 'Technical Interview',
    subject: 'Technical Interview: {{jobTitle}} — {{organizationName}}',
    body: `Dear {{candidateName}},

Thank you for your interest in the {{jobTitle}} position at {{organizationName}}. We'd like to invite you to a technical interview.

Interview Details:
- Title: {{interviewTitle}}
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Duration: {{interviewDuration}} minutes
- Format: {{interviewType}}
- Location: {{interviewLocation}}

Your interviewer(s): {{interviewers}}

To help you prepare:
- Be ready to discuss your technical experience and problem-solving approach
- You may be asked to write or review code during the session
- Feel free to ask questions about our tech stack and development practices

Please confirm your attendance by replying to this email.

Best regards,
{{organizationName}}`,
  },
]

// ─── State ────────────────────────────────────────────────────────
type Tab = 'template' | 'custom' | 'manage'
const activeTab = ref<Tab>('template')
const selectedTemplateId = ref<string>('system-standard')
const showPreview = ref(false)
const isSending = ref(false)
const sendError = ref('')
const sendSuccess = ref(false)

// Custom email state
const customSubject = ref('')
const customBody = ref('')

// New template form state
const showNewTemplateForm = ref(false)
const newTemplateName = ref('')
const newTemplateSubject = ref('')
const newTemplateBody = ref('')
const isSavingTemplate = ref(false)
const templateSaveError = ref('')

// ─── Computed ─────────────────────────────────────────────────────
const allTemplates = computed(() => [
  ...systemTemplates.map(t => ({ ...t, isSystem: true as const })),
  ...(templates.value ?? []).map(t => ({ ...t, isSystem: false as const })),
])

const selectedTemplate = computed(() =>
  allTemplates.value.find(t => t.id === selectedTemplateId.value),
)

const previewVariables: Record<string, string> = {
  candidateName: `${props.interview.candidateFirstName} ${props.interview.candidateLastName}`,
  candidateFirstName: props.interview.candidateFirstName,
  candidateLastName: props.interview.candidateLastName,
  candidateEmail: props.interview.candidateEmail,
  jobTitle: props.interview.jobTitle,
  interviewTitle: props.interview.title,
  interviewDate: new Date(props.interview.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }),
  interviewTime: new Date(props.interview.scheduledAt).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  }),
  interviewDuration: String(props.interview.duration),
  interviewType: {
    video: 'Video Call', phone: 'Phone Call', in_person: 'In Person',
    technical: 'Technical Interview', panel: 'Panel Interview', take_home: 'Take-Home Assignment',
  }[props.interview.type] ?? props.interview.type,
  interviewLocation: props.interview.location ?? 'To be confirmed',
  interviewers: props.interview.interviewers?.join(', ') ?? 'To be confirmed',
  organizationName: 'Your Organization',
}

function renderPreview(template: string): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in previewVariables ? previewVariables[key]! : match
  })
}

const previewSubject = computed(() => {
  if (activeTab.value === 'custom') return renderPreview(customSubject.value)
  return selectedTemplate.value ? renderPreview(selectedTemplate.value.subject) : ''
})

const previewBody = computed(() => {
  if (activeTab.value === 'custom') return renderPreview(customBody.value)
  return selectedTemplate.value ? renderPreview(selectedTemplate.value.body) : ''
})

// ─── Actions ──────────────────────────────────────────────────────
async function handleSend() {
  sendError.value = ''
  isSending.value = true

  try {
    const payload = activeTab.value === 'custom'
      ? { customSubject: customSubject.value, customBody: customBody.value }
      : { templateId: selectedTemplateId.value }

    await sendInvitation(props.interview.id, payload)
    sendSuccess.value = true
    setTimeout(() => emit('sent'), 1500)
  } catch (err: any) {
    sendError.value = err?.data?.statusMessage ?? err?.message ?? 'Failed to send invitation email'
  } finally {
    isSending.value = false
  }
}

async function handleSaveTemplate() {
  templateSaveError.value = ''
  if (!newTemplateName.value.trim() || !newTemplateSubject.value.trim() || !newTemplateBody.value.trim()) {
    templateSaveError.value = 'All fields are required'
    return
  }

  isSavingTemplate.value = true
  try {
    await createTemplate({
      name: newTemplateName.value.trim(),
      subject: newTemplateSubject.value.trim(),
      body: newTemplateBody.value.trim(),
    })
    showNewTemplateForm.value = false
    newTemplateName.value = ''
    newTemplateSubject.value = ''
    newTemplateBody.value = ''
  } catch (err: any) {
    templateSaveError.value = err?.data?.statusMessage ?? 'Failed to save template'
  } finally {
    isSavingTemplate.value = false
  }
}

async function handleDeleteTemplate(id: string) {
  try {
    await deleteTemplate(id)
    if (selectedTemplateId.value === id) {
      selectedTemplateId.value = 'system-standard'
    }
  } catch {
    // Handled by composable
  }
}

const canSend = computed(() => {
  if (activeTab.value === 'custom') {
    return customSubject.value.trim().length > 0 && customBody.value.trim().length > 0
  }
  return !!selectedTemplateId.value
})

const availableVariables = [
  { key: '{{candidateName}}', desc: 'Full name' },
  { key: '{{candidateFirstName}}', desc: 'First name' },
  { key: '{{jobTitle}}', desc: 'Job title' },
  { key: '{{interviewDate}}', desc: 'Interview date' },
  { key: '{{interviewTime}}', desc: 'Interview time' },
  { key: '{{interviewDuration}}', desc: 'Duration (min)' },
  { key: '{{interviewType}}', desc: 'Interview type' },
  { key: '{{interviewLocation}}', desc: 'Location/link' },
  { key: '{{interviewers}}', desc: 'Interviewer names' },
  { key: '{{organizationName}}', desc: 'Your org name' },
]
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="emit('close')" />

      <!-- Modal -->
      <div class="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl shadow-surface-900/10 dark:shadow-black/30 ring-1 ring-surface-200/80 dark:ring-surface-700/60 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="shrink-0 border-b border-surface-200/80 dark:border-surface-800/60 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="flex size-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
                <Mail class="size-4.5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">
                  Send Interview Invitation
                </h2>
                <p class="text-xs text-surface-500 dark:text-surface-400">
                  to {{ interview.candidateFirstName }} {{ interview.candidateLastName }} · {{ interview.candidateEmail }}
                </p>
              </div>
            </div>
            <button
              class="rounded-lg p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-800 transition-all cursor-pointer"
              @click="emit('close')"
            >
              <X class="size-5" />
            </button>
          </div>
        </div>

        <!-- Success state -->
        <div v-if="sendSuccess" class="flex-1 flex flex-col items-center justify-center py-12 px-6">
          <div class="flex size-14 items-center justify-center rounded-full bg-success-100 dark:bg-success-950/40 mb-4">
            <Check class="size-7 text-success-600 dark:text-success-400" />
          </div>
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1.5">Invitation Sent!</h3>
          <p class="text-sm text-surface-500 dark:text-surface-400 text-center">
            The interview invitation has been sent to {{ interview.candidateEmail }}.
          </p>
        </div>

        <!-- Main content -->
        <template v-else>
          <!-- Tabs -->
          <div class="shrink-0 border-b border-surface-200/80 dark:border-surface-800/60 px-6">
            <div class="flex gap-1">
              <button
                v-for="tab in ([
                  { id: 'template' as Tab, label: 'Choose Template', icon: FileText },
                  { id: 'custom' as Tab, label: 'Custom Email', icon: Pencil },
                  { id: 'manage' as Tab, label: 'Manage Templates', icon: Sparkles },
                ])"
                :key="tab.id"
                class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer -mb-px"
                :class="activeTab === tab.id
                  ? 'border-brand-500 text-brand-700 dark:text-brand-300'
                  : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'"
                @click="activeTab = tab.id"
              >
                <component :is="tab.icon" class="size-3.5" />
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="sendError" class="mx-6 mt-4 flex items-start gap-2.5 rounded-xl border border-danger-200/80 bg-danger-50 p-3.5 text-sm text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300">
            <AlertCircle class="size-4 shrink-0 mt-0.5" />
            {{ sendError }}
          </div>

          <!-- Tab content -->
          <div class="flex-1 overflow-y-auto px-6 py-5">
            <!-- Template Selection Tab -->
            <div v-if="activeTab === 'template'" class="space-y-3">
              <p class="text-xs text-surface-500 dark:text-surface-400 mb-3">
                Select a template to send the interview invitation.
              </p>
              <button
                v-for="t in allTemplates"
                :key="t.id"
                type="button"
                class="w-full text-left rounded-xl border-2 p-4 transition-all duration-150 cursor-pointer"
                :class="selectedTemplateId === t.id
                  ? 'border-brand-500 bg-brand-50/50 dark:border-brand-400 dark:bg-brand-950/20 shadow-sm'
                  : 'border-surface-200 dark:border-surface-700/80 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800/40'"
                @click="selectedTemplateId = t.id"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-semibold text-surface-800 dark:text-surface-200">{{ t.name }}</span>
                  <span v-if="t.isSystem" class="text-[10px] uppercase tracking-wider font-semibold text-surface-400 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">
                    Built-in
                  </span>
                </div>
                <p class="text-xs text-surface-500 dark:text-surface-400 truncate">
                  Subject: {{ t.subject }}
                </p>
              </button>

              <!-- Preview toggle -->
              <div v-if="selectedTemplate" class="mt-4">
                <button
                  type="button"
                  class="flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer"
                  @click="showPreview = !showPreview"
                >
                  <Eye class="size-3.5" />
                  {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
                  <ChevronDown
                    class="size-3.5 transition-transform"
                    :class="showPreview ? 'rotate-180' : ''"
                  />
                </button>
                <div v-if="showPreview" class="mt-3 rounded-xl border border-surface-200 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-800/40 p-4">
                  <div class="mb-2">
                    <span class="text-[10px] uppercase tracking-wider font-semibold text-surface-400">Subject</span>
                    <p class="text-sm font-semibold text-surface-800 dark:text-surface-200">{{ previewSubject }}</p>
                  </div>
                  <div>
                    <span class="text-[10px] uppercase tracking-wider font-semibold text-surface-400">Body</span>
                    <p class="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap mt-1">{{ previewBody }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Custom Email Tab -->
            <div v-else-if="activeTab === 'custom'" class="space-y-4">
              <div>
                <label for="custom-subject" class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1.5">
                  Subject Line
                </label>
                <input
                  id="custom-subject"
                  v-model="customSubject"
                  type="text"
                  placeholder="e.g., Interview Invitation: {{jobTitle}}"
                  class="w-full rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label for="custom-body" class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1.5">
                  Email Body
                </label>
                <textarea
                  id="custom-body"
                  v-model="customBody"
                  rows="10"
                  placeholder="Write your invitation email here. Use {{variables}} for dynamic content..."
                  class="w-full rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none font-mono"
                />
              </div>

              <!-- Variable reference -->
              <div class="rounded-xl border border-surface-200/60 dark:border-surface-700/40 bg-surface-50 dark:bg-surface-800/30 p-3.5">
                <p class="text-[10px] uppercase tracking-wider font-semibold text-surface-400 mb-2">Available Variables</p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="v in availableVariables"
                    :key="v.key"
                    class="inline-flex items-center gap-1 rounded-md bg-brand-50 dark:bg-brand-950/30 px-2 py-1 text-[11px] font-mono text-brand-700 dark:text-brand-300"
                    :title="v.desc"
                  >
                    {{ v.key }}
                  </span>
                </div>
              </div>

              <!-- Preview -->
              <div v-if="customSubject || customBody">
                <button
                  type="button"
                  class="flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer"
                  @click="showPreview = !showPreview"
                >
                  <Eye class="size-3.5" />
                  {{ showPreview ? 'Hide Preview' : 'Preview with Real Data' }}
                </button>
                <div v-if="showPreview" class="mt-3 rounded-xl border border-surface-200 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-800/40 p-4">
                  <div class="mb-2">
                    <span class="text-[10px] uppercase tracking-wider font-semibold text-surface-400">Subject</span>
                    <p class="text-sm font-semibold text-surface-800 dark:text-surface-200">{{ previewSubject }}</p>
                  </div>
                  <div>
                    <span class="text-[10px] uppercase tracking-wider font-semibold text-surface-400">Body</span>
                    <p class="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap mt-1">{{ previewBody }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Manage Templates Tab -->
            <div v-else-if="activeTab === 'manage'" class="space-y-4">
              <div class="flex items-center justify-between">
                <p class="text-xs text-surface-500 dark:text-surface-400">
                  Create and manage reusable email templates for your organization.
                </p>
                <button
                  v-if="!showNewTemplateForm"
                  type="button"
                  class="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-all cursor-pointer"
                  @click="showNewTemplateForm = true"
                >
                  <Plus class="size-3.5" />
                  New Template
                </button>
              </div>

              <!-- New template form -->
              <div v-if="showNewTemplateForm" class="rounded-xl border border-brand-200 dark:border-brand-800/60 bg-brand-50/30 dark:bg-brand-950/20 p-4 space-y-3">
                <h4 class="text-sm font-semibold text-surface-800 dark:text-surface-200">Create Template</h4>
                <div v-if="templateSaveError" class="rounded-lg border border-danger-200 bg-danger-50 p-2.5 text-xs text-danger-700 dark:border-danger-800 dark:bg-danger-950/40 dark:text-danger-300">
                  {{ templateSaveError }}
                </div>
                <input
                  v-model="newTemplateName"
                  type="text"
                  placeholder="Template name"
                  class="w-full rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                />
                <input
                  v-model="newTemplateSubject"
                  type="text"
                  placeholder="Subject line (use {{variables}})"
                  class="w-full rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                />
                <textarea
                  v-model="newTemplateBody"
                  rows="6"
                  placeholder="Email body (use {{variables}} for dynamic content)"
                  class="w-full rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none font-mono"
                />
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all cursor-pointer"
                    @click="showNewTemplateForm = false"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    :disabled="isSavingTemplate"
                    class="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    @click="handleSaveTemplate"
                  >
                    <Save class="size-3" />
                    {{ isSavingTemplate ? 'Saving…' : 'Save Template' }}
                  </button>
                </div>
              </div>

              <!-- Existing custom templates -->
              <div v-if="templates && templates.length > 0" class="space-y-2">
                <h4 class="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Your Templates</h4>
                <div
                  v-for="t in templates"
                  :key="t.id"
                  class="flex items-center justify-between rounded-xl border border-surface-200 dark:border-surface-700/80 bg-white dark:bg-surface-800/40 p-3.5"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">{{ t.name }}</p>
                    <p class="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">{{ t.subject }}</p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 ml-3 rounded-lg p-1.5 text-surface-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:text-danger-400 dark:hover:bg-danger-950/40 transition-all cursor-pointer"
                    @click="handleDeleteTemplate(t.id)"
                  >
                    <Trash2 class="size-3.5" />
                  </button>
                </div>
              </div>

              <div v-else-if="!showNewTemplateForm" class="text-center py-6">
                <p class="text-sm text-surface-400 dark:text-surface-500">No custom templates yet.</p>
                <p class="text-xs text-surface-400 dark:text-surface-500 mt-1">Create one to reuse across interview invitations.</p>
              </div>

              <!-- Variable reference -->
              <div class="rounded-xl border border-surface-200/60 dark:border-surface-700/40 bg-surface-50 dark:bg-surface-800/30 p-3.5">
                <p class="text-[10px] uppercase tracking-wider font-semibold text-surface-400 mb-2">Available Variables</p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="v in availableVariables"
                    :key="v.key"
                    class="inline-flex items-center gap-1 rounded-md bg-brand-50 dark:bg-brand-950/30 px-2 py-1 text-[11px] font-mono text-brand-700 dark:text-brand-300"
                    :title="v.desc"
                  >
                    {{ v.key }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div v-if="activeTab !== 'manage'" class="shrink-0 border-t border-surface-200/80 dark:border-surface-800/60 bg-surface-50/80 dark:bg-surface-950/60 px-6 py-4">
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
                :disabled="!canSend || isSending"
                class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-brand-500/20"
                @click="handleSend"
              >
                <Send class="size-4" />
                {{ isSending ? 'Sending…' : 'Send Invitation' }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
