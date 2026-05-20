export type OnboardingStepId =
  | 'workspace_created'
  | 'first_job'
  | 'publish_job'
  | 'first_candidate'
  | 'pipeline_action'
  | 'invite_team'
  | 'configure_ai'

export interface OnboardingStep {
  id: OnboardingStepId
  completed: boolean
  xp: number
}

export interface OnboardingProgress {
  steps: OnboardingStep[]
  dismissed: boolean
  dismissedAt: string | null
}

// ─────────────────────────────────────────────
// Static step metadata (titles, descriptions, CTAs)
// ─────────────────────────────────────────────

export const STEP_META: Record<OnboardingStepId, {
  title: string
  description: string
  cta: string
  ctaPath: string
  xp: number
}> = {
  workspace_created: {
    title: 'Create your workspace',
    description: 'Your organization is live. Welcome to Reqcore.',
    cta: 'Done',
    ctaPath: '/dashboard',
    xp: 100,
  },
  first_job: {
    title: 'Post your first job',
    description: 'Create a job listing so candidates know what you\'re hiring for.',
    cta: 'Create job',
    ctaPath: '/dashboard/jobs/new',
    xp: 150,
  },
  publish_job: {
    title: 'Publish a job listing',
    description: 'Set a job to Open so it appears on your public careers page.',
    cta: 'View jobs',
    ctaPath: '/dashboard/jobs',
    xp: 200,
  },
  first_candidate: {
    title: 'Add your first candidate',
    description: 'Import a candidate manually or wait for inbound applications.',
    cta: 'Add candidate',
    ctaPath: '/dashboard/candidates',
    xp: 150,
  },
  pipeline_action: {
    title: 'Move a candidate through the pipeline',
    description: 'Advance an applicant from New → Screening to start making decisions.',
    cta: 'View applications',
    ctaPath: '/dashboard/applications',
    xp: 200,
  },
  invite_team: {
    title: 'Invite a team member',
    description: 'Hiring is a team sport. Bring in a recruiter or hiring manager.',
    cta: 'Invite teammate',
    ctaPath: '/dashboard/settings/members',
    xp: 150,
  },
  configure_ai: {
    title: 'Set up AI-powered screening',
    description: 'Connect an AI provider to auto-score and rank incoming applications.',
    cta: 'Configure AI',
    ctaPath: '/dashboard/settings/ai',
    xp: 200,
  },
}

// ─────────────────────────────────────────────
// XP → Level mapping
// ─────────────────────────────────────────────

export const LEVELS = [
  { label: 'Rookie', minXp: 0, color: 'text-surface-500' },
  { label: 'Scout', minXp: 300, color: 'text-blue-500' },
  { label: 'Coordinator', minXp: 600, color: 'text-violet-500' },
  { label: 'Recruiter', minXp: 900, color: 'text-amber-500' },
  { label: 'Pro', minXp: 1150, color: 'text-brand-500' },
] as const

export function getLevelFromXp(xp: number) {
  return [...LEVELS].reverse().find(l => xp >= l.minXp) ?? LEVELS[0]!
}

// ─────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────

export function useOnboarding() {
  const localePath = useLocalePath()
  const { track } = useTrack()

  const { data, status, refresh } = useFetch<OnboardingProgress>('/api/onboarding/progress', {
    key: 'onboarding-progress',
    default: () => ({ steps: [], dismissed: false, dismissedAt: null }),
  })

  // ── Derived state ──

  const steps = computed(() =>
    (data.value?.steps ?? []).map(s => ({
      ...s,
      ...STEP_META[s.id],
    })),
  )

  const completedCount = computed(() => steps.value.filter(s => s.completed).length)
  const totalCount = computed(() => steps.value.length)
  const progressPercent = computed(() =>
    totalCount.value > 0 ? Math.round((completedCount.value / totalCount.value) * 100) : 0,
  )

  const earnedXp = computed(() =>
    steps.value.filter(s => s.completed).reduce((sum, s) => sum + s.xp, 0),
  )

  const totalXp = computed(() =>
    steps.value.reduce((sum, s) => sum + s.xp, 0),
  )

  const currentLevel = computed(() => getLevelFromXp(earnedXp.value))

  const allComplete = computed(() => completedCount.value === totalCount.value && totalCount.value > 0)

  const isDismissed = computed(() => data.value?.dismissed ?? false)

  /** Show the checklist: not dismissed AND not all steps done */
  const shouldShow = computed(() =>
    status.value !== 'pending'
    && !isDismissed.value
    && !allComplete.value,
  )

  // ── Actions ──

  const isDismissing = ref(false)

  async function dismiss() {
    isDismissing.value = true
    track('onboarding_dismissed', {
      completed_count: completedCount.value,
      total_count: totalCount.value,
      earned_xp: earnedXp.value,
    })
    try {
      await $fetch('/api/onboarding/dismiss', { method: 'POST' })
      await refresh()
    }
    finally {
      isDismissing.value = false
    }
  }

  return {
    steps,
    completedCount,
    totalCount,
    progressPercent,
    earnedXp,
    totalXp,
    currentLevel,
    allComplete,
    isDismissed,
    shouldShow,
    isDismissing,
    status,
    dismiss,
    refresh,
    localePath,
  }
}
