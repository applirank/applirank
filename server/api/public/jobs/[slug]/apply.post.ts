import { eq, and, asc } from 'drizzle-orm'
import { fileTypeFromBuffer } from 'file-type'
import { job, candidate, application, jobQuestion, questionResponse, document, organization } from '../../../../database/schema'
import { publicApplicationSchema, publicJobSlugSchema } from '../../../../utils/schemas/publicApplication'
import { createPreviewReadOnlyError } from '../../../../utils/previewReadOnly'
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_DOCUMENTS_PER_CANDIDATE,
  MIME_TO_EXTENSION,
  sanitizeFilename,
} from '../../../../utils/schemas/document'

/** Rate limit: max 5 applications per IP per 15 minutes */
const applyRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many applications submitted. Please try again later.',
})

/**
 * POST /api/public/jobs/:slug/apply
 * Public application submission endpoint. No auth required.
 *
 * Supports two content types:
 *   - `application/json` — standard form submission (no files)
 *   - `multipart/form-data` — form with file uploads
 *
 * Security:
 *   - IP-based rate limiting (5 requests per 15 minutes)
 *   - Honeypot field for basic bot detection
 *
 * Flow:
 * 1. Enforce rate limit
 * 2. Validate the job exists and is open (resolve by slug)
 * 3. Parse request body (JSON or multipart)
 * 4. Validate all required custom questions are answered
 * 5. Upsert candidate (deduplicate by email within the org)
 * 6. Create application linking candidate → job
 * 7. Store question responses
 * 8. Upload files to S3 and create document records
 */
