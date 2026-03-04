import { z } from 'zod'

// ─────────────────────────────────────────────
// Public application submission schemas
// ─────────────────────────────────────────────

/** Schema for a single question response in a public application */
const questionResponseSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([
    z.string(),
    z.array(z.string()),
    z.number(),
    z.boolean(),
  ]),
})

/** Schema for public application submission on an open job */
export const publicApplicationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(254),
  phone: z.string().max(50).optional(),
  responses: z.array(questionResponseSchema).default([]),
  /** Optional cover letter text submitted by the candidate */
  coverLetterText: z.string().max(10000).optional(),
  /** Honeypot field — bots fill it, humans don't see it. Validated at runtime in the handler. */
  website: z.string().optional(),
})

/** Route param for public job slug */
export const publicJobSlugSchema = z.object({
  slug: z.string().min(1),
})

/** Route param for public job ID (legacy, used internally) */
export const publicJobIdSchema = z.object({
  id: z.string().min(1),
})

// ─────────────────────────────────────────────
// Public job board query schemas
// ─────────────────────────────────────────────

/** Schema for public job listing query params */
export const publicJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(200).optional(),
  type: z.enum(['full_time', 'part_time', 'contract', 'internship']).optional(),
  location: z.string().min(1).max(200).optional(),
})
