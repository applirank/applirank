import { and, eq } from 'drizzle-orm'
import { emailTemplate } from '../../../database/schema'
import { emailTemplateIdParamSchema, updateEmailTemplateSchema } from '../../../utils/schemas/emailTemplate'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { emailTemplate: ['update'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, emailTemplateIdParamSchema.parse)
  const body = await readValidatedBody(event, updateEmailTemplateSchema.parse)

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

  const [updated] = await db.update(emailTemplate)
    .set({ ...body, updatedAt: new Date() })
    .where(and(
      eq(emailTemplate.id, id),
      eq(emailTemplate.organizationId, orgId),
    ))
    .returning()

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'updated',
    resourceType: 'emailTemplate',
    resourceId: id,
  })

  return updated
})
