import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface ChangelogEntry {
  title: string
  date: string | null
  version: string | null
  link: string | null
  sections: { heading: string; items: string[] }[]
}

/**
 * GET /api/updates/changelog
 *
 * Parses CHANGELOG.md and returns structured changelog entries.
 * Requires authentication.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const changelogPath = resolve(process.cwd(), 'CHANGELOG.md')
  let raw: string
  try {
    raw = await readFile(changelogPath, 'utf-8')
  }
  catch {
    return { entries: [], currentVersion: null }
  }

  const { version: currentVersion } = await readFile(
    resolve(process.cwd(), 'package.json'),
    'utf-8',
  ).then(JSON.parse)

  const entries: ChangelogEntry[] = []
  let current: ChangelogEntry | null = null
  let currentSection: { heading: string; items: string[] } | null = null

  for (const line of raw.split('\n')) {
    // Match ## headings (entries)
    const h2 = line.match(/^## \[(.+?)]\((.+?)\)\s*\((.+?)\)/)
    const h2Unreleased = line.match(/^## Unreleased/)
    const h2Date = line.match(/^## (\d{4}-\d{2}-\d{2})/)

    if (h2 || h2Unreleased || h2Date) {
      if (current) entries.push(current)

      if (h2) {
        current = {
          title: `v${h2[1]}`,
          version: h2[1] ?? null,
          date: h2[3] ?? null,
          link: h2[2] ?? null,
          sections: [],
        }
      }
      else if (h2Unreleased) {
        current = { title: 'Unreleased', version: null, date: null, link: null, sections: [] }
      }
      else if (h2Date) {
        current = { title: h2Date[1] ?? '', version: null, date: h2Date[1] ?? null, link: null, sections: [] }
      }
      currentSection = null
      continue
    }

    // Match ### sub-headings (sections within an entry)
    const h3 = line.match(/^### (.+)/)
    if (h3 && current) {
      currentSection = { heading: h3[1] ?? '', items: [] }
      current.sections.push(currentSection)
      continue
    }

    // Match list items
    const item = line.match(/^\s*[*-]\s+(.+)/)
    if (item && currentSection) {
      currentSection.items.push(item[1] ?? '')
    }
  }

  if (current) entries.push(current)

  // Only keep versioned releases + Unreleased (not bare date entries)
  const releases = entries.filter(e => e.version !== null || e.title === 'Unreleased')

  // Deduplicate entries with same title
  const seen = new Set<string>()
  const unique = releases.filter((e) => {
    const key = `${e.title}-${e.date}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { entries: unique, currentVersion }
})
