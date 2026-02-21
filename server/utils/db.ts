import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

type DB = PostgresJsDatabase<typeof schema>

let _client: ReturnType<typeof postgres> | undefined
let _db: DB | undefined

/**
 * Lazily create the Drizzle client on first access.
 * Prevents build-time prerendering from crashing when DATABASE_URL
 * isn't available (Railway injects env vars only at deploy time).
 */
function getDB(): DB {
  if (!_db) {
    _client = postgres(env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
    _db = drizzle(_client, { schema })

    // Gracefully close all connections on shutdown.
    // Prevents leaked pools during dev HMR and ensures clean prod teardown.
    function shutdown() {
      _client?.end({ timeout: 5 }).catch(() => {})
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  }
  return _db
}

/**
 * Lazily-initialized Drizzle database client.
 * The connection is created on first property access — not at import time.
 * This prevents build-time prerendering from failing when DATABASE_URL
 * isn't available (e.g., Railway injects variables only at deploy time).
 */
export const db: DB = new Proxy({} as DB, {
  get(_, prop) {
    const instance = getDB()

    if (typeof prop !== 'string') {
      return Reflect.get(instance as object, prop)
    }

    const value = (instance as unknown as Record<string, unknown>)[prop]
    // Bind methods so they keep the correct `this` context
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
