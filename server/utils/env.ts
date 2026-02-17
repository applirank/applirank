import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.url(),
  S3_ENDPOINT: z.url(),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_REGION: z.string().min(1).default('us-east-1'),
  /** Slug of the demo organization. When set, write operations are blocked for this org. */
  DEMO_ORG_SLUG: z.string().optional(),
  /** Fine-grained GitHub PAT with Issues:write scope. When set (along with GITHUB_FEEDBACK_REPO), enables in-app feedback. */
  GITHUB_FEEDBACK_TOKEN: z.string().min(1).optional(),
  /** GitHub repo in "owner/repo" format for feedback issues. */
  GITHUB_FEEDBACK_REPO: z.string().regex(/^[^/]+\/[^/]+$/, 'Must be in "owner/repo" format').optional(),
})

export const env = envSchema.parse(process.env)
