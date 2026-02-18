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
  /** Use path-style S3 URLs. Required for MinIO (local dev), must be `false` for Railway Buckets / AWS S3. */
  S3_FORCE_PATH_STYLE: z.string().transform(v => v === 'true').default('true'),
  /** IP address of the trusted reverse proxy (e.g., Railway, Cloudflare). When set, X-Forwarded-For is trusted for rate limiting. */
  TRUSTED_PROXY_IP: z.string().min(1).optional(),
  /** Slug of the demo organization. When set, write operations are blocked for this org. */
  DEMO_ORG_SLUG: z.string().optional(),
  /** Fine-grained GitHub PAT with Issues:write scope. When set (along with GITHUB_FEEDBACK_REPO), enables in-app feedback. */
  GITHUB_FEEDBACK_TOKEN: z.string().min(1).optional(),
  /** GitHub repo in "owner/repo" format for feedback issues. */
  GITHUB_FEEDBACK_REPO: z.string().regex(/^[^/]+\/[^/]+$/, 'Must be in "owner/repo" format').optional(),
})

/**
 * Validated environment variables. Uses lazy initialization so the schema
 * is only parsed on first access at runtime — not at import time. This
 * prevents build-time prerendering from failing when env vars aren't
 * available (e.g., Railway injects variables only at deploy time, not
 * during the build phase).
 */
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop: string) {
    // Parse once on first access, then cache for all subsequent reads
    const parsed = (globalThis as Record<string, unknown>).__env ??= envSchema.parse(process.env)
    return (parsed as Record<string, unknown>)[prop]
  },
})
