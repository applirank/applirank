/**
 * Nitro plugin: gracefully shut down the server-side PostHog Node client when
 * the server process closes.  Without this the flush-interval timer keeps the
 * event loop alive and any buffered events are silently discarded.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hookOnce('close', () => shutdownServerPostHog())
})
