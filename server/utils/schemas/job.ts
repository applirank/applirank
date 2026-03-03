import { z } from 'zod'

export { JOB_STATUS_TRANSITIONS } from '~~/shared/status-transitions'

// ─────────────────────────────────────────────
// Job validation schemas — shared across API routes
// ─────────────────────────────────────────────

/** Schema for creating a new job */
export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(['full_time', 'part_time', 'contract', 'internship']).default('full_time'),
  /** Optional custom slug — if omitted, generated from title */
  slug: z.string().max(80).optional(),
  /** Salary range fields for SEO-rich job postings (Google Jobs) */
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  salaryCurrency: z.string().length(3).optional(),
  salaryUnit: z.enum(['YEAR', 'MONTH', 'HOUR']).optional(),
  /** Remote work status: remote, hybrid, or onsite */
  remoteStatus: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  /** When this job listing expires (required for Google Jobs rich results) */
  validThrough: z.coerce.date().optional(),
})

/** Schema for updating an existing job (all fields optional, includes status) */
export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(['draft', 'open', 'closed', 'archived']).optional(),
})

/** Schema for job list query params */
export const jobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'open', 'closed', 'archived']).optional(),
})

/** Reusable schema for `:id` route params */
export const idParamSchema = z.object({
  id: z.string().min(1),
})

// Status transition rules are now in shared/status-transitions.ts
// and re-exported above for backward compatibility.
