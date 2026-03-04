import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E configuration for Reqcore.
 *
 * Tests the most critical user outcomes:
 * - Creating a job (authenticated recruiter flow)
 * - Candidate applying to a job (public flow)
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // sequential — tests share state (auth → create job → apply)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // single worker — tests depend on each other
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never' }],
        ['allure-playwright', { outputFolder: 'allure-results', suiteTitle: true }],
      ]
    : [
        ['html'],
        ['allure-playwright', { outputFolder: 'allure-results', suiteTitle: true }],
      ],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the Nuxt dev server before running tests (skipped in CI — we build there) */
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 60_000,
        },
      }),
})
