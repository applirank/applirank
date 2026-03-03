import { eq, and, desc, ilike, or, sql } from 'drizzle-orm'
import { job } from '../../../database/schema'
import { publicJobsQuerySchema } from '../../../utils/schemas/publicApplication'

/**
 * GET /api/public/jobs
 * Lists all open jobs with pagination, search, and type filter.
 * No auth required — this is the public-facing job board endpoint.
 */
export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, publicJobsQuerySchema.parse)

  const offset = (query.page - 1) * query.limit

  // Always filter to open jobs only
  const conditions = [eq(job.status, 'open')]

  // Optional search — matches title OR location
  if (query.search) {
    // Escape LIKE meta-characters to prevent pattern injection
    const escaped = query.search.replace(/[%_\\]/g, '\\$&')
    const pattern = `%${escaped}%`
    conditions.push(
      or(
        ilike(job.title, pattern),
        ilike(job.location, pattern),
      )!,
    )
  }

  // Optional type filter
  if (query.type) {
    conditions.push(eq(job.type, query.type))
  }

  // Optional location filter
  if (query.location) {
    // Escape LIKE meta-characters to prevent pattern injection
    const escapedLoc = query.location.replace(/[%_\\]/g, '\\$&')
    conditions.push(ilike(job.location, `%${escapedLoc}%`))
  }

  const where = and(...conditions)

  const [data, total] = await Promise.all([
    db.query.job.findMany({
      where,
      limit: query.limit,
      offset,
      orderBy: [desc(job.createdAt)],
      columns: {
        id: true,
        title: true,
        slug: true,
        description: true,
        location: true,
        type: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        salaryUnit: true,
        remoteStatus: true,
        createdAt: true,
      },
      with: {
        organization: {
          columns: { name: true },
        },
      },
    }),
    db.$count(job, where),
  ])

  // Flatten org name into each job object
  const flatData = data.map(({ organization: org, ...j }) => ({
    ...j,
    organizationName: org?.name ?? null,
  }))

  return { data: flatData, total, page: query.page, limit: query.limit }
})