export default defineEventHandler(async (event) => {
  // Enforce rate limit before any processing (skip in dev for E2E test stability)
  if (process.env.NODE_ENV === 'production') {
    await applyRateLimit(event)
  }

  const { slug } = await getValidatedRouterParams(event, publicJobSlugSchema.parse)

  // ─────────────────────────────────────────────
  // 1. Detect content type and parse request
  // ─────────────────────────────────────────────

  const contentType = getHeader(event, 'content-type') ?? ''
  const isMultipart = contentType.includes('multipart/form-data')

  let firstName: string
  let lastName: string
  let email: string
  let phone: string | undefined
  let website: string | undefined
  let responseArray: { questionId: string; value: string | string[] | number | boolean }[] = []
  const uploadedFiles: Map<string, { data: Buffer; filename: string; type?: string }> = new Map()

  if (isMultipart) {
    // Parse multipart form data
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({ statusCode: 400, statusMessage: 'No form data received' })
    }

    const fields: Record<string, string> = {}

    for (const part of formData) {
      if (!part.name) continue

      if (part.name.startsWith('file:')) {
        // File field: "file:<questionId>"
        const questionId = part.name.slice(5)
        if (part.data && part.filename) {
          uploadedFiles.set(questionId, {
            data: Buffer.from(part.data),
            filename: part.filename,
            type: part.type,
          })
        }
      } else {
        // Text field
        fields[part.name] = part.data.toString()
      }
    }

    // Parse responses from JSON string before validation
    let rawResponses: unknown[] = []
    if (fields.responses) {
      try {
        rawResponses = JSON.parse(fields.responses)
      } catch {
        throw createError({ statusCode: 400, statusMessage: 'Invalid responses format' })
      }
    }

    // Validate all multipart text fields through the same Zod schema as JSON
    const validated = publicApplicationSchema.parse({
      firstName: fields.firstName?.trim() ?? '',
      lastName: fields.lastName?.trim() ?? '',
      email: fields.email?.trim() ?? '',
      phone: fields.phone?.trim() || undefined,
      website: fields.website || undefined,
      responses: rawResponses,
    })

    firstName = validated.firstName
    lastName = validated.lastName
    email = validated.email
    phone = validated.phone
    website = validated.website
    responseArray = validated.responses
  } else {
    // Standard JSON body
    const body = await readValidatedBody(event, publicApplicationSchema.parse)
    firstName = body.firstName
    lastName = body.lastName
    email = body.email
    phone = body.phone
    website = body.website
    responseArray = body.responses
  }

  // Honeypot check — if the hidden `website` field is filled, silently reject
  if (website) {
    setResponseStatus(event, 200)
    return { success: true }
  }

  // ─────────────────────────────────────────────
  // 2. Fetch the job by slug and verify it's open
  // ─────────────────────────────────────────────

  const existingJob = await db.query.job.findFirst({
    where: and(eq(job.slug, slug), eq(job.status, 'open')),
    columns: { id: true, organizationId: true },
  })

  if (!existingJob) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found or not accepting applications' })
  }

  const orgId = existingJob.organizationId
  const jobId = existingJob.id

  // Demo org is strictly read-only (defense in depth; middleware also blocks this route)
  if (env.DEMO_ORG_SLUG) {
    const [demoOrg] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, env.DEMO_ORG_SLUG))
      .limit(1)

    if (demoOrg?.id === orgId) {
      throw createPreviewReadOnlyError()
    }
  }

  // ─────────────────────────────────────────────
  // 3. Fetch questions and validate responses
  // ─────────────────────────────────────────────

  const questions = await db.query.jobQuestion.findMany({
    where: and(eq(jobQuestion.jobId, jobId), eq(jobQuestion.organizationId, orgId)),
    orderBy: [asc(jobQuestion.displayOrder)],
  })

  const requiredQuestionIds = questions
    .filter((q) => q.required)
    .map((q) => q.id)

  // Check required non-file questions are answered
  const answeredIds = new Set(responseArray.map((r) => r.questionId))

  // For file_upload questions, check if files were provided
  const fileQuestions = questions.filter((q) => q.type === 'file_upload')
  const fileQuestionIds = new Set(fileQuestions.map((q) => q.id))

  const unanswered = requiredQuestionIds.filter((id) => {
    if (fileQuestionIds.has(id)) {
      return !uploadedFiles.has(id)
    }
    return !answeredIds.has(id)
  })

  if (unanswered.length > 0) {
    const unansweredLabels = questions
      .filter((q) => unanswered.includes(q.id))
      .map((q) => q.label)

    throw createError({
      statusCode: 422,
      statusMessage: `Missing required answers: ${unansweredLabels.join(', ')}`,
    })
  }

  // Filter out responses for questions that don't belong to this job
  const validQuestionIds = new Set(questions.map((q) => q.id))
  const validResponses = responseArray.filter((r) => validQuestionIds.has(r.questionId))

  // ─────────────────────────────────────────────
  // 4. Validate uploaded files (MIME via magic bytes, size)
  // ─────────────────────────────────────────────

  for (const [questionId, file] of uploadedFiles) {
    // Only accept files for valid file_upload questions
    if (!fileQuestionIds.has(questionId)) {
      uploadedFiles.delete(questionId)
      continue
    }

    // Check file size
    if (file.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 413,
        statusMessage: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB`,
      })
    }

    // Validate MIME from magic bytes (not Content-Type header)
    const detectedType = await fileTypeFromBuffer(file.data)
    let mimeType = detectedType?.mime

    // file-type can't detect legacy .doc (OLE2 compound documents) — validate magic bytes manually
    if (!mimeType) {
      const OLE2_MAGIC = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])
      if (file.data.length >= 8 && Buffer.compare(file.data.subarray(0, 8), OLE2_MAGIC) === 0) {
        mimeType = 'application/msword'
      }
    }

    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Allowed: PDF, DOC, DOCX',
      })
    }

    // Store the validated MIME type back on the file object
    file.type = mimeType
  }

  // ─────────────────────────────────────────────
  // 5. Upsert candidate — deduplicate by email within this org
  // ─────────────────────────────────────────────

  let existingCandidate = await db.query.candidate.findFirst({
    where: and(
      eq(candidate.organizationId, orgId),
      eq(candidate.email, email.toLowerCase()),
    ),
    columns: { id: true, firstName: true, lastName: true, phone: true },
  })

  let candidateId: string

  if (existingCandidate) {
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (!existingCandidate.firstName) updates.firstName = firstName
    if (!existingCandidate.lastName) updates.lastName = lastName
    if (!existingCandidate.phone && phone) updates.phone = phone

    const [updated] = await db.update(candidate)
      .set(updates)
      .where(eq(candidate.id, existingCandidate.id))
      .returning({ id: candidate.id })

    candidateId = updated!.id
  } else {
    const [created] = await db.insert(candidate).values({
      organizationId: orgId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
    }).returning({ id: candidate.id })

    candidateId = created!.id
  }

  // ─────────────────────────────────────────────
  // 6. Check for duplicate application
  // ─────────────────────────────────────────────

  const existingApplication = await db.query.application.findFirst({
    where: and(
      eq(application.organizationId, orgId),
      eq(application.candidateId, candidateId),
      eq(application.jobId, jobId),
    ),
    columns: { id: true },
  })

  if (existingApplication) {
    throw createError({
      statusCode: 409,
      statusMessage: 'You have already applied to this position',
    })
  }

  // ─────────────────────────────────────────────
  // 7. Create application
  // ─────────────────────────────────────────────

  const [newApplication] = await db.insert(application).values({
    organizationId: orgId,
    candidateId,
    jobId,
    status: 'new',
  }).returning({ id: application.id })

  // ─────────────────────────────────────────────
  // 8. Store question responses
  // ─────────────────────────────────────────────

  if (validResponses.length > 0) {
    await db.insert(questionResponse).values(
      validResponses.map((r) => ({
        organizationId: orgId,
        applicationId: newApplication!.id,
        questionId: r.questionId,
        value: r.value,
      })),
    )
  }

  // ─────────────────────────────────────────────
  // 9. Upload files to S3 and create document records
  // ─────────────────────────────────────────────

  // Enforce per-candidate document limit (same as authenticated upload)
  if (uploadedFiles.size > 0) {
    const existingDocCount = await db.$count(
      document,
      and(
        eq(document.candidateId, candidateId),
        eq(document.organizationId, orgId),
      ),
    )

    if (existingDocCount + uploadedFiles.size > MAX_DOCUMENTS_PER_CANDIDATE) {
      throw createError({
        statusCode: 409,
        statusMessage: `Document limit reached. Maximum ${MAX_DOCUMENTS_PER_CANDIDATE} documents per candidate`,
      })
    }
  }

  const uploadedDocIds: string[] = []

  for (const [questionId, file] of uploadedFiles) {
    const docId = crypto.randomUUID()
    const mimeType = file.type!
    const extension = MIME_TO_EXTENSION[mimeType] ?? 'bin'
    const storageKey = `${orgId}/${candidateId}/${docId}.${extension}`

    // Determine document type from question label heuristics
    const question = questions.find((q) => q.id === questionId)
    const label = question?.label?.toLowerCase() ?? ''
    let docType: 'resume' | 'cover_letter' | 'other' = 'other'
    if (label.includes('resume') || label.includes('cv')) {
      docType = 'resume'
    } else if (label.includes('cover letter')) {
      docType = 'cover_letter'
    }

    try {
      await uploadToS3(storageKey, file.data, mimeType)

      const [created] = await db.insert(document).values({
        id: docId,
        organizationId: orgId,
        candidateId,
        type: docType,
        storageKey,
        originalFilename: sanitizeFilename(file.filename),
        mimeType,
        sizeBytes: file.data.length,
      }).returning({ id: document.id })

      uploadedDocIds.push(created!.id)

      // Store a response linking the file_upload question to the document ID
      await db.insert(questionResponse).values({
        organizationId: orgId,
        applicationId: newApplication!.id,
        questionId,
        value: docId,
      })
    } catch (uploadError) {
      // Clean up orphaned S3 object on DB failure
      try {
        await deleteFromS3(storageKey)
      } catch (cleanupError) {
        console.error('[Reqcore] Failed to clean up orphaned S3 object:', storageKey, cleanupError)
      }
      console.error('[Reqcore] File upload failed during application:', uploadError)
      // Continue processing — don't fail the entire application for a file upload error
    }
  }

  setResponseStatus(event, 201)
  return { success: true }
})
