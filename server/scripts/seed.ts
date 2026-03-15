/**
 * Seeds the database with realistic demo data for Reqcore.
 *
 * Creates:
 * - 1 demo user (demo@reqcore.com / demo1234)
 * - 1 organization ("Reqcore Demo")
 * - 5 jobs with varying statuses
 * - 30 candidates
 * - 65+ applications across all pipeline stages
 * - Custom questions on select jobs
 * - Question responses on applications
 * - 35+ scheduled/completed interviews across the pipeline
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

const processWithLoadEnv = process as NodeJS.Process & {
  loadEnvFile?: (path?: string) => void
}

if (!process.env.DATABASE_URL && typeof processWithLoadEnv.loadEnvFile === 'function') {
  try {
    processWithLoadEnv.loadEnvFile('.env')
  }
  catch {
    // .env is optional in hosted environments like Railway
  }
}

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? ''

  try {
    const parsed = new URL(raw)
    if (parsed.hostname) return raw
  }
  catch {
    // fall through to individual-variable reconstruction
  }

  const host = process.env.PGHOST ?? process.env.RAILWAY_TCP_PROXY_DOMAIN ?? ''
  const port = process.env.PGPORT ?? process.env.RAILWAY_TCP_PROXY_PORT ?? '5432'
  const user = process.env.PGUSER ?? 'postgres'
  const password = process.env.PGPASSWORD ?? ''
  const database = process.env.PGDATABASE ?? 'railway'

  if (host) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
  }

  return ''
}

const DATABASE_URL = resolveDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required. Set it in .env or export it.')
  process.exit(1)
}

const DEMO_EMAIL = 'demo@reqcore.com'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'demo1234'
const DEMO_ORG_NAME = 'Reqcore Demo'
const DEMO_ORG_SLUG = 'reqcore-demo'

// Legacy values from the old applirank.com domain — cleaned up on seed
const LEGACY_DEMO_EMAIL = 'demo@applirank.com'
const LEGACY_ORG_SLUG = 'applirank-demo'

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

/** Create a date offset from today with a specific time. Positive = future, negative = past. */
function dateWithOffset(daysOffset: number, hour: number, minute: number = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  d.setHours(hour, minute, 0, 0)
  return d
}

