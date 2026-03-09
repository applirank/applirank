<script setup lang="ts">
import {
  ChevronRight,
  ChevronDown,
  X,
  Layers,
  Rocket,
  Hammer,
  Telescope,
  HelpCircle,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-vue-next'

// ─── SEO ──────────────────────────────────────────
useSeoMeta({
  title: 'Feature Catalog — Everything We\'re Building',
  description:
    'Browse Reqcore\'s complete feature catalog. See what\'s shipped, in progress, and planned — with competitor comparisons and open discussion.',
  ogTitle: 'Reqcore Feature Catalog',
  ogDescription:
    'Transparent product roadmap with detailed feature descriptions, competitor comparisons, and community discussion.',
  ogType: 'website',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Reqcore Feature Catalog',
  twitterDescription:
    'Browse the complete ATS feature catalog — shipped, building, and planned.',
})

useHead({
  bodyAttrs: {
    style: 'background-color: #09090b;',
  },
})

const { data: session } = await authClient.useSession(useFetch)

// ─── Fetch all catalog items ──────────────────────
const { data: allItems } = await useAsyncData('catalog-items', () =>
  queryCollection('catalog').order('path', 'ASC').all(),
)

// ─── Build tree hierarchy from flat paths ─────────
interface CatalogNode {
  path: string
  title: string
  description?: string
  status?: string
  priority?: string
  complexity?: string
  competitors?: Record<string, string>
  children: CatalogNode[]
  depth: number
  isCategory: boolean
  body?: any
  rawItem?: any
}

function buildTree(items: any[]): CatalogNode[] {
  if (!items?.length) return []

  const nodeMap = new Map<string, CatalogNode>()
  const roots: CatalogNode[] = []

  // First pass: create nodes
  for (const item of items) {
    const path = item.path as string
    // Path looks like /catalog/pipeline-management or /catalog/pipeline-management/job-management
    const segments = path.replace(/^\/catalog\/?/, '').split('/').filter(Boolean)
    const depth = segments.length

    // Category = depth 1 (e.g., "pipeline-management"), features = depth 2+
    const isCategory = depth <= 1

    nodeMap.set(path, {
      path,
      title: item.title || segments[segments.length - 1] || '',
      description: item.description,
      status: item.status,
      priority: item.priority,
      complexity: item.complexity,
      competitors: item.competitors,
      children: [],
      depth,
      isCategory,
      rawItem: item,
    })
  }

  // Second pass: build parent-child relationships
  for (const [path, node] of nodeMap) {
    const segments = path.replace(/^\/catalog\/?/, '').split('/').filter(Boolean)
    if (segments.length <= 1) {
      roots.push(node)
    } else {
      const parentSegments = segments.slice(0, -1)
      const parentPath = '/catalog/' + parentSegments.join('/')
      const parent = nodeMap.get(parentPath)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }
  }

  return roots
}

const tree = computed(() => buildTree(allItems.value || []))

// ─── Expand/collapse state ───────────────────────
const expandedPaths = ref<Set<string>>(new Set())

// Auto-expand all categories on load
watchEffect(() => {
  if (tree.value.length && expandedPaths.value.size === 0) {
    for (const node of tree.value) {
      expandedPaths.value.add(node.path)
    }
  }
})

function toggleExpand(path: string) {
  if (expandedPaths.value.has(path)) {
    expandedPaths.value.delete(path)
  } else {
    expandedPaths.value.add(path)
  }
}

function isExpanded(path: string) {
  return expandedPaths.value.has(path)
}

// ─── Sidebar state ───────────────────────────────
const selectedNode = ref<CatalogNode | null>(null)
const sidebarOpen = ref(false)

function selectFeature(node: CatalogNode) {
  selectedNode.value = node
  sidebarOpen.value = true
}

function closeSidebar() {
  sidebarOpen.value = false
  // Delay clearing to allow transition to finish
  setTimeout(() => {
    if (!sidebarOpen.value) selectedNode.value = null
  }, 300)
}

// ─── Status styling ──────────────────────────────
const statusConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  shipped: { label: 'Shipped', color: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20', icon: Rocket },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500/15 text-blue-400 ring-blue-500/20', icon: Hammer },
  planned: { label: 'Planned', color: 'bg-violet-500/15 text-violet-400 ring-violet-500/20', icon: Telescope },
  considering: { label: 'Considering', color: 'bg-amber-500/15 text-amber-400 ring-amber-500/20', icon: HelpCircle },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: 'High', color: 'bg-rose-500/15 text-rose-400 ring-rose-500/20' },
  medium: { label: 'Medium', color: 'bg-amber-500/15 text-amber-400 ring-amber-500/20' },
  low: { label: 'Low', color: 'bg-surface-500/15 text-surface-400 ring-surface-500/20' },
}

