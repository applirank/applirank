<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: ['guest'],
})

useSeoMeta({
  title: 'Sign In — Reqcore',
  description: 'Sign in to your Reqcore account',
  robots: 'noindex, nofollow',
})

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const route = useRoute()
const config = useRuntimeConfig()
const localePath = useLocalePath()

if (route.query.live === '1') {
  email.value = config.public.liveDemoEmail
  password.value = config.public.liveDemoSecret
}

async function handleSignIn() {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = 'Email and password are required.'
    return
  }

  isLoading.value = true

  const result = await authClient.signIn.email({
    email: email.value,
    password: password.value,
  })

  if (result.error) {
    error.value = result.error.message ?? 'Invalid credentials. Please try again.'
    isLoading.value = false
    return
  }

  clearNuxtData()

  // If the user was accepting an invitation, redirect back to accept it
  const pendingInvitation = route.query.invitation as string | undefined
  if (pendingInvitation) {
    await navigateTo(localePath(`/auth/accept-invitation/${pendingInvitation}`))
  }
  else {
    await navigateTo(localePath('/dashboard'))
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="handleSignIn">
    <h2 class="text-xl font-semibold text-center text-surface-900 dark:text-surface-100 mb-2">Sign in to your account</h2>

    <div v-if="error" class="rounded-md border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-3 text-sm text-danger-700 dark:text-danger-400">{{ error }}</div>

    <label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
      <span>Email</span>
      <input
        v-model="email"
        type="email"
        autocomplete="email"
        required
        class="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
      />
    </label>

    <label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
      <span>Password</span>
      <input
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        class="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
      />
    </label>

    <button
      type="submit"
      :disabled="isLoading"
      class="mt-2 px-4 py-2.5 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {{ isLoading ? 'Signing in…' : 'Sign in' }}
    </button>

    <p class="text-center text-sm text-surface-500 dark:text-surface-400">
      Don't have an account?
      <NuxtLink :to="route.query.invitation ? $localePath(`/auth/sign-up?invitation=${route.query.invitation}`) : $localePath('/auth/sign-up')" class="text-brand-600 dark:text-brand-400 hover:underline">Sign up</NuxtLink>
    </p>
  </form>
</template>

