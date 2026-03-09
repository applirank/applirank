<script setup lang="ts">
import {
  BookOpen,
  ChevronRight,
  Download,
  Rocket,
  Container,
  Train,
  KeyRound,
  Briefcase,
  Users,
  FileText,
  Globe,
  ClipboardList,
  LayoutDashboard,
  Layers,
  FolderTree,
  Database,
  ShieldCheck,
  Code,
  FileCode,
  type LucideIcon,
} from 'lucide-vue-next'

defineI18nRoute(false)

definePageMeta({
  i18n: false,
})

useSeoMeta({
  title: 'Documentation — Reqcore Open-Source ATS',
  description:
    'Complete documentation for Reqcore, the open-source applicant tracking system. Covers installation, configuration, deployment, features, architecture, and contributing.',
  ogTitle: 'Reqcore Documentation',
  ogDescription:
    'Guides on installing, configuring, deploying, and contributing to Reqcore — the open-source ATS with full data ownership.',
  ogType: 'website',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Reqcore Documentation',
  twitterDescription:
    'Complete docs for the open-source ATS: installation, deployment, features, and architecture.',
})

useHead({
  bodyAttrs: {
    style: 'background-color: #09090b;',
  },
})

const { data: session } = await authClient.useSession(useFetch)

const { data: allDocs } = await useAsyncData('docs-all', () =>
  queryCollection('docs').order('path', 'ASC').all(),
)

// ─── Icon mapping for sections ────────────────────
const iconMap: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  'download': Download,
  'settings': KeyRound,
  'rocket': Rocket,
  'container': Container,
  'train': Train,
  'key-round': KeyRound,
  'briefcase': Briefcase,
  'users': Users,
  'file-text': FileText,
  'globe': Globe,
  'clipboard-list': ClipboardList,
  'layout-dashboard': LayoutDashboard,
  'layers': Layers,
  'folder-tree': FolderTree,
  'database': Database,
  'shield-check': ShieldCheck,
  'code': Code,
  'file-code': FileCode,
}

// ─── Section definitions ──────────────────────────
interface DocSection {
  key: string
  title: string
  description: string
  icon: LucideIcon
}

const sections: DocSection[] = [
  { key: 'Getting Started', title: 'Getting Started', description: 'Install, configure, and start using Reqcore', icon: Rocket },
  { key: 'Deployment', title: 'Deployment', description: 'Self-host with Docker or deploy to Railway', icon: Container },
  { key: 'Features', title: 'Features', description: 'Jobs, pipeline, documents, and job board', icon: Briefcase },
  { key: 'Architecture', title: 'Architecture', description: 'System design, data model, and security', icon: Layers },
  { key: 'Contributing', title: 'Contributing', description: 'Development setup and coding conventions', icon: Code },
]

// ─── Group docs by section ────────────────────────
const docsBySection = computed(() => {
  if (!allDocs.value) return {}
  const grouped: Record<string, typeof allDocs.value> = {}
  for (const doc of allDocs.value) {
    const section = doc.section || 'Other'
    if (!grouped[section]) grouped[section] = []
    grouped[section].push(doc)
  }
  return grouped
})

function getDocIcon(doc: { icon?: string }): LucideIcon {
  return (doc.icon && iconMap[doc.icon]) || BookOpen
}
</script>

<template>
  <div class="relative min-h-screen bg-[#09090b] text-white">
    <!-- ───── Nav ───── -->
    <PublicNavBar active-page="docs" />

    <!-- ───── Hero ───── -->
    <section class="relative overflow-hidden pt-32 pb-16">
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-brand-500/10 blur-[120px]"
        />
      </div>
      <div class="relative mx-auto max-w-3xl px-6 text-center">
        <div
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-white/60"
        >
          <BookOpen class="size-3.5 text-brand-400" />
          Documentation
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Reqcore Documentation
        </h1>
        <p class="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/50">
          Everything you need to install, deploy, and use Reqcore — the open-source ATS you own.
        </p>
      </div>
    </section>

    <!-- ───── Sections Grid ───── -->
    <section class="mx-auto max-w-4xl px-6 pb-24">
      <div v-for="section in sections" :key="section.key" class="mb-12">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-8 items-center justify-center rounded-lg bg-white/[0.06]">
            <component :is="section.icon" class="size-4 text-brand-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold tracking-tight">{{ section.title }}</h2>
            <p class="text-sm text-white/40">{{ section.description }}</p>
          </div>
        </div>

        <div
          v-if="docsBySection[section.key]?.length"
          class="grid gap-3 sm:grid-cols-2"
        >
          <NuxtLink
            v-for="doc in docsBySection[section.key]"
            :key="doc.path"
            :to="doc.path"
            class="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            <div class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06]">
              <component :is="getDocIcon(doc)" class="size-3.5 text-white/50 group-hover:text-brand-400 transition" />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-medium text-white group-hover:text-brand-400 transition">
                {{ doc.title }}
              </h3>
              <p v-if="doc.description" class="mt-1 text-xs leading-relaxed text-white/40 line-clamp-2">
                {{ doc.description }}
              </p>
            </div>
            <ChevronRight
              class="ml-auto mt-0.5 size-4 shrink-0 text-white/20 transition group-hover:text-brand-400 group-hover:translate-x-0.5"
            />
          </NuxtLink>
        </div>
        <div v-else class="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 text-center text-sm text-white/30">
          Coming soon
        </div>
      </div>
    </section>

    <!-- ───── Footer ───── -->
    <footer class="border-t border-white/[0.06] py-8">
      <div class="mx-auto max-w-5xl px-6 flex items-center justify-between text-xs text-white/30">
        <span>&copy; {{ new Date().getFullYear() }} Reqcore</span>
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="transition hover:text-white/60">Home</NuxtLink>
          <NuxtLink to="/roadmap" class="transition hover:text-white/60">Roadmap</NuxtLink>
          <NuxtLink to="/blog" class="transition hover:text-white/60">Blog</NuxtLink>
          <a
            href="https://github.com/reqcore-inc/reqcore"
            target="_blank"
            class="transition hover:text-white/60"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
