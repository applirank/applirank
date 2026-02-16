/**
 * Seeds the database with realistic demo data for Applirank.
 *
 * Creates:
 * - 1 demo user (demo@applirank.com / demo1234)
 * - 1 organization ("Applirank Demo")
 * - 5 jobs with varying statuses
 * - 30 candidates
 * - 65+ applications across all pipeline stages
 * - Custom questions on select jobs
 * - Question responses on applications
 *
 * Usage: npx tsx server/scripts/seed.ts
 * Requires DATABASE_URL in .env (loaded via dotenv or shell env).
 *
 * Idempotent — checks if demo org exists before running.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import * as schema from '../database/schema'

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required. Set it in .env or export it.')
  process.exit(1)
}

const DEMO_EMAIL = 'demo@applirank.com'
const DEMO_PASSWORD = 'demo1234'
const DEMO_ORG_NAME = 'Applirank Demo'
const DEMO_ORG_SLUG = 'applirank-demo'

// ─────────────────────────────────────────────
// Database connection
// ─────────────────────────────────────────────

const client = postgres(DATABASE_URL, { max: 1 })
const db = drizzle(client, { schema })

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function id(): string {
  return crypto.randomUUID()
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateSlug(title: string, uuid: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  const shortId = uuid.replace(/-/g, '').slice(0, 8)
  return `${base}-${shortId}`
}

// ─────────────────────────────────────────────
// Seed Data Definitions
// ─────────────────────────────────────────────

const JOBS_DATA = [
  {
    title: 'Senior Full-Stack Engineer',
    description: `We're looking for a Senior Full-Stack Engineer to lead the development of our core platform. You'll work with a modern tech stack (TypeScript, Vue 3, Nuxt, PostgreSQL) and have significant impact on product direction.\n\n**Responsibilities**\n- Design and implement new features end-to-end\n- Mentor junior engineers through code reviews and pairing sessions\n- Contribute to architecture decisions and technical planning\n- Ensure code quality through testing and CI/CD practices\n\n**Requirements**\n- 5+ years of professional software engineering experience\n- Strong proficiency in TypeScript and a modern frontend framework (Vue, React, or Svelte)\n- Experience with PostgreSQL and ORM tools (Drizzle, Prisma, or similar)\n- Familiarity with Docker, CI/CD pipelines, and cloud deployment\n- Excellent problem-solving and communication skills`,
    location: 'Berlin, Germany (Hybrid)',
    type: 'full_time' as const,
    status: 'open' as const,
  },
  {
    title: 'Product Designer',
    description: `Join our design team to shape the user experience of Applirank. You'll work closely with engineering and product to create intuitive, beautiful interfaces for recruiters and candidates.\n\n**Responsibilities**\n- Own the design process from research to high-fidelity prototypes\n- Conduct user interviews and usability testing\n- Create and maintain our design system\n- Collaborate daily with developers on implementation details\n\n**Requirements**\n- 3+ years of product design experience (B2B SaaS preferred)\n- Expert-level Figma skills\n- Portfolio showing end-to-end design work\n- Experience with design systems and component libraries\n- Strong understanding of accessibility standards`,
    location: 'Remote (EU)',
    type: 'full_time' as const,
    status: 'open' as const,
  },
  {
    title: 'DevOps Engineer',
    description: `We need a DevOps Engineer to build and maintain our infrastructure. You'll be responsible for CI/CD, monitoring, and ensuring our self-hosted product is easy to deploy.\n\n**Responsibilities**\n- Build and maintain CI/CD pipelines (GitHub Actions)\n- Manage Docker-based deployments and infrastructure\n- Set up monitoring, alerting, and logging (Grafana, Prometheus)\n- Write deployment documentation and automation scripts\n- Ensure security best practices across infrastructure\n\n**Requirements**\n- 3+ years of DevOps/Infrastructure experience\n- Strong Docker and Docker Compose expertise\n- Experience with Linux server administration\n- Familiarity with Caddy, Nginx, or similar reverse proxies\n- Knowledge of PostgreSQL operations (backup, restore, monitoring)`,
    location: 'Remote (Worldwide)',
    type: 'contract' as const,
    status: 'open' as const,
  },
  {
    title: 'Technical Writer (Part-Time)',
    description: `Help us create world-class documentation for Applirank. From setup guides to API references, your writing will help thousands of developers and recruiters use our product.\n\n**Responsibilities**\n- Write and maintain deployment guides, API docs, and tutorials\n- Create onboarding documentation for new users\n- Review and improve existing documentation\n- Collaborate with engineering on changelog and release notes\n\n**Requirements**\n- 2+ years of technical writing experience\n- Ability to explain complex technical concepts to non-technical audiences\n- Experience with Markdown and docs-as-code workflows\n- Familiarity with open-source project documentation patterns`,
    location: 'Remote (EU)',
    type: 'part_time' as const,
    status: 'open' as const,
  },
  {
    title: 'Frontend Engineering Intern',
    description: `A 6-month internship opportunity for aspiring frontend developers. You'll work on real features in a production codebase, getting hands-on experience with Vue 3, Nuxt 4, and Tailwind CSS.\n\n**What You'll Learn**\n- Build production Vue 3 components with Composition API\n- Work with TypeScript in a real-world codebase\n- Understand SSR concepts with Nuxt\n- Practice Git workflows, code review, and agile development\n\n**Requirements**\n- Currently enrolled in CS/SE degree or bootcamp\n- Basic knowledge of HTML, CSS, and JavaScript\n- Familiarity with Vue or React is a plus\n- Enthusiasm for learning and growth mindset`,
    location: 'Berlin, Germany (On-site)',
    type: 'internship' as const,
    status: 'draft' as const,
  },
]

const CANDIDATES_DATA = [
  { firstName: 'Emma', lastName: 'Schmidt', email: 'emma.schmidt@example.com', phone: '+49 170 1234567' },
  { firstName: 'Liam', lastName: 'Müller', email: 'liam.mueller@example.com', phone: '+49 171 2345678' },
  { firstName: 'Sofia', lastName: 'Dubois', email: 'sofia.dubois@example.com', phone: '+33 6 12 34 56 78' },
  { firstName: 'Noah', lastName: 'van der Berg', email: 'noah.vdberg@example.com', phone: '+31 6 12345678' },
  { firstName: 'Olivia', lastName: 'Rossi', email: 'olivia.rossi@example.com', phone: '+39 320 1234567' },
  { firstName: 'James', lastName: 'O\'Brien', email: 'james.obrien@example.com', phone: '+44 7700 123456' },
  { firstName: 'Amara', lastName: 'Okafor', email: 'amara.okafor@example.com', phone: '+234 801 234 5678' },
  { firstName: 'Yuki', lastName: 'Tanaka', email: 'yuki.tanaka@example.com', phone: '+81 90 1234 5678' },
  { firstName: 'Lucas', lastName: 'Andersson', email: 'lucas.andersson@example.com', phone: '+46 70 123 45 67' },
  { firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@example.com', phone: '+91 98765 43210' },
  { firstName: 'Mateo', lastName: 'García', email: 'mateo.garcia@example.com', phone: '+34 612 345 678' },
  { firstName: 'Aisha', lastName: 'Hassan', email: 'aisha.hassan@example.com', phone: '+971 50 123 4567' },
  { firstName: 'Felix', lastName: 'Weber', email: 'felix.weber@example.com', phone: '+49 172 3456789' },
  { firstName: 'Chloe', lastName: 'Martin', email: 'chloe.martin@example.com', phone: '+33 7 12 34 56 78' },
  { firstName: 'David', lastName: 'Kim', email: 'david.kim@example.com', phone: '+82 10 1234 5678' },
  { firstName: 'Elena', lastName: 'Petrova', email: 'elena.petrova@example.com', phone: '+7 916 123 4567' },
  { firstName: 'Alexander', lastName: 'Johansson', email: 'alex.johansson@example.com', phone: '+46 73 234 56 78' },
  { firstName: 'Maria', lastName: 'Costa', email: 'maria.costa@example.com', phone: '+351 912 345 678' },
  { firstName: 'Ryan', lastName: 'Chen', email: 'ryan.chen@example.com', phone: '+1 415 234 5678' },
  { firstName: 'Laura', lastName: 'Nguyen', email: 'laura.nguyen@example.com', phone: '+84 90 123 4567' },
  { firstName: 'Henrik', lastName: 'Larsen', email: 'henrik.larsen@example.com', phone: '+45 20 12 34 56' },
  { firstName: 'Fatima', lastName: 'Al-Rashid', email: 'fatima.alrashid@example.com', phone: '+962 79 123 4567' },
  { firstName: 'Tom', lastName: 'Kowalski', email: 'tom.kowalski@example.com', phone: '+48 501 234 567' },
  { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@example.com', phone: '+1 212 345 6789' },
  { firstName: 'Raj', lastName: 'Patel', email: 'raj.patel@example.com', phone: '+91 99887 76655' },
  { firstName: 'Anna', lastName: 'Becker', email: 'anna.becker@example.com', phone: '+49 175 4567890' },
  { firstName: 'Marcus', lastName: 'Eriksson', email: 'marcus.eriksson@example.com', phone: '+46 76 345 67 89' },
  { firstName: 'Ines', lastName: 'da Silva', email: 'ines.dasilva@example.com', phone: '+55 11 98765 4321' },
  { firstName: 'Kevin', lastName: 'Dupont', email: 'kevin.dupont@example.com', phone: '+33 6 98 76 54 32' },
  { firstName: 'Zara', lastName: 'Khan', email: 'zara.khan@example.com', phone: '+92 300 1234567' },
]

// Questions for the Senior Full-Stack Engineer job
const FULLSTACK_QUESTIONS = [
  { type: 'short_text' as const, label: 'Years of TypeScript experience', required: true },
  { type: 'single_select' as const, label: 'Preferred frontend framework', options: ['Vue', 'React', 'Svelte', 'Angular', 'Solid'], required: true },
  { type: 'long_text' as const, label: 'Describe a challenging technical problem you solved recently', required: true },
  { type: 'url' as const, label: 'Link to your GitHub profile or portfolio', required: false },
  { type: 'single_select' as const, label: 'When can you start?', options: ['Immediately', '2 weeks', '1 month', '2-3 months'], required: true },
]

// Questions for Product Designer
const DESIGNER_QUESTIONS = [
  { type: 'url' as const, label: 'Link to your portfolio', required: true },
  { type: 'single_select' as const, label: 'Primary design tool', options: ['Figma', 'Sketch', 'Adobe XD', 'Framer'], required: true },
  { type: 'long_text' as const, label: 'Walk us through your design process for a recent project', required: true },
  { type: 'checkbox' as const, label: 'I have experience with design systems', required: false },
]

// Questions for DevOps Engineer
const DEVOPS_QUESTIONS = [
  { type: 'multi_select' as const, label: 'Which cloud platforms have you worked with?', options: ['AWS', 'GCP', 'Azure', 'Hetzner', 'DigitalOcean', 'Other'], required: true },
  { type: 'short_text' as const, label: 'Years of Docker experience', required: true },
  { type: 'single_select' as const, label: 'Preferred CI/CD platform', options: ['GitHub Actions', 'GitLab CI', 'Jenkins', 'CircleCI', 'Other'], required: true },
]

// ─────────────────────────────────────────────
// Application distribution map
// Ensures realistic pipeline distribution across all stages
// ─────────────────────────────────────────────

type AppStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'

interface ApplicationAssignment {
  candidateIndex: number
  status: AppStatus
  score?: number
  notes?: string
}

// Job 0: Senior Full-Stack Engineer — most applications, full pipeline
const JOB_0_APPS: ApplicationAssignment[] = [
  { candidateIndex: 0, status: 'hired', score: 95, notes: 'Excellent TypeScript skills. Strong culture fit. Accepted offer.' },
  { candidateIndex: 1, status: 'offer', score: 90, notes: 'Great system design skills. Preparing offer letter.' },
  { candidateIndex: 2, status: 'interview', score: 85, notes: 'Strong portfolio. Scheduled final round for next week.' },
  { candidateIndex: 3, status: 'interview', score: 82, notes: 'Passed take-home. Technical interview pending.' },
  { candidateIndex: 4, status: 'interview', score: 78, notes: 'Good communication. Moving to system design round.' },
  { candidateIndex: 5, status: 'screening', score: 75, notes: 'Interesting background in distributed systems.' },
  { candidateIndex: 6, status: 'screening', score: 72, notes: 'Resume looks strong. Scheduling intro call.' },
  { candidateIndex: 7, status: 'screening', score: 70 },
  { candidateIndex: 8, status: 'new', score: 68 },
  { candidateIndex: 9, status: 'new', score: 65 },
  { candidateIndex: 10, status: 'new' },
  { candidateIndex: 11, status: 'new' },
  { candidateIndex: 12, status: 'new' },
  { candidateIndex: 13, status: 'rejected', score: 40, notes: 'Insufficient TypeScript experience for senior role.' },
  { candidateIndex: 14, status: 'rejected', score: 35, notes: 'No backend experience. Better fit for frontend role.' },
  { candidateIndex: 15, status: 'rejected', score: 30, notes: 'Location requirements don\'t match.' },
]

// Job 1: Product Designer — moderate applications
const JOB_1_APPS: ApplicationAssignment[] = [
  { candidateIndex: 16, status: 'interview', score: 92, notes: 'Outstanding portfolio. Design system experience.' },
  { candidateIndex: 17, status: 'interview', score: 88, notes: 'Great case studies. Scheduling portfolio review.' },
  { candidateIndex: 18, status: 'screening', score: 80, notes: 'Interesting transition from engineering to design.' },
  { candidateIndex: 19, status: 'screening', score: 77 },
  { candidateIndex: 20, status: 'new', score: 74 },
  { candidateIndex: 21, status: 'new' },
  { candidateIndex: 22, status: 'new' },
  { candidateIndex: 23, status: 'rejected', score: 45, notes: 'Portfolio mostly marketing design, not product.' },
  { candidateIndex: 24, status: 'rejected', score: 38, notes: 'No B2B SaaS experience.' },
]

// Job 2: DevOps Engineer — fewer applications (contract role)
const JOB_2_APPS: ApplicationAssignment[] = [
  { candidateIndex: 8, status: 'offer', score: 91, notes: 'Perfect fit. Strong Docker + Kubernetes expertise.' },
  { candidateIndex: 13, status: 'interview', score: 84, notes: 'Good infrastructure background. Clarifying contract terms.' },
  { candidateIndex: 25, status: 'screening', score: 76, notes: 'AWS certified. Reviewing Hetzner experience.' },
  { candidateIndex: 26, status: 'new', score: 70 },
  { candidateIndex: 27, status: 'new' },
  { candidateIndex: 28, status: 'rejected', score: 42, notes: 'Only Windows server experience.' },
]

// Job 3: Technical Writer — some applications
const JOB_3_APPS: ApplicationAssignment[] = [
  { candidateIndex: 29, status: 'screening', score: 85, notes: 'Published tech blog with excellent writing samples.' },
  { candidateIndex: 14, status: 'screening', score: 79 },
  { candidateIndex: 20, status: 'new', score: 71 },
  { candidateIndex: 21, status: 'new' },
  { candidateIndex: 22, status: 'rejected', score: 50, notes: 'Writing samples were mostly marketing copy, not technical.' },
]

// Job 4: Frontend Intern — draft, no applications yet

const JOB_APPLICATIONS = [JOB_0_APPS, JOB_1_APPS, JOB_2_APPS, JOB_3_APPS, []]

// Sample responses for questions
function generateResponses(jobIndex: number, candidateIndex: number): Record<string, string | string[] | boolean> {
  if (jobIndex === 0) {
    const years = ['3', '4', '5', '6', '7', '8+']
    const frameworks = ['Vue', 'React', 'Svelte', 'Vue', 'React', 'Vue']
    const starts = ['Immediately', '2 weeks', '1 month', '2 weeks', '1 month', '2-3 months']
    const problems = [
      'Migrated a monolithic REST API to a GraphQL federation with zero downtime across 12 microservices.',
      'Built a real-time collaboration engine using CRDTs that supports 500+ concurrent users editing the same document.',
      'Redesigned our database schema to support multi-tenancy, reducing query latency by 60% and storage costs by 40%.',
      'Implemented an automated canary deployment pipeline that reduced production incidents by 75%.',
      'Built a custom state management solution for a complex form wizard with 20+ conditional steps and offline support.',
      'Created a type-safe API client generator from OpenAPI specs that eliminated an entire class of runtime errors.',
    ]
    const i = candidateIndex % years.length
    return {
      'Years of TypeScript experience': years[i],
      'Preferred frontend framework': frameworks[i],
      'Describe a challenging technical problem you solved recently': problems[i],
      'Link to your GitHub profile or portfolio': `https://github.com/${CANDIDATES_DATA[candidateIndex].firstName.toLowerCase()}${CANDIDATES_DATA[candidateIndex].lastName.toLowerCase().replace(/['\s]/g, '')}`,
      'When can you start?': starts[i],
    }
  }
  if (jobIndex === 1) {
    const tools = ['Figma', 'Figma', 'Sketch', 'Figma']
    const processes = [
      'I start with stakeholder interviews to understand goals, then user research (interviews + analytics). I create low-fi wireframes in FigJam, iterate with the team, then move to high-fidelity in Figma with a component library.',
      'My process: Research → Competitive analysis → User flows → Wireframes → Prototypes → User testing → Iteration. I always validate with real users before implementation.',
      'I follow a double diamond approach: Discover (research), Define (insights), Develop (ideation), Deliver (testing). I document everything in a design spec for handoff.',
      'I believe in rapid prototyping. Quick sketches → Figma prototypes → guerrilla testing → iteration. Speed of learning beats perfection.',
    ]
    const i = candidateIndex % tools.length
    return {
      'Link to your portfolio': `https://dribbble.com/${CANDIDATES_DATA[candidateIndex].firstName.toLowerCase()}${CANDIDATES_DATA[candidateIndex].lastName.toLowerCase().charAt(0)}`,
      'Primary design tool': tools[i],
      'Walk us through your design process for a recent project': processes[i],
      'I have experience with design systems': candidateIndex % 2 === 0,
    }
  }
  if (jobIndex === 2) {
    const platforms = [['AWS', 'Hetzner'], ['GCP', 'AWS', 'Azure'], ['AWS', 'DigitalOcean'], ['Hetzner', 'DigitalOcean'], ['AWS', 'GCP'], ['Azure']]
    const ciPlatforms = ['GitHub Actions', 'GitLab CI', 'GitHub Actions', 'Jenkins', 'GitHub Actions', 'CircleCI']
    const dockerYears = ['3', '4', '5', '6', '2', '7']
    const i = candidateIndex % platforms.length
    return {
      'Which cloud platforms have you worked with?': platforms[i],
      'Years of Docker experience': dockerYears[i],
      'Preferred CI/CD platform': ciPlatforms[i],
    }
  }
  return {}
}

// ─────────────────────────────────────────────
// Main Seed Function
// ─────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding Applirank demo data...\n')

  // Check if demo org already exists
  const existingOrg = await db
    .select()
    .from(schema.organization)
    .where(eq(schema.organization.slug, DEMO_ORG_SLUG))
    .limit(1)

  if (existingOrg.length > 0) {
    console.log('⚠️  Demo organization already exists. Skipping seed.')
    console.log('   To re-seed, delete the organization first or reset the database.')
    await client.end()
    return
  }

  // 1. Create demo user
  const userId = id()
  const hashedPassword = await hashPassword(DEMO_PASSWORD)

  await db.insert(schema.user).values({
    id: userId,
    name: 'Demo Recruiter',
    email: DEMO_EMAIL,
    emailVerified: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  })

  // Create account (email/password provider)
  await db.insert(schema.account).values({
    id: id(),
    userId,
    accountId: userId,
    providerId: 'credential',
    password: hashedPassword,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  })

  console.log(`✅ Created demo user: ${DEMO_EMAIL}`)

  // 2. Create organization
  const orgId = id()

  await db.insert(schema.organization).values({
    id: orgId,
    name: DEMO_ORG_NAME,
    slug: DEMO_ORG_SLUG,
    createdAt: daysAgo(30),
  })

  // Add user as owner
  await db.insert(schema.member).values({
    id: id(),
    userId,
    organizationId: orgId,
    role: 'owner',
    createdAt: daysAgo(30),
  })

  console.log(`✅ Created organization: ${DEMO_ORG_NAME}`)

  // 3. Create jobs
  const jobIds: string[] = []

  for (const jobData of JOBS_DATA) {
    const jobId = id()
    jobIds.push(jobId)
    const slug = generateSlug(jobData.title, jobId)
    const createdDaysAgo = 20 + Math.floor(Math.random() * 10)

    await db.insert(schema.job).values({
      id: jobId,
      organizationId: orgId,
      title: jobData.title,
      slug,
      description: jobData.description,
      location: jobData.location,
      type: jobData.type,
      status: jobData.status,
      createdAt: daysAgo(createdDaysAgo),
      updatedAt: daysAgo(Math.floor(createdDaysAgo / 2)),
    })
  }

  console.log(`✅ Created ${JOBS_DATA.length} jobs`)

  // 4. Create candidates
  const candidateIds: string[] = []

  for (const candidateData of CANDIDATES_DATA) {
    const candidateId = id()
    candidateIds.push(candidateId)
    const createdDaysAgo = 5 + Math.floor(Math.random() * 20)

    await db.insert(schema.candidate).values({
      id: candidateId,
      organizationId: orgId,
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      email: candidateData.email,
      phone: candidateData.phone,
      createdAt: daysAgo(createdDaysAgo),
      updatedAt: daysAgo(Math.floor(createdDaysAgo / 2)),
    })
  }

  console.log(`✅ Created ${CANDIDATES_DATA.length} candidates`)

  // 5. Create custom questions for first 3 jobs
  const questionSets = [FULLSTACK_QUESTIONS, DESIGNER_QUESTIONS, DEVOPS_QUESTIONS]
  const questionIdsByJob: Map<number, { questionId: string; label: string }[]> = new Map()

  for (let jobIndex = 0; jobIndex < questionSets.length; jobIndex++) {
    const questions = questionSets[jobIndex]
    const questionIds: { questionId: string; label: string }[] = []

    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi]
      const questionId = id()
      questionIds.push({ questionId, label: q.label })

      await db.insert(schema.jobQuestion).values({
        id: questionId,
        organizationId: orgId,
        jobId: jobIds[jobIndex],
        type: q.type,
        label: q.label,
        required: q.required,
        options: 'options' in q ? q.options : null,
        displayOrder: qi,
        createdAt: daysAgo(18),
        updatedAt: daysAgo(18),
      })
    }

    questionIdsByJob.set(jobIndex, questionIds)
  }

  console.log(`✅ Created custom questions for ${questionSets.length} jobs`)

  // 6. Create applications with status distribution
  let totalApps = 0

  for (let jobIndex = 0; jobIndex < JOB_APPLICATIONS.length; jobIndex++) {
    const apps = JOB_APPLICATIONS[jobIndex]

    for (const app of apps) {
      const applicationId = id()
      const createdDaysAgo = 1 + Math.floor(Math.random() * 15)

      await db.insert(schema.application).values({
        id: applicationId,
        organizationId: orgId,
        candidateId: candidateIds[app.candidateIndex],
        jobId: jobIds[jobIndex],
        status: app.status,
        score: app.score ?? null,
        notes: app.notes ?? null,
        createdAt: daysAgo(createdDaysAgo),
        updatedAt: daysAgo(Math.max(0, createdDaysAgo - Math.floor(Math.random() * 5))),
      })

      // Create question responses for jobs that have questions
      const jobQuestions = questionIdsByJob.get(jobIndex)
      if (jobQuestions && app.status !== 'rejected') {
        const responses = generateResponses(jobIndex, app.candidateIndex)

        for (const q of jobQuestions) {
          const responseValue = responses[q.label]
          if (responseValue !== undefined) {
            await db.insert(schema.questionResponse).values({
              id: id(),
              organizationId: orgId,
              applicationId,
              questionId: q.questionId,
              value: responseValue,
              createdAt: daysAgo(createdDaysAgo),
            })
          }
        }
      }

      totalApps++
    }
  }

  console.log(`✅ Created ${totalApps} applications with pipeline distribution`)

  // Summary
  const statusCounts: Record<string, number> = {}
  for (const apps of JOB_APPLICATIONS) {
    for (const app of apps) {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1
    }
  }

  console.log(`\n📊 Pipeline distribution:`)
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`   ${status}: ${count}`)
  }

  console.log(`\n🎉 Seed complete!`)
  console.log(`\n   Sign in with:`)
  console.log(`   Email:    ${DEMO_EMAIL}`)
  console.log(`   Password: ${DEMO_PASSWORD}`)
  console.log(`\n   Then select "${DEMO_ORG_NAME}" as your organization.`)

  await client.end()
}

// ─────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  client.end().then(() => process.exit(1))
})
