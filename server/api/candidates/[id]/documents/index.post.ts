import { eq, and } from 'drizzle-orm'
import { fileTypeFromBuffer } from 'file-type'
import { candidate, document } from '../../../../database/schema'
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_DOCUMENTS_PER_CANDIDATE,
  MIME_TO_EXTENSION,
  documentTypeSchema,
  sanitizeFilename,
} from '../../../../utils/schemas/document'

/**
 * POST /api/candidates/:id/documents
 *
 * Upload a document (resume, cover letter, etc.) for a candidate.
 * Accepts multipart/form-data with:
 *   - `file`: the document file (PDF, DOC, DOCX — max 10 MB)
 *   - `type`: document type ("resume" | "cover_letter" | "other")
 *
 * Security:
 *   - Auth required, org-scoped
 *   - Candidate ownership verified (candidate must belong to the authenticated org)
 *   - MIME type validated from file magic bytes (not just Content-Type header)
 *   - Storage key is server-generated (no user-controlled path components)
 *   - Per-candidate document limit enforced
 *   - Orphaned S3 objects cleaned up on DB insert failure
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { document: ['create'] })
  const orgId = session.session.activeOrganizationId

  // ─────────────────────────────────────────────
  // 1. Validate candidate exists and belongs to this org
  // ─────────────────────────────────────────────

  const candidateId = getRouterParam(event, 'id')
  if (!candidateId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing candidate ID' })
  }

  const existingCandidate = await db.query.candidate.findFirst({
    where: and(
      eq(candidate.id, candidateId),
      eq(candidate.organizationId, orgId),
    ),
    columns: { id: true },
  })

  if (!existingCandidate) {
    throw createError({ statusCode: 404, statusMessage: 'Candidate not found' })
  }

  // ─────────────────────────────────────────────
  // 2. Read multipart form data
  // ─────────────────────────────────────────────

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No form data received' })
  }

  const filePart = formData.find((part) => part.name === 'file')
  const typePart = formData.find((part) => part.name === 'type')

  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  // ─────────────────────────────────────────────
  // 3. Validate document type
  // ─────────────────────────────────────────────

  const typeValue = typePart?.data?.toString() ?? 'resume'
  const typeResult = documentTypeSchema.safeParse(typeValue)
  if (!typeResult.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid document type. Must be: resume, cover_letter, or other' })
  }
  const documentType = typeResult.data

  // ─────────────────────────────────────────────
  // 4. Validate file size
  // ─────────────────────────────────────────────

  const fileBuffer = filePart.data
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 413,
      statusMessage: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB`,
    })
  }

  // ─────────────────────────────────────────────
  // 5. Validate MIME type from magic bytes (not just Content-Type header)
  // ─────────────────────────────────────────────

  const detectedType = await fileTypeFromBuffer(fileBuffer)
  let mimeType = detectedType?.mime

  // file-type can't detect legacy .doc (OLE2 compound documents) — validate magic bytes manually
  if (!mimeType) {
    const OLE2_MAGIC = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])
    if (fileBuffer.length >= 8 && Buffer.compare(fileBuffer.subarray(0, 8), OLE2_MAGIC) === 0) {
      mimeType = 'application/msword'
    }
  }

  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file type. Allowed: PDF, DOC, DOCX',
    })
  }

  // ─────────────────────────────────────────────
  // 6. Check per-candidate document limit
  // ─────────────────────────────────────────────

  const existingDocCount = await db.$count(
    document,
    and(
      eq(document.candidateId, candidateId),
      eq(document.organizationId, orgId),
    ),
  )

  if (existingDocCount >= MAX_DOCUMENTS_PER_CANDIDATE) {
    throw createError({
      statusCode: 409,
      statusMessage: `Document limit reached. Maximum ${MAX_DOCUMENTS_PER_CANDIDATE} documents per candidate`,
    })
  }

  // ─────────────────────────────────────────────
  // 7. Generate safe storage key and upload to S3
  // ─────────────────────────────────────────────

  const documentId = crypto.randomUUID()
  const extension = MIME_TO_EXTENSION[mimeType] ?? 'bin'
  const storageKey = `${orgId}/${candidateId}/${documentId}.${extension}`

  await uploadToS3(storageKey, fileBuffer, mimeType)

  // ─────────────────────────────────────────────
  // 8. Insert DB record — clean up S3 on failure
  // ─────────────────────────────────────────────

  try {
    const [created] = await db.insert(document).values({
      id: documentId,
      organizationId: orgId,
      candidateId,
      type: documentType,
      storageKey,
      originalFilename: sanitizeFilename(filePart.filename),
      mimeType,
      sizeBytes: fileBuffer.length,
    }).returning({
      id: document.id,
      type: document.type,
      originalFilename: document.originalFilename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      createdAt: document.createdAt,
    })

    if (!created) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create document' })
    }

    recordActivity({
      organizationId: orgId,
      actorId: session.user.id,
      action: 'created',
      resourceType: 'document',
      resourceId: created.id,
      metadata: { candidateId, filename: created.originalFilename, type: created.type },
    })

    setResponseStatus(event, 201)
    return created
  } catch (dbError) {
    // Clean up the orphaned S3 object if DB insert fails
    try {
      await deleteFromS3(storageKey)
    } catch (cleanupError) {
      console.error('[Reqcore] Failed to clean up orphaned S3 object:', storageKey, cleanupError)
    }
    throw dbError
  }
})
