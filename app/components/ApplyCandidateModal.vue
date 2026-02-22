<script setup lang="ts">
import { Search, X, UserPlus } from 'lucide-vue-next'
import { usePreviewReadOnly } from '~/composables/usePreviewReadOnly'

const props = defineProps<{
  jobId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

// Search for candidates
const searchInput = ref('')
const debouncedSearch = ref<string | undefined>(undefined)

let debounceTimer: ReturnType<typeof setTimeout>
watch(searchInput, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = val.trim() || undefined
  }, 300)
})

const { data: candidateData, status: searchStatus } = useFetch('/api/candidates', {
  key: 'apply-candidate-search',
  query: computed(() => ({
    ...(debouncedSearch.value && { search: debouncedSearch.value }),
    limit: 20,
  })),
  headers: useRequestHeaders(['cookie']),
})

const candidates = computed(() => candidateData.value?.data ?? [])
const { handlePreviewReadOnlyError } = usePreviewReadOnly()

// Apply candidate
const isApplying = ref(false)
const applyError = ref('')

async function applyCandidate(candidateId: string) {
  isApplying.value = true
  applyError.value = ''
  try {
    await $fetch('/api/applications', {
      method: 'POST',
      body: { candidateId, jobId: props.jobId },
    })
    emit('created')
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    applyError.value = err.data?.statusMessage ?? 'Failed to apply candidate'
  } finally {
    isApplying.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
      <div class="relative bg-white dark:bg-surface-900 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-800">
          <div class="flex items-center gap-2">
            <UserPlus class="size-5 text-brand-600 dark:text-brand-400" />
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50">Add Candidate</h3>
          </div>
          <button
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
            @click="emit('close')"
          >
            <X class="size-5" />
          </button>
        </div>

        <!-- Search -->
        <div class="px-5 pt-4">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-400" />
            <input
              v-model="searchInput"
              type="text"
              placeholder="Search candidates by name or email…"
              class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-10 pr-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        <!-- Error -->
        <div v-if="applyError" class="mx-5 mt-3 rounded-lg border border-danger-200 bg-danger-50 dark:bg-danger-950 p-3 text-sm text-danger-700 dark:text-danger-400">
          {{ applyError }}
        </div>

        <!-- Candidate list -->
        <div class="flex-1 overflow-y-auto px-5 py-3">
          <div v-if="searchStatus === 'pending'" class="text-center py-6 text-surface-400 text-sm">
            Searching…
          </div>

          <div v-else-if="candidates.length === 0" class="text-center py-6 text-surface-400 text-sm">
            {{ debouncedSearch ? 'No candidates found.' : 'No candidates in your org yet.' }}
          </div>

          <div v-else class="space-y-1">
            <button
              v-for="c in candidates"
              :key="c.id"
              :disabled="isApplying"
              class="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
              @click="applyCandidate(c.id)"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                  {{ c.firstName }} {{ c.lastName }}
                </p>
                <p class="text-xs text-surface-400 truncate">{{ c.email }}</p>
              </div>
              <span class="text-xs text-brand-600 dark:text-brand-400 font-medium shrink-0 ml-2">
                Apply
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
