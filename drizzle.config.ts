import { defineConfig } from 'drizzle-kit'

/**
 * Resolve a valid database URL, with a fallback for Railway PR/preview environments
 * where DATABASE_URL may have an empty hostname due to unresolved variable references.
 * Falls back to individual PG* and RAILWAY_TCP_PROXY_* variables when available.
 */
function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? ''

  try {
    const parsed = new URL(raw)
    if (parsed.hostname) return raw
  }
  catch {
    // fall through to individual-variable reconstruction
  }

  const host = process.env.PGHOST ?? process.env.RAILWAY_TCP_PROXY_DOMAIN ?? ''
  const port = process.env.PGPORT ?? process.env.RAILWAY_TCP_PROXY_PORT ?? '5432'
  const user = process.env.PGUSER ?? 'postgres'
  const password = process.env.PGPASSWORD ?? ''
  const database = process.env.PGDATABASE ?? 'railway'

  if (host) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
  }

  throw new Error(
    `DATABASE_URL is missing a hostname and no PGHOST fallback is available.\n`
    + `Raw DATABASE_URL: "${raw}"\n`
    + `In Railway PR environments, ensure the Postgres service variables are linked to this service.`,
  )
}

export default defineConfig({
  schema: './server/database/schema/index.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
})
