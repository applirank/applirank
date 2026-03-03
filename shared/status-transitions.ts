/**
 * ─────────────────────────────────────────────
 * Status transition rules — single source of truth
 * ─────────────────────────────────────────────
 *
 * Defines allowed state transitions for jobs and applications.
 * Imported by both server (API validation) and client (UI rendering).
 *
 * If you need to add/remove a transition, change it HERE and both
 * sides stay in sync automatically.
 */

// ─── Application status transitions ────────────────────────────────
/**
 * Allowed status transitions for applications.
 * - `hired` is terminal — no forward transitions
 * - `rejected` can be re-opened back to `new`
 */
export const APPLICATION_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['screening', 'interview', 'rejected'],
  screening: ['interview', 'offer', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [],
  rejected: ['new'],
}

// ─── Job status transitions ────────────────────────────────────────
/**
 * Allowed status transitions for jobs.
 * `archived` can be reverted to `draft` or `open`.
 */
export const JOB_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['open', 'archived'],
  open: ['closed', 'archived'],
  closed: ['open', 'archived'],
  archived: ['draft', 'open'],
}
