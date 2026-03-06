<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4 relative">
    <div class="absolute right-4 top-4 z-10">
      <LanguageSwitcher />
    </div>
    <div class="w-full max-w-[540px] bg-white dark:bg-surface-900 rounded-lg shadow-sm dark:shadow-none dark:border dark:border-surface-800 p-8">
      <div class="text-center mb-8">
        <div class="flex justify-center mb-3">
          <img src="/eagle-mascot-logo.png" alt="Reqcore mascot" class="size-16 object-contain" />
        </div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">Reqcore</h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">The Sovereign Recruitment Engine</p>
      </div>
      <slot />
    </div>
  </div>
</template>
