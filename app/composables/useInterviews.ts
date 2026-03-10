import type { MaybeRefOrGetter } from 'vue'

export interface Interview {
  id: string
  title: string
  type: 'phone' | 'video' | 'in_person' | 'panel' | 'technical' | 'take_home'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  scheduledAt: string
  duration: number
  location: string | null
  notes: string | null
  interviewers: string[] | null
  invitationSentAt: string | null
  applicationId: string
  candidateFirstName: string
  candidateLastName: string
  candidateEmail: string
  candidatePhone?: string | null
  jobId: string
  jobTitle: string
  createdAt: string
  updatedAt: string
}

interface InterviewListResponse {
  data: Interview[]
  total: number
  page: number
  limit: number
}

/**
 * Composable for listing interviews with filters.
 */
export function useInterviews(options?: {
  applicationId?: MaybeRefOrGetter<string | undefined>
  jobId?: MaybeRefOrGetter<string | undefined>
  status?: MaybeRefOrGetter<string | undefined>
  from?: MaybeRefOrGetter<string | undefined>
  to?: MaybeRefOrGetter<string | undefined>
  limit?: MaybeRefOrGetter<number | undefined>
}) {
  const { handlePreviewReadOnlyError } = usePreviewReadOnly()

  const query = computed(() => {
    const q: Record<string, string | number> = {}
    if (options?.applicationId) {
      const v = toValue(options.applicationId)
      if (v) q.applicationId = v
    }
    if (options?.jobId) {
      const v = toValue(options.jobId)
      if (v) q.jobId = v
    }
    if (options?.status) {
      const v = toValue(options.status)
      if (v) q.status = v
    }
    if (options?.from) {
      const v = toValue(options.from)
      if (v) q.from = v
    }
    if (options?.to) {
      const v = toValue(options.to)
      if (v) q.to = v
    }
    if (options?.limit) {
      const v = toValue(options.limit)
      if (v) q.limit = v
    }
    return q
  })

  const { data, status, error, refresh } = useFetch<InterviewListResponse>('/api/interviews', {
    key: 'interviews',
    query,
    headers: useRequestHeaders(['cookie']),
  })

  const interviews = computed(() => data.value?.data ?? [])
  const total = computed(() => data.value?.total ?? 0)

  async function createInterview(payload: {
    applicationId: string
    title: string
    type?: Interview['type']
    scheduledAt: string
    duration?: number
    location?: string
    notes?: string
    interviewers?: string[]
  }) {
    try {
      const created = await $fetch('/api/interviews', {
        method: 'POST',
        body: payload,
      })
      await refresh()
      return created
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
  }

  return { interviews, total, status, error, refresh, createInterview }
}

/**
 * Composable for a single interview detail with update/delete mutations.
 */
export function useInterview(id: MaybeRefOrGetter<string>) {
  const { handlePreviewReadOnlyError } = usePreviewReadOnly()
  const interviewId = computed(() => toValue(id))

  const { data: interview, status, error, refresh } = useFetch<Interview>(
    () => `/api/interviews/${interviewId.value}`,
    {
      key: computed(() => `interview-${interviewId.value}`),
      headers: useRequestHeaders(['cookie']),
    },
  )

  async function updateInterview(payload: Partial<{
    title: string
    type: Interview['type']
    status: Interview['status']
    scheduledAt: string
    duration: number
    location: string | null
    notes: string | null
    interviewers: string[] | null
  }>) {
    try {
      const updated = await $fetch(`/api/interviews/${interviewId.value}`, {
        method: 'PATCH',
        body: payload,
      })
      await refresh()
      await refreshNuxtData('interviews')
      return updated
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
  }

  async function deleteInterview() {
    try {
      await $fetch(`/api/interviews/${interviewId.value}`, {
        method: 'DELETE',
      })
      await refreshNuxtData('interviews')
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
  }

  return { interview, status, error, refresh, updateInterview, deleteInterview }
}
