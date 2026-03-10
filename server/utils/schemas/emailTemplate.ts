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
// Pre-made (system) templates — single source of truth in shared/
// ─────────────────────────────────────────────

export { SYSTEM_TEMPLATES } from '~~/shared/system-templates'
export type { SystemTemplate } from '~~/shared/system-templates'
