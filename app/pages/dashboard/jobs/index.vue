<script setup lang="ts">
/**
 * Redirect to the main dashboard — the dashboard IS the jobs view now.
 * This keeps old bookmarks and links working.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

await navigateTo('/dashboard', { redirectCode: 301, replace: true })
</script>

<template>
  <div />
</template>
