import { test, expect } from '../fixtures'

/**
 * Critical flow: Invitation management (invite, resend, cancel).
 *
 * Steps:
 * 1. Owner signs up, creates org (via fixture)
 * 2. Owner navigates to Settings → Members
 * 3. Owner invites a new member
 * 4. Pending invitation appears in the list
 * 5. Owner resends the invitation
 * 6. Owner cancels the invitation
 */

const INVITED_EMAIL = 'invited-member@test.local'

test.describe('Invitation Management Flow', () => {
  test('owner can invite, resend, and cancel an invitation', async ({ authenticatedPage }) => {
    const page = authenticatedPage

    // ── Navigate to Members page ──────────────────────────
    await page.goto('/dashboard/settings/members')
    await page.waitForLoadState('networkidle')

    // Wait for the page to fully load
    await page.getByText('Members').first().waitFor({ state: 'visible', timeout: 15_000 })

    // ── Step 1: Invite a new member ───────────────────────
    const inviteButton = page.getByRole('button', { name: 'Invite team member' })
    await inviteButton.waitFor({ state: 'visible', timeout: 10_000 })
    await inviteButton.click()

    // Fill in the invite form
    const emailInput = page.getByPlaceholder('colleague@company.com')
    await emailInput.waitFor({ state: 'visible', timeout: 10_000 })
    await emailInput.fill(INVITED_EMAIL)

    // Submit the invitation
    await page.getByRole('button', { name: 'Send invite' }).click()

    // Wait for success message
    await expect(page.getByText(`Invitation sent to ${INVITED_EMAIL}`)).toBeVisible({ timeout: 15_000 })

    // ── Step 2: Verify pending invitation appears ─────────
    // The pending invitations section should now show
    await expect(page.getByText('Pending invitations')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(INVITED_EMAIL).last()).toBeVisible({ timeout: 10_000 })

    // ── Step 3: Resend the invitation ─────────────────────
    const resendButton = page.getByRole('button', { name: 'Resend' })
    await resendButton.waitFor({ state: 'visible', timeout: 10_000 })
    await resendButton.click()

    // Wait for resend success message
    await expect(page.getByText(`Invitation resent to ${INVITED_EMAIL}`)).toBeVisible({ timeout: 15_000 })

    // Invitation should still appear in the list
    await expect(page.getByText(INVITED_EMAIL).last()).toBeVisible()

    // ── Step 4: Cancel the invitation ─────────────────────
    const cancelButton = page.getByRole('button', { name: 'Cancel' }).last()
    await cancelButton.waitFor({ state: 'visible', timeout: 10_000 })
    await cancelButton.click()

    // Give it time to process
    await page.waitForTimeout(2000)

    // After cancellation, the invitation should no longer appear
    // (or the pending invitations section could be hidden entirely if empty)
    const pendingSection = page.getByText('Pending invitations')
    const invitedEmail = page.getByText(INVITED_EMAIL)

    // Either the section is gone or the email is no longer listed
    const isHidden = await pendingSection.isHidden().catch(() => true)
    if (!isHidden) {
      // Section still visible - email should not be in it
      await expect(invitedEmail.last()).toBeHidden({ timeout: 10_000 })
    }
  })
})
