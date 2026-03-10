import { z } from 'zod'

// ─────────────────────────────────────────────
// Email template validation schemas
// ─────────────────────────────────────────────

/** Allowed placeholder variables for interview invitation templates */
export const TEMPLATE_VARIABLES = [
  'candidateName',
  'candidateFirstName',
  'candidateLastName',
  'candidateEmail',
  'jobTitle',
  'interviewTitle',
  'interviewDate',
  'interviewTime',
  'interviewDuration',
  'interviewType',
  'interviewLocation',
  'interviewers',
  'organizationName',
] as const

const MAX_SUBJECT_LENGTH = 200
const MAX_BODY_LENGTH = 10_000
const MAX_NAME_LENGTH = 100

/** Schema for creating a new email template */
export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(MAX_NAME_LENGTH),
  subject: z.string().min(1, 'Subject line is required').max(MAX_SUBJECT_LENGTH),
  body: z.string().min(1, 'Email body is required').max(MAX_BODY_LENGTH),
})

/** Schema for updating an email template */
export const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  subject: z.string().min(1).max(MAX_SUBJECT_LENGTH).optional(),
  body: z.string().min(1).max(MAX_BODY_LENGTH).optional(),
})

/** Schema for :id route params */
export const emailTemplateIdParamSchema = z.object({
  id: z.string().min(1),
})

/** Schema for sending an interview invitation */
export const sendInterviewInvitationSchema = z.object({
  templateId: z.string().min(1).optional(),
  customSubject: z.string().min(1).max(MAX_SUBJECT_LENGTH).optional(),
  customBody: z.string().min(1).max(MAX_BODY_LENGTH).optional(),
}).refine(
  data => data.templateId || (data.customSubject && data.customBody),
  { message: 'Either a template ID or both custom subject and body are required' },
)

// ─────────────────────────────────────────────
// Pre-made (system) templates
// ─────────────────────────────────────────────

export interface SystemTemplate {
  id: string
  name: string
  subject: string
  body: string
}

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
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
