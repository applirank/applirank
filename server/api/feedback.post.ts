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
  bug: ['bug', 'source:in-app'],
  feature: ['enhancement', 'source:in-app'],
} as const

const MAX_GITHUB_ISSUE_BODY_CHARS = 60000

function normalizeSingleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function escapeMarkdownTableValue(value: string): string {
  return normalizeSingleLine(value)
    .replace(/\|/g, '\\|')
}

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

  const reporterRows = [
    ...(body.includeReporterContext ? [`| **Reporter** | ${escapeMarkdownTableValue(userName)} |`] : []),
    ...(body.includeEmail ? [`| **Email** | ${escapeMarkdownTableValue(userEmail)} |`] : []),
    ...(body.includeReporterContext && body.currentUrl ? [`| **Page** | ${escapeMarkdownTableValue(body.currentUrl)} |`] : []),
    `| **Submitted** | ${new Date().toISOString()} |`,
  ]

  const diagnosticsRows = body.diagnostics
    ? [
        `| **User Agent** | ${escapeMarkdownTableValue(body.diagnostics.userAgent ?? 'Not shared')} |`,
        `| **Language** | ${escapeMarkdownTableValue(body.diagnostics.language ?? 'Not shared')} |`,
        `| **Platform** | ${escapeMarkdownTableValue(body.diagnostics.platform ?? 'Not shared')} |`,
        `| **Timezone** | ${escapeMarkdownTableValue(body.diagnostics.timezone ?? 'Not shared')} |`,
        `| **Viewport** | ${escapeMarkdownTableValue(body.diagnostics.viewport ?? 'Not shared')} |`,
        `| **Screen** | ${escapeMarkdownTableValue(body.diagnostics.screen ?? 'Not shared')} |`,
      ]
    : []

  const screenshotSection =
    body.includeScreenshot && body.screenshotDataUrl
      ? [
          '### Screenshot Context',
          '',
          `Filename: ${escapeMarkdownTableValue(body.screenshotFileName ?? 'screenshot.jpg')}`,
          '',
          '<details>',
          '<summary>Screenshot data URL (base64)</summary>',
          '',
          '```text',
          body.screenshotDataUrl,
          '```',
          '</details>',
          '',
        ]
      : []

  const issueBody = [
    `## ${typeEmoji} ${typeLabel}`,
    '',
    '### Summary',
    '',
    body.description,
    '',
    ...(body.type === 'bug'
      ? [
          '### Bug Reproduction',
          '',
          `- Steps to reproduce: ${body.bugContext?.stepsToReproduce?.trim() || '_not provided_'}`,
          `- Expected result: ${body.bugContext?.expectedResult?.trim() || '_not provided_'}`,
          `- Actual result: ${body.bugContext?.actualResult?.trim() || '_not provided_'}`,
          '',
        ]
      : [
          '### Feature Context',
          '',
          `- User problem: ${body.featureContext?.userProblem?.trim() || '_not provided_'}`,
          `- Desired workflow: ${body.featureContext?.desiredWorkflow?.trim() || '_not provided_'}`,
          `- Expected impact: ${body.featureContext?.expectedImpact?.trim() || '_not provided_'}`,
          '',
        ]),
    ...screenshotSection,
    '---',
    '',
    '### Reporter Context',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    ...reporterRows,
    ...(diagnosticsRows.length > 0
      ? [
          '',
          '### Technical Context',
          '',
          `| Field | Value |`,
          `|-------|-------|`,
          ...diagnosticsRows,
        ]
      : []),
    '',
    '_Submitted via in-app feedback_',
  ].join('\n')

  if (issueBody.length > MAX_GITHUB_ISSUE_BODY_CHARS) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Feedback payload is too large for GitHub issue body. Please reduce screenshot size or context.',
    })
  }

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
