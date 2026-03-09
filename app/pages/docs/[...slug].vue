<script setup lang="ts">
import {
  ArrowLeft,
  Github,
  ChevronRight,
  BookOpen,
  Rocket,
  Container,
  Briefcase,
  Layers,
  Code,
  Scale,
  type LucideIcon,
} from 'lucide-vue-next'

defineI18nRoute(false)

definePageMeta({
  i18n: false,
})

const route = useRoute()

// Build the content path from the slug segments
const slugPath = computed(() => {
  const slug = route.params.slug
  const segments = Array.isArray(slug) ? slug : [slug]
  return `/docs/${segments.join('/')}`
})

const { data: page } = await useAsyncData(`docs-${slugPath.value}`, () =>
  queryCollection('docs').path(slugPath.value).first(),
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

// Fetch all docs for sidebar navigation
const { data: allDocs } = await useAsyncData('docs-sidebar', () =>
  queryCollection('docs').order('path', 'ASC').all(),
)

// ─── SEO ──────────────────────────────────────────
useSeoMeta({
  title: `${page.value.title} — Reqcore Docs`,
  description: page.value.description,
  ogTitle: `${page.value.title} — Reqcore Documentation`,
  ogDescription: page.value.description,
  ogType: 'article',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: `${page.value.title} — Reqcore Docs`,
  twitterDescription: page.value.description,
})

useSchemaOrg([
  defineArticle({
    headline: page.value.title,
    description: page.value.description,
    publisher: {
      '@type': 'Organization',
      name: 'Reqcore',
      url: 'https://reqcore.com',
    },
  }),
])

useHead({
  bodyAttrs: {
    style: 'background-color: #09090b;',
  },
})

const { data: session } = await authClient.useSession(useFetch)

// ─── Sidebar navigation ──────────────────────────
interface SidebarSection {
  key: string
  title: string
  icon: LucideIcon
  docs: Array<{ path: string; title: string; active: boolean }>
}

const sectionIcons: Record<string, LucideIcon> = {
  'Getting Started': Rocket,
  'Deployment': Container,
  'Features': Briefcase,
  'Architecture': Layers,
  'Contributing': Code,
  'Legal': Scale,
}

const sidebarSections = computed<SidebarSection[]>(() => {
  if (!allDocs.value) return []

  const grouped: Record<string, Array<{ path: string; title: string; active: boolean }>> = {}
  const sectionOrder: string[] = []

  for (const doc of allDocs.value) {
    const section = doc.section || 'Other'
    if (!grouped[section]) {
      grouped[section] = []
      sectionOrder.push(section)
    }
    grouped[section].push({
      path: doc.path!,
      title: doc.title!,
      active: doc.path === slugPath.value,
    })
  }

  return sectionOrder.map(key => ({
    key,
    title: key,
    icon: sectionIcons[key] || BookOpen,
    docs: grouped[key] ?? [],
  }))
})

// ─── Prev/Next navigation ─────────────────────────
const flatDocs = computed(() => allDocs.value ?? [])
const currentIndex = computed(() =>
  flatDocs.value.findIndex(d => d.path === slugPath.value),
)
const prevDoc = computed(() =>
  currentIndex.value > 0 ? flatDocs.value[currentIndex.value - 1] : null,
)
const nextDoc = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < flatDocs.value.length - 1
    ? flatDocs.value[currentIndex.value + 1]
    : null,
)
</script>

