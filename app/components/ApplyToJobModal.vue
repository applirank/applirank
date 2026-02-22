<script setup lang="ts">
import { X, Briefcase } from 'lucide-vue-next'
import { usePreviewReadOnly } from '~/composables/usePreviewReadOnly'

const props = defineProps<{
  candidateId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

// Fetch open jobs
const { data: jobData, status: jobFetchStatus } = useFetch('/api/jobs', {
  key: 'apply-to-job-list',
  query: { status: 'open' },
  headers: useRequestHeaders(['cookie']),
})

const jobs = computed(() => jobData.value?.data ?? [])
const { handlePreviewReadOnlyError } = usePreviewReadOnly()

// Apply to job
const isApplying = ref(false)
const applyError = ref('')

async function applyToJob(jobId: string) {
  isApplying.value = true
  applyError.value = ''
  try {
    await $fetch('/api/applications', {
      method: 'POST',
      body: { candidateId: props.candidateId, jobId },
    })
    emit('created')
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    applyError.value = err.data?.statusMessage ?? 'Failed to apply to job'
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
            <Briefcase class="size-5 text-brand-600 dark:text-brand-400" />
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50">Apply to Job</h3>
          </div>
          <button
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
            @click="emit('close')"
          >
            <X class="size-5" />
          </button>
        </div>

        <!-- Error -->
        <div v-if="applyError" class="mx-5 mt-3 rounded-lg border border-danger-200 bg-danger-50 dark:bg-danger-950 p-3 text-sm text-danger-700 dark:text-danger-400">
          {{ applyError }}
        </div>

        <!-- Job list -->
        <div class="flex-1 overflow-y-auto px-5 py-3">
          <div v-if="jobFetchStatus === 'pending'" class="text-center py-6 text-surface-400 text-sm">
            Loading jobs…
          </div>

          <div v-else-if="jobs.length === 0" class="text-center py-6 text-surface-400 text-sm">
            No open jobs available.
          </div>

          <div v-else class="space-y-1">
            <button
              v-for="j in jobs"
              :key="j.id"
              :disabled="isApplying"
              class="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
              @click="applyToJob(j.id)"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                  {{ j.title }}
                </p>
                <p v-if="j.location" class="text-xs text-surface-400 truncate">{{ j.location }}</p>
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
