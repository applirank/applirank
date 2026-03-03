import { eq, and } from 'drizzle-orm'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { document } from '../../../database/schema'

/**
 * GET /api/documents/:id/download
 *
 * Stream a document directly through the server for authenticated download.
 * The file bytes are proxied from S3/MinIO so presigned URLs are never
 * exposed to the client — eliminates the risk of URL sharing/leaking.
 *
 * Security:
 *   - Auth required, org-scoped
 *   - Document must belong to the authenticated org (prevents IDOR)
 *   - Returns 404 for non-existent or cross-org documents (no information leak)
 *   - Content-Disposition: attachment forces download (prevents inline rendering)
 *   - No presigned URLs — S3 credentials never leave the server
 *   - Cache-Control: no-store prevents caching of sensitive documents
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { document: ['read'] })
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
      storageKey: true,
      originalFilename: true,
      mimeType: true,
    },
  })

  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  // Fetch the object from S3
  const s3Response = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: doc.storageKey,
    }),
  )

  if (!s3Response.Body) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve document' })
  }

  // Stream the file directly through the server — no presigned URLs exposed
  const encodedFilename = encodeURIComponent(doc.originalFilename)

  const headers: Record<string, string> = {
    'Content-Type': doc.mimeType,
    // RFC 5987: ASCII fallback + UTF-8 extended filename for international characters
    'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  }

  // Forward Content-Length from S3 so browsers can show download progress
  if (s3Response.ContentLength) {
    headers['Content-Length'] = String(s3Response.ContentLength)
  }

  setResponseHeaders(event, headers)

  // Stream the S3 body to the response
  return s3Response.Body.transformToWebStream()
})
