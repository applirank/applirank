import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

interface UpdateResult {
  success: boolean
  message: string
  previousVersion: string | null
  steps: { step: string; status: 'success' | 'failed'; detail?: string }[]
}

/**
 * POST /api/updates/apply
 *
 * Triggers a self-hosted update via Docker Compose.
 * This endpoint orchestrates the update process:
 *   1. Pulls latest code from the default branch
 *   2. Rebuilds the Docker containers
 *   3. Restarts the application
 *
 * Only works for Docker-based deployments. Railway deployments
 * auto-update via GitHub integration.
 *
 * Requires authentication (owner only).
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, { organization: ['delete'] })

  const steps: UpdateResult['steps'] = []

  // Read current version before update
  const { readFile } = await import('node:fs/promises')
  const { resolve } = await import('node:path')
  let previousVersion: string | null = null
  try {
    const pkg = await readFile(resolve(process.cwd(), 'package.json'), 'utf-8')
    previousVersion = JSON.parse(pkg).version
  }
  catch {
    previousVersion = null
  }

  // Verify we're running in Docker
  try {
    const { access } = await import('node:fs/promises')
    await access('/.dockerenv')
  }
  catch {
    return {
      success: false,
      message: 'Updates via UI are only available for Docker-based deployments. For other deployment methods, please update manually.',
      previousVersion,
      steps: [],
    } satisfies UpdateResult
  }

  // Verify required commands are available
  for (const cmd of ['git', 'docker'] as const) {
    try {
      await execFileAsync('which', [cmd], { timeout: 5_000 })
    }
    catch {
      return {
        success: false,
        message: `The "${cmd}" command is not available inside this container. One-click updates require git and docker CLI to be installed in the container image, and the Docker socket to be mounted. Please update manually instead.`,
        previousVersion,
        steps: [],
      } satisfies UpdateResult
    }
  }

  // Step 1: Pull latest changes
  try {
    const { stdout } = await execFileAsync('git', ['pull', 'origin', 'main'], {
      cwd: '/app',
      timeout: 120_000,
    })
    steps.push({
      step: 'Pull latest code',
      status: 'success',
      detail: stdout.trim(),
    })
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    steps.push({ step: 'Pull latest code', status: 'failed', detail: message })
    return {
      success: false,
      message: 'Failed to pull latest code. Check your network connection and try again.',
      previousVersion,
      steps,
    } satisfies UpdateResult
  }

  // Step 2: Rebuild and restart via Docker Compose
  try {
    const { stdout } = await execFileAsync(
      'docker', ['compose', 'up', '--build', '--detach', '--no-deps', 'app'],
      {
        cwd: '/app',
        timeout: 600_000, // 10 minutes for build
      },
    )
    steps.push({
      step: 'Rebuild & restart',
      status: 'success',
      detail: stdout.trim(),
    })
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    steps.push({ step: 'Rebuild & restart', status: 'failed', detail: message })
    return {
      success: false,
      message: 'Failed to rebuild. Your current version is still running safely. Try running the update manually.',
      previousVersion,
      steps,
    } satisfies UpdateResult
  }

  return {
    success: true,
    message: 'Update started successfully. The application will restart momentarily. Refresh this page in about 30 seconds.',
    previousVersion,
    steps,
  } satisfies UpdateResult
})
