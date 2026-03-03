import { test, expect } from '../fixtures'

/**
 * Critical flow: Recruiter creates and publishes a job.
 *
 * Steps:
 * 1. Sign up + create org (via authenticatedPage fixture)
 * 2. Navigate to "Create Job" page
 * 3. Fill in job details (title, description, location, type)
 * 4. Submit the job
 * 5. Verify the job appears in the job list
 * 6. Open the job and publish it (draft → open)
 * 7. Verify the job is visible on the public jobs page
 */

const JOB_TITLE = 'Senior QA Engineer'
const JOB_DESCRIPTION = 'We are looking for a senior QA engineer to lead our testing efforts.'
const JOB_LOCATION = 'Remote'

test.describe('Job Creation Flow', () => {
  test('recruiter can create and publish a job', async ({ authenticatedPage, testAccount }) => {
    const page = authenticatedPage

    // ── Navigate to Create Job ───────────────────────────
    await page.goto('/dashboard/jobs/new')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'New Job' })).toBeVisible()

    // ── Step 1: Fill in job details ──────────────────────
    // Wait for the form to be fully hydrated before interacting
    await page.getByLabel('Job title').waitFor({ state: 'visible', timeout: 15_000 })
    await page.getByLabel('Job title').fill(JOB_TITLE)
    await page.locator('textarea').first().fill(JOB_DESCRIPTION)
    await page.getByLabel('Location').fill(JOB_LOCATION)

    // Click through to step 3 and submit (scope to form to avoid header duplicate button)
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).waitFor({ state: 'attached', timeout: 10_000 })
    await expect(page.locator('form').getByRole('button', { name: 'Save & continue' })).toBeEnabled({ timeout: 10_000 })
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).click()

    // Step 2: Application form — skip (defaults are fine)
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).waitFor({ state: 'attached', timeout: 10_000 })
    await expect(page.locator('form').getByRole('button', { name: 'Save & continue' })).toBeEnabled({ timeout: 10_000 })
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).click()

    // Step 3: Find candidates — submit
    await page.locator('form').getByRole('button', { name: 'Create job' }).click()

    // ── Verify redirect to jobs list ─────────────────────
    await page.waitForURL('**/dashboard', { waitUntil: 'commit' })
    await expect(page.getByText(JOB_TITLE)).toBeVisible()

    // ── Open the job detail page ─────────────────────────
    await page.getByText(JOB_TITLE).first().click()

    // ── Publish the job (draft → open) ───────────────────
    const publishButton = page.getByRole('button', { name: 'Publish' })
    await expect(publishButton).toBeVisible()
    await publishButton.click()

    // Wait for status to update
    await expect(page.getByText('open').first()).toBeVisible({ timeout: 10_000 })

    // ── Verify on public jobs page ───────────────────────
    // Get the job slug from the URL or page content
    const jobDetailUrl = page.url()
    const jobId = jobDetailUrl.split('/dashboard/jobs/')[1]?.split('/')[0]
    expect(jobId).toBeTruthy()

    // Fetch the job data via API to get the slug
    const jobData = await page.evaluate(async (id) => {
      const res = await fetch(`/api/jobs/${id}`)
      return res.json()
    }, jobId)

    const jobSlug = jobData.slug
    expect(jobSlug).toBeTruthy()

    // Visit the public job page
    await page.goto(`/jobs/${jobSlug}`)
    await expect(page.getByRole('heading', { name: JOB_TITLE })).toBeVisible()
    await expect(page.getByText(JOB_LOCATION)).toBeVisible()

    // Verify the "Apply" link/button is present (use .first() because the page has two apply links)
    await expect(page.getByRole('link', { name: /apply/i }).first()).toBeVisible()
  })
})
