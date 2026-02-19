<script setup lang="ts">
import {
  ArrowRight,
  Github,
  Check,
  Hammer,
  Telescope,
  Star,
  ChevronRight,
  Layers,
  LogIn,
  Palette,
  Briefcase,
  Users,
  GitBranch,
  FileText,
  Globe,
  ClipboardList,
  LayoutDashboard,
  Search,
  ScanText,
  Sparkles,
  MessageSquare,
  Mail,
  Shield,
  type LucideIcon,
} from 'lucide-vue-next'

useSeoMeta({
  title: 'Product Roadmap — Open-Source ATS Development',
  description:
    'See what we\'ve shipped, what we\'re building, and where we\'re headed. Follow the transparent Applirank product roadmap.',
  ogTitle: 'Applirank Roadmap — Open-Source ATS Development',
  ogDescription:
    'Follow the Applirank product roadmap — transparent progress on the open-source ATS you actually own.',
  ogType: 'website',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Applirank Product Roadmap',
  twitterDescription:
    'Transparent progress updates on the open-source ATS you actually own.',
})

useHead({
  bodyAttrs: {
    style: 'background-color: #09090b;',
  },
})

const { data: session } = await authClient.useSession(useFetch)

// ─── Roadmap data ──────────────────────────────────────────

type RoadmapStatus = 'shipped' | 'building' | 'vision'

interface RoadmapItem {
  title: string
  description: string
  highlights: string[]
  icon: LucideIcon
  status: RoadmapStatus
}

