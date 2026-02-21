<script setup lang="ts">
import {
  ArrowRight,
  Briefcase,
  Database,
  ScanEye,
  UsersRound,
  ShieldCheck,
  Github,
  Rocket,
  Settings,
  Sparkles,
  Droplets,
  KeyRound,
  HardDrive,
  Container,
  ChevronRight,
  Star,
  Map,
  Check,
  Hammer,
  Telescope,
  Quote,
  Play,
} from 'lucide-vue-next'

useSeoMeta({
  title: 'Open-Source Applicant Tracking System — Self-Hosted ATS',
  description:
    'Applirank is a free, open-source ATS you can self-host. Transparent AI candidate ranking, no per-seat pricing, and full data ownership. The best Greenhouse & Lever alternative.',
  ogTitle: 'Applirank — Open-Source Applicant Tracking System',
  ogDescription:
    'Free, self-hosted ATS with auditable AI, zero per-seat fees, and full data ownership. Deploy on your own infrastructure in minutes.',
  ogType: 'website',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Applirank — Open-Source Applicant Tracking System',
  twitterDescription:
    'Self-hosted ATS with transparent AI, no per-seat pricing, and full data ownership.',
})

// ─── Schema.org: Organization + WebSite ──────────────
useSchemaOrg([
  defineOrganization({
    name: 'Applirank',
    url: 'https://applirank.com',
    logo: 'https://applirank.com/og-image.png',
    sameAs: ['https://github.com/applirank/applirank'],
    description: 'Open-source applicant tracking system with transparent AI and full data ownership.',
  }),
  defineWebSite({
    name: 'Applirank',
    description: 'Open-source applicant tracking system with transparent AI, no per-seat pricing, and full data ownership.',
  }),
  defineWebPage({
    name: 'Applirank — Open-Source Applicant Tracking System',
    description: 'Free, self-hosted ATS with auditable AI, zero per-seat fees, and full data ownership.',
  }),
])

const { data: session } = await authClient.useSession(useFetch)

/** Override the light body background for the dark landing page */
useHead({
  bodyAttrs: {
    style: 'background-color: #09090b;',
  },
})

// ─────────────────────────────────────────────
// One-click demo login
// ─────────────────────────────────────────────
const isDemoLoading = ref(false)

