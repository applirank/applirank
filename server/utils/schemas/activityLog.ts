import { z } from 'zod'

export const activityLogQuerySchema = z.object({
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})
