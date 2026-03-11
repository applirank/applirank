/**
 * Composable for managing Google Calendar integration status.
 * Provides connection state, connect/disconnect actions.
 */
export interface CalendarStatus {
  available: boolean
  connected: boolean
  provider: 'google' | null
  accountEmail: string | null
  calendarId: string | null
  webhookActive: boolean
  connectedAt?: string
}

export function useCalendarIntegration() {
  const { data, status, error, refresh } = useFetch<CalendarStatus>('/api/calendar/status', {
    key: 'calendar-status',
    headers: useRequestHeaders(['cookie']),
  })

  const calendarStatus = computed<CalendarStatus>(() => data.value ?? {
    available: false,
    connected: false,
    provider: null,
    accountEmail: null,
    calendarId: null,
    webhookActive: false,
  })

  const isConnected = computed(() => calendarStatus.value.connected)
  const isAvailable = computed(() => calendarStatus.value.available)

  function connect() {
    // Navigate to the OAuth2 connect endpoint (server-side redirect)
    navigateTo('/api/calendar/google/connect', { external: true })
  }

  async function disconnect() {
    await $fetch('/api/calendar/disconnect', { method: 'POST' })
    await refresh()
  }

  return {
    calendarStatus,
    isConnected,
    isAvailable,
    status,
    error,
    refresh,
    connect,
    disconnect,
  }
}
