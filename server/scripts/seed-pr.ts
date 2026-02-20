/**
 * Seeds a lightweight PR environment dataset.
 *
 * Creates:
 * - 1 organization
 * - 5 recruiter users (with credential accounts)
 * - 5 candidates
 * - 5 jobs
 * - 5 applications
 *
 * Idempotent: if the PR seed organization already exists, the script exits without changes.
 */

import { hashPassword } from 'better-auth/crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import * as schema from '../database/schema'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const PR_ORG_NAME = 'Applirank PR Demo'
const PR_ORG_SLUG = 'applirank-pr-demo'
const DEFAULT_PASSWORD = process.env.PR_SEED_PASSWORD ?? 'demo1234'
const railwayEnvironmentName = process.env.RAILWAY_ENVIRONMENT_NAME?.toLowerCase() ?? ''
const forceSeed = process.env.SEED_PR_DEMO === 'true'
const isLikelyPrEnvironment =
  railwayEnvironmentName.startsWith('pr')
  || railwayEnvironmentName.includes('pull-request')
  || railwayEnvironmentName.includes('preview')

const client = postgres(DATABASE_URL, { max: 1 })
const db = drizzle(client, { schema })

function id() {
  return crypto.randomUUID()
}

function createJobSlug(title: string, index: number): string {
  const normalized = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${normalized}-pr-${index + 1}`
}

const users = [
  { name: 'Ava Johnson', email: 'pr.user1@applirank.dev' },
  { name: 'Noah Smith', email: 'pr.user2@applirank.dev' },
  { name: 'Mia Chen', email: 'pr.user3@applirank.dev' },
  { name: 'Liam Garcia', email: 'pr.user4@applirank.dev' },
  { name: 'Emma Davis', email: 'pr.user5@applirank.dev' },
]

const candidates = [
  { firstName: 'Sophie', lastName: 'Miller', email: 'candidate1@applirank.dev', phone: '+1 555 000 1001' },
  { firstName: 'Lucas', lastName: 'Brown', email: 'candidate2@applirank.dev', phone: '+1 555 000 1002' },
  { firstName: 'Isabella', lastName: 'Wilson', email: 'candidate3@applirank.dev', phone: '+1 555 000 1003' },
  { firstName: 'Ethan', lastName: 'Moore', email: 'candidate4@applirank.dev', phone: '+1 555 000 1004' },
  { firstName: 'Olivia', lastName: 'Taylor', email: 'candidate5@applirank.dev', phone: '+1 555 000 1005' },
]

const jobs = [
  {
    title: 'Frontend Engineer',
    description: 'Build and improve recruiter-facing Nuxt interfaces.',
    location: 'Remote',
    type: 'full_time' as const,
    status: 'open' as const,
  },
  {
    title: 'Backend Engineer',
    description: 'Develop and maintain API endpoints and data workflows.',
    location: 'Berlin, Germany',
    type: 'full_time' as const,
    status: 'open' as const,
  },
  {
    title: 'Product Designer',
    description: 'Design high-clarity hiring workflows and forms.',
    location: 'Remote (EU)',
    type: 'contract' as const,
    status: 'open' as const,
  },
  {
    title: 'Technical Recruiter',
    description: 'Run sourcing and screening for engineering roles.',
    location: 'London, UK',
    type: 'part_time' as const,
    status: 'open' as const,
  },
  {
    title: 'Data Analyst Intern',
    description: 'Support pipeline analytics and reporting.',
    location: 'Remote',
    type: 'internship' as const,
    status: 'open' as const,
  },
]

const applicationStatuses = ['new', 'screening', 'interview', 'offer', 'hired'] as const

async function seedPrEnvironment() {
  console.log('🌱 Seeding PR environment data...')

  if (!forceSeed && !isLikelyPrEnvironment) {
    console.log(`ℹ️ Skipping PR seed outside PR environments (RAILWAY_ENVIRONMENT_NAME='${railwayEnvironmentName || 'unknown'}').`)
    return
  }

  const existingOrg = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.slug, PR_ORG_SLUG))
    .limit(1)

  if (existingOrg.length > 0) {
    console.log('ℹ️ PR seed data already exists. Skipping.')
    return
  }

  const now = new Date()
  const organizationId = id()

  await db.insert(schema.organization).values({
    id: organizationId,
    name: PR_ORG_NAME,
    slug: PR_ORG_SLUG,
    createdAt: now,
  })

  const passwordHash = await hashPassword(DEFAULT_PASSWORD)

  for (const user of users) {
    const userId = id()

    await db.insert(schema.user).values({
      id: userId,
      name: user.name,
      email: user.email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(schema.account).values({
      id: id(),
      userId,
      accountId: userId,
      providerId: 'credential',
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(schema.member).values({
      id: id(),
      userId,
      organizationId,
      role: 'member',
      createdAt: now,
    })
  }

  const insertedCandidates = await db.insert(schema.candidate).values(
    candidates.map((candidate) => ({
      id: id(),
      organizationId,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      createdAt: now,
      updatedAt: now,
    }))
  ).returning({ id: schema.candidate.id })

  const insertedJobs = await db.insert(schema.job).values(
    jobs.map((job, index) => ({
      id: id(),
      organizationId,
      title: job.title,
      slug: createJobSlug(job.title, index),
      description: job.description,
      location: job.location,
      type: job.type,
      status: job.status,
      createdAt: now,
      updatedAt: now,
    }))
  ).returning({ id: schema.job.id })

  const applicationsToInsert = insertedCandidates.map((candidate, index) => {
    const matchingJob = insertedJobs[index]

    if (!matchingJob) {
      throw new Error(`Missing seeded job at index ${index}`)
    }

    return {
      id: id(),
      organizationId,
      candidateId: candidate.id,
      jobId: matchingJob.id,
      status: applicationStatuses[index],
      score: 60 + (index * 8),
      notes: `PR demo application ${index + 1}`,
      createdAt: now,
      updatedAt: now,
    }
  })

  await db.insert(schema.application).values(applicationsToInsert)

  console.log('✅ PR seed complete: 5 users, 5 jobs, 5 applications.')
  console.log(`🔐 Test login password: ${DEFAULT_PASSWORD}`)
}

seedPrEnvironment()
  .catch((error) => {
    console.error('❌ PR seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await client.end()
  })
