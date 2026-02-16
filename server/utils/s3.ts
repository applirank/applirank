import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  DeleteBucketPolicyCommand,
} from '@aws-sdk/client-s3'

// ─────────────────────────────────────────────
// S3-compatible client for MinIO document storage
// ─────────────────────────────────────────────

/**
 * S3-compatible client configured for MinIO.
 * Uses `forcePathStyle: true` which is required for MinIO.
 * Credentials come from validated env vars — never hardcoded.
 */
export const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
})

/** The configured bucket name from env */
export const S3_BUCKET = env.S3_BUCKET

/**
 * Upload a file to S3/MinIO.
 *
 * @param key - Server-generated storage key (e.g. `{orgId}/{candidateId}/{docId}.pdf`)
 * @param body - File content as Buffer or Uint8Array
 * @param contentType - Validated MIME type of the file
 */
export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

/**
 * Delete a file from S3/MinIO.
 * Silently succeeds if the object doesn't exist (S3 convention).
 *
 * @param key - The storage key of the object to delete
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }),
  )
}

/**
 * Check if the configured bucket exists.
 * @returns true if the bucket exists and is accessible
 */
export async function bucketExists(): Promise<boolean> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }))
    return true
  } catch {
    return false
  }
}

/**
 * Create the configured bucket if it doesn't exist, then enforce a
 * private-only access policy. Idempotent — safe to call repeatedly.
 *
 * Security: Explicitly denies all anonymous access even if someone
 * manually changes the policy via the MinIO console.
 */
export async function ensureBucketExists(): Promise<void> {
  if (!(await bucketExists())) {
    await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }))
  }

  // Always enforce private policy (idempotent)
  await enforcePrivateBucketPolicy()
}

/**
 * Set the bucket to private by removing any public policy.
 * MinIO buckets are private by default — this ensures no public
 * policy was added manually via the MinIO console.
 *
 * Note: We delete the bucket policy rather than setting a Deny rule
 * because MinIO doesn't support AWS-specific condition keys like
 * `aws:PrincipalType`. A bucket with no policy is private by default.
 */
async function enforcePrivateBucketPolicy(): Promise<void> {
  try {
    await s3Client.send(
      new DeleteBucketPolicyCommand({ Bucket: S3_BUCKET }),
    )
  } catch (error: unknown) {
    // Ignore "no policy exists" errors — that's the desired state
    if (error instanceof Error && 'name' in error && error.name === 'NoSuchBucketPolicy') {
      return
    }
    throw error
  }
}
