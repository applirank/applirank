import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

interface BackupResult {
  success: boolean
  message: string
  filename?: string
}

/**
 * POST /api/updates/backup
 *
 * Creates a PostgreSQL database backup before applying updates.
 * Backups are stored in /data/backups/ which should be mapped to a
 * Docker volume for persistence. Falls back to /tmp/ if the
 * directory cannot be created.
 *
 * Requires authentication (owner only).
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, { organization: ['delete'] })

  const { mkdir, writeFile, unlink } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const backupDir = '/data/backups'
  let effectiveDir = backupDir
  try {
    await mkdir(backupDir, { recursive: true })
    // Probe actual write access — mkdir succeeds even on read-only mounts
    const probe = join(backupDir, `.probe-${Date.now()}`)
    await writeFile(probe, '')
    await unlink(probe)
  }
  catch {
    // Fall back to /tmp if /data/backups is not writable (e.g. non-Docker)
    effectiveDir = '/tmp'
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `reqcore-backup-${timestamp}.sql`
  const backupPath = `${effectiveDir}/${filename}`

  try {
    // Extract connection details from DATABASE_URL
    const dbUrl = new URL(env.DATABASE_URL)
    const host = dbUrl.hostname
    const port = dbUrl.port || '5432'
    const user = dbUrl.username
    const database = dbUrl.pathname.slice(1)

    await execFileAsync(
      'pg_dump',
      ['-h', host, '-p', port, '-U', user, '-d', database, '--no-owner', '--no-acl', '-f', backupPath],
      {
        timeout: 300_000,
        env: { ...process.env, PGPASSWORD: dbUrl.password },
      },
    )

    return {
      success: true,
      message: `Database backup created successfully at ${backupPath}`,
      filename,
    } satisfies BackupResult
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      message: `Backup failed: ${message}. You can create a manual backup using: docker compose exec db pg_dump -U reqcore reqcore > backup.sql`,
    } satisfies BackupResult
  }
})
