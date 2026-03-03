import { eq, and } from 'drizzle-orm'
import { document } from '../../database/schema'

/**
 * DELETE /api/documents/:id
 *
 * Delete a document from both MinIO and the database.
 *
 * Security:
 *   - Auth required, org-scoped
 *   - Document must belong to the authenticated org (prevents IDOR)
 *   - Returns 404 for non-existent or cross-org documents
 *   - S3 deletion failure is logged but doesn't block DB cleanup
 *     (orphaned S3 objects are less harmful than orphaned DB records)
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { document: ['delete'] })
  const orgId = session.session.activeOrganizationId

  const documentId = getRouterParam(event, 'id')
  if (!documentId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing document ID' })
  }

  // Query scoped by BOTH id AND organizationId — prevents IDOR
  const doc = await db.query.document.findFirst({
    where: and(
      eq(document.id, documentId),
      eq(document.organizationId, orgId),
    ),
    columns: {
      id: true,
      storageKey: true,
    },
  })

  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  // Delete from S3 first — log but don't block on failure
  try {
    await deleteFromS3(doc.storageKey)
  } catch (s3Error) {
    console.error('[Reqcore] Failed to delete S3 object:', doc.storageKey, s3Error)
    // Continue with DB deletion — orphaned S3 objects can be cleaned up later
  }

  // Delete DB record
  await db.delete(document)
    .where(and(
      eq(document.id, doc.id),
      eq(document.organizationId, orgId),
    ))

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'deleted',
    resourceType: 'document',
    resourceId: doc.id,
  })

  setResponseStatus(event, 204)
  return null
})
