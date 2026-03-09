<script setup lang="ts">
import { Github } from 'lucide-vue-next'

defineProps<{
  activePage?: 'features' | 'jobs' | 'roadmap' | 'blog' | 'docs'
}>()

const localePath = useLocalePath()
const { data: session } = await authClient.useSession(useFetch)
</script>

<template>
  <nav class="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
      <!-- Logo -->
      <NuxtLink
        :to="localePath('/')"
        class="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-white"
      >
        <img
          src="/eagle-mascot-logo-128.png"
          alt="Reqcore mascot"
          width="28"
          height="28"
          loading="eager"
          decoding="sync"
          class="h-7 w-7 object-contain"
        />
        Reqcore
      </NuxtLink>

      <!-- Center nav links (desktop) -->
      <div class="hidden items-center gap-1 md:flex">
        <NuxtLink
          :to="localePath('/catalog')"
          class="rounded-md px-3 py-1.5 text-[13px] font-medium transition"
          :class="activePage === 'features' ? 'text-white' : 'text-surface-400 hover:text-white'"
        >
          Features
        </NuxtLink>
        <NuxtLink
          :to="localePath('/jobs')"
          class="rounded-md px-3 py-1.5 text-[13px] font-medium transition"
          :class="activePage === 'jobs' ? 'text-white' : 'text-surface-400 hover:text-white'"
        >
          Open Positions
        </NuxtLink>
        <NuxtLink
          :to="localePath('/roadmap')"
          class="rounded-md px-3 py-1.5 text-[13px] font-medium transition"
          :class="activePage === 'roadmap' ? 'text-white' : 'text-surface-400 hover:text-white'"
        >
          Roadmap
        </NuxtLink>
        <NuxtLink
          to="/blog"
          class="rounded-md px-3 py-1.5 text-[13px] font-medium transition"
          :class="activePage === 'blog' ? 'text-white' : 'text-surface-400 hover:text-white'"
        >
          Blog
        </NuxtLink>
        <NuxtLink
          to="/docs"
          class="rounded-md px-3 py-1.5 text-[13px] font-medium transition"
          :class="activePage === 'docs' ? 'text-white' : 'text-surface-400 hover:text-white'"
        >
          Docs
        </NuxtLink>
        <a
          href="https://github.com/reqcore-inc/reqcore"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-surface-400 transition hover:text-white"
        >
          <Github class="h-3.5 w-3.5" />
          GitHub
        </a>
      </div>

      <!-- Right: session actions -->
      <div class="flex items-center gap-2">
        <template v-if="session?.user">
          <NuxtLink
            :to="localePath('/dashboard')"
            class="rounded-md bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#09090b] transition hover:bg-white/90"
          >
            Dashboard
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink
            :to="localePath('/auth/sign-in')"
            class="hidden rounded-md px-3 py-1.5 text-[13px] font-medium text-surface-400 transition hover:text-white sm:inline-flex"
          >
            Log In
          </NuxtLink>
          <NuxtLink
            :to="localePath('/auth/sign-up')"
            class="rounded-md bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#09090b] transition hover:bg-white/90"
          >
            Get Started
          </NuxtLink>
        </template>
      </div>
    </div>
  </nav>
</template>