async function tryDemo() {
  isDemoLoading.value = true
  try {
    const result = await authClient.signIn.email({
      email: 'demo@applirank.com',
      password: 'demo1234',
    })
    if (result.error) {
      await navigateTo('/auth/sign-in')
      return
    }

    // Activate the demo org before navigating
    const orgsResult = await authClient.organization.list()
    const orgs = orgsResult.data
    const firstOrg = orgs?.[0]
    if (firstOrg) {
      await authClient.organization.setActive({ organizationId: firstOrg.id })
    }

    // Hard navigation to avoid hydration mismatches between dark landing and light dashboard
    window.location.href = '/dashboard'
  }
  catch {
    await navigateTo('/auth/sign-in')
  }
  finally {
    isDemoLoading.value = false
  }
}
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
            class="hidden rounded-md px-3 py-1.5 text-[13px] font-medium text-surface-400 transition hover:text-white sm:inline-flex"
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

    <!-- ─── Hero ───────────────────────────────────────── -->
    <section class="relative overflow-hidden pt-28 pb-24 sm:pt-36 sm:pb-32">
      <!-- Ambient glow -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/[0.07] blur-[120px]" />
        <div class="absolute right-0 bottom-0 h-[400px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-accent-500/[0.05] blur-[100px]" />
      </div>
      <!-- Grid pattern -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
        :style="{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }"
      />

      <div class="relative mx-auto max-w-3xl px-6 text-center">
        <!-- Badge -->
        <a
          href="https://github.com/applirank/applirank"
          target="_blank"
          rel="noopener noreferrer"
          class="group mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-surface-300 transition hover:border-white/[0.15] hover:bg-white/[0.06]"
        >
          <Star class="h-3.5 w-3.5 text-brand-400" :stroke-width="2" />
          Open Source &amp; Self-Hosted
          <ChevronRight class="h-3 w-3 text-surface-500 transition group-hover:translate-x-0.5" />
        </a>

        <h1 class="text-[clamp(2.25rem,5vw,4rem)] leading-[1.08] font-extrabold tracking-tight">
          The open&#8209;source ATS<br />
          <span class="bg-gradient-to-r from-brand-400 via-brand-300 to-accent-400 bg-clip-text text-transparent">you actually own</span>
        </h1>

        <p class="mx-auto mt-6 max-w-xl text-base leading-relaxed text-surface-400 sm:text-lg sm:leading-relaxed">
          Self-hosted applicant tracking system with transparent AI ranking,
          zero per-seat fees, and full data sovereignty. Your candidates, your infra, your rules.
        </p>

        <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            :disabled="isDemoLoading"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] transition hover:bg-brand-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
            @click="tryDemo"
          >
            <Play v-if="!isDemoLoading" class="h-3.5 w-3.5" />
            <div v-else class="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {{ isDemoLoading ? 'Launching…' : 'Try live demo' }}
          </button>
          <NuxtLink
            to="/auth/sign-up"
            class="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#09090b] shadow-[0_0_20px_rgba(255,255,255,0.1)] transition hover:bg-white/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            Get started free
            <ArrowRight class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>
        <p class="mt-3 text-xs text-surface-500">No sign-up needed — instant access with sample data</p>

        <!-- Terminal -->
        <div class="mx-auto mt-14 max-w-lg">
          <div class="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] shadow-2xl shadow-black/50 ring-1 ring-inset ring-white/[0.04]">
            <div class="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
              <span class="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
              <span class="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
              <span class="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
              <span class="ml-2 text-[11px] text-surface-500">terminal</span>
            </div>
            <div class="space-y-1 px-5 py-4 font-mono text-[13px] leading-relaxed text-surface-300">
              <div><span class="text-brand-400">$</span> git clone https://github.com/applirank/applirank</div>
              <div><span class="text-brand-400">$</span> docker compose up -d</div>
              <div><span class="text-brand-400">$</span> npm install &amp;&amp; npm run dev</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Value Props ────────────────────────────────── -->
    <section class="relative border-t border-white/[0.06] py-24 sm:py-32">
      <div class="mx-auto max-w-6xl px-6">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-semibold tracking-[0.2em] text-brand-400 uppercase">Why Applirank</p>
          <h2 class="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            The Glass Box alternative
          </h2>
          <p class="mt-4 text-base leading-relaxed text-surface-400 sm:text-lg">
            Stop renting access to your own talent data. Own your infrastructure,
            audit your AI, and scale without penalty.
          </p>
        </div>

        <div class="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Card: Ownership -->
          <div class="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 ring-1 ring-inset ring-brand-500/20">
              <Database class="h-[18px] w-[18px]" :stroke-width="1.75" />
            </div>
            <h3 class="text-[15px] font-semibold text-white">Ownership over Access</h3>
            <p class="mt-2 text-sm leading-relaxed text-surface-400">
              Your Postgres database, your MinIO storage. Cancel anytime — your talent pool stays with you forever.
            </p>
          </div>

          <!-- Card: Glass Box AI -->
          <div class="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/40 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 ring-1 ring-inset ring-accent-500/20">
              <ScanEye class="h-[18px] w-[18px]" :stroke-width="1.75" />
            </div>
            <h3 class="text-[15px] font-semibold text-white">Auditable Intelligence</h3>
            <p class="mt-2 text-sm leading-relaxed text-surface-400">
              When AI ranks a candidate, it shows the receipts. Every decision comes with a visible matching-logic summary.
            </p>
          </div>

          <!-- Card: No Per-Seat Tax -->
          <div class="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-success-500/40 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-success-500/10 text-success-400 ring-1 ring-inset ring-success-500/20">
              <UsersRound class="h-[18px] w-[18px]" :stroke-width="1.75" />
            </div>
            <h3 class="text-[15px] font-semibold text-white">Anti-Growth Tax</h3>
            <p class="mt-2 text-sm leading-relaxed text-surface-400">
              No per-seat pricing. Add as many recruiters and hiring managers as you need — your bill doesn't change.
            </p>
          </div>

          <!-- Card: Privacy -->
          <div class="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warning-500/40 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-warning-500/10 text-warning-400 ring-1 ring-inset ring-warning-500/20">
              <ShieldCheck class="h-[18px] w-[18px]" :stroke-width="1.75" />
            </div>
            <h3 class="text-[15px] font-semibold text-white">Privacy Sovereignty</h3>
            <p class="mt-2 text-sm leading-relaxed text-surface-400">
              Local-first storage and local AI via Ollama. Candidate PII never has to leave your private network.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Manifesto ──────────────────────────────────── -->
    <section class="relative overflow-hidden border-t border-white/[0.06] py-24 sm:py-32">
      <!-- Glow -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute top-0 left-1/3 h-[500px] w-[600px] -translate-y-1/3 rounded-full bg-brand-500/[0.05] blur-[150px]" />
        <div class="absolute right-0 bottom-1/4 h-[400px] w-[500px] translate-x-1/4 rounded-full bg-accent-500/[0.04] blur-[130px]" />
      </div>

      <div class="relative mx-auto max-w-3xl px-6">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-semibold tracking-[0.2em] text-brand-400 uppercase">Why we exist</p>
          <h2 class="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Stop renting. Start owning.
          </h2>
        </div>

        <!-- Letter-style manifesto card -->
        <div class="relative mt-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 sm:p-12">
          <!-- Decorative quote mark -->
          <Quote
            class="absolute -top-4 left-8 h-8 w-8 rotate-180 text-brand-500/30 sm:left-12"
            :stroke-width="1.5"
          />

          <div class="space-y-6 text-base leading-[1.8] text-surface-300 sm:text-lg sm:leading-[1.85]">
            <p>
              I'm building this because I'm tired of seeing companies get charged
              <span class="font-semibold text-white">huge amounts of money for simple features.</span>
            </p>

            <p>
              If you use Greenhouse or Workday, you know how it works. These big SaaS
              companies don't care about the community. They just want to extract as
              much money as they can &mdash; and they
              <span class="font-semibold text-white">&ldquo;tax&rdquo; you just for growing.</span>
              You're forced to pay them because, until now, there hasn't been a great
              open-source alternative.
            </p>

            <p>
              I want to change that. I'm building a tool that is
              <span class="font-semibold text-white">100% AGPL-3.0 open source</span>
              &mdash; in the same transparent spirit as Grafana or PostHog, but for hiring.
            </p>

            <p>
              This is about giving the power back to the recruiters. You should be able
              to <span class="font-semibold text-white">own your data and your process</span>
              without being squeezed by a corporate boardroom.
            </p>

            <p class="text-lg font-semibold text-white sm:text-xl">
              Let's stop renting our hiring tools and start owning them.
            </p>
          </div>

          <!-- Separator + attribution -->
          <div class="mt-8 flex items-center gap-4 border-t border-white/[0.06] pt-8">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              A
            </div>
            <div>
              <div class="text-sm font-semibold text-white">The Applirank Team</div>
              <div class="text-[13px] text-surface-500">Building the open-source applicant tracking system</div>
            </div>
          </div>
        </div>

        <!-- Inline CTA -->
        <div class="mt-10 flex justify-center">
          <NuxtLink
            to="/auth/sign-up"
            class="group inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-white/[0.2] hover:bg-white/[0.08]"
          >
            Join the mission
            <ArrowRight class="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ─── How It Works ───────────────────────────────── -->
    <section class="relative border-t border-white/[0.06] py-24 sm:py-32">
      <!-- Subtle radial -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute top-1/2 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/[0.03] blur-[100px]" />
      </div>

      <div class="relative mx-auto max-w-6xl px-6">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-semibold tracking-[0.2em] text-brand-400 uppercase">How It Works</p>
          <h2 class="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Up and running in minutes
          </h2>
          <p class="mt-4 text-base leading-relaxed text-surface-400 sm:text-lg">
            No vendor lock-in. No cloud dependencies. Clone, compose, hire.
          </p>
        </div>

        <div class="mt-16 grid gap-4 sm:grid-cols-3">
          <div class="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-7 transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <div class="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 ring-1 ring-inset ring-brand-500/20">
              <Rocket class="h-[18px] w-[18px]" :stroke-width="1.75" />
            </div>
            <div class="mb-2 text-[11px] font-semibold tracking-widest text-surface-500 uppercase">Step 1</div>
            <h3 class="text-[15px] font-semibold text-white">Deploy</h3>
            <p class="mt-2 text-sm leading-relaxed text-surface-400">
              Clone the repo and run <code class="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs text-brand-300">docker compose up</code>.
              Postgres, MinIO, and the app spin up on your infrastructure.
            </p>
          </div>

          <div class="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-7 transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <div class="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 ring-1 ring-inset ring-brand-500/20">
              <Settings class="h-[18px] w-[18px]" :stroke-width="1.75" />
            </div>
            <div class="mb-2 text-[11px] font-semibold tracking-widest text-surface-500 uppercase">Step 2</div>
            <h3 class="text-[15px] font-semibold text-white">Configure</h3>
            <p class="mt-2 text-sm leading-relaxed text-surface-400">
              Create your organization, invite your team, and set up your hiring pipeline. No seat limits, no upsells.
            </p>
          </div>

          <div class="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-7 transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <div class="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 ring-1 ring-inset ring-brand-500/20">
              <Sparkles class="h-[18px] w-[18px]" :stroke-width="1.75" />
            </div>
            <div class="mb-2 text-[11px] font-semibold tracking-widest text-surface-500 uppercase">Step 3</div>
            <h3 class="text-[15px] font-semibold text-white">Hire</h3>
            <p class="mt-2 text-sm leading-relaxed text-surface-400">
              Post jobs, receive applications, and let transparent AI surface the best matches — with full matching logic visible.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Tech Stack ─────────────────────────────────── -->
    <section class="border-t border-white/[0.06] py-24 sm:py-32">
      <div class="mx-auto max-w-6xl px-6">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-semibold tracking-[0.2em] text-brand-400 uppercase">Built With</p>
          <h2 class="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Modern, boring technology
          </h2>
          <p class="mt-4 text-base leading-relaxed text-surface-400 sm:text-lg">
            Battle-tested tools. No exotic dependencies. Easy to understand, contribute to, and maintain.
          </p>
        </div>

        <div class="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div class="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <svg class="h-7 w-7" viewBox="0 0 400 400" fill="none">
              <path d="M227.3 321.7H354c4.5 0 8.9-1.2 12.7-3.5 3.9-2.3 7-5.5 9.2-9.4 2.1-3.9 3.2-8.2 3.1-12.6-.1-4.4-1.4-8.7-3.7-12.4L281 122.6c-2.2-3.8-5.4-6.9-9.2-9.1-3.8-2.2-8.1-3.4-12.5-3.4s-8.7 1.2-12.5 3.4c-3.8 2.2-7 5.3-9.2 9.1l-10.3 17.8-20.2-34.8c-2.3-3.8-5.5-7-9.4-9.2-3.9-2.2-8.2-3.4-12.7-3.4-4.4 0-8.8 1.2-12.7 3.4-3.9 2.2-7.1 5.3-9.4 9.2L46.7 283.8c-2.3 3.8-3.5 8-3.6 12.4-.1 4.4 1 8.7 3.1 12.6 2.1 3.9 5.3 7.1 9.2 9.4 3.9 2.3 8.3 3.5 12.7 3.5h79.9c35.3 0 61.4-15.4 79.3-45.8l53.2-91.7-20.1-34.7-63.3 109.2c-13 22-28.7 29.4-52.7 29.4H88.2l97-167.6 48.3 83.4-26.5 45.6 20.3 35z" fill="#00DC82"/>
            </svg>
            <span class="text-[13px] font-medium text-surface-300">Nuxt 4</span>
          </div>
          <div class="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <svg class="h-7 w-7" viewBox="0 0 25.6 25.6" fill="none">
              <g fill="#336791"><path d="M18.98 20.85c-.36.04-.18-.16-.63-.3-.46-.14-1.06-.48-.8-1 .58-1.08 1.07-.37 1.35-.08.36.37.46.68.37.91-.05.12-.14.2-.3.23l.01.24z"/><path d="M23.6 14.76c-.2-1.54-.6-2.1-1.85-2.78l-.6-.24c.88-1.38 1.6-2.93 1.88-4.08.4-1.6.14-2.38-.3-2.96a7.09 7.09 0 0 0-2.3-1.94 7.38 7.38 0 0 0-2.1-.66c-.33-.62-.54-1.28-1.27-1.72A5.1 5.1 0 0 0 14.66 0c-1.53.08-2.68.74-3.45 1.6-1 .06-1.97.22-2.77.6C7.53 2.57 7 3.14 6.6 3.93 5.37 3.84 3.99 4.3 3 5.21c-.84.77-1.37 1.83-1.27 3.56.03.46.43 3.25 1.15 5.44.4 1.21.85 2.25 1.37 2.88.25.3.53.5.85.55.4.06.8-.13 1.1-.54.82-1.13 1.45-2.2 1.77-4.78.5.22.94.35 1.35.41l-.01.05c-.35.54-.28.62-1.05 1.03-.23.12-.06.34.42.47.52.14 1.73.22 2.78-.62.22.72.28 1.67.22 2.87-.06 1.28-.37 1.65-.73 2.23-.14.22-.28.47-.4.82-.25.67-.12 1.08.28 1.33.36.23 1.02.33 1.78.15 1.35-.33 2.13-.8 2.58-2.48.24-.87.14-2.86.34-4.3.02-.11.04-.18.08-.16.22.16.42.46.6.86.25.55.4 1.22.43 1.73.04.63-.1 1.38-.23 2.15-.2 1.1-.4 2.2-.1 2.93.7 1.64 2.53 1.16 3.68.3.48-.36 1.5-1.3 1.16-3.93z"/></g>
              <path d="M23.1 14.96c-.13-1-1-1.58-2.1-2l-.03-.02c.88-1.38 1.59-2.9 1.86-4.04.35-1.44.14-2.14-.24-2.66l-.02-.02A6.87 6.87 0 0 0 20.34 4.4a6.8 6.8 0 0 0-1.92-.6c-.38-.62-.65-1.29-1.44-1.74A4.8 4.8 0 0 0 14.68.28c-1.4.07-2.48.67-3.22 1.48a8 8 0 0 0-2.6.55c-.85.38-1.32.89-1.7 1.58-1.14-.08-2.36.34-3.26 1.16-.74.68-1.22 1.6-1.13 3.13.03.42.42 3.15 1.12 5.28.37 1.13.79 2.08 1.25 2.65.22.27.45.4.68.44.3.04.57-.12.8-.43.84-1.16 1.5-2.33 1.8-4.8.22.08.43.14.63.18l.34.07v.02c-.4.6-.31.57-1.04.95l-.1.06c-.13.06-.1.2.2.32.04.01.1.03.17.05.42.1 1.4.13 2.36-.46l.13-.09c.17.67.22 1.54.17 2.72-.06 1.27-.38 1.72-.75 2.3l-.06.1c-.13.2-.26.42-.37.72-.2.55-.1.9.25 1.12.18.12.57.28 1.3.1h.03c1.3-.32 1.96-.75 2.37-2.26.17-.63.12-1.95.22-3.4.02-.35.07-.67.15-.76l.04-.06c.04-.05.08-.06.14-.02.2.16.38.42.55.78.23.5.37 1.12.4 1.57.04.63-.1 1.36-.23 2.1-.2 1.1-.41 2.26-.11 2.96.57 1.3 2.1.96 3.17.3h.01c.48-.33 1.35-1.2 1.07-3.38z" fill="#fff"/>
              <path d="M12.1 16.34c-.35.42-.77.64-1.15.72-.38.08-.67-.02-.72-.05.12-.35.26-.6.4-.82.35-.57.7-1.1.77-2.46.07-1.4-.03-2.48-.32-3.28l.03.01c.25.16.52.5.72.98.36.87.58 2.18.27 4.9z" fill="#336791"/>
            </svg>
            <span class="text-[13px] font-medium text-surface-300">PostgreSQL</span>
          </div>
          <div class="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <Droplets class="h-7 w-7 text-[#C5F74F]" :stroke-width="1.5" />
            <span class="text-[13px] font-medium text-surface-300">Drizzle ORM</span>
          </div>
          <div class="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <KeyRound class="h-7 w-7 text-surface-300" :stroke-width="1.5" />
            <span class="text-[13px] font-medium text-surface-300">Better Auth</span>
          </div>
          <div class="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <HardDrive class="h-7 w-7 text-[#C72C48]" :stroke-width="1.5" />
            <span class="text-[13px] font-medium text-surface-300">MinIO / S3</span>
          </div>
          <div class="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center transition hover:border-white/[0.12] hover:bg-white/[0.04]">
            <Container class="h-7 w-7 text-[#2496ED]" :stroke-width="1.5" />
            <span class="text-[13px] font-medium text-surface-300">Docker</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Roadmap ─────────────────────────────────────── -->
    <section class="relative overflow-hidden border-t border-white/[0.06] py-24 sm:py-32">
      <!-- Glow -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute top-1/2 left-1/4 h-[500px] w-[600px] -translate-y-1/2 rounded-full bg-success-500/[0.04] blur-[150px]" />
        <div class="absolute top-1/2 right-1/4 h-[400px] w-[500px] -translate-y-1/2 rounded-full bg-purple-500/[0.04] blur-[130px]" />
      </div>

      <div class="relative mx-auto max-w-6xl px-6">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-semibold tracking-[0.2em] text-brand-400 uppercase">Product Roadmap</p>
          <h2 class="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built in the open
          </h2>
          <p class="mt-4 text-base leading-relaxed text-surface-400 sm:text-lg">
            Every feature is planned publicly. See what we've shipped,
            what we're building, and where the product is headed.
          </p>
        </div>

        <!-- Mini timeline preview -->
        <div class="mt-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 sm:p-10">
          <!-- Timeline stages -->
          <div class="flex items-center justify-between gap-4">
            <!-- Shipped -->
            <div class="flex flex-1 flex-col items-center gap-3 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-success-400/10 ring-1 ring-inset ring-success-400/20">
                <Check class="h-5 w-5 text-success-400" :stroke-width="2.5" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">9</div>
                <div class="text-[13px] font-medium text-success-400">Shipped</div>
              </div>
              <p class="hidden text-xs leading-relaxed text-surface-500 sm:block">
                Foundation, Auth, Jobs, Candidates, Pipeline, Documents, Job Board, Forms, Landing
              </p>
            </div>

            <!-- Connector -->
            <div class="hidden h-px flex-1 bg-gradient-to-r from-success-400/40 to-brand-400/40 sm:block" />

            <!-- Building -->
            <div class="flex flex-1 flex-col items-center gap-3 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-400/10 ring-1 ring-inset ring-brand-400/20">
                <Hammer class="h-5 w-5 text-brand-400" :stroke-width="2" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">1</div>
                <div class="text-[13px] font-medium text-brand-400">Building</div>
              </div>
              <p class="hidden text-xs leading-relaxed text-surface-500 sm:block">
                Recruiter Dashboard with live stats
              </p>
            </div>

            <!-- Connector -->
            <div class="hidden h-px flex-1 bg-gradient-to-r from-brand-400/40 to-purple-400/40 sm:block" />

            <!-- Vision -->
            <div class="flex flex-1 flex-col items-center gap-3 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-400/10 ring-1 ring-inset ring-purple-400/20">
                <Telescope class="h-5 w-5 text-purple-400" :stroke-width="2" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">5</div>
                <div class="text-[13px] font-medium text-purple-400">The Vision</div>
              </div>
              <p class="hidden text-xs leading-relaxed text-surface-500 sm:block">
                AI Ranking, Resume Parsing, Collaboration, Comms, Hardening
              </p>
            </div>
          </div>

          <!-- CTA -->
          <div class="mt-10 flex justify-center">
            <NuxtLink
              to="/roadmap"
              class="group inline-flex items-center gap-2.5 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#09090b] shadow-[0_0_20px_rgba(255,255,255,0.1)] transition hover:bg-white/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              <Map class="h-4 w-4" />
              Explore the Full Roadmap
              <ArrowRight class="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── CTA ────────────────────────────────────────── -->
    <section class="relative overflow-hidden border-t border-white/[0.06] py-24 sm:py-32">
      <!-- Glow -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 translate-y-1/2 rounded-full bg-brand-500/[0.06] blur-[120px]" />
      </div>

      <div class="relative mx-auto max-w-3xl px-6 text-center">
        <h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to own your hiring pipeline?
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-base leading-relaxed text-surface-400 sm:text-lg">
          Deploy in minutes. No credit card required.
          Your data never leaves your infrastructure.
        </p>
        <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <NuxtLink
            to="/auth/sign-up"
            class="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#09090b] shadow-[0_0_20px_rgba(255,255,255,0.1)] transition hover:bg-white/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            Get started
            <ArrowRight class="h-3.5 w-3.5" />
          </NuxtLink>
          <a
            href="https://github.com/applirank/applirank"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-surface-300 transition hover:border-white/[0.2] hover:bg-white/[0.06] hover:text-white"
          >
            <Github class="h-4 w-4" />
            Star on GitHub
          </a>
        </div>
      </div>
    </section>

    <!-- ─── Footer ─────────────────────────────────────── -->
    <footer class="border-t border-white/[0.06] py-8">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div class="flex items-center gap-2 text-[13px] text-surface-500">
          <span class="flex h-5 w-5 items-center justify-center rounded bg-brand-500 text-[9px] font-black text-white">A</span>
          &copy; {{ new Date().getFullYear() }} Applirank. Open source under AGPL-3.0.
        </div>
        <div class="flex gap-6 text-[13px] text-surface-500">
          <NuxtLink to="/roadmap" class="transition hover:text-white">
            Roadmap
          </NuxtLink>
          <NuxtLink to="/blog" class="transition hover:text-white">
            Blog
          </NuxtLink>
          <a
            href="https://github.com/applirank/applirank"
            target="_blank"
            rel="noopener noreferrer"
            class="transition hover:text-white"
          >
            GitHub
          </a>
          <a
            href="https://github.com/applirank/applirank/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            class="transition hover:text-white"
          >
            Docs
          </a>
          <a
            href="https://github.com/applirank/applirank/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            class="transition hover:text-white"
          >
            License
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
