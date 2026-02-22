import type { MaybeRefOrGetter } from 'vue'

/**
 * Composable for a single job detail with update and delete mutations.
 * Wraps `useFetch('/api/jobs/:id')` with a reactive key.
 */
export function useJob(id: MaybeRefOrGetter<string>) {
  const { handlePreviewReadOnlyError } = usePreviewReadOnly()
  const jobId = computed(() => toValue(id))

  const { data: job, status, error, refresh } = useFetch(
    () => `/api/jobs/${jobId.value}`,
    {
      key: computed(() => `job-${jobId.value}`),
      headers: useRequestHeaders(['cookie']),
    },
  )

  /** Update job fields (partial) and refresh both detail and list caches */
  async function updateJob(payload: Partial<{
    title: string
    description: string
    location: string
    type: 'full_time' | 'part_time' | 'contract' | 'internship'
    status: 'draft' | 'open' | 'closed' | 'archived'
  }>) {
    try {
      const updated = await $fetch(`/api/jobs/${jobId.value}`, {
        method: 'PATCH',
        body: payload,
      })
      await refresh()
      await refreshNuxtData('jobs')
      return updated
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
  }

  /** Delete this job and navigate back to the list */
  async function deleteJob() {
    try {
      await $fetch(`/api/jobs/${jobId.value}`, { method: 'DELETE' })
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
    await refreshNuxtData('jobs')
    await navigateTo('/dashboard/jobs')
  }

  return { job, status, error, refresh, updateJob, deleteJob }
}
