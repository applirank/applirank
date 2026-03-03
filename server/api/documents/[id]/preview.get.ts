import { eq, and } from 'drizzle-orm'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { document } from '../../../database/schema'

/**
 * GET /api/documents/:id/preview
 *
 * Stream a PDF document directly through the server for inline preview.
 * The PDF bytes are proxied from S3/MinIO so the iframe loads from the
 * same origin — eliminates cross-origin issues with presigned URLs.
 *
 * Security:
 *   - Auth required, org-scoped
 *   - Document must belong to the authenticated org (prevents IDOR)
 *   - Returns 404 for non-existent or cross-org documents (no information leak)
 *   - Only PDFs allowed for inline preview (DOC/DOCX can contain macros)
 *   - Content-Type forced to application/pdf to prevent MIME confusion
 *   - Content-Disposition: inline allows browser rendering
 *   - X-Frame-Options overridden to SAMEORIGIN for this route only
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

  // Only allow inline preview for PDFs — DOC/DOCX can contain macros
  if (doc.mimeType !== 'application/pdf') {
    throw createError({
      statusCode: 415,
      statusMessage: 'Inline preview is only available for PDF files',
    })
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

  // Stream the PDF directly through the server (same-origin for iframe)
  const encodedFilename = encodeURIComponent(doc.originalFilename)

  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    // RFC 5987: ASCII fallback + UTF-8 extended filename for international characters
    'Content-Disposition': `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
    'Cache-Control': 'private, no-store',
    // Override global DENY — allow same-origin framing for preview iframe
    'X-Frame-Options': 'SAMEORIGIN',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Restrictive CSP — prevent a malicious PDF from loading external resources
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
  }

  // Forward Content-Length from S3 so browsers can render the PDF efficiently
  if (s3Response.ContentLength) {
    headers['Content-Length'] = String(s3Response.ContentLength)
  }

  setResponseHeaders(event, headers)

  // Stream the S3 body to the response
  return s3Response.Body.transformToWebStream()
})
