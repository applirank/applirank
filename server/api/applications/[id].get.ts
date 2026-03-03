import { eq, and } from 'drizzle-orm'
import { application } from '../../database/schema'
import { applicationIdParamSchema } from '../../utils/schemas/application'

/**
 * GET /api/applications/:id
 * Single application detail with related candidate, job, and question responses.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { application: ['read'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, applicationIdParamSchema.parse)

  const result = await db.query.application.findFirst({
    where: and(eq(application.id, id), eq(application.organizationId, orgId)),
    with: {
      candidate: {
        columns: { id: true, firstName: true, lastName: true, email: true, phone: true },
        with: {
          documents: {
            columns: {
              id: true,
              type: true,
              originalFilename: true,
              mimeType: true,
              createdAt: true,
            },
            orderBy: (document, { desc }) => [desc(document.createdAt)],
          },
        },
      },
      job: {
        columns: { id: true, title: true, status: true, slug: true },
      },
      responses: {
        with: {
          question: {
            columns: { id: true, label: true, type: true, options: true },
          },
        },
        orderBy: (r, { asc }) => [asc(r.createdAt)],
      },
    },
  })

  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return result
})