function getArrayItemOrThrow<T>(arr: readonly T[], index: number, context: string): T {
  const value = arr[index]
  if (value === undefined) {
    throw new Error(`Missing ${context} at index ${index}`)
  }
  return value
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
    description: `We're hiring a Senior Full-Stack Engineer to help scale the core Reqcore platform used by growing hiring teams. You will own high-impact features across product, API, and data layers using TypeScript, Nuxt, and PostgreSQL in a pragmatic, fast-moving environment.\n\n**What you'll do**\n- Deliver end-to-end features from discovery and technical design to production rollout\n- Shape architecture decisions for multi-tenant workflows, performance, and reliability\n- Partner with product and design to turn recruiter pain points into elegant UX\n- Raise engineering quality through thoughtful code review, testing, and observability\n- Mentor team members and improve development standards across the stack\n\n**What we're looking for**\n- 5+ years building and shipping production web applications\n- Strong TypeScript proficiency across frontend and backend services\n- Experience with modern component architectures (Vue, React, or similar)\n- Practical PostgreSQL skills including query tuning and schema evolution\n- Familiarity with CI/CD, Dockerized environments, and cloud deployment workflows\n- Clear communication and ownership mindset in cross-functional teams\n\n**Nice to have**\n- Experience building internal tools, ATS/HR products, or workflow-heavy B2B software\n- Interest in transparent, explainable AI experiences`,
    location: 'Berlin, Germany (Hybrid)',
    type: 'full_time' as const,
    status: 'open' as const,
  },
  {
    title: 'Product Designer',
    description: `Join Reqcore as a Product Designer and craft the daily workflows used by recruiters to evaluate talent fairly and efficiently. You'll collaborate closely with engineering and product to design intuitive, high-trust experiences across dashboard, pipeline, and candidate flows.\n\n**What you'll do**\n- Lead design work from discovery through polished UI and production handoff\n- Translate complex hiring workflows into clear, low-friction user journeys\n- Run lightweight research and usability testing with real recruiting users\n- Evolve our design system and interaction patterns for speed and consistency\n- Partner with engineers to ensure high-quality implementation and accessibility\n\n**What we're looking for**\n- 3+ years in product design, ideally in B2B SaaS or workflow tools\n- Strong portfolio demonstrating end-to-end problem-solving and measurable outcomes\n- Advanced Figma skills including components, variants, and prototyping\n- Experience balancing visual polish with delivery constraints\n- Solid understanding of accessibility, hierarchy, and information architecture\n\n**Nice to have**\n- Experience designing data-rich interfaces or collaborative tooling\n- Familiarity with recruiting, HR, or marketplace products`,
    location: 'Remote (EU)',
    type: 'full_time' as const,
    status: 'open' as const,
  },
  {
    title: 'DevOps Engineer',
    description: `We are looking for a DevOps Engineer to harden and streamline our delivery platform across hosted and self-hosted environments. You will own deployment reliability, operational visibility, and developer productivity with a strong focus on secure, repeatable infrastructure.\n\n**What you'll do**\n- Build and improve CI/CD pipelines for faster, safer releases\n- Maintain containerized environments and infrastructure automation\n- Improve runtime observability with meaningful alerts, dashboards, and runbooks\n- Strengthen backup, restore, and disaster recovery practices for Postgres and storage\n- Document deployment standards to make enterprise self-hosting predictable\n\n**What we're looking for**\n- 3+ years of DevOps or platform engineering experience\n- Deep Docker and Linux operations knowledge\n- Hands-on CI/CD experience (GitHub Actions, GitLab CI, or similar)\n- Practical understanding of reverse proxies, TLS, and networking fundamentals\n- Experience with database operations and incident response\n\n**Nice to have**\n- IaC experience (Terraform, Pulumi, or equivalent)\n- Experience supporting compliance-sensitive B2B workloads`,
    location: 'Remote (Worldwide)',
    type: 'contract' as const,
    status: 'open' as const,
  },
  {
    title: 'Technical Writer (Part-Time)',
    description: `We're hiring a part-time Technical Writer to make Reqcore documentation clear, actionable, and enterprise-ready. Your work will directly improve product adoption by helping recruiters, admins, and developers succeed quickly.\n\n**What you'll do**\n- Create and maintain setup guides, API docs, and troubleshooting playbooks\n- Improve onboarding flows for first-time teams and self-hosted deployments\n- Standardize tone, structure, and quality across product documentation\n- Work with engineering and product to document new releases and migrations\n- Identify knowledge gaps from support and feedback loops\n\n**What we're looking for**\n- 2+ years writing technical documentation for software products\n- Ability to explain complex systems in simple, practical language\n- Strong Markdown/docs-as-code workflow habits\n- Attention to clarity, consistency, and user intent\n- Experience editing developer-facing and operations-focused content\n\n**Nice to have**\n- Open-source documentation contributions\n- Familiarity with hiring/recruiting software terminology`,
    location: 'Remote (EU)',
    type: 'part_time' as const,
    status: 'open' as const,
  },
  {
    title: 'Frontend Engineering Intern',
    description: `Start your frontend career on a real product with real users. In this 6-month internship, you'll contribute production code to Reqcore while learning modern frontend engineering practices from an experienced team.\n\n**What you'll work on**\n- Build and ship Vue/Nuxt interface components used in daily recruiting workflows\n- Improve usability, accessibility, and performance of existing screens\n- Collaborate in code reviews and iterative delivery cycles\n- Learn how product, design, and engineering collaborate in a modern SaaS team\n\n**What we're looking for**\n- Currently enrolled in computer science, software engineering, or equivalent program\n- Strong foundations in HTML, CSS, and JavaScript\n- Basic familiarity with TypeScript and component-based frameworks is a plus\n- Curiosity, coachability, and attention to detail\n- Ability to communicate clearly and ask good questions\n\n**Internship details**\n- Structured mentorship, weekly feedback, and clear growth goals\n- Opportunity to present shipped work at the end of the internship`,
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

// Job 0: Senior Full-Stack Engineer — high volume, full funnel
const JOB_0_APPS: ApplicationAssignment[] = [
  { candidateIndex: 0, status: 'hired', score: 96, notes: 'Outstanding architecture interview and strong leadership examples. Accepted offer.' },
  { candidateIndex: 1, status: 'offer', score: 92, notes: 'Excellent systems design and pragmatic decision-making. Offer package in final approval.' },
  { candidateIndex: 2, status: 'offer', score: 89, notes: 'Strong backend depth and clear communication. Final compensation discussion scheduled.' },
  { candidateIndex: 3, status: 'interview', score: 86, notes: 'Great take-home submission. Final panel interview planned next week.' },
  { candidateIndex: 4, status: 'interview', score: 84, notes: 'Consistent coding quality. Proceeding to architecture round.' },
  { candidateIndex: 5, status: 'interview', score: 81, notes: 'Positive recruiter and hiring manager feedback. Interview loop in progress.' },
  { candidateIndex: 6, status: 'screening', score: 78, notes: 'Relevant multi-tenant SaaS experience. Scheduling technical screen.' },
  { candidateIndex: 7, status: 'screening', score: 75, notes: 'Solid TypeScript background. Waiting on availability for first call.' },
  { candidateIndex: 8, status: 'new', score: 73, notes: 'Promising CV with production Nuxt experience. Pending initial review.' },
  { candidateIndex: 9, status: 'new', score: 70, notes: 'Good open-source profile. Recruiter triage queued.' },
  { candidateIndex: 10, status: 'new', score: 68 },
  { candidateIndex: 11, status: 'new', score: 66 },
  { candidateIndex: 12, status: 'rejected', score: 44, notes: 'Experience level below senior expectations for this role.' },
  { candidateIndex: 13, status: 'rejected', score: 39, notes: 'Limited backend ownership in recent roles.' },
]

// Job 1: Product Designer — strong mid-funnel representation
const JOB_1_APPS: ApplicationAssignment[] = [
  { candidateIndex: 14, status: 'offer', score: 91, notes: 'Exceptional portfolio depth and design-system leadership. Preparing offer.' },
  { candidateIndex: 15, status: 'interview', score: 88, notes: 'Strong product thinking and workshop facilitation skills.' },
  { candidateIndex: 16, status: 'interview', score: 86, notes: 'High-quality case studies with clear impact metrics.' },
  { candidateIndex: 17, status: 'interview', score: 83, notes: 'Great cross-functional collaboration examples.' },
  { candidateIndex: 18, status: 'screening', score: 79, notes: 'Compelling research approach. Moving to portfolio walkthrough.' },
  { candidateIndex: 19, status: 'screening', score: 76, notes: 'Strong visual craft. Reviewing B2B experience depth.' },
  { candidateIndex: 20, status: 'new', score: 74, notes: 'Interesting transition from frontend engineering into product design.' },
  { candidateIndex: 21, status: 'new', score: 71 },
  { candidateIndex: 22, status: 'new', score: 69 },
  { candidateIndex: 23, status: 'new', score: 67 },
  { candidateIndex: 24, status: 'rejected', score: 46, notes: 'Portfolio focus is primarily brand and campaign design.' },
  { candidateIndex: 25, status: 'rejected', score: 41, notes: 'Limited product discovery and usability testing examples.' },
]

// Job 2: DevOps Engineer — healthy pipeline for a contract position
const JOB_2_APPS: ApplicationAssignment[] = [
  { candidateIndex: 5, status: 'hired', score: 94, notes: 'Strong container orchestration and observability setup. Contract signed.' },
  { candidateIndex: 6, status: 'offer', score: 90, notes: 'Excellent platform reliability background. Offer sent.' },
  { candidateIndex: 7, status: 'interview', score: 85, notes: 'Deep CI/CD experience. Final technical interview scheduled.' },
  { candidateIndex: 8, status: 'interview', score: 83, notes: 'Strong automation mindset and incident response examples.' },
  { candidateIndex: 9, status: 'screening', score: 79, notes: 'Good cloud fundamentals. Validating production ownership scope.' },
  { candidateIndex: 10, status: 'screening', score: 76, notes: 'Relevant Docker and IaC stack. Recruiter follow-up pending.' },
  { candidateIndex: 26, status: 'new', score: 72, notes: 'Promising profile. Awaiting first availability window.' },
  { candidateIndex: 27, status: 'new', score: 70 },
  { candidateIndex: 28, status: 'new', score: 67 },
  { candidateIndex: 29, status: 'rejected', score: 45, notes: 'Skillset weighted toward support operations, limited platform engineering depth.' },
  { candidateIndex: 13, status: 'rejected', score: 40, notes: 'Primary experience with legacy on-prem tooling; limited cloud-native track record.' },
]

// Job 3: Technical Writer — consistent pipeline quality
const JOB_3_APPS: ApplicationAssignment[] = [
  { candidateIndex: 12, status: 'offer', score: 90, notes: 'Clear, structured writing samples and strong docs-as-code workflow.' },
  { candidateIndex: 14, status: 'interview', score: 86, notes: 'Great API documentation examples and editorial discipline.' },
  { candidateIndex: 16, status: 'interview', score: 83, notes: 'Strong technical depth and clean information architecture approach.' },
  { candidateIndex: 18, status: 'screening', score: 78, notes: 'Good writing quality; validating long-form technical ownership.' },
  { candidateIndex: 20, status: 'screening', score: 75, notes: 'Strong communication style. Intro call booked.' },
  { candidateIndex: 22, status: 'new', score: 72 },
  { candidateIndex: 24, status: 'new', score: 69 },
  { candidateIndex: 26, status: 'new', score: 66 },
  { candidateIndex: 28, status: 'rejected', score: 49, notes: 'Writing portfolio is mostly social and campaign content.' },
  { candidateIndex: 29, status: 'rejected', score: 43, notes: 'Limited experience with developer-focused documentation.' },
]

// Job 4: Frontend Engineering Intern — active early-career funnel
const JOB_4_APPS: ApplicationAssignment[] = [
  { candidateIndex: 0, status: 'interview', score: 88, notes: 'Impressive internship project quality and thoughtful code reviews in GitHub profile.' },
  { candidateIndex: 2, status: 'interview', score: 84, notes: 'Strong fundamentals in Vue and Tailwind. Team fit interview scheduled.' },
  { candidateIndex: 4, status: 'screening', score: 79, notes: 'Good learning velocity and clean component architecture examples.' },
  { candidateIndex: 6, status: 'screening', score: 76, notes: 'Strong front-end fundamentals; evaluating SSR understanding.' },
  { candidateIndex: 11, status: 'screening', score: 74, notes: 'Promising portfolio with clear UX thinking for early-career level.' },
  { candidateIndex: 15, status: 'new', score: 71 },
  { candidateIndex: 17, status: 'new', score: 69 },
  { candidateIndex: 19, status: 'new', score: 67 },
  { candidateIndex: 21, status: 'new', score: 65 },
  { candidateIndex: 23, status: 'rejected', score: 46, notes: 'Limited JavaScript fundamentals demonstrated in practical assessment.' },
]

const JOB_APPLICATIONS = [JOB_0_APPS, JOB_1_APPS, JOB_2_APPS, JOB_3_APPS, JOB_4_APPS]

// ─────────────────────────────────────────────
// Interview definitions — realistic multi-stage loops
// ─────────────────────────────────────────────

interface InterviewSeed {
  jobIndex: number
  candidateIndex: number
  title: string
  type: 'phone' | 'video' | 'in_person' | 'panel' | 'technical' | 'take_home'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  /** Days from seed date. Positive = future, negative = past. */
  daysOffset: number
  hour: number
  minute?: number
  duration: number
  location: string | null
  notes: string | null
  interviewers: string[]
  candidateResponse: 'pending' | 'accepted' | 'declined' | 'tentative'
  timezone: string
}

const INTERVIEWS_DATA: InterviewSeed[] = [
  // ──────────────────────────────────────────
  // Job 0: Senior Full-Stack Engineer
  // ──────────────────────────────────────────

  // Emma Schmidt (hired) — full 3-round loop, all completed
  {
    jobIndex: 0, candidateIndex: 0,
    title: 'Initial Phone Screen',
    type: 'phone', status: 'completed',
    daysOffset: -18, hour: 10, duration: 30,
    location: null,
    notes: 'Strong communication skills. Clear motivation and relevant experience. Advancing to technical round.',
    interviewers: ['Anna Weiss'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },
  {
    jobIndex: 0, candidateIndex: 0,
    title: 'Technical Interview — System Design & Coding',
    type: 'technical', status: 'completed',
    daysOffset: -12, hour: 14, duration: 90,
    location: 'Google Meet',
    notes: 'Exceptional system design approach. Solved the distributed caching problem elegantly. Strong TypeScript patterns and testing discipline.',
    interviewers: ['Marcus Reiter', 'Sarah Chen'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },
  {
    jobIndex: 0, candidateIndex: 0,
    title: 'Final Panel — Culture & Leadership',
    type: 'panel', status: 'completed',
    daysOffset: -7, hour: 11, duration: 60,
    location: 'Reqcore HQ, Friedrichstraße 123, Berlin',
    notes: 'Unanimous strong hire from the panel. Great leadership examples and clear alignment with team values. Offer approved.',
    interviewers: ['Thomas Berger', 'Sarah Chen', 'Lisa Hoffmann'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },

  // Liam Müller (offer) — 3 rounds completed, offer pending
  {
    jobIndex: 0, candidateIndex: 1,
    title: 'Recruiter Screen',
    type: 'phone', status: 'completed',
    daysOffset: -16, hour: 9, minute: 30, duration: 30,
    location: null,
    notes: 'Well-prepared candidate. Salary expectations within band. Moving forward.',
    interviewers: ['Anna Weiss'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },
  {
    jobIndex: 0, candidateIndex: 1,
    title: 'Technical Deep-Dive — Full-Stack Architecture',
    type: 'technical', status: 'completed',
    daysOffset: -10, hour: 15, duration: 90,
    location: 'Google Meet',
    notes: 'Excellent systems thinking. Strong PostgreSQL optimization knowledge. Good tradeoff analysis on caching strategies.',
    interviewers: ['Marcus Reiter', 'Daniel Krause'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },
  {
    jobIndex: 0, candidateIndex: 1,
    title: 'Hiring Manager Interview',
    type: 'video', status: 'completed',
    daysOffset: -5, hour: 13, duration: 45,
    location: 'Google Meet',
    notes: 'Great cultural fit. Proactive mindset and excellent collaboration examples. Preparing offer package.',
    interviewers: ['Sarah Chen'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },

  // Sofia Dubois (offer) — 2 rounds completed
  {
    jobIndex: 0, candidateIndex: 2,
    title: 'Introductory Call',
    type: 'phone', status: 'completed',
    daysOffset: -14, hour: 11, duration: 30,
    location: null,
    notes: 'Strong backend focus with solid frontend skills. Motivated by the open-source mission.',
    interviewers: ['Anna Weiss'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Paris',
  },
  {
    jobIndex: 0, candidateIndex: 2,
    title: 'Technical Assessment — Live Coding',
    type: 'technical', status: 'completed',
    daysOffset: -8, hour: 14, minute: 30, duration: 75,
    location: 'Google Meet',
    notes: 'Clean code structure and strong testing habits. Handled edge cases well during the API design exercise.',
    interviewers: ['Marcus Reiter'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Paris',
  },

  // Noah van der Berg (interview) — 1 completed, 1 upcoming
  {
    jobIndex: 0, candidateIndex: 3,
    title: 'Recruiter Phone Screen',
    type: 'phone', status: 'completed',
    daysOffset: -6, hour: 10, duration: 30,
    location: null,
    notes: 'Good technical background. Previous multi-tenant SaaS experience. Proceeding to technical round.',
    interviewers: ['Anna Weiss'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Amsterdam',
  },
  {
    jobIndex: 0, candidateIndex: 3,
    title: 'Technical Interview — Architecture & Problem Solving',
    type: 'technical', status: 'scheduled',
    daysOffset: 3, hour: 14, duration: 90,
    location: 'Google Meet',
    notes: 'Focus on system design, database modeling, and real-time collaboration patterns.',
    interviewers: ['Marcus Reiter', 'Sarah Chen'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Amsterdam',
  },

  // Olivia Rossi (interview) — 1 upcoming
  {
    jobIndex: 0, candidateIndex: 4,
    title: 'Initial Video Screen',
    type: 'video', status: 'scheduled',
    daysOffset: 2, hour: 11, duration: 45,
    location: 'Google Meet',
    notes: 'Review portfolio projects and discuss full-stack experience with Vue/Nuxt.',
    interviewers: ['Sarah Chen'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Rome',
  },

  // James O\'Brien (interview) — 1 upcoming, pending response
  {
    jobIndex: 0, candidateIndex: 5,
    title: 'Phone Screen',
    type: 'phone', status: 'scheduled',
    daysOffset: 5, hour: 15, duration: 30,
    location: null,
    notes: 'Discuss background, role expectations, and availability.',
    interviewers: ['Anna Weiss'],
    candidateResponse: 'pending',
    timezone: 'Europe/London',
  },

  // ──────────────────────────────────────────
  // Job 1: Product Designer
  // ──────────────────────────────────────────

  // David Kim (offer) — 2 rounds completed
  {
    jobIndex: 1, candidateIndex: 14,
    title: 'Portfolio Review & Design Discussion',
    type: 'video', status: 'completed',
    daysOffset: -15, hour: 10, duration: 60,
    location: 'Google Meet',
    notes: 'Exceptional portfolio depth. Clear articulation of design decisions and business impact. Strong systems thinking.',
    interviewers: ['Julia Engel'],
    candidateResponse: 'accepted',
    timezone: 'Asia/Seoul',
  },
  {
    jobIndex: 1, candidateIndex: 14,
    title: 'Design Challenge Debrief & Team Fit',
    type: 'panel', status: 'completed',
    daysOffset: -8, hour: 9, duration: 75,
    location: 'Google Meet',
    notes: 'Design challenge solution was thoughtful and user-centered. Excellent collaboration style during critique. Strong hire recommendation.',
    interviewers: ['Julia Engel', 'Lisa Hoffmann', 'Thomas Berger'],
    candidateResponse: 'accepted',
    timezone: 'Asia/Seoul',
  },

  // Elena Petrova (interview) — 1 upcoming
  {
    jobIndex: 1, candidateIndex: 15,
    title: 'Portfolio Walkthrough & Design Process',
    type: 'video', status: 'scheduled',
    daysOffset: 4, hour: 13, duration: 60,
    location: 'Google Meet',
    notes: 'Review 2-3 case studies. Assess design thinking, research methods, and handoff practices.',
    interviewers: ['Julia Engel'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },

  // Alexander Johansson (interview) — 1 upcoming, tentative response
  {
    jobIndex: 1, candidateIndex: 16,
    title: 'Introductory Design Interview',
    type: 'video', status: 'scheduled',
    daysOffset: 6, hour: 10, minute: 30, duration: 45,
    location: 'Google Meet',
    notes: 'Discuss portfolio highlights, design process, and interest in B2B SaaS products.',
    interviewers: ['Julia Engel', 'Lisa Hoffmann'],
    candidateResponse: 'tentative',
    timezone: 'Europe/Stockholm',
  },

  // Maria Costa (interview) — 1 completed, 1 upcoming
  {
    jobIndex: 1, candidateIndex: 17,
    title: 'Initial Screening Call',
    type: 'phone', status: 'completed',
    daysOffset: -5, hour: 14, duration: 30,
    location: null,
    notes: 'Strong cross-functional collaboration background. Interesting perspective on accessible design.',
    interviewers: ['Anna Weiss'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Lisbon',
  },
  {
    jobIndex: 1, candidateIndex: 17,
    title: 'Design Exercise Review & Discussion',
    type: 'video', status: 'scheduled',
    daysOffset: 7, hour: 11, duration: 90,
    location: 'Google Meet',
    notes: 'Review take-home design exercise. Assess problem framing, research approach, and visual execution.',
    interviewers: ['Julia Engel', 'Lisa Hoffmann'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Lisbon',
  },

  // ──────────────────────────────────────────
  // Job 2: DevOps Engineer
  // ──────────────────────────────────────────

  // James O\'Brien (hired) — 2 rounds completed
  {
    jobIndex: 2, candidateIndex: 5,
    title: 'Technical Screen — Infrastructure & CI/CD',
    type: 'technical', status: 'completed',
    daysOffset: -20, hour: 14, duration: 60,
    location: 'Google Meet',
    notes: 'Deep Docker expertise and strong GitHub Actions experience. Excellent incident response examples.',
    interviewers: ['Daniel Krause'],
    candidateResponse: 'accepted',
    timezone: 'Europe/London',
  },
  {
    jobIndex: 2, candidateIndex: 5,
    title: 'System Design — Deployment Architecture',
    type: 'technical', status: 'completed',
    daysOffset: -14, hour: 11, duration: 90,
    location: 'Google Meet',
    notes: 'Outstanding architecture proposal for multi-region deployment with automated failover. Strong security awareness. Contract approved.',
    interviewers: ['Daniel Krause', 'Thomas Berger'],
    candidateResponse: 'accepted',
    timezone: 'Europe/London',
  },

  // Amara Okafor (offer) — 2 rounds completed
  {
    jobIndex: 2, candidateIndex: 6,
    title: 'Introductory Technical Call',
    type: 'video', status: 'completed',
    daysOffset: -12, hour: 13, duration: 45,
    location: 'Google Meet',
    notes: 'Strong platform engineering background. Good experience with Terraform and observability tooling.',
    interviewers: ['Daniel Krause'],
    candidateResponse: 'accepted',
    timezone: 'Africa/Lagos',
  },
  {
    jobIndex: 2, candidateIndex: 6,
    title: 'Hands-On Technical Challenge Review',
    type: 'technical', status: 'completed',
    daysOffset: -6, hour: 15, duration: 75,
    location: 'Google Meet',
    notes: 'Well-structured solution to the Dockerized deployment exercise. Clean IaC approach. Offer being prepared.',
    interviewers: ['Daniel Krause', 'Marcus Reiter'],
    candidateResponse: 'accepted',
    timezone: 'Africa/Lagos',
  },

  // Yuki Tanaka (interview) — 1 upcoming
  {
    jobIndex: 2, candidateIndex: 7,
    title: 'Technical Assessment — Container Orchestration',
    type: 'technical', status: 'scheduled',
    daysOffset: 3, hour: 9, duration: 60,
    location: 'Google Meet',
    notes: 'Focus on Docker best practices, CI pipeline design, and monitoring strategies.',
    interviewers: ['Daniel Krause'],
    candidateResponse: 'accepted',
    timezone: 'Asia/Tokyo',
  },

  // Lucas Andersson (interview) — 1 completed, 1 upcoming
  {
    jobIndex: 2, candidateIndex: 8,
    title: 'Initial Phone Screen',
    type: 'phone', status: 'completed',
    daysOffset: -4, hour: 10, duration: 30,
    location: null,
    notes: 'Good automation mindset. Relevant experience with GitHub Actions and Postgres ops. Moving to technical round.',
    interviewers: ['Anna Weiss'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Stockholm',
  },
  {
    jobIndex: 2, candidateIndex: 8,
    title: 'Technical Deep-Dive — Infrastructure as Code',
    type: 'technical', status: 'scheduled',
    daysOffset: 8, hour: 14, duration: 75,
    location: 'Google Meet',
    notes: 'Practical exercise: design a CI/CD pipeline for a multi-service deployment with rollback support.',
    interviewers: ['Daniel Krause', 'Thomas Berger'],
    candidateResponse: 'pending',
    timezone: 'Europe/Stockholm',
  },

  // ──────────────────────────────────────────
  // Job 3: Technical Writer
  // ──────────────────────────────────────────

  // Felix Weber (offer) — 2 rounds completed
  {
    jobIndex: 3, candidateIndex: 12,
    title: 'Writing Sample Review & Discussion',
    type: 'video', status: 'completed',
    daysOffset: -11, hour: 10, duration: 45,
    location: 'Google Meet',
    notes: 'Excellent technical writing samples. Clear information architecture and reader-first approach.',
    interviewers: ['Lisa Hoffmann'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },
  {
    jobIndex: 3, candidateIndex: 12,
    title: 'Editorial Discussion & Team Integration',
    type: 'video', status: 'completed',
    daysOffset: -4, hour: 14, duration: 60,
    location: 'Google Meet',
    notes: 'Strong docs-as-code experience and excellent editorial judgment. Great fit for the team. Offer recommended.',
    interviewers: ['Lisa Hoffmann', 'Sarah Chen'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },

  // David Kim (interview) — 1 upcoming
  {
    jobIndex: 3, candidateIndex: 14,
    title: 'Technical Writing Assessment Review',
    type: 'video', status: 'scheduled',
    daysOffset: 5, hour: 10, duration: 60,
    location: 'Google Meet',
    notes: 'Review submitted API documentation sample. Discuss approach to developer docs and information architecture.',
    interviewers: ['Lisa Hoffmann'],
    candidateResponse: 'accepted',
    timezone: 'Asia/Seoul',
  },

  // Alexander Johansson (interview) — 1 cancelled + rescheduled
  {
    jobIndex: 3, candidateIndex: 16,
    title: 'Introductory Call',
    type: 'phone', status: 'cancelled',
    daysOffset: -3, hour: 15, duration: 30,
    location: null,
    notes: 'Candidate requested reschedule due to conflict. Rebooked for next week.',
    interviewers: ['Lisa Hoffmann'],
    candidateResponse: 'declined',
    timezone: 'Europe/Stockholm',
  },
  {
    jobIndex: 3, candidateIndex: 16,
    title: 'Introductory Call (Rescheduled)',
    type: 'video', status: 'scheduled',
    daysOffset: 6, hour: 13, duration: 30,
    location: 'Google Meet',
    notes: 'Rescheduled from last week. Discuss writing background and interest in the role.',
    interviewers: ['Lisa Hoffmann'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Stockholm',
  },

  // ──────────────────────────────────────────
  // Job 4: Frontend Engineering Intern
  // ──────────────────────────────────────────

  // Emma Schmidt (interview) — 1 completed, 1 upcoming
  {
    jobIndex: 4, candidateIndex: 0,
    title: 'Intro Call — Internship Overview',
    type: 'video', status: 'completed',
    daysOffset: -5, hour: 14, duration: 30,
    location: 'Google Meet',
    notes: 'Very enthusiastic and well-prepared. Impressive personal projects using Vue and Tailwind. Strong learning velocity.',
    interviewers: ['Sarah Chen'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },
  {
    jobIndex: 4, candidateIndex: 0,
    title: 'Technical Screen — Frontend Fundamentals',
    type: 'technical', status: 'scheduled',
    daysOffset: 4, hour: 10, duration: 60,
    location: 'Google Meet',
    notes: 'Assess HTML/CSS/JS fundamentals, component thinking, and basic Vue.js understanding.',
    interviewers: ['Marcus Reiter'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Berlin',
  },

  // Sofia Dubois (interview) — 1 upcoming
  {
    jobIndex: 4, candidateIndex: 2,
    title: 'Internship Interview — Skills & Motivation',
    type: 'video', status: 'scheduled',
    daysOffset: 2, hour: 16, duration: 45,
    location: 'Google Meet',
    notes: 'Discuss academic projects, frontend experience, and career goals in software engineering.',
    interviewers: ['Sarah Chen', 'Marcus Reiter'],
    candidateResponse: 'accepted',
    timezone: 'Europe/Paris',
  },
]

// Sample responses for questions
function generateResponses(jobIndex: number, candidateIndex: number): Record<string, string | string[] | boolean> {
  const candidate = CANDIDATES_DATA[candidateIndex]
  if (!candidate) {
    return {}
  }

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
    const year = getArrayItemOrThrow(years, i, 'TypeScript years response')
    const framework = getArrayItemOrThrow(frameworks, i, 'framework response')
    const problem = getArrayItemOrThrow(problems, i, 'problem response')
    const start = getArrayItemOrThrow(starts, i, 'start date response')
    return {
      'Years of TypeScript experience': year,
      'Preferred frontend framework': framework,
      'Describe a challenging technical problem you solved recently': problem,
      'Link to your GitHub profile or portfolio': `https://github.com/${candidate.firstName.toLowerCase()}${candidate.lastName.toLowerCase().replace(/['\s]/g, '')}`,
      'When can you start?': start,
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
    const tool = getArrayItemOrThrow(tools, i, 'design tool response')
    const process = getArrayItemOrThrow(processes, i, 'design process response')
    return {
      'Link to your portfolio': `https://dribbble.com/${candidate.firstName.toLowerCase()}${candidate.lastName.toLowerCase().charAt(0)}`,
      'Primary design tool': tool,
      'Walk us through your design process for a recent project': process,
      'I have experience with design systems': candidateIndex % 2 === 0,
    }
  }
  if (jobIndex === 2) {
    const platforms = [['AWS', 'Hetzner'], ['GCP', 'AWS', 'Azure'], ['AWS', 'DigitalOcean'], ['Hetzner', 'DigitalOcean'], ['AWS', 'GCP'], ['Azure']]
    const ciPlatforms = ['GitHub Actions', 'GitLab CI', 'GitHub Actions', 'Jenkins', 'GitHub Actions', 'CircleCI']
    const dockerYears = ['3', '4', '5', '6', '2', '7']
    const i = candidateIndex % platforms.length
    const platformList = getArrayItemOrThrow(platforms, i, 'cloud platform response')
    const ciPlatform = getArrayItemOrThrow(ciPlatforms, i, 'CI/CD platform response')
    const dockerYear = getArrayItemOrThrow(dockerYears, i, 'docker years response')
    return {
      'Which cloud platforms have you worked with?': platformList,
      'Years of Docker experience': dockerYear,
      'Preferred CI/CD platform': ciPlatform,
    }
  }
  return {}
}

// ─────────────────────────────────────────────
// Main Seed Function
// ─────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding Reqcore demo data...\n')

  // ─────────────────────────────────────────────
  // Clean up legacy applirank.com seed data
  // ─────────────────────────────────────────────
  const [legacyOrgResult, legacyUserResult] = await Promise.all([
    db
      .select({ id: schema.organization.id })
      .from(schema.organization)
      .where(eq(schema.organization.slug, LEGACY_ORG_SLUG))
      .limit(1),
    db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, LEGACY_DEMO_EMAIL))
      .limit(1),
  ])
  const [legacyOrg] = legacyOrgResult
  const [legacyUser] = legacyUserResult
  if (legacyOrg || legacyUser) {
    console.log('🧹 Removing legacy applirank.com demo data...')

    if (legacyOrg) {
      // All child tables (jobs, candidates, applications, members, etc.) have
      // onDelete: 'cascade' so deleting the org removes everything beneath it.
      await db.delete(schema.organization).where(eq(schema.organization.id, legacyOrg.id))
      console.log(`   ✅ Deleted legacy org: ${LEGACY_ORG_SLUG}`)
    }

    if (legacyUser) {
      // sessions and accounts also cascade from the user row
      await db.delete(schema.user).where(eq(schema.user.id, legacyUser.id))
      console.log(`   ✅ Deleted legacy user: ${LEGACY_DEMO_EMAIL}`)
    }
  }

  // ─────────────────────────────────────────────
  // Upsert demo user (handles email rename scenarios)
  // ─────────────────────────────────────────────
  const [existingDemoUser] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, DEMO_EMAIL))
    .limit(1)

  const hashedPassword = await hashPassword(DEMO_PASSWORD)
  let userId: string

  if (existingDemoUser) {
    userId = existingDemoUser.id
    // Ensure password is up to date in case it changed
    await db
      .update(schema.account)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.account.userId, userId))
    console.log(`✅ Demo user already exists: ${DEMO_EMAIL}`)
  }
  else {
    userId = id()
    await db.insert(schema.user).values({
      id: userId,
      name: 'Demo Recruiter',
      email: DEMO_EMAIL,
      emailVerified: true,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    })
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
  }

  // ─────────────────────────────────────────────
  // Upsert demo org (handles partial migration)
  // ─────────────────────────────────────────────
  const [existingOrg] = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.slug, DEMO_ORG_SLUG))
    .limit(1)

  if (existingOrg) {
    // Org exists — ensure the demo user is a member, then stop
    const [existingMember] = await db
      .select({ id: schema.member.id })
      .from(schema.member)
      .where(eq(schema.member.userId, userId))
      .limit(1)

    if (!existingMember) {
      await db.insert(schema.member).values({
        id: id(),
        userId,
        organizationId: existingOrg.id,
        role: 'owner',
        createdAt: daysAgo(30),
      })
      console.log('✅ Linked demo user to existing org as owner')
    }

    console.log('⚠️  Demo organization already exists. Skipping full seed.')
    console.log('   To re-seed all data, delete the organization first or reset the database.')
    await client.end()
    return
  }

  // 2. Create organization (fresh seed path)
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
    const jobId = jobIds[jobIndex]
    if (!questions || !jobId) {
      throw new Error(`Invalid seed configuration for questions at job index ${jobIndex}`)
    }

    const questionIds: { questionId: string; label: string }[] = []

    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi]
      if (!q) {
        continue
      }

      const questionId = id()
      questionIds.push({ questionId, label: q.label })

      await db.insert(schema.jobQuestion).values({
        id: questionId,
        organizationId: orgId,
        jobId,
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
  const applicationMap = new Map<string, string>() // key: "jobIndex-candidateIndex" → applicationId

  for (let jobIndex = 0; jobIndex < JOB_APPLICATIONS.length; jobIndex++) {
    const apps = JOB_APPLICATIONS[jobIndex]
    const jobId = jobIds[jobIndex]
    if (!apps || !jobId) {
      throw new Error(`Invalid seed configuration for applications at job index ${jobIndex}`)
    }

    for (const app of apps) {
      const candidateId = candidateIds[app.candidateIndex]
      if (!candidateId) {
        throw new Error(`Missing candidate ID for candidate index ${app.candidateIndex}`)
      }

      const applicationId = id()
      applicationMap.set(`${jobIndex}-${app.candidateIndex}`, applicationId)
      const createdDaysAgo = 1 + Math.floor(Math.random() * 15)

      await db.insert(schema.application).values({
        id: applicationId,
        organizationId: orgId,
        candidateId,
        jobId,
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

  // 7. Create interviews
  let totalInterviews = 0

  for (const iv of INTERVIEWS_DATA) {
    const applicationId = applicationMap.get(`${iv.jobIndex}-${iv.candidateIndex}`)
    if (!applicationId) {
      console.warn(`⚠️  Skipping interview "${iv.title}" — no application found for job ${iv.jobIndex}, candidate ${iv.candidateIndex}`)
      continue
    }

    const scheduledAt = dateWithOffset(iv.daysOffset, iv.hour, iv.minute ?? 0)
    const responded = iv.candidateResponse !== 'pending'

    await db.insert(schema.interview).values({
      id: id(),
      organizationId: orgId,
      applicationId,
      title: iv.title,
      type: iv.type,
      status: iv.status,
      scheduledAt,
      duration: iv.duration,
      location: iv.location,
      notes: iv.notes,
      interviewers: iv.interviewers,
      createdById: userId,
      candidateResponse: iv.candidateResponse,
      candidateRespondedAt: responded ? daysAgo(Math.abs(iv.daysOffset) + 2) : null,
      invitationSentAt: responded ? daysAgo(Math.abs(iv.daysOffset) + 3) : null,
      timezone: iv.timezone,
      createdAt: daysAgo(Math.abs(iv.daysOffset) + 4),
      updatedAt: daysAgo(Math.abs(iv.daysOffset) + 1),
    })

    totalInterviews++
  }

  console.log(`✅ Created ${totalInterviews} interviews across the pipeline`)

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
