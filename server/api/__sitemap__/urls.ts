import { eq } from 'drizzle-orm'
import { job } from '../../database/schema'

/**
 * Dynamic sitemap source — returns URLs for open public job pages and blog articles.
 * Used by @nuxtjs/sitemap to include dynamic routes in the XML sitemap.
 *
 * @see https://nuxtseo.com/docs/sitemap/getting-started/data-sources#2-runtime-sources
 */
export default defineEventHandler(async (event) => {
  const openJobs = await db
    .select({
      slug: job.slug,
      updatedAt: job.updatedAt,
    })
    .from(job)
    .where(eq(job.status, 'open'))

  const blogPosts = await queryCollection(event, 'blog')
    .all()

  const jobUrls = openJobs.map((j) => ({
    loc: `/jobs/${j.slug}`,
    lastmod: j.updatedAt,
    changefreq: 'weekly' as const,
    priority: 0.8,
  }))

  const blogUrls = blogPosts
    .filter((post) => post.path.startsWith('/blog/'))
    .map((post) => ({
      loc: post.path,
      lastmod: post.date,
      changefreq: 'monthly' as const,
      priority: 0.7,
    }))

  return [...jobUrls, ...blogUrls]
})
