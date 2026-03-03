import { eq, and, desc, count, inArray } from 'drizzle-orm'
import { job, application } from '../../database/schema'
import { jobQuerySchema } from '../../utils/schemas/job'

interface PipelineCounts {
  new: number
  screening: number
  interview: number
  offer: number
  hired: number
  rejected: number
}

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { job: ['read'] })
  const orgId = session.session.activeOrganizationId

  const query = await getValidatedQuery(event, jobQuerySchema.parse)

  const offset = (query.page - 1) * query.limit
  const conditions = [eq(job.organizationId, orgId)]
  if (query.status) conditions.push(eq(job.status, query.status))

  const [data, total] = await Promise.all([
    db.query.job.findMany({
      where: and(...conditions),
      limit: query.limit,
      offset,
      orderBy: [desc(job.createdAt)],
      columns: {
        id: true,
        title: true,
        slug: true,
        description: true,
        location: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.$count(job, and(...conditions)),
  ])

  // Fetch pipeline counts (application status breakdown) for returned jobs
  const jobIds = data.map((j) => j.id)
  let pipelineMap: Record<string, PipelineCounts> = {}

  if (jobIds.length > 0) {
    const pipelineRows = await db
      .select({
        jobId: application.jobId,
        status: application.status,
        count: count().as('count'),
      })
      .from(application)
      .where(and(
        eq(application.organizationId, orgId),
        inArray(application.jobId, jobIds),
      ))
      .groupBy(application.jobId, application.status)

    for (const row of pipelineRows) {
      const entry = (pipelineMap[row.jobId] ??= { new: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 })
      entry[row.status as keyof PipelineCounts] = row.count
    }
  }

  const enrichedData = data.map((j) => ({
    ...j,
    pipeline: pipelineMap[j.id] ?? { new: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 },
  }))

  return { data: enrichedData, total, page: query.page, limit: query.limit }
})
