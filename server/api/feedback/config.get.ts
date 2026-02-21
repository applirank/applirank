/**
 * GET /api/feedback/config
 *
 * Returns whether in-app GitHub feedback integration is enabled.
 * Requires authentication to avoid exposing internal integration status publicly.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  return {
    enabled: Boolean(env.GITHUB_FEEDBACK_TOKEN && env.GITHUB_FEEDBACK_REPO),
  }
})
