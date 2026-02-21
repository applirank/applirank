import { eq } from 'drizzle-orm'
import * as schema from '../database/schema'
import { createPreviewReadOnlyError } from '../utils/previewReadOnly'

/**
 * Demo guard middleware — blocks write operations (POST, PATCH, PUT, DELETE)
 * for the demo organization. Only active when DEMO_ORG_SLUG is set in env.
 *
 * Read operations (GET, HEAD, OPTIONS) pass through unaffected.
 * Auth routes (/api/auth/**) are always allowed so users can sign in/out.
 */

// ─────────────────────────────────────────────
// Cache the demo org ID to avoid a DB lookup on every request
// ─────────────────────────────────────────────
let demoOrgId: string | null | undefined // undefined = not yet resolved

const PUBLIC_APPLY_PATH_REGEX = /^\/api\/public\/jobs\/([^/]+)\/apply\/?$/

function throwDemoReadOnlyError(): never {
  throw createPreviewReadOnlyError()
}

async function getDemoOrgId(): Promise<string | null> {
  if (demoOrgId !== undefined) return demoOrgId

  const slug = env.DEMO_ORG_SLUG
  if (!slug) {
    demoOrgId = null
    return null
  }

  const [org] = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.slug, slug))
    .limit(1)

  demoOrgId = org?.id ?? null
  return demoOrgId
}

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Only guard API routes
  if (!path.startsWith('/api/')) return

  // Always allow auth routes (sign-in, sign-out, session, org switch)
  if (path.startsWith('/api/auth/')) return

  // Skip if no demo slug configured
  if (!env.DEMO_ORG_SLUG) return

  // Only guard write operations
  if (!WRITE_METHODS.has(event.method)) return

  const guardedOrgId = await getDemoOrgId()
  if (!guardedOrgId) return

  // Public apply route has no session context, so resolve org by job slug.
  const publicApplyMatch = path.match(PUBLIC_APPLY_PATH_REGEX)
  if (publicApplyMatch) {
    const slug = decodeURIComponent(publicApplyMatch[1] ?? '')
    if (!slug) return

    const [targetJob] = await db
      .select({ organizationId: schema.job.organizationId })
      .from(schema.job)
      .where(eq(schema.job.slug, slug))
      .limit(1)

    if (targetJob?.organizationId === guardedOrgId) {
      throwDemoReadOnlyError()
    }
    return
  }

  // Check if the current session belongs to the demo org
  const session = await auth.api.getSession({ headers: event.headers })
  const activeOrganizationId = session
    ? (session.session as { activeOrganizationId?: string }).activeOrganizationId
    : undefined

  if (!activeOrganizationId) return

  if (activeOrganizationId === guardedOrgId) {
    throwDemoReadOnlyError()
  }
})
