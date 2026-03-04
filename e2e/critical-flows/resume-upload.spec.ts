import { type Browser } from '@playwright/test'
import { test, expect } from '../fixtures'
import {
  VALID_FILE_CONFIGS,
  INVALID_FILE_CONFIGS,
  type TestFileConfig,
} from '../fixtures/test-buffers'

/**
 * Critical flow: Resume / CV file upload — all valid and invalid formats.
 *
 * Tests both upload paths:
 * 1. **Built-in resume upload** — the "Require resume/CV" toggle on the job
 * 2. **Custom question file_upload** — a question of type `file_upload`
 *
 * For each valid format (PDF, DOC, DOCX):
 *   - Upload succeeds → API returns 2xx → confirmation page is shown
 *
 * For each invalid format (TXT, PNG):
 *   - Upload is rejected → API returns 400
 *
 * Recruiter setup (shared across tests):
 *   1. Create a job via the 4-step wizard
 *   2. Step 2: enable "Require resume/CV" + add one `file_upload` custom question
 *   3. Step 4: publish the job → capture the application URL
 */

const JOB_TITLE = 'File Upload Format Test'
const JOB_DESCRIPTION = 'Testing all supported document upload formats.'
const JOB_LOCATION = 'Remote'

let applicationLink = ''
let jobSlug = ''

function applicant(index: number) {
  return {
    firstName: 'Upload',
    lastName: `Tester${index}`,
    email: `upload-tester-${index}-${Date.now()}@example.com`,
    phone: '+1 555 000 0000',
  }
}

