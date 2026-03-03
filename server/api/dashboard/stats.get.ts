import { eq, and, desc, sql, count } from 'drizzle-orm'
import { application, candidate, job } from '../../database/schema'

/**
 * GET /api/dashboard/stats
 * Returns aggregated dashboard data for the current organization:
 * - Summary counts (open jobs, candidates, applications, unreviewed)
 * - Pipeline breakdown (application count per status)
 * - Jobs breakdown (job count per status)
 * - Recent applications (last 10 with candidate + job info)
 * - Top active jobs (open jobs sorted by application count, top 5)
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { job: ['read'], candidate: ['read'], application: ['read'] })
  const orgId = session.session.activeOrganizationId

  // ─────────────────────────────────────────────
  // Run all queries in parallel for performance
  // ─────────────────────────────────────────────
  const [
    openJobsCount,
    totalCandidatesCount,
    totalApplicationsCount,
    newApplicationsCount,
    pipelineRows,
    jobStatusRows,
    recentApplications,
    topJobs,
  ] = await Promise.all([
    // 1. Open jobs count
    db.$count(job, and(eq(job.organizationId, orgId), eq(job.status, 'open'))),

    // 2. Total candidates
    db.$count(candidate, eq(candidate.organizationId, orgId)),

    // 3. Total applications
    db.$count(application, eq(application.organizationId, orgId)),

    // 4. New (unreviewed) applications
    db.$count(application, and(eq(application.organizationId, orgId), eq(application.status, 'new'))),

    // 5. Pipeline breakdown — application count per status
    db
      .select({
        status: application.status,
        count: count().as('count'),
      })
      .from(application)
      .where(eq(application.organizationId, orgId))
      .groupBy(application.status),

    // 6. Jobs by status
    db
      .select({
        status: job.status,
        count: count().as('count'),
      })
      .from(job)
      .where(eq(job.organizationId, orgId))
      .groupBy(job.status),

    // 7. Recent applications (last 10) with candidate + job details
    db
      .select({
        id: application.id,
        status: application.status,
        createdAt: application.createdAt,
        candidateId: application.candidateId,
        candidateFirstName: candidate.firstName,
        candidateLastName: candidate.lastName,
        candidateEmail: candidate.email,
        jobId: application.jobId,
        jobTitle: job.title,
      })
      .from(application)
      .innerJoin(candidate, eq(candidate.id, application.candidateId))
      .innerJoin(job, eq(job.id, application.jobId))
      .where(eq(application.organizationId, orgId))
      .orderBy(desc(application.createdAt))
      .limit(10),

    // 8. Top 5 active (open) jobs by total application count
    db
      .select({
        id: job.id,
        title: job.title,
        slug: job.slug,
        status: job.status,
        createdAt: job.createdAt,
        applicationCount: count(application.id).as('application_count'),
        newCount: sql<number>`count(case when ${application.status} = 'new' then 1 end)`.as('new_count'),
      })
      .from(job)
      .leftJoin(application, eq(application.jobId, job.id))
      .where(and(eq(job.organizationId, orgId), eq(job.status, 'open')))
      .groupBy(job.id)
      .orderBy(sql`count(${application.id}) desc`)
      .limit(5),
  ])

  // ─────────────────────────────────────────────
  // Transform grouped rows into keyed objects
  // ─────────────────────────────────────────────
  const pipeline: Record<string, number> = {
    new: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    hired: 0,
    rejected: 0,
  }
  for (const row of pipelineRows) {
    pipeline[row.status] = row.count
  }

  const jobsByStatus: Record<string, number> = {
    draft: 0,
    open: 0,
    closed: 0,
    archived: 0,
  }
  for (const row of jobStatusRows) {
    jobsByStatus[row.status] = row.count
  }

  return {
    counts: {
      openJobs: openJobsCount,
      totalCandidates: totalCandidatesCount,
      totalApplications: totalApplicationsCount,
      newApplications: newApplicationsCount,
    },
    pipeline,
    jobsByStatus,
    recentApplications,
    topJobs,
  }
})
