<script setup lang="ts">
import { ArrowLeft, Calendar, User } from 'lucide-vue-next'

defineI18nRoute(false)

definePageMeta({
  i18n: false,
})

const route = useRoute()

// Build the content path from the slug segments
const slugPath = computed(() => {
  const slug = route.params.slug
  const segments = Array.isArray(slug) ? slug : [slug]
  return `/blog/${segments.join('/')}`
})

const { data: post } = await useAsyncData(`blog-${slugPath.value}`, () =>
  queryCollection('blog').path(slugPath.value).first(),
)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

// ─── SEO ──────────────────────────────────────────
useSeoMeta({
  title: post.value.title,
  description: post.value.description,
  ogTitle: post.value.title,
  ogDescription: post.value.description,
  ogType: 'article',
  ogImage: post.value.image || '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: post.value.title,
  twitterDescription: post.value.description,
})

useSchemaOrg([
  defineArticle({
    headline: post.value.title,
    description: post.value.description,
    datePublished: post.value.date ? new Date(post.value.date).toISOString() : undefined,
    author: post.value.author
      ? { name: post.value.author, '@type': 'Person' }
      : undefined,
    image: post.value.image || '/og-image.png',
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
</script>

<template>
  <div class="relative min-h-screen bg-[#09090b] text-white">
    <!-- ───── Nav ───── -->
    <PublicNavBar active-page="blog" />

    <!-- ───── Article ───── -->
    <article class="relative pt-28 pb-24">
      <div class="mx-auto max-w-2xl px-6">
        <!-- Back link -->
        <NuxtLink
          to="/blog"
          class="mb-8 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70"
        >
          <ArrowLeft class="size-3.5" />
          All posts
        </NuxtLink>

        <!-- Header -->
        <header class="mb-10">
          <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
            {{ post!.title }}
          </h1>
          <div class="mt-4 flex items-center gap-4 text-sm text-white/40">
            <span v-if="post!.date" class="inline-flex items-center gap-1.5">
              <Calendar class="size-3.5" />
              {{
                new Date(post!.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              }}
            </span>
            <span v-if="post!.author" class="inline-flex items-center gap-1.5">
              <User class="size-3.5" />
              {{ post!.author }}
            </span>
          </div>
        </header>

        <!-- Content -->
        <div
          class="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-brand-300 prose-pre:bg-white/[0.04] prose-pre:border prose-pre:border-white/[0.06] prose-td:px-3 prose-td:py-2 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-table:border-collapse prose-tr:border-b prose-tr:border-white/[0.06]"
        >
          <ContentRenderer v-if="post" :value="post" />
        </div>

        <!-- CTA -->
        <div
          class="mt-16 rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center"
        >
          <h3 class="text-lg font-semibold">Ready to own your hiring?</h3>
          <p class="mt-2 text-sm text-white/50">
            Reqcore is the open-source ATS you can self-host. Transparent AI, no per-seat fees, full data ownership.
          </p>
          <div class="mt-5 flex items-center justify-center gap-3">
            <NuxtLink
              :to="$localePath('/auth/sign-in')"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] transition hover:bg-brand-400"
            >
              Try live demo
            </NuxtLink>
            <NuxtLink
              :to="$localePath('/')"
              class="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
            >
              Learn more
            </NuxtLink>
          </div>
        </div>
      </div>
    </article>

    <!-- ───── Footer ───── -->
    <footer class="border-t border-white/[0.06] py-8">
      <div class="mx-auto max-w-5xl px-6 flex items-center justify-between text-xs text-white/30">
        <span>&copy; {{ new Date().getFullYear() }} Reqcore</span>
        <div class="flex items-center gap-4">
          <NuxtLink :to="$localePath('/')" class="transition hover:text-white/60">Home</NuxtLink>
          <NuxtLink :to="$localePath('/roadmap')" class="transition hover:text-white/60">Roadmap</NuxtLink>
          <NuxtLink to="/docs" class="transition hover:text-white/60">Docs</NuxtLink>
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