test.describe('Resume Upload — All File Formats', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // One-time setup: create & publish the job
  // ─────────────────────────────────────────────────────────────────────────

  test.beforeAll('create and publish a job requiring resume + file_upload question', async ({ browser }) => {
    // We need a fresh authenticated page to set up the job.
    // Re-use the same signup logic from fixtures.ts.
    const context = await browser.newContext()
    const page = await context.newPage()

    const id = `${Date.now()}-setup`
    const account = {
      name: `Upload Test Recruiter ${id}`,
      email: `upload-test-${id}@test.local`,
      password: 'TestPassword123!',
      orgName: `Upload Test Org ${id}`,
    }

    // ── Sign up ────────────────────────────────────────────────────────────
    await page.goto('/auth/sign-up')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Name').fill(account.name)
    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Password', { exact: true }).fill(account.password)
    await page.getByLabel('Confirm password').fill(account.password)

    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/api/auth/sign-up') && resp.status() === 200,
        { timeout: 30_000 },
      ),
      page.getByRole('button', { name: 'Sign up' }).click(),
    ])

    await page.waitForURL(
      url => url.pathname.includes('/onboarding/') || url.pathname.includes('/auth/sign-in'),
      { waitUntil: 'commit', timeout: 30_000 },
    )

    if (page.url().includes('/auth/sign-in')) {
      await page.waitForLoadState('networkidle')
      await page.getByLabel('Email').fill(account.email)
      await page.getByLabel('Password').fill(account.password)
      await Promise.all([
        page.waitForResponse(
          resp => resp.url().includes('/api/auth/sign-in') && resp.status() === 200,
          { timeout: 30_000 },
        ),
        page.getByRole('button', { name: 'Sign in' }).click(),
      ])
      await page.waitForURL('**/onboarding/**', { waitUntil: 'commit', timeout: 30_000 })
    }

    await page.getByLabel('Organization name').waitFor({ state: 'visible', timeout: 30_000 })
    await page.getByLabel('Organization name').fill(account.orgName)
    await page.getByRole('button', { name: 'Create organization' }).click()
    await page.waitForURL('**/dashboard**', { waitUntil: 'commit' })

    // ── Create job ─────────────────────────────────────────────────────────

    // Step 1: Job details
    await page.goto('/dashboard/jobs/new')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Job title').waitFor({ state: 'visible', timeout: 15_000 })
    await page.getByLabel('Job title').fill(JOB_TITLE)
    await page.locator('textarea').first().fill(JOB_DESCRIPTION)
    await page.getByLabel('Location').fill(JOB_LOCATION)

    await page.locator('form').getByRole('button', { name: 'Save & continue' }).first()
      .waitFor({ state: 'attached', timeout: 10_000 })
    await expect(page.locator('form').getByRole('button', { name: 'Save & continue' }).first())
      .toBeEnabled({ timeout: 10_000 })
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).first().click()

    // Step 2: Application form — enable resume, add file_upload question
    await page.getByRole('button', { name: /Require resume\/CV/i })
      .waitFor({ state: 'visible', timeout: 10_000 })
    const resumeToggle = page.getByRole('button', { name: /Require resume\/CV/i })
    if ((await resumeToggle.getAttribute('aria-pressed')) !== 'true') {
      await resumeToggle.click()
    }

    // Add a file_upload custom question
    await page.getByRole('button', { name: 'Add Question' }).waitFor({ state: 'visible', timeout: 10_000 })
    await page.getByRole('button', { name: 'Add Question' }).click()
    await page.locator('#q-label').waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('#q-label').fill('Portfolio document')
    await page.locator('#q-type').selectOption('file_upload')
    await page.getByRole('button', { name: 'Add Question' }).click()
    await page.locator('#q-label').waitFor({ state: 'hidden', timeout: 10_000 })

    // Step 2 → Step 3
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).first().click()

    // Step 3 → Step 4
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).first()
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('form').getByRole('button', { name: 'Save & continue' }).first().click()

    // Step 4: Publish
    await expect(page.getByRole('heading', { name: /Ready to go\?/i })).toBeVisible({ timeout: 10_000 })
    const publishButton = page.locator('form').getByRole('button', { name: /Publish & copy link/i })
    await publishButton.waitFor({ state: 'visible', timeout: 10_000 })
    await publishButton.click()

    await expect(page.getByRole('heading', { name: 'Your job is live!' })).toBeVisible({ timeout: 20_000 })

    applicationLink = await page.locator('input[readonly]').inputValue()
    expect(applicationLink).toContain('/jobs/')
    jobSlug = applicationLink.split('/jobs/')[1]?.split('/apply')[0] ?? ''
    expect(jobSlug.length).toBeGreaterThan(0)

    await page.close()
    await context.close()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Valid format tests — each format should succeed end-to-end
  // ─────────────────────────────────────────────────────────────────────────

  for (const fileConfig of VALID_FILE_CONFIGS) {
    test(`accepts ${fileConfig.label} file (${fileConfig.filename}) as resume upload`, async ({ browser }) => {
      await assertUploadResult(browser, fileConfig, 'success')
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Invalid format tests — each format should be rejected by the server
  // ─────────────────────────────────────────────────────────────────────────

  for (const fileConfig of INVALID_FILE_CONFIGS) {
    test(`rejects ${fileConfig.label} file (${fileConfig.filename}) as resume upload`, async ({ browser }) => {
      await assertUploadResult(browser, fileConfig, 'rejected')
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Custom question file_upload — verify all valid formats work there too
  // ─────────────────────────────────────────────────────────────────────────

  for (const fileConfig of VALID_FILE_CONFIGS) {
    test(`accepts ${fileConfig.label} file via custom file_upload question`, async ({ browser }) => {
      await assertUploadResult(browser, fileConfig, 'success', { uploadToCustomQuestion: true })
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Shared test logic
// ─────────────────────────────────────────────────────────────────────────────

async function assertUploadResult(
  browser: Browser,
  fileConfig: TestFileConfig,
  expected: 'success' | 'rejected',
  options: { uploadToCustomQuestion?: boolean } = {},
) {
  const idx = Date.now()
  const candidate = applicant(idx)

  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  await page.goto(applicationLink)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: JOB_TITLE })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /submit/i }).waitFor({ state: 'visible', timeout: 15_000 })

  // ── Fill basic applicant info ──────────────────────────────────────────
  await page.getByLabel('First name').fill(candidate.firstName)
  await page.getByLabel('Last name').fill(candidate.lastName)
  await page.getByLabel('Email').fill(candidate.email)
  await page.getByLabel('Phone').fill(candidate.phone)

  // ── Upload resume (built-in required field) ────────────────────────────
  // The form has the built-in resume upload (required) plus one custom
  // file_upload question. We need to identify each input[type=file].
  //
  // Built-in resume: <input id="resume" type="file" ...>
  // Custom question:  <input type="file" ...> inside the DynamicField
  const resumeInput = page.locator('input#resume[type="file"]')
  const customFileInput = page.locator('input[type="file"]').last()

  // Always upload a valid PDF as the resume so the test can isolate the
  // variable we're testing (unless we specifically test the resume input).
  if (options.uploadToCustomQuestion) {
    // For custom question tests: use a known-good PDF for the resume
    await resumeInput.setInputFiles({
      name: 'resume-base.pdf',
      mimeType: 'application/pdf',
      buffer: VALID_FILE_CONFIGS[0]!.buffer,
    })
    // Upload the test file to the custom question input
    await customFileInput.setInputFiles({
      name: fileConfig.filename,
      mimeType: fileConfig.mimeType,
      buffer: fileConfig.buffer,
    })
    await expect(page.getByText(fileConfig.filename)).toBeVisible({ timeout: 5_000 })
  } else {
    // Upload the test file directly to the resume input
    await resumeInput.setInputFiles({
      name: fileConfig.filename,
      mimeType: fileConfig.mimeType,
      buffer: fileConfig.buffer,
    })
    await expect(page.getByText(fileConfig.filename)).toBeVisible({ timeout: 5_000 })
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  const [response] = await Promise.all([
    page.waitForResponse(
      resp =>
        resp.url().includes(`/api/public/jobs/${jobSlug}/apply`)
        && resp.request().method() === 'POST',
      { timeout: 30_000 },
    ),
    page.getByRole('button', { name: /submit/i }).click(),
  ])

  const status = response.status()

  if (expected === 'success') {
    expect(status, `${fileConfig.label}: expected 2xx but got ${status}`).toBeGreaterThanOrEqual(200)
    expect(status, `${fileConfig.label}: expected 2xx but got ${status}`).toBeLessThan(300)

    // Verify confirmation page
    await page.waitForURL(`**/jobs/${jobSlug}/confirmation`, {
      waitUntil: 'commit',
      timeout: 15_000,
    })
    await expect(page.getByRole('heading', { name: 'Application Submitted!' })).toBeVisible()
  } else {
    // Server should reject with 400
    expect(status, `${fileConfig.label}: expected 400 but got ${status}`).toBe(400)

    // The candidate should still be on the apply page (no redirect to confirmation)
    expect(page.url()).toContain('/apply')
  }

  await page.close()
  await ctx.close()
}