const items: RoadmapItem[] = [
  {
    title: 'Foundation',
    description: 'The bedrock layer — infrastructure, ORM, auth, and the domain data model that everything else builds on.',
    highlights: [
      'Nuxt 4 with app/ directory structure',
      'PostgreSQL 16 + MinIO object storage',
      'Drizzle ORM with auto-migrations on startup',
      'Zod-validated environment configuration',
      'Better Auth with organization plugin',
      'Full domain schema: jobs, candidates, applications, documents',
    ],
    icon: Layers,
    status: 'shipped',
  },
  {
    title: 'Auth & Navigation',
    description: 'Complete authentication flows and the recruiter app shell with sidebar navigation.',
    highlights: [
      'Sign-up and sign-in pages with validation',
      'Organization creation and switching',
      'Auth, guest, and require-org middleware',
      'Dashboard layout with collapsible sidebar',
      'Dynamic job context sub-navigation',
    ],
    icon: LogIn,
    status: 'shipped',
  },
  {
    title: 'Landing Page',
    description: 'A cinematic dark-mode marketing page that communicates the product vision at first glance.',
    highlights: [
      'Linear/Raycast-inspired dark aesthetic',
      'Glass-morphism cards and glow effects',
      'Auth-aware navbar with session detection',
      'Terminal deploy snippet and tech stack grid',
      'Full SEO meta tags and OpenGraph',
    ],
    icon: Palette,
    status: 'shipped',
  },
  {
    title: 'Job Management',
    description: 'Full lifecycle management for job postings — from draft to archived, with complete CRUD.',
    highlights: [
      'Create, read, update, delete jobs',
      'Status workflow: draft → open → closed → archived',
      'Job list with filtering and search',
      'Job detail page with inline editing',
      'Shared Zod validation on client and server',
    ],
    icon: Briefcase,
    status: 'shipped',
  },
  {
    title: 'Candidate Management',
    description: 'A per-organization talent pool with deduplication, documents, and application history.',
    highlights: [
      'Candidate CRUD with org-scoped access',
      'Email-based deduplication on creation',
      'Candidate detail with tabbed interface',
      'Application history and document list',
      'Direct candidate creation form',
    ],
    icon: Users,
    status: 'shipped',
  },
  {
    title: 'Applications & Pipeline',
    description: 'The core hiring workflow — link candidates to jobs and track them through customizable stages.',
    highlights: [
      'Kanban pipeline view per job',
      'Drag-and-drop stage transitions',
      'Application detail with notes and scoring',
      'Status transition validation rules',
      'Candidate detail sidebar on pipeline cards',
      'Duplicate application prevention',
    ],
    icon: GitBranch,
    status: 'shipped',
  },
  {
    title: 'Document Storage',
    description: 'Secure, server-proxied document management — resumes and cover letters stored in MinIO.',
    highlights: [
      'Multipart upload to S3-compatible storage',
      'Server-proxied download streaming',
      'Inline PDF preview in candidate sidebar',
      'Private bucket policy enforced on startup',
      'Filename sanitization and per-candidate limits',
      'Storage keys never exposed to clients',
    ],
    icon: FileText,
    status: 'shipped',
  },
  {
    title: 'Public Job Board',
    description: 'A public-facing job listing that applicants can browse without creating an account.',
    highlights: [
      'SEO-friendly slug-based URLs',
      'Custom slug support for recruiters',
      'Public job detail with full description',
      'No authentication required to browse',
      'Responsive layout with public theme',
    ],
    icon: Globe,
    status: 'shipped',
  },
  {
    title: 'Application Forms',
    description: 'Custom application forms with 9 field types — from text inputs to file uploads — with public submission.',
    highlights: [
      'Drag-and-drop question reordering',
      '9 field types including file upload',
      'Public apply endpoint with rate limiting',
      'Anti-spam honeypot field protection',
      'Magic byte MIME type validation',
      'Shareable application link per job',
    ],
    icon: ClipboardList,
    status: 'shipped',
  },
  {
    title: 'Dashboard',
    description: 'An at-a-glance command center — the first screen recruiters see when they sign in.',
    highlights: [
      'Stat cards: open jobs, candidates, applications, unreviewed',
      'Pipeline breakdown bar chart with color-coded stages',
      'Recent applications feed with relative timestamps',
      'Top active jobs by application count',
      'Quick actions and welcome empty state for new orgs',
      'Responsive layout with loading skeleton states',
    ],
    icon: LayoutDashboard,
    status: 'shipped',
  },
  {
    title: 'Organic SEO',
    description: 'Search-engine optimization foundation — sitemap, structured data, blog, and meta tags for organic discovery.',
    highlights: [
      'Dynamic sitemap with all open job postings',
      'JSON-LD structured data: JobPosting, Organization, Article',
      'Blog engine with Markdown content and prose styling',
      'Full OG + Twitter Card meta on all public pages',
      'Salary, remote status, and validity fields for Google Jobs',
      'Robots directives blocking private routes from crawlers',
    ],
    icon: Search,
    status: 'shipped',
  },
  {
    title: 'Resume Parsing',
    description: 'Intelligent PDF extraction that turns unstructured resumes into structured, searchable candidate data.',
    highlights: [
      'PDF text extraction service',
      'Contact, experience, education, skills → JSON',
      'Parsed data stored on document record',
      'Auto-fill candidate fields from resume',
      'Structured display on candidate detail',
    ],
    icon: ScanText,
    status: 'building',
  },
  {
    title: 'AI Ranking',
    description: 'The Glass Box — transparent candidate matching where every AI decision is explainable and auditable.',
    highlights: [
      'Configurable ranking criteria per job',
      'Job requirements ↔ candidate skills matching',
      'Visible matching-logic summary per candidate',
      'Highlighted skill matches on candidate cards',
      'Local AI via Ollama for privacy-first orgs',
    ],
    icon: Sparkles,
    status: 'vision',
  },
  {
    title: 'Team Collaboration',
    description: 'Bring hiring managers into the loop with structured feedback, comments, and role-based access.',
    highlights: [
      'Threaded comments on applications',
      'Activity log per candidate and job',
      'Role-based permissions: recruiter, manager, admin',
      'Team mentions and notifications',
    ],
    icon: MessageSquare,
    status: 'vision',
  },
  {
    title: 'Communication',
    description: 'Close the loop with candidates — schedule interviews, send updates, and provide status tracking.',
    highlights: [
      'Interview scheduling with calendar sync',
      'Email templates for candidate outreach',
      'Candidate self-service portal',
      'Application status notifications',
    ],
    icon: Mail,
    status: 'vision',
  },
  {
    title: 'Production Hardening',
    description: 'Everything needed to run Applirank in production with confidence — security, compliance, and reliability.',
    highlights: [
      'Live on Railway with auto-TLS and Cloudflare CDN',
      'Security headers, rate limiting, and server-proxied docs',
      'In-app feedback system with GitHub Issues integration',
      'Postgres and S3 backup & restore (planned)',
      'GDPR data export and deletion (planned)',
      'CI/CD pipeline and test suite (planned)',
    ],
    icon: Shield,
    status: 'building',
  },
]