<template>
  <div class="relative min-h-screen bg-[#09090b] text-white">
    <!-- ───── Nav ───── -->
    <nav
      class="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl"
    >
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <NuxtLink to="/" class="text-[15px] font-semibold tracking-tight">Reqcore</NuxtLink>
        <div class="flex items-center gap-5 text-[13px] text-white/60">
          <NuxtLink to="/roadmap" class="transition hover:text-white">Roadmap</NuxtLink>
          <NuxtLink to="/catalog" class="transition hover:text-white">Features</NuxtLink>
          <NuxtLink to="/blog" class="transition hover:text-white">Blog</NuxtLink>
          <NuxtLink to="/docs" class="text-white transition">Docs</NuxtLink>
          <a
            href="https://github.com/reqcore-inc/reqcore"
            target="_blank"
            class="transition hover:text-white"
          >
            <Github class="size-4" />
          </a>
          <NuxtLink
            v-if="session?.user"
            to="/dashboard"
            class="rounded-md bg-white/10 px-3 py-1 text-white transition hover:bg-white/15"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            v-else
            to="/auth/sign-in"
            class="rounded-md bg-white/10 px-3 py-1 text-white transition hover:bg-white/15"
          >
            Sign In
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- ───── Layout: Sidebar + Content ───── -->
    <div class="mx-auto max-w-6xl px-6 pt-20">
      <div class="flex gap-10">
        <!-- Sidebar -->
        <aside class="hidden w-56 shrink-0 lg:block">
          <div class="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8">
            <NuxtLink
              to="/docs"
              class="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70"
            >
              <ArrowLeft class="size-3.5" />
              All docs
            </NuxtLink>

            <nav class="space-y-5">
              <div v-for="section in sidebarSections" :key="section.key">
                <h4 class="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/30">
                  <component :is="section.icon" class="size-3.5" />
                  {{ section.title }}
                </h4>
                <ul class="space-y-0.5">
                  <li v-for="doc in section.docs" :key="doc.path">
                    <NuxtLink
                      :to="doc.path"
                      class="block rounded-md px-2.5 py-1.5 text-[13px] transition"
                      :class="doc.active
                        ? 'bg-white/[0.08] text-brand-400 font-medium'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.04]'"
                    >
                      {{ doc.title }}
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </aside>

        <!-- Content -->
        <article class="min-w-0 flex-1 pb-24 pt-8">
          <!-- Breadcrumb -->
          <div class="mb-6 flex items-center gap-1.5 text-xs text-white/30">
            <NuxtLink to="/docs" class="transition hover:text-white/60">Docs</NuxtLink>
            <ChevronRight class="size-3" />
            <span v-if="page!.section" class="text-white/40">{{ page!.section }}</span>
            <ChevronRight v-if="page!.section" class="size-3" />
            <span class="text-white/60">{{ page!.title }}</span>
          </div>

          <!-- Title -->
          <header class="mb-10">
            <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
              {{ page!.title }}
            </h1>
            <p v-if="page!.description" class="mt-3 text-base text-white/50 leading-relaxed">
              {{ page!.description }}
            </p>
          </header>

          <!-- Rendered content -->
          <div
            class="docs-prose prose prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-headings:border-0 prose-headings:border-b-0 prose-headings:text-white prose-p:text-white/65 prose-p:leading-relaxed prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-brand-300 prose-code:bg-white/[0.08] prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.8125em] prose-code:font-medium prose-pre:!bg-[#0a0c10] prose-pre:border prose-pre:border-white/[0.12] prose-pre:rounded-xl prose-pre:shadow-xl prose-pre:shadow-black/60 prose-hr:border-white/[0.08] prose-blockquote:border-l-brand-500/50 prose-blockquote:text-white/55 prose-blockquote:not-italic prose-li:text-white/65 prose-td:px-3 prose-td:py-2 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-table:border-collapse prose-tr:border-b prose-tr:border-white/[0.06]"
          >
            <ContentRenderer v-if="page" :value="page" />
          </div>

          <!-- Prev/Next Navigation -->
          <div class="mt-16 grid grid-cols-2 gap-4">
            <NuxtLink
              v-if="prevDoc"
              :to="prevDoc.path!"
              class="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <span class="text-xs text-white/30">Previous</span>
              <span class="mt-1 block text-sm font-medium text-white group-hover:text-brand-400 transition">
                {{ prevDoc.title }}
              </span>
            </NuxtLink>
            <div v-else />
            <NuxtLink
              v-if="nextDoc"
              :to="nextDoc.path!"
              class="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-right transition hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <span class="text-xs text-white/30">Next</span>
              <span class="mt-1 block text-sm font-medium text-white group-hover:text-brand-400 transition">
                {{ nextDoc.title }}
              </span>
            </NuxtLink>
          </div>
        </article>
      </div>
    </div>

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

<style scoped>
/* ── Remove Typography plugin's auto-backticks around inline code ── */
.docs-prose :deep(code::before),
.docs-prose :deep(code::after) {
  content: none !important;
}

/* ── Heading anchor links: Nuxt Content wraps headings in <a> tags.
   Strip the link color + underline so they look like plain headings. ── */
.docs-prose :deep(h1 a),
.docs-prose :deep(h2 a),
.docs-prose :deep(h3 a),
.docs-prose :deep(h4 a) {
  color: inherit !important;
  text-decoration: none !important;
  font-weight: inherit !important;
}

/* ── Remove any border Tailwind Typography adds below headings ── */
.docs-prose :deep(h1),
.docs-prose :deep(h2),
.docs-prose :deep(h3),
.docs-prose :deep(h4) {
  border-bottom: none !important;
  border-top: none !important;
  padding-bottom: 0 !important;
}

/* ── Premium code block: github-dark-high-contrast bg is #0a0c10 ── */
.docs-prose :deep(pre) {
  position: relative;
  overflow-x: auto;
  background-color: #0a0c10 !important;
}

/* Shiki outputs <span> tags with inline color — reset code wrapper only ── */
.docs-prose :deep(pre code) {
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  font-size: 0.875rem;
  line-height: 1.7;
  color: #f0f3f6; /* github-dark-high-contrast base text */
}

/* Force full opacity on all Shiki token spans ── */
.docs-prose :deep(pre code span) {
  opacity: 1 !important;
}

/* ── Refined table styling ── */
.docs-prose :deep(table) {
  border: 1px solid rgb(255 255 255 / 0.07);
  border-radius: 0.75rem;
  overflow: hidden;
}

.docs-prose :deep(thead) {
  background: rgb(255 255 255 / 0.04);
}

.docs-prose :deep(th) {
  border-bottom: 1px solid rgb(255 255 255 / 0.08) !important;
}

/* ── Smooth heading spacing ── */
.docs-prose :deep(h2) {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}

.docs-prose :deep(h3) {
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}
</style>
