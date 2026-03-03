/**
 * Composable for invite-link API interactions.
 *
 * Centralises typed wrappers around the invite-link endpoints so that
 * consumer components get proper types without relying on Nuxt's
 * auto-inferred route types (which hit TypeScript's recursion limit
 * on large route sets — TS2321 "Excessive stack depth").
 */

// ── Response types (mirror server return shapes) ────────────────────

export interface InviteLinkAcceptResponse {
  success: boolean
  organizationId: string
  organizationName: string
  role: string
}

export interface InviteLinkInfoResponse {
  organizationName: string
  organizationSlug: string
  role: string
  invitedByName: string | null
  expiresAt: string
}

export interface InviteLink {
  id: string
  token: string
  role: string
  maxUses: number | null
  useCount: number
  expiresAt: string
  createdAt: string
  createdByName: string | null
}

// ── Composable ──────────────────────────────────────────────────────

export function useInviteLinks() {
  /**
   * Accept a shareable invite link and join the organisation.
   *
   * Wraps `POST /api/invite-links/accept` with an explicit return type
   * so TypeScript doesn't recurse into Nuxt's route-type matching.
   */
  async function acceptInviteLink(token: string): Promise<InviteLinkAcceptResponse> {
    // Widen the URL to `string` to bypass Nuxt's deep NitroFetchRequest
    // route-type inference, which causes TS2321 on large route sets.
    const url: string = '/api/invite-links/accept'

    return await $fetch<InviteLinkAcceptResponse>(url, {
      method: 'POST',
      body: { token },
    })
  }

  /**
   * Fetch public metadata for an invite link (used on the /join/[token] page).
   */
  async function fetchInviteLinkInfo(token: string): Promise<InviteLinkInfoResponse> {
    const url: string = `/api/invite-links/info/${token}`

    return await $fetch<InviteLinkInfoResponse>(url)
  }

  /**
   * List all invite links for the current organisation.
   */
  async function listInviteLinks(): Promise<InviteLink[]> {
    const url: string = '/api/invite-links'

    return await $fetch<InviteLink[]>(url)
  }

  /**
   * Create a new invite link for the current organisation.
   */
  async function createInviteLink(opts: {
    role?: 'admin' | 'member'
    maxUses?: number | null
    expiresInHours?: number
  }): Promise<void> {
    const url: string = '/api/invite-links'

    await $fetch(url, {
      method: 'POST',
      body: opts,
    })
  }

  /**
   * Revoke (delete) an invite link.
   */
  async function revokeInviteLink(linkId: string): Promise<void> {
    const url: string = `/api/invite-links/${linkId}`

    await $fetch(url, { method: 'DELETE' })
  }

  return {
    acceptInviteLink,
    fetchInviteLinkInfo,
    listInviteLinks,
    createInviteLink,
    revokeInviteLink,
  }
}