const complexityConfig: Record<string, { label: string; color: string }> = {
  S: { label: 'S', color: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20' },
  M: { label: 'M', color: 'bg-blue-500/15 text-blue-400 ring-blue-500/20' },
  L: { label: 'L', color: 'bg-violet-500/15 text-violet-400 ring-violet-500/20' },
  XL: { label: 'XL', color: 'bg-rose-500/15 text-rose-400 ring-rose-500/20' },
}

// Template helpers — avoid "possibly undefined" TS errors from v-if guard not narrowing
function getStatusConfig(status: string | undefined) {
  return status ? statusConfig[status] : undefined
}
function getPriorityConfig(priority: string | undefined) {
  return priority ? priorityConfig[priority] : undefined
}
function getComplexityConfig(complexity: string | undefined) {
  return complexity ? complexityConfig[complexity] : undefined
}

const competitorLabel: Record<string, string> = {
  poor: '🔴 Poor',
  okay: '🟡 Okay',
  good: '🟢 Good',
  excellent: '🟣 Excellent',
}

const competitorNames: Record<string, string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  workable: 'Workable',
  opencats: 'OpenCATS',
}

// ─── Stats ────────────────────────────────────────
const stats = computed(() => {
  const items = allItems.value || []
  return {
    shipped: items.filter(i => i.status === 'shipped').length,
    inProgress: items.filter(i => i.status === 'in-progress').length,
    planned: items.filter(i => i.status === 'planned').length,
    considering: items.filter(i => i.status === 'considering').length,
    total: items.filter(i => i.status).length,
  }
})
</script>

