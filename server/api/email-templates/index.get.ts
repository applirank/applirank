import { eq } from 'drizzle-orm'
import { emailTemplate } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { emailTemplate: ['read'] })
  const orgId = session.session.activeOrganizationId

  const templates = await db.query.emailTemplate.findMany({
    where: eq(emailTemplate.organizationId, orgId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  return templates
})
