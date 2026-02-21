import { z } from 'zod'

// ─────────────────────────────────────────────
// Feedback — in-app bug reports & feature requests
// ─────────────────────────────────────────────

/** Allowed feedback types — maps to GitHub issue labels. */
export const feedbackTypeSchema = z.enum(['bug', 'feature'])

const MAX_SCREENSHOT_DATA_URL_CHARS = 45000

const screenshotDataUrlSchema = z
  .string()
  .regex(/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/, 'Screenshot must be a valid image data URL')
  .max(MAX_SCREENSHOT_DATA_URL_CHARS, 'Screenshot is too large for GitHub issue body')

const diagnosticsSchema = z.object({
  userAgent: z.string().max(1000).optional(),
  language: z.string().max(50).optional(),
  platform: z.string().max(100).optional(),
  timezone: z.string().max(100).optional(),
  viewport: z.string().max(100).optional(),
  screen: z.string().max(100).optional(),
})

const featureContextSchema = z.object({
  userProblem: z.string().max(1000).optional(),
  desiredWorkflow: z.string().max(1000).optional(),
  expectedImpact: z.string().max(1000).optional(),
})

const bugContextSchema = z.object({
  stepsToReproduce: z.string().max(1500).optional(),
  expectedResult: z.string().max(1000).optional(),
  actualResult: z.string().max(1000).optional(),
})

/** Schema for the POST /api/feedback request body. */
export const createFeedbackSchema = z.object({
  type: feedbackTypeSchema,
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be at most 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be at most 5000 characters'),
  currentUrl: z.url('Current URL must be a valid URL').max(2000).optional(),
  includeReporterContext: z.boolean().default(false),
  includeEmail: z.boolean().default(false),
  includeScreenshot: z.boolean().default(false),
  screenshotDataUrl: screenshotDataUrlSchema.optional(),
  screenshotFileName: z.string().max(255).optional(),
  diagnostics: diagnosticsSchema.optional(),
  featureContext: featureContextSchema.optional(),
  bugContext: bugContextSchema.optional(),
}).superRefine((value, context) => {
  if (value.includeScreenshot && !value.screenshotDataUrl) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Screenshot is required when sharing screenshot is enabled',
      path: ['screenshotDataUrl'],
    })
  }
})
