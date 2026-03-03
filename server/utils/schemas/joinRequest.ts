import { z } from 'zod'

/**
 * Schema for creating a join request to an organization.
 */
export const createJoinRequestSchema = z.object({
  organizationId: z.string().min(1).max(256),
  message: z.string().max(500).optional(),
})

/**
 * Schema for searching organizations by slug.
 * Used during the "join org" flow.
 */
export const orgSearchSchema = z.object({
  q: z.string().min(1).max(128),
})
