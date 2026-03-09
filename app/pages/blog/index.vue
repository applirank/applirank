<script setup lang="ts">
import { ArrowRight, BookOpen, Star, ChevronRight } from 'lucide-vue-next'

defineI18nRoute(false)

definePageMeta({
  i18n: false,
})

useSeoMeta({
  title: 'Blog — Recruitment, ATS, and Hiring Insights',
  description:
    'Practical guides on applicant tracking systems, self-hosted recruitment software, hiring best practices, and open-source ATS comparisons.',
  ogTitle: 'Reqcore Blog — Recruitment & ATS Insights',
  ogDescription:
    'Practical guides on applicant tracking systems, self-hosted recruitment, and hiring best practices.',
  ogType: 'website',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Reqcore Blog — Recruitment & ATS Insights',
  twitterDescription:
    'Practical guides on self-hosted ATS, recruitment, and hiring best practices.',
})

useHead({
  bodyAttrs: {
    style: 'background-color: #09090b;',
  },
})

const { data: session } = await authClient.useSession(useFetch)

const { data: posts } = await useAsyncData('blog-posts', () =>
  queryCollection('blog').order('date', 'DESC').all(),
)
</script>

<template>
  <div class="relative min-h-screen bg-[#09090b] text-white">
    <!-- ───── Nav ───── -->
    <PublicNavBar active-page="blog" />

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
          Insights &amp; Guides
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
          The Reqcore Blog
        </h1>
        <p class="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/50">
          Practical guides on hiring, recruitment software, and building a better ATS.
        </p>
      </div>
    </section>

    <!-- ───── Posts Grid ───── -->
    <section class="mx-auto max-w-3xl px-6 pb-24">
      <div v-if="posts?.length" class="space-y-6">
        <NuxtLink
          v-for="post in posts"
          :key="post.path"
          :to="post.path"
          class="group block rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h2
                class="text-lg font-semibold tracking-tight text-white group-hover:text-brand-400 transition"
              >
                {{ post.title }}
              </h2>
              <p class="mt-2 text-sm leading-relaxed text-white/50 line-clamp-2">
                {{ post.description }}
              </p>
              <div class="mt-3 flex items-center gap-3 text-xs text-white/40">
                <time v-if="post.date" :datetime="String(post.date)">
                  {{
                    new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  }}
                </time>
                <span v-if="post.author">&middot; {{ post.author }}</span>
              </div>
            </div>
            <ArrowRight
              class="mt-1 size-5 shrink-0 text-white/20 transition group-hover:text-brand-400 group-hover:translate-x-0.5"
            />
          </div>
        </NuxtLink>
      </div>
      <div v-else class="py-16 text-center text-white/40">
        <p>No posts yet. Check back soon!</p>
      </div>
    </section>

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
