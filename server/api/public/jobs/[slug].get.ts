import { eq, and, asc } from 'drizzle-orm'
import { job, organization } from '../../../database/schema'
import { publicJobSlugSchema } from '../../../utils/schemas/publicApplication'

/**
 * GET /api/public/jobs/:slug
 * Returns job details + custom questions for an open job, resolved by slug.
 * Includes organization name for SEO structured data (Google Jobs).
 * No auth required — this is the public-facing endpoint for applicants.
 */
export default defineEventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, publicJobSlugSchema.parse)

  const result = await db.query.job.findFirst({
    where: and(eq(job.slug, slug), eq(job.status, 'open')),
    columns: {
      id: true,
      title: true,
      slug: true,
      description: true,
      location: true,
      type: true,
      status: true,
      salaryMin: true,
      salaryMax: true,
      salaryCurrency: true,
      salaryUnit: true,
      remoteStatus: true,
      validThrough: true,
      requireResume: true,
      requireCoverLetter: true,
      createdAt: true,
    },
    with: {
      organization: {
        columns: {
          name: true,
          logo: true,
        },
      },
      questions: {
        orderBy: (q, { asc }) => [asc(q.displayOrder), asc(q.createdAt)],
        columns: {
          id: true,
          type: true,
          label: true,
          description: true,
          required: true,
          options: true,
          displayOrder: true,
        },
      },
    },
  })

  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  // Flatten organization name into the response for SEO consumers
  const { organization: org, ...jobData } = result
  return {
    ...jobData,
    organizationName: org?.name ?? null,
    organizationLogo: org?.logo ?? null,
  }
})
