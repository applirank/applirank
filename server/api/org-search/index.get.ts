import { eq, or, sql } from 'drizzle-orm'
import { organization } from '../../database/schema'
import { orgSearchSchema } from '../../utils/schemas/joinRequest'

/**
 * GET /api/org-search?q=slug
 * Search for organizations by slug (exact match) or name (partial).
 * Requires authentication but NOT an active org (user may not have one).
 *
 * Security:
 *   - Only returns minimal public info (name, slug)
 *   - Exact slug match OR partial name match (case-insensitive)
 *   - Maximum 5 results to prevent enumeration abuse
 *   - LIKE wildcards (%, _) escaped with explicit ESCAPE clause
 */
export default defineEventHandler(async (event) => {
  // ── Authenticate (no org required) ──
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = await getValidatedQuery(event, orgSearchSchema.parse)
  const searchTerm = query.q.trim().toLowerCase()

  if (searchTerm.length < 2) {
    return []
  }

  // Escape LIKE wildcards with backslash and use explicit ESCAPE clause
  const escapedTerm = searchTerm.replace(/[\\%_]/g, '\\$&')
  const likePattern = `%${escapedTerm}%`

  const results = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    })
    .from(organization)
    .where(
      or(
        eq(organization.slug, searchTerm),
        sql`${organization.name} ILIKE ${likePattern} ESCAPE '\\'`,
      ),
    )
    .limit(5)

  return results
})