// ─── Scroll tracking ──────────────────────────────────────

const scrollContainer = useTemplateRef<HTMLElement>('timeline')
const introCardRef = useTemplateRef<HTMLElement>('introCard')
const scrollProgress = ref(0)

function onScroll() {
  const el = scrollContainer.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  scrollProgress.value = max > 0 ? el.scrollLeft / max : 0
}

/** Convert vertical mousewheel into horizontal scroll with smooth animation */
let scrollTarget = 0
let isAnimating = false

function smoothScrollTo() {
  const el = scrollContainer.value
  if (!el) { isAnimating = false; return }
  const diff = scrollTarget - el.scrollLeft
  if (Math.abs(diff) < 0.5) { isAnimating = false; return }
  el.scrollLeft += diff * 0.15
  requestAnimationFrame(smoothScrollTo)
}

function onWheel(e: WheelEvent) {
  const el = scrollContainer.value
  if (!el) return
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault()
    scrollTarget = Math.max(0, Math.min(
      el.scrollWidth - el.clientWidth,
      (isAnimating ? scrollTarget : el.scrollLeft) + e.deltaY * 1.2
    ))
    if (!isAnimating) {
      isAnimating = true
      requestAnimationFrame(smoothScrollTo)
    }
  }
}

onMounted(() => {
  const el = scrollContainer.value
  if (!el) return
  el.addEventListener('scroll', onScroll, { passive: true })
  el.addEventListener('wheel', onWheel, { passive: false })

  // Scroll to the intro card so it's the first thing users see
  nextTick(() => {
    const card = introCardRef.value
    if (!card) return
    const cardCenter = card.offsetLeft + card.offsetWidth / 2
    el.scrollLeft = cardCenter - el.clientWidth / 2
    scrollTarget = el.scrollLeft
    onScroll()
  })
})

onUnmounted(() => {
  const el = scrollContainer.value
  if (!el) return
  el.removeEventListener('scroll', onScroll)
  el.removeEventListener('wheel', onWheel)
})

// ─── Status helpers ────────────────────────────────────────

const statusConfig = {
  shipped: {
    label: 'Shipped',
    color: 'text-success-400',
    bg: 'bg-success-400/10',
    border: 'border-success-400/20',
    line: 'bg-success-400',
    dot: 'bg-success-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
    glow: 'from-transparent via-success-500/30 to-transparent',
  },
  building: {
    label: 'Building',
    color: 'text-brand-400',
    bg: 'bg-brand-400/10',
    border: 'border-brand-400/20',
    line: 'bg-brand-400',
    dot: 'bg-brand-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]',
    glow: 'from-transparent via-brand-500/30 to-transparent',
  },
  vision: {
    label: 'The Vision',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
    line: 'bg-purple-400/40',
    dot: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.4)]',
    glow: 'from-transparent via-purple-500/30 to-transparent',
  },
} as const

