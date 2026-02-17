import { createFeedbackSchema } from '../utils/schemas/feedback'

// ─────────────────────────────────────────────
// Rate limiter: 5 feedback submissions per user per hour
// Uses userId (not IP) since this endpoint requires auth
// ─────────────────────────────────────────────

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 5

const userSubmissions = new Map<string, number[]>()

// Prune stale entries every 2 hours
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of userSubmissions) {
    const active = timestamps.filter((t) => now - t < WINDOW_MS)
    if (active.length === 0) {
      userSubmissions.delete(key)
    } else {
      userSubmissions.set(key, active)
    }
  }
}, WINDOW_MS * 2).unref()

/** GitHub issue label mapping by feedback type. */
const LABEL_MAP = {
  bug: ['bug'],
  feature: ['enhancement'],
} as const

/**
 * POST /api/feedback
 *
 * Creates a GitHub Issue from authenticated user feedback.
 * Requires GITHUB_FEEDBACK_TOKEN and GITHUB_FEEDBACK_REPO env vars.
 * Rate-limited to 5 submissions per user per hour.
 */
export default defineEventHandler(async (event) => {
  // ── Auth guard ──────────────────────────────
  const session = await requireAuth(event)
  const userId = session.user.id
  const userName = session.user.name ?? 'Unknown'
  const userEmail = session.user.email ?? 'Unknown'

  // ── Check env vars are configured ───────────
  if (!env.GITHUB_FEEDBACK_TOKEN || !env.GITHUB_FEEDBACK_REPO) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Feedback is not configured on this instance',
    })
  }

  // ── Per-user rate limiting ──────────────────
  const now = Date.now()
  const timestamps = userSubmissions.get(userId) ?? []
  const activeTimestamps = timestamps.filter((t) => now - t < WINDOW_MS)

  if (activeTimestamps.length >= MAX_REQUESTS) {
    const oldestActive = activeTimestamps[0]!
    const resetSeconds = Math.ceil((oldestActive + WINDOW_MS - now) / 1000)
    setResponseHeaders(event, {
      'X-RateLimit-Limit': String(MAX_REQUESTS),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(resetSeconds),
      'Retry-After': String(resetSeconds),
    })
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many feedback submissions. Please try again later.',
    })
  }

  // ── Validate request body ──────────────────
  const body = await readValidatedBody(event, createFeedbackSchema.parse)

  // ── Build GitHub issue body ─────────────────
  const typeEmoji = body.type === 'bug' ? '🐛' : '💡'
  const typeLabel = body.type === 'bug' ? 'Bug Report' : 'Feature Request'

  const issueBody = [
    `## ${typeEmoji} ${typeLabel}`,
    '',
    body.description,
    '',
    '---',
    '',
    '### Reporter Context',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Reporter** | ${userName} |`,
    `| **Email** | ${userEmail} |`,
    ...(body.currentUrl ? [`| **Page** | ${body.currentUrl} |`] : []),
    `| **Submitted** | ${new Date().toISOString()} |`,
    '',
    '_Submitted via in-app feedback_',
  ].join('\n')

  // ── Create GitHub Issue ─────────────────────
  const [owner, repo] = env.GITHUB_FEEDBACK_REPO.split('/')

  let issueUrl: string
  try {
    const response = await $fetch<{ html_url: string }>(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GITHUB_FEEDBACK_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: {
          title: `[${typeLabel}] ${body.title}`,
          body: issueBody,
          labels: LABEL_MAP[body.type],
        },
      },
    )
    issueUrl = response.html_url
  } catch (err: any) {
    console.error('[feedback] Failed to create GitHub issue:', err.data ?? err.message)
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to submit feedback. Please try again later.',
    })
  }

  // ── Record successful submission for rate limiting ──
  activeTimestamps.push(now)
  userSubmissions.set(userId, activeTimestamps)

  setResponseStatus(event, 201)
  return { issueUrl }
})
