import { z } from 'zod'
// ─────────────────────────────────────────────
// Interview validation schemas — shared across API routes
// ─────────────────────────────────────────────

const interviewTypes = ['phone', 'video', 'in_person', 'panel', 'technical', 'take_home'] as const
const interviewStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'] as const

/** Schema for creating a new interview */
export const createInterviewSchema = z.object({
  applicationId: z.string().min(1, 'Application is required'),
  title: z.string().min(1, 'Title is required').max(200),
  type: z.enum(interviewTypes).default('video'),
  scheduledAt: z.string().datetime({ message: 'Valid ISO 8601 datetime required' }),
  duration: z.number().int().min(5).max(480).default(60),
  location: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
  interviewers: z.array(z.string().max(200)).max(20).optional(),
  timezone: z.string().max(100).optional(),
  // Notification preferences
  calendarSync: z.boolean().optional(),
  calendarEventTitle: z.string().max(200).optional(),
  calendarEventDescription: z.string().max(5000).optional(),
  calendarAddCandidateAttendee: z.boolean().optional(),
  calendarSendUpdates: z.boolean().optional(),
}).refine(
  data => new Date(data.scheduledAt) > new Date(),
  { message: 'Scheduled date must be in the future', path: ['scheduledAt'] },
)

/** Schema for updating an existing interview */
export const updateInterviewSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(interviewTypes).optional(),
  status: z.enum(interviewStatuses).optional(),
  scheduledAt: z.string().datetime({ message: 'Valid ISO 8601 datetime required' }).optional(),
  duration: z.number().int().min(5).max(480).optional(),
  location: z.string().max(500).nullish(),
  notes: z.string().max(5000).nullish(),
  interviewers: z.array(z.string().max(200)).max(20).nullish(),
  timezone: z.string().max(100).optional(),
}).refine(
  data => !data.scheduledAt || new Date(data.scheduledAt) > new Date(),
  { message: 'Scheduled date must be in the future', path: ['scheduledAt'] },
)

/** Schema for interview list query params */
export const interviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  applicationId: z.string().min(1).optional(),
  jobId: z.string().min(1).optional(),
  status: z.enum(interviewStatuses).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

/** Reusable schema for `:id` route params */
export const interviewIdParamSchema = z.object({
  id: z.string().min(1),
})


