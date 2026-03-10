import { emailTemplate } from '../../database/schema'
import { createEmailTemplateSchema } from '../../utils/schemas/emailTemplate'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { emailTemplate: ['create'] })
  const orgId = session.session.activeOrganizationId

  const body = await readValidatedBody(event, createEmailTemplateSchema.parse)

  const [created] = await db.insert(emailTemplate).values({
    organizationId: orgId,
    name: body.name,
    subject: body.subject,
    body: body.body,
    createdById: session.user.id,
  }).returning()

  if (!created) throw createError({ statusCode: 500, statusMessage: 'Failed to create email template' })

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'created',
    resourceType: 'emailTemplate',
    resourceId: created.id,
    metadata: { name: body.name },
  })

  setResponseStatus(event, 201)
  return created
})
