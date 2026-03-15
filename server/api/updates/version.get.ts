import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * GET /api/updates/version
 *
 * Compares the running version (from package.json) against the latest
 * GitHub release to determine if an update is available.
 * Requires authentication.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { version: currentVersion } = await readFile(
    resolve(process.cwd(), 'package.json'),
    'utf-8',
  ).then(JSON.parse) as { version: string }

  const owner = 'reqcore-inc'
  const repo = 'reqcore'

  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': `Reqcore/${currentVersion}`,
        },
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (!response.ok) {
      return {
        currentVersion,
        latestVersion: null as string | null,
        updateAvailable: false,
        releaseUrl: null as string | null,
        releaseNotes: null as string | null,
        publishedAt: null as string | null,
      }
    }

    const release = await response.json() as {
      tag_name: string
      html_url: string
      body: string
      published_at: string
    }

    const latestVersion = release.tag_name.replace(/^v/, '')
    const updateAvailable = isNewerVersion(currentVersion, latestVersion)

    return {
      currentVersion,
      latestVersion,
      updateAvailable,
      releaseUrl: release.html_url,
      releaseNotes: release.body,
      publishedAt: release.published_at,
    }
  }
  catch {
    return {
      currentVersion,
      latestVersion: null as string | null,
      updateAvailable: false,
      releaseUrl: null as string | null,
      releaseNotes: null as string | null,
      publishedAt: null as string | null,
    }
  }
})

/**
 * Simple semver comparison: returns true if `latest` is newer than `current`.
 * Handles standard x.y.z format.
 */
function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = current.split('.').map(Number)
  const latestParts = latest.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const c = currentParts[i] ?? 0
    const l = latestParts[i] ?? 0
    if (l > c) return true
    if (l < c) return false
  }
  return false
}
