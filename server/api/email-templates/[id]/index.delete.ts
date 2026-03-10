import { and, eq } from 'drizzle-orm'
import { emailTemplate } from '../../../database/schema'
import { emailTemplateIdParamSchema } from '../../../utils/schemas/emailTemplate'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { emailTemplate: ['delete'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, emailTemplateIdParamSchema.parse)

  // Verify the template exists and belongs to this org
  const existing = await db.query.emailTemplate.findFirst({
    where: and(
      eq(emailTemplate.id, id),
      eq(emailTemplate.organizationId, orgId),
    ),
    columns: { id: true },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Email template not found' })
  }

  await db.delete(emailTemplate).where(and(
    eq(emailTemplate.id, id),
    eq(emailTemplate.organizationId, orgId),
  ))

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'deleted',
    resourceType: 'emailTemplate',
    resourceId: id,
  })

  setResponseStatus(event, 204)
  return null
})