<template>
  <div class="relative min-h-screen bg-[#09090b] text-white">
    <!-- ───── Nav ───── -->
    <PublicNavBar active-page="features" />

    <!-- ───── Hero ───── -->
    <section class="relative overflow-hidden pt-28 pb-10">
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="absolute left-1/2 top-0 -translate-x-1/2 h-[350px] w-[500px] rounded-full bg-brand-500/8 blur-[120px]"
        />
      </div>
      <div class="relative mx-auto max-w-4xl px-6 text-center">
        <div
          class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-white/60"
        >
          <Layers class="size-3.5 text-brand-400" />
          Feature Catalog
        </div>
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything We're Building
        </h1>
        <p class="mt-3 text-[15px] leading-relaxed text-white/50 max-w-2xl mx-auto">
          A transparent, hierarchical view of every feature in Reqcore — shipped, in progress, and planned.
          Click any feature to see its full description, competitor comparison, and join the discussion.
        </p>

        <!-- Stats strip -->
        <div class="mt-8 flex flex-wrap items-center justify-center gap-4 text-[13px]">
          <div class="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
            <Rocket class="size-3.5 text-emerald-400" />
            <span class="text-white/70">{{ stats.shipped }} Shipped</span>
          </div>
          <div class="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
            <Hammer class="size-3.5 text-blue-400" />
            <span class="text-white/70">{{ stats.inProgress }} In Progress</span>
          </div>
          <div class="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
            <Telescope class="size-3.5 text-violet-400" />
            <span class="text-white/70">{{ stats.planned }} Planned</span>
          </div>
          <div class="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
            <HelpCircle class="size-3.5 text-amber-400" />
            <span class="text-white/70">{{ stats.considering }} Considering</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ───── Main content: Outline + Sidebar ───── -->
    <section class="relative mx-auto max-w-4xl px-6 pb-24">
      <!-- The outline tree -->
      <div
        class="rounded-xl border border-white/[0.06] bg-white/[0.02]"
      >
        <template v-for="category in tree" :key="category.path">
          <!-- Category header -->
          <div
            class="border-b border-white/[0.04] last:border-b-0"
          >
            <button
              type="button"
              :aria-expanded="isExpanded(category.path)"
              :aria-controls="`cat-panel-${category.path.replace(/\//g, '-')}`"
              class="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03]"
              @click="toggleExpand(category.path)"
            >
              <component
                :is="isExpanded(category.path) ? ChevronDown : ChevronRight"
                class="size-4 text-white/30 shrink-0"
              />
              <div class="flex-1 min-w-0">
                <h2 class="text-[15px] font-semibold text-white">{{ category.title }}</h2>
                <p v-if="category.description" class="mt-0.5 text-[13px] text-white/40 truncate">
                  {{ category.description }}
                </p>
              </div>
              <span class="text-[11px] text-white/20 tabular-nums shrink-0">
                {{ category.children.length }} feature{{ category.children.length !== 1 ? 's' : '' }}
              </span>
            </button>

            <!-- Features within category -->
            <div
              :id="`cat-panel-${category.path.replace(/\//g, '-')}`"
              v-if="isExpanded(category.path)"
              class="border-t border-white/[0.04]"
            >
              <template v-for="feature in category.children" :key="feature.path">
                <button
                  type="button"
                  :aria-expanded="feature.children.length ? isExpanded(feature.path) : undefined"
                  :aria-controls="feature.children.length ? `feat-panel-${feature.path.replace(/\//g, '-')}` : undefined"
                  class="flex w-full items-center gap-3 px-5 py-3 pl-12 text-left transition hover:bg-white/[0.03]"
                  :class="{
                    'bg-white/[0.04]': selectedNode?.path === feature.path,
                  }"
                  @click="selectFeature(feature)"
                >
                  <!-- Expand toggle if feature has children -->
                  <component
                    v-if="feature.children.length"
                    :is="isExpanded(feature.path) ? ChevronDown : ChevronRight"
                    class="size-3.5 text-white/25 shrink-0"
                    @click.stop="toggleExpand(feature.path)"
                  />
                  <div v-else class="w-3.5 shrink-0" />

                  <div class="flex-1 min-w-0">
                    <span class="text-[14px] text-white/80">{{ feature.title }}</span>
                  </div>

                  <!-- Status badge -->
                  <span
                    v-if="getStatusConfig(feature.status)"
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset shrink-0"
                    :class="getStatusConfig(feature.status)!.color"
                  >
                    <component :is="getStatusConfig(feature.status)!.icon" class="size-3" />
                    {{ getStatusConfig(feature.status)!.label }}
                  </span>
                </button>

                <!-- Sub-features -->
                <div
                  v-if="feature.children.length && isExpanded(feature.path)"
                  :id="`feat-panel-${feature.path.replace(/\//g, '-')}`"
                >
                  <button
                    v-for="sub in feature.children"
                    :key="sub.path"
                    class="flex w-full items-center gap-3 px-5 py-2.5 pl-20 text-left transition hover:bg-white/[0.03]"
                    :class="{
                      'bg-white/[0.04]': selectedNode?.path === sub.path,
                    }"
                    @click="selectFeature(sub)"
                  >
                    <div class="w-3.5 shrink-0" />
                    <span class="flex-1 text-[13px] text-white/60">{{ sub.title }}</span>
                    <span
                      v-if="getStatusConfig(sub.status)"
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset shrink-0"
                      :class="getStatusConfig(sub.status)!.color"
                    >
                      {{ getStatusConfig(sub.status)!.label }}
                    </span>
                  </button>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>

      <!-- ───── Sidebar overlay (mobile) ───── -->
      <Transition name="fade">
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 z-40 bg-black/60 lg:hidden"
          @click="closeSidebar"
        />
      </Transition>

      <!-- ───── Sidebar panel ───── -->
      <Transition name="slide">
        <div
          v-if="sidebarOpen && selectedNode"
          class="fixed top-14 right-0 bottom-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/[0.06] bg-[#0d0d0f] lg:z-30"
        >
          <!-- Close button -->
          <div class="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#0d0d0f]/95 backdrop-blur-sm px-5 py-3">
            <h3 class="text-[15px] font-semibold text-white truncate pr-4">
              {{ selectedNode.title }}
            </h3>
            <button
              class="rounded-md p-1.5 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              @click="closeSidebar"
            >
              <X class="size-4" />
            </button>
          </div>

          <div class="px-5 py-5 space-y-6">
            <!-- ─── 1. Metadata strip ─── -->
            <div v-if="selectedNode.status || selectedNode.priority || selectedNode.complexity" class="flex flex-wrap gap-2">
              <span
                v-if="getStatusConfig(selectedNode.status)"
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset"
                :class="getStatusConfig(selectedNode.status)!.color"
              >
                <component :is="getStatusConfig(selectedNode.status)!.icon" class="size-3.5" />
                {{ getStatusConfig(selectedNode.status)!.label }}
              </span>
              <span
                v-if="getPriorityConfig(selectedNode.priority)"
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset"
                :class="getPriorityConfig(selectedNode.priority)!.color"
              >
                {{ getPriorityConfig(selectedNode.priority)!.label }} Priority
              </span>
              <span
                v-if="getComplexityConfig(selectedNode.complexity)"
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset"
                :class="getComplexityConfig(selectedNode.complexity)!.color"
              >
                Size: {{ getComplexityConfig(selectedNode.complexity)!.label }}
              </span>
            </div>

            <!-- ─── 2. Markdown body ─── -->
            <div class="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-white/60 prose-li:text-white/60 prose-strong:text-white/80 prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline prose-code:text-brand-300 prose-th:text-white/70 prose-td:text-white/50">
              <ContentRenderer v-if="selectedNode.rawItem" :value="selectedNode.rawItem" />
            </div>

            <!-- ─── 3. Competitor comparison table ─── -->
            <div v-if="selectedNode.competitors && Object.keys(selectedNode.competitors).length">
              <h4 class="text-[13px] font-semibold text-white/70 uppercase tracking-wider mb-3">
                Competitor Comparison
              </h4>
              <div class="rounded-lg border border-white/[0.06] overflow-hidden">
                <table class="w-full text-[13px]">
                  <thead>
                    <tr class="border-b border-white/[0.06] bg-white/[0.02]">
                      <th class="px-4 py-2.5 text-left font-medium text-white/50">Platform</th>
                      <th class="px-4 py-2.5 text-left font-medium text-white/50">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(rating, platform) in selectedNode.competitors"
                      :key="platform"
                      class="border-b border-white/[0.04] last:border-b-0"
                    >
                      <td class="px-4 py-2.5 text-white/70 capitalize">
                        {{ competitorNames[platform] || platform }}
                      </td>
                      <td class="px-4 py-2.5 text-white/50">
                        {{ competitorLabel[rating] || rating }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- ─── 4. Giscus comments ─── -->
            <div>
              <h4 class="text-[13px] font-semibold text-white/70 uppercase tracking-wider mb-3">
                Discussion
              </h4>
              <p class="text-[12px] text-white/30 mb-3">
                Sign in with GitHub to comment. Discussions are powered by
                <a href="https://giscus.app" target="_blank" class="text-brand-400 hover:underline">Giscus</a>.
              </p>
              <ClientOnly>
                <GiscusComments :term="selectedNode.path" />
              </ClientOnly>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <!-- ───── Footer ───── -->
    <footer class="border-t border-white/[0.06]">
      <div class="mx-auto max-w-4xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-white/30">
        <div class="flex items-center gap-4">
          <NuxtLink :to="$localePath('/')" class="hover:text-white/60 transition">Home</NuxtLink>
          <NuxtLink :to="$localePath('/roadmap')" class="hover:text-white/60 transition">Roadmap</NuxtLink>
          <NuxtLink to="/blog" class="hover:text-white/60 transition">Blog</NuxtLink>
        </div>
        <div class="flex items-center gap-2">
          <span>Open source on</span>
          <a
            href="https://github.com/reqcore-inc/reqcore"
            target="_blank"
            class="inline-flex items-center gap-1 text-white/50 hover:text-white transition"
          >
            GitHub <ArrowUpRight class="size-3" />
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Sidebar slide in/out */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Backdrop fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
