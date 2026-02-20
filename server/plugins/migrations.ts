import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from '../utils/db'

export default defineNitroPlugin(async () => {
  // Skip during build-time prerendering — database isn't available
  if (import.meta.prerender) return

  // Railway handles schema sync via preDeploy commands.
  // Running runtime migrations there can conflict with drizzle-kit push/migrate.
  if (process.env.RAILWAY_ENVIRONMENT_ID) {
    console.log('[Applirank] Skipping runtime migrations on Railway (handled in preDeploy)')
    return
  }

  // Advisory lock ID — prevents concurrent migration runs across instances.
  // The lock is automatically released when the transaction/session ends.
  const MIGRATION_LOCK_ID = 123456789

  try {
    // pg_try_advisory_lock returns true if lock acquired, false if another process holds it
    const [{ locked }] = await db.execute<{ locked: boolean }>(
      `SELECT pg_try_advisory_lock(${MIGRATION_LOCK_ID}) as locked`
    )

    if (!locked) {
      console.log('[Applirank] Another instance is running migrations, skipping')
      return
    }

    console.log('[Applirank] Running database migrations...')
    // Suppress harmless NOTICE messages (e.g. "schema already exists, skipping")
    await db.execute(`SET client_min_messages TO warning`)
    await migrate(db, {
      migrationsFolder: './server/database/migrations',
    })
    await db.execute(`SET client_min_messages TO notice`)
    console.log('[Applirank] Database migrations applied successfully')
  } catch (error) {
    console.error('[Applirank] Migration failed:', error)
    throw error
  } finally {
    await db.execute(
      `SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID})`
    ).catch(() => {})
  }
})
