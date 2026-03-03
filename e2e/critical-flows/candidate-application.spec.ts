import { test, expect } from '../fixtures'

/**
 * Critical flow: Candidate applies to a published job.
 *
 * Steps:
 * 1. Recruiter signs up, creates org, creates and publishes a job (setup)
 * 2. Candidate visits the public job page
 * 3. Candidate clicks "Apply"
 * 4. Candidate fills in application form (name, email, phone)
 * 5. Candidate submits the application
 * 6. Candidate sees the confirmation page
 * 7. Recruiter sees the application in the dashboard
 */

const JOB_TITLE = 'Frontend Developer'
const JOB_DESCRIPTION = 'Join our team building modern web applications with Vue and Nuxt.'
const JOB_LOCATION = 'Berlin, Germany'

const APPLICANT = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '+49 170 1234567',
}

test.describe('Candidate Application Flow', () => {
  test('candidate can apply to a published job', async ({ authenticatedPage, testAccount, browser }) => {
    const page = authenticatedPage

    // ── Setup: Create and publish a job ──────────────────

    await page.goto('/dashboard/jobs/new')
    await page.waitForLoadState('networkidle')
    // Wait for the form to be fully hydrated before interacting
    await page.getByLabel('Job title').waitFor({ state: 'visible', timeout: 15_000 })
    await page.getByLabel('Job title').fill(JOB_TITLE)
    await page.locator('textarea').first().fill(JOB_DESCRIPTION)
    await page.getByLabel('Location').fill(JOB_LOCATION)

    // Step through wizard (scope to form to avoid header duplicate button)
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).waitFor({ state: 'attached', timeout: 10_000 })
    await expect(page.locator('form').getByRole('button', { name: 'Save & continue' })).toBeEnabled({ timeout: 10_000 })
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).click()
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).waitFor({ state: 'attached', timeout: 10_000 })
    await expect(page.locator('form').getByRole('button', { name: 'Save & continue' })).toBeEnabled({ timeout: 10_000 })
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).click()
    await page.locator('form').getByRole('button', { name: 'Create job' }).click()

    // Wait for redirect to jobs list and open the job
    await page.waitForURL('**/dashboard', { waitUntil: 'commit' })
    await page.getByText(JOB_TITLE).first().click()

    // Publish the job
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByText('open').first()).toBeVisible({ timeout: 10_000 })

    // Get job slug via API
    const jobDetailUrl = page.url()
    const jobId = jobDetailUrl.split('/dashboard/jobs/')[1]?.split('/')[0]
    const jobData = await page.evaluate(async (id) => {
      const res = await fetch(`/api/jobs/${id}`)
      return res.json()
    }, jobId)

    const jobSlug = jobData.slug

    // ── Candidate flow: Apply in a separate browser context ─
    // Use a fresh context (no auth cookies) to simulate an anonymous candidate
    const candidateContext = await browser.newContext()
    const candidatePage = await candidateContext.newPage()

    await candidatePage.goto(`/jobs/${jobSlug}`)
    await candidatePage.waitForLoadState('networkidle')
    await expect(candidatePage.getByRole('heading', { name: JOB_TITLE })).toBeVisible()

    // Click Apply (use .first() because the page has both "Apply Now" and "Apply for this position" links)
    await candidatePage.getByRole('link', { name: /apply/i }).first().click()
    await candidatePage.waitForURL(`**/jobs/${jobSlug}/apply`, { waitUntil: 'commit' })
    await candidatePage.waitForLoadState('networkidle')

    // Wait for the application form to be fully rendered and hydrated
    await candidatePage.getByRole('button', { name: /submit/i }).waitFor({ state: 'visible', timeout: 15_000 })

    // ── Fill in application form ─────────────────────────
    await candidatePage.getByLabel('First name').fill(APPLICANT.firstName)
    await candidatePage.getByLabel('Last name').fill(APPLICANT.lastName)
    await candidatePage.getByLabel('Email').fill(APPLICANT.email)
    await candidatePage.getByLabel('Phone').fill(APPLICANT.phone)

    // Submit application and wait for the API response
    const [applyResponse] = await Promise.all([
      candidatePage.waitForResponse(
        resp => resp.url().includes(`/api/public/jobs/${jobSlug}/apply`) && resp.request().method() === 'POST',
        { timeout: 30_000 },
      ),
      candidatePage.getByRole('button', { name: /submit/i }).click(),
    ])

    // Verify the API responded successfully (200 or 201)
    const applyStatus = applyResponse.status()
    expect(applyStatus, `Apply API returned ${applyStatus}`).toBeGreaterThanOrEqual(200)
    expect(applyStatus, `Apply API returned ${applyStatus}`).toBeLessThan(300)

    // ── Verify confirmation page ─────────────────────────
    await candidatePage.waitForURL(`**/jobs/${jobSlug}/confirmation`, { waitUntil: 'commit', timeout: 15_000 })
    await expect(candidatePage.getByRole('heading', { name: 'Application Submitted!' })).toBeVisible()
    await expect(candidatePage.getByText(JOB_TITLE)).toBeVisible()

    await candidatePage.close()
    await candidateContext.close()

    // ── Verify application appears in recruiter dashboard ─
    // Navigate to the job's candidates page
    await page.goto(`/dashboard/jobs/${jobId}/candidates`)
    await page.waitForLoadState('networkidle')

    // Verify the page header shows the job title and at least 1 candidate
    await expect(page.getByRole('heading', { name: JOB_TITLE })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('1 candidate applied')).toBeVisible()

    // Verify the candidate row shows name, email, and "New" status
    const nameCell = page.getByRole('cell', { name: `${APPLICANT.firstName} ${APPLICANT.lastName}` })
    await expect(nameCell).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('cell', { name: APPLICANT.email })).toBeVisible()
    // New applications should have "new" status badge
    await expect(page.locator('tbody').getByText('new', { exact: true })).toBeVisible()

    // Click on the candidate row to open the detail sidebar
    await nameCell.click()

    // Verify the sidebar shows the candidate's full details
    const sidebar = page.locator('[class*="fixed"]').filter({ hasText: APPLICANT.firstName })
    await expect(sidebar.getByRole('heading', { name: `${APPLICANT.firstName} ${APPLICANT.lastName}` })).toBeVisible({ timeout: 10_000 })
    await expect(sidebar.getByRole('definition').filter({ hasText: APPLICANT.email })).toBeVisible()
    await expect(sidebar.getByRole('definition').filter({ hasText: APPLICANT.phone })).toBeVisible()
  })
})
