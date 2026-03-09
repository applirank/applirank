<script setup lang="ts">
const i18nHead = useLocaleHead({
  seo: true,
})

useHead(() => ({
  htmlAttrs: i18nHead.value.htmlAttrs,
  link: i18nHead.value.link,
  meta: i18nHead.value.meta,
}))

// Sync Better Auth session → PostHog identity & org group
await usePostHogIdentity()
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <ConsentBanner />
    </ClientOnly>
  </div>
</template>
