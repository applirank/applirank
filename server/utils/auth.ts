import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'
import { ac, owner, admin, member } from '~~/shared/permissions'
import { sendOrgInvitationEmail } from './email'
import * as schema from '../database/schema'

type Auth = ReturnType<typeof betterAuth>
let _auth: Auth | undefined

function resolveTrustedOrigins(baseUrl: string): string[] {
  const configuredOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS
  const baseOrigin = new URL(baseUrl)
  const isLocalBase = baseOrigin.hostname === 'localhost' || baseOrigin.hostname === '127.0.0.1'
  const defaultDevOrigins = (import.meta.dev || isLocalBase)
    ? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ]
    : []

  return Array.from(new Set([baseOrigin.origin, ...configuredOrigins, ...defaultDevOrigins]))
}

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

  if (railwayDomain) {
    const previewUrl = `https://${railwayDomain}`
    console.info(`[Reqcore] Using Railway public-domain BETTER_AUTH_URL: ${previewUrl}`)
    return previewUrl
  }

  const prNumber = env.RAILWAY_GIT_PR_NUMBER?.trim()
  if (prNumber) {
    console.warn(
      `[Reqcore] Railway PR number detected (${prNumber}) but RAILWAY_PUBLIC_DOMAIN is missing. ` +
      'Set BETTER_AUTH_URL explicitly or ensure Railway generated domains are enabled.',
    )
  }

  if (explicitUrl) {
    console.info('[Reqcore] Using explicit BETTER_AUTH_URL in Railway PR/preview environment')
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
    const baseURL = resolveBetterAuthUrl()

    _auth = betterAuth({
      baseURL,
      trustedOrigins: resolveTrustedOrigins(baseURL),
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema,
      }),
      secret: env.BETTER_AUTH_SECRET,
      emailAndPassword: {
        enabled: true,
      },
      plugins: [
        organization({
          // ── Access Control ──────────────────────────────────────
          // Declarative RBAC — permissions defined once in shared/permissions.ts,
          // enforced on every API route via requirePermission().
          ac,
          roles: {
            owner,
            admin,
            member,
          },

          // ── Invitation Email ────────────────────────────────────
          // Required for Better Auth's built-in invitation flow.
          // Constructs a link the invitee clicks to accept.
          // Uses Resend when RESEND_API_KEY is configured, otherwise logs to console.
          async sendInvitationEmail(data) {
            const inviteLink = `${baseURL}/auth/accept-invitation/${data.id}`
            await sendOrgInvitationEmail(data, inviteLink)
          },

          // ── Security Hardening ──────────────────────────────────
          // Cancel stale invitations when a new one is sent to the same email.
          cancelPendingInvitationsOnReInvite: true,
          // 48 hours (default) — explicitly stated for auditability.
          invitationExpiresIn: 48 * 60 * 60,
        }),
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
