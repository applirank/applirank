import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'
import * as schema from '../database/schema'

type Auth = ReturnType<typeof betterAuth>
let _auth: Auth | undefined

function resolveBetterAuthUrl(): string {
  const explicitUrl = env.BETTER_AUTH_URL?.trim()
  const railwayDomain = env.RAILWAY_PUBLIC_DOMAIN?.trim()
  const hasPreviewDomain = railwayDomain ? railwayDomain.toLowerCase().includes('-pr-') : false
  const hasPrNumber = !!env.RAILWAY_GIT_PR_NUMBER?.trim()
  const isPreview = isRailwayPreviewEnvironment(env.RAILWAY_ENVIRONMENT_NAME) || hasPreviewDomain || hasPrNumber

  if (!isPreview) {
    if (!explicitUrl) {
      throw new Error('BETTER_AUTH_URL is required outside Railway PR/preview environments')
    }

    return explicitUrl
  }

  const prNumber = env.RAILWAY_GIT_PR_NUMBER?.trim()
  if (prNumber) {
    const previewUrl = `https://applirank-applirank-pr-${prNumber}.up.railway.app`
    console.info(`[Applirank] Using Railway PR-derived BETTER_AUTH_URL: ${previewUrl}`)
    return previewUrl
  }

  if (railwayDomain) {
    const previewUrl = `https://${railwayDomain}`
    console.info(`[Applirank] Using Railway public-domain BETTER_AUTH_URL: ${previewUrl}`)
    return previewUrl
  }

  if (explicitUrl) {
    console.info('[Applirank] Using explicit BETTER_AUTH_URL in Railway PR/preview environment')
    return explicitUrl
  }

  throw new Error(
    'Unable to resolve BETTER_AUTH_URL in Railway PR/preview environment. ' +
    'Set RAILWAY_GIT_PR_NUMBER, RAILWAY_PUBLIC_DOMAIN, or BETTER_AUTH_URL.',
  )
}

/**
 * Lazily create the Better Auth instance on first access.
 * Prevents build-time prerendering from crashing when auth env vars
 * aren't available (Railway injects env vars only at deploy time).
 */
function getAuth(): Auth {
  if (!_auth) {
    _auth = betterAuth({
      baseURL: resolveBetterAuthUrl(),
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema,
      }),
      secret: env.BETTER_AUTH_SECRET,
      emailAndPassword: {
        enabled: true,
      },
      plugins: [
        organization(),
      ],
    })
  }
  return _auth
}

/**
 * Lazily-initialized Better Auth instance.
 * The auth configuration is created on first property access — not at import time.
 * This prevents build-time prerendering from failing when BETTER_AUTH_SECRET
 * and BETTER_AUTH_URL aren't available.
 */
export const auth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    const instance = getAuth()
    const value = (instance as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? (value as Function).bind(instance) : value
  },
})
