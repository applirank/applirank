import { readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { totalmem, freemem } from 'node:os'
import { sql } from 'drizzle-orm'
import { HeadBucketCommand } from '@aws-sdk/client-s3'

/**
 * GET /api/updates/system
 *
 * Returns system information for the self-hosted instance.
 * Useful for diagnostics and the admin settings panel.
 * Requires authentication.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { version } = await readFile(
    resolve(process.cwd(), 'package.json'),
    'utf-8',
  ).then(JSON.parse) as { version: string }

  // Check database connectivity
  let dbConnected = false
  try {
    await db.execute(sql`SELECT 1`)
    dbConnected = true
  }
  catch {
    dbConnected = false
  }

  // Check S3/MinIO connectivity
  let storageConnected = false
  try {
    await getS3Client().send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }))
    storageConnected = true
  }
  catch {
    storageConnected = false
  }

  // Detect deployment method
  const isDocker = await isRunningInDocker()
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT_NAME

  const totalMem = totalmem()
  const usedMem = totalMem - freemem()

  return {
    version,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    memoryUsage: {
      used: usedMem,
      total: totalMem,
      percentage: Math.round((usedMem / totalMem) * 100),
    },
    database: {
      connected: dbConnected,
    },
    storage: {
      connected: storageConnected,
    },
    deployment: {
      method: isDocker ? 'docker' as const : 'standalone' as const,
      isRailway,
    },
  }
})

async function isRunningInDocker(): Promise<boolean> {
  try {
    await access('/.dockerenv')
    return true
  }
  catch {
    return false
  }
}
