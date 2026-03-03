import { z } from 'zod'

// ─── Comment schemas ───────────────────────────────────────────────

export const commentTargetTypes = ['candidate', 'application', 'job'] as const

export const createCommentSchema = z.object({
  targetType: z.enum(commentTargetTypes),
  targetId: z.string().uuid(),
  body: z.string().min(1).max(10000),
})

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(10000),
})

export const commentQuerySchema = z.object({
  targetType: z.enum(commentTargetTypes),
  targetId: z.string().uuid(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const commentIdParamSchema = z.object({
  id: z.string().uuid(),
})
