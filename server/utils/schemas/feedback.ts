import { z } from 'zod'

// ─────────────────────────────────────────────
// Feedback — in-app bug reports & feature requests
// ─────────────────────────────────────────────

/** Allowed feedback types — maps to GitHub issue labels. */
export const feedbackTypeSchema = z.enum(['bug', 'feature'])

/** Schema for the POST /api/feedback request body. */
export const createFeedbackSchema = z.object({
  type: feedbackTypeSchema,
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be at most 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be at most 5000 characters'),
  currentUrl: z.string().max(2000).optional(),
})