const shippedItems = computed(() => items.filter(item => item.status === 'shipped'))
const upcomingItems = computed(() => items.filter(item => item.status !== 'shipped'))
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-white antialiased">

    <!-- ─── Navbar ─────────────────────────────────────── -->
    <nav class="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <NuxtLink to="/" class="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-white">
          <span class="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-xs font-black text-white">A</span>
          Applirank
        </NuxtLink>

        <div class="flex items-center gap-2">
          <NuxtLink
            to="/jobs"
            class="hidden rounded-md px-3 py-1.5 text-[13px] font-medium text-surface-400 transition hover:text-white sm:inline-flex"
          >
            Open Positions
          </NuxtLink>
          <NuxtLink
            to="/roadmap"
            class="hidden rounded-md px-3 py-1.5 text-[13px] font-medium text-white transition sm:inline-flex"
          >
            Roadmap
          </NuxtLink>
          <NuxtLink
            to="/blog"
            class="hidden rounded-md px-3 py-1.5 text-[13px] font-medium text-surface-400 transition hover:text-white sm:inline-flex"
          >
            Blog
          </NuxtLink>
          <a
            href="https://github.com/applirank/applirank"
            target="_blank"
            rel="noopener noreferrer"
            class="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-surface-400 transition hover:text-white sm:flex"
          >
            <Github class="h-3.5 w-3.5" />
            GitHub
          </a>

          <template v-if="session">
            <NuxtLink
              to="/dashboard"
              class="rounded-md bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#09090b] transition hover:bg-white/90"
            >
              Dashboard
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink
              to="/auth/sign-in"
              class="rounded-md px-3 py-1.5 text-[13px] font-medium text-surface-400 transition hover:text-white"
            >
              Sign In
            </NuxtLink>
            <NuxtLink
              to="/auth/sign-up"
              class="rounded-md bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#09090b] transition hover:bg-white/90"
            >
              Get Started
            </NuxtLink>
          </template>
        </div>
      </div>
    </nav>

    <!-- ─── Main scrollable area ───────────────────────── -->
    <div
      ref="timeline"
      class="h-screen overflow-x-auto overflow-y-hidden"
      style="scrollbar-width: none;"
    >
      <div class="relative flex h-full min-w-max items-end px-6 pb-[18vh]">

        <!-- ─── Grid pattern overlay ─────────────────── -->
        <div
          class="pointer-events-none fixed inset-0 opacity-[0.025]"
          aria-hidden="true"
          :style="{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }"
        />

        <!-- ─── Ambient glow blobs ───────────────────── -->
        <div class="pointer-events-none fixed inset-0" aria-hidden="true">
          <div class="absolute top-1/4 left-[10%] h-[500px] w-[600px] rounded-full bg-success-500/[0.04] blur-[150px]" />
          <div class="absolute top-1/3 left-[55%] h-[400px] w-[500px] rounded-full bg-brand-500/[0.06] blur-[130px]" />
          <div class="absolute top-1/4 right-[5%] h-[400px] w-[500px] rounded-full bg-surface-500/[0.03] blur-[120px]" />
        </div>

        <!-- ─── Timeline line (bottom axis) ──────────── -->
        <div class="absolute right-0 bottom-[18vh] left-0 h-px">
          <!-- Base line -->
          <div class="absolute inset-0 bg-white/[0.06]" />
          <!-- Progress glow -->
          <div
            class="absolute inset-y-0 left-0 bg-gradient-to-r from-success-400/80 via-brand-400/60 to-brand-400/0"
            :style="{ width: `${Math.max(scrollProgress * 100, 2)}%` }"
          />
          <!-- Progress glow halo -->
          <div
            class="absolute -top-[2px] -bottom-[2px] left-0 bg-gradient-to-r from-success-400/20 via-brand-400/15 to-transparent blur-sm"
            :style="{ width: `${Math.max(scrollProgress * 100, 2)}%` }"
          />
        </div>

        <!-- Left spacer -->
        <div class="w-24 shrink-0" />

        <!-- ─── Shipped cards (left of intro) ────────── -->
        <div
          v-for="(item, i) in shippedItems"
          :key="'shipped-' + i"
          :data-card-index="i"
          class="relative mr-24 flex shrink-0 flex-col items-center"
        >
          <!-- Card -->
          <div
            class="group relative flex h-[500px] w-[500px] flex-col overflow-hidden rounded-2xl border bg-white/[0.025] backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.05]"
            :class="[
              item.status === 'vision'
                ? 'border-white/[0.06] hover:border-white/[0.12]'
                : 'border-white/[0.08] hover:border-white/[0.18]',
            ]"
          >
            <!-- Top edge glow on hover -->
            <div
              class="absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              :class="statusConfig[item.status].glow"
            />

            <!-- Corner number badge -->
            <div class="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-xs font-medium text-surface-500">
              {{ String(i + 1).padStart(2, '0') }}
            </div>

            <!-- Card content -->
            <div class="flex flex-1 flex-col p-10">
              <!-- Feature icon -->
              <div
                class="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border"
                :class="[statusConfig[item.status].bg, statusConfig[item.status].border]"
              >
                <component :is="item.icon" class="h-5 w-5" :class="statusConfig[item.status].color" :stroke-width="1.75" />
              </div>

              <!-- Status badge -->
              <div class="mb-5 flex items-center gap-2.5">
                <span class="h-2 w-2 rounded-full" :class="statusConfig[item.status].dot" />
                <span
                  class="text-[11px] font-semibold tracking-widest uppercase"
                  :class="statusConfig[item.status].color"
                >
                  {{ statusConfig[item.status].label }}
                </span>
              </div>

              <!-- Title & description -->
              <h3 class="text-xl font-semibold tracking-tight text-white">{{ item.title }}</h3>
              <p class="mt-3 text-[14px] leading-relaxed text-surface-400">
                {{ item.description }}
              </p>

              <!-- Highlights list -->
              <ul class="mt-auto space-y-2.5 border-t border-white/[0.06] pt-6">
                <li
                  v-for="(highlight, j) in item.highlights"
                  :key="j"
                  class="flex items-start gap-2.5 text-[13px] leading-snug"
                >
                  <Check
                    v-if="item.status === 'shipped'"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0"
                    :class="statusConfig[item.status].color"
                    :stroke-width="2.5"
                  />
                  <Hammer
                    v-else-if="item.status === 'building'"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0"
                    :class="statusConfig[item.status].color"
                    :stroke-width="2"
                  />
                  <span
                    v-else
                    class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    :class="statusConfig[item.status].dot"
                  />
                  <span class="text-surface-300">{{ highlight }}</span>
                </li>
              </ul>
            </div>

            <!-- Bottom decorative gradient bar -->
            <div
              class="h-[2px] w-full bg-gradient-to-r opacity-40"
              :class="statusConfig[item.status].glow"
            />
          </div>

          <!-- Vertical connector -->
          <div class="flex flex-col items-center">
            <div
              class="h-8 w-px"
              :class="statusConfig[item.status].line"
            />
            <!-- Dot on the timeline -->
            <div
              class="h-3 w-3 rounded-full"
              :class="statusConfig[item.status].dot"
            />
          </div>
        </div>

        <!-- ─── Roadmap intro card ───────────────────── -->
        <div ref="introCard" class="relative mr-24 flex shrink-0 flex-col items-center">
          <div
            class="group relative flex h-[500px] w-[500px] flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.025] backdrop-blur-xl"
          >
            <!-- Top edge glow -->
            <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

            <div class="flex flex-1 flex-col items-center justify-center p-10 text-center">
              <a
                href="https://github.com/applirank/applirank"
                target="_blank"
                rel="noopener noreferrer"
                class="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-surface-300 transition hover:border-white/[0.15] hover:bg-white/[0.06]"
              >
                <Star class="h-3.5 w-3.5 text-brand-400" :stroke-width="2" />
                Open Source
                <ChevronRight class="h-3 w-3 text-surface-500 transition group-hover:translate-x-0.5" />
              </a>

              <h1 class="text-5xl font-extrabold tracking-tight">
                Roadmap
              </h1>
              <p class="mt-5 max-w-sm text-base leading-relaxed text-surface-400">
                What we've shipped, what we're building, and where we're headed.
              </p>

              <div class="mt-10 flex items-center gap-6 text-[13px]">
                <span class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-success-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                  <span class="text-surface-400">Shipped</span>
                </span>
                <span class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-brand-400 shadow-[0_0_6px_rgba(129,140,248,0.5)]" />
                  <span class="text-surface-400">Building</span>
                </span>
                <span class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.4)]" />
                  <span class="text-surface-400">Vision</span>
                </span>
              </div>

              <p class="mt-8 text-xs text-surface-500">
                ← Shipped &nbsp;&middot;&nbsp; Scroll to explore &nbsp;&middot;&nbsp; Vision →
              </p>
            </div>

            <!-- Bottom decorative gradient bar -->
            <div class="h-[2px] w-full bg-gradient-to-r from-transparent via-brand-500/30 to-transparent opacity-40" />
          </div>

          <!-- Vertical connector -->
          <div class="flex flex-col items-center">
            <div class="h-8 w-px bg-brand-400" />
            <div class="h-3 w-3 rounded-full bg-brand-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
          </div>
        </div>

        <!-- ─── Upcoming cards (right of intro) ──────── -->
        <div
          v-for="(item, i) in upcomingItems"
          :key="'upcoming-' + i"
          :data-card-index="shippedItems.length + i"
          class="relative mr-24 flex shrink-0 flex-col items-center last:mr-0"
        >
          <!-- Card -->
          <div
            class="group relative flex h-[500px] w-[500px] flex-col overflow-hidden rounded-2xl border bg-white/[0.025] backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.05]"
            :class="[
              item.status === 'vision'
                ? 'border-white/[0.06] hover:border-white/[0.12]'
                : 'border-white/[0.08] hover:border-white/[0.18]',
            ]"
          >
            <!-- Top edge glow on hover -->
            <div
              class="absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              :class="statusConfig[item.status].glow"
            />

            <!-- Corner number badge -->
            <div class="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-xs font-medium text-surface-500">
              {{ String(shippedItems.length + i + 1).padStart(2, '0') }}
            </div>

            <!-- Card content -->
            <div class="flex flex-1 flex-col p-10">
              <!-- Feature icon -->
              <div
                class="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border"
                :class="[statusConfig[item.status].bg, statusConfig[item.status].border]"
              >
                <component :is="item.icon" class="h-5 w-5" :class="statusConfig[item.status].color" :stroke-width="1.75" />
              </div>

              <!-- Status badge -->
              <div class="mb-5 flex items-center gap-2.5">
                <span class="h-2 w-2 rounded-full" :class="statusConfig[item.status].dot" />
                <span
                  class="text-[11px] font-semibold tracking-widest uppercase"
                  :class="statusConfig[item.status].color"
                >
                  {{ statusConfig[item.status].label }}
                </span>
              </div>

              <!-- Title & description -->
              <h3 class="text-xl font-semibold tracking-tight text-white">{{ item.title }}</h3>
              <p class="mt-3 text-[14px] leading-relaxed text-surface-400">
                {{ item.description }}
              </p>

              <!-- Highlights list -->
              <ul class="mt-auto space-y-2.5 border-t border-white/[0.06] pt-6">
                <li
                  v-for="(highlight, j) in item.highlights"
                  :key="j"
                  class="flex items-start gap-2.5 text-[13px] leading-snug"
                >
                  <Check
                    v-if="item.status === 'shipped'"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0"
                    :class="statusConfig[item.status].color"
                    :stroke-width="2.5"
                  />
                  <Hammer
                    v-else-if="item.status === 'building'"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0"
                    :class="statusConfig[item.status].color"
                    :stroke-width="2"
                  />
                  <span
                    v-else
                    class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    :class="statusConfig[item.status].dot"
                  />
                  <span class="text-surface-300">{{ highlight }}</span>
                </li>
              </ul>
            </div>

            <!-- Bottom decorative gradient bar -->
            <div
              class="h-[2px] w-full bg-gradient-to-r opacity-40"
              :class="statusConfig[item.status].glow"
            />
          </div>

          <!-- Vertical connector -->
          <div class="flex flex-col items-center">
            <div
              class="h-8 w-px"
              :class="statusConfig[item.status].line"
            />
            <!-- Dot on the timeline -->
            <div
              class="h-3 w-3 rounded-full"
              :class="statusConfig[item.status].dot"
            />
          </div>
        </div>

        <!-- ─── End CTA (right anchor) ───────────────── -->
        <div class="relative ml-8 flex w-72 shrink-0 flex-col items-start justify-end pb-16 sm:w-80">
          <h2 class="text-2xl font-bold tracking-tight">
            Shape the future
          </h2>
          <p class="mt-3 text-sm leading-relaxed text-surface-400">
            Applirank is open source. Suggest features, report bugs, or contribute directly.
          </p>
          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://github.com/applirank/applirank/issues"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-[#09090b] shadow-[0_0_20px_rgba(255,255,255,0.08)] transition hover:bg-white/90"
            >
              <Github class="h-3.5 w-3.5" />
              Open an Issue
            </a>
            <NuxtLink
              to="/auth/sign-up"
              class="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-[13px] font-semibold text-surface-300 transition hover:border-white/[0.2] hover:bg-white/[0.06] hover:text-white"
            >
              Get Started
              <ArrowRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar across browsers while keeping scroll functional */
div[ref="timeline"]::-webkit-scrollbar {
  display: none;
}
</style>
