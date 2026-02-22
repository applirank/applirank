import type { MaybeRefOrGetter } from 'vue'

/**
 * Composable for a single application detail with update mutation.
 * Wraps `useFetch('/api/applications/:id')` with a reactive key.
 */
export function useApplication(id: MaybeRefOrGetter<string>) {
  const { handlePreviewReadOnlyError } = usePreviewReadOnly()
  const applicationId = computed(() => toValue(id))

  const { data: application, status, error, refresh } = useFetch(
    () => `/api/applications/${applicationId.value}`,
    {
      key: computed(() => `application-${applicationId.value}`),
      headers: useRequestHeaders(['cookie']),
    },
  )

  /** Update application fields (status, notes, score) and refresh caches */
  async function updateApplication(payload: Partial<{
    status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
    notes: string | null
    score: number | null
  }>) {
    try {
      const updated = await $fetch(`/api/applications/${applicationId.value}`, {
        method: 'PATCH',
        body: payload,
      })
      await refresh()
      await refreshNuxtData('applications')
      return updated
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
  }

  return { application, status, error, refresh, updateApplication }
}
