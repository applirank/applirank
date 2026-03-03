<script setup lang="ts">
import { MapPin, Briefcase, Building2, ArrowLeft, ExternalLink, Calendar } from 'lucide-vue-next'

definePageMeta({
  layout: 'public',
})

const route = useRoute()
const jobSlug = route.params.slug as string

const { data: job, status: fetchStatus, error: fetchError } = useFetch(
  `/api/public/jobs/${jobSlug}`,
  { key: `public-job-detail-${jobSlug}` },
)

function markdownToPlainText(markdown?: string | null): string {
  if (!markdown) return ''

  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/^\s{0,3}\d+\.\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const jobDescriptionPlain = computed(() => markdownToPlainText(job.value?.description))

// ─────────────────────────────────────────────
// SEO — Meta tags (title, description, OG, Twitter)
// ─────────────────────────────────────────────

useSeoMeta({
  title: computed(() => job.value ? `${job.value.title} — Hiring Now` : 'Job Details — Reqcore'),
  description: computed(() => {
    if (!job.value) return 'View job details and apply'
    const loc = job.value.location ? ` in ${job.value.location}` : ''
    const org = job.value.organizationName ? ` at ${job.value.organizationName}` : ''
    return `Apply for ${job.value.title}${org}${loc}. ${jobDescriptionPlain.value.slice(0, 120)}`.trim()
  }),
  ogTitle: computed(() => job.value ? `${job.value.title} — Hiring Now` : 'Job Details'),
  ogDescription: computed(() => {
    if (!job.value) return 'View job details and apply'
    const org = job.value.organizationName ? ` at ${job.value.organizationName}` : ''
    return `Apply for ${job.value.title}${org}. ${job.value.location ?? 'Remote'}.`
  }),
  ogType: 'website',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: computed(() => job.value?.title ?? 'Job Details'),
  twitterDescription: computed(() => {
    if (!job.value) return 'View job details and apply'
    return `Apply for ${job.value.title}. ${job.value.location ?? 'Remote'}.`
  }),
})

// ─────────────────────────────────────────────
// SEO — JSON-LD JobPosting structured data (Google Jobs)
// ─────────────────────────────────────────────

/** Map internal job type to schema.org employmentType */
function mapEmploymentType(type: string): string {
  const map: Record<string, string> = {
    full_time: 'FULL_TIME',
    part_time: 'PART_TIME',
    contract: 'CONTRACTOR',
    internship: 'INTERN',
  }
  return map[type] || 'OTHER'
}

// Build the JobPosting JSON-LD reactively
watchEffect(() => {
  if (!job.value) return

  const j = job.value
  const posting: Record<string, unknown> = {
    '@type': 'JobPosting',
    'title': j.title,
    'description': jobDescriptionPlain.value || j.title,
    'datePosted': j.createdAt,
    'employmentType': mapEmploymentType(j.type),
    'directApply': true,
  }

  // Hiring organization
  if (j.organizationName) {
    posting.hiringOrganization = {
      '@type': 'Organization',
      'name': j.organizationName,
      ...(j.organizationLogo ? { logo: j.organizationLogo } : {}),
    }
  }

  // Job location
  if (j.location) {
    posting.jobLocation = {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': j.location,
      },
    }
  }

  // Remote work
  if (j.remoteStatus === 'remote') {
    posting.jobLocationType = 'TELECOMMUTE'
    posting.applicantLocationRequirements = {
      '@type': 'Country',
      'name': 'Anywhere',
    }
  }

  // Valid through
  if (j.validThrough) {
    posting.validThrough = new Date(j.validThrough).toISOString()
  }

  // Salary (baseSalary)
  if (j.salaryMin || j.salaryMax) {
    const value: Record<string, unknown> = { '@type': 'QuantitativeValue' }
    if (j.salaryMin && j.salaryMax) {
      value.minValue = j.salaryMin
      value.maxValue = j.salaryMax
    } else if (j.salaryMin) {
      value.value = j.salaryMin
    } else if (j.salaryMax) {
      value.value = j.salaryMax
    }
    if (j.salaryUnit) {
      value.unitText = j.salaryUnit
    }
    posting.baseSalary = {
      '@type': 'MonetaryAmount',
      'currency': j.salaryCurrency || 'USD',
      'value': value,
    }
  }

  useSchemaOrg([posting])
})

const typeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

const { locale } = useI18n()

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Format salary for display */
function formatSalary(min?: number | null, max?: number | null, currency?: string | null, unit?: string | null): string | null {
  if (!min && !max) return null
  const cur = currency || 'USD'
  const fmt = (v: number) => new Intl.NumberFormat(locale.value, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v)
  const unitLabel = unit ? `/${unit.toLowerCase().replace('year', 'yr').replace('month', 'mo').replace('hour', 'hr')}` : ''
  if (min && max) return `${fmt(min)} – ${fmt(max)}${unitLabel}`
  return `${fmt(min || max!)}${unitLabel}`
}
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="fetchStatus === 'pending'" class="animate-pulse space-y-4">
      <div class="h-4 w-24 bg-surface-200 dark:bg-surface-800 rounded" />
      <div class="mt-4 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div class="h-1 bg-surface-200 dark:bg-surface-800" />
        <div class="p-6 sm:p-8 space-y-4">
          <div class="flex gap-2">
            <div class="h-6 w-28 bg-surface-200 dark:bg-surface-800 rounded-full" />
            <div class="h-6 w-20 bg-surface-200 dark:bg-surface-800 rounded-full" />
          </div>
          <div class="h-8 w-64 bg-surface-200 dark:bg-surface-800 rounded-lg" />
          <div class="h-4 w-40 bg-surface-200 dark:bg-surface-800 rounded" />
          <div class="space-y-2 pt-2">
            <div class="h-3 w-full bg-surface-200 dark:bg-surface-800 rounded" />
            <div class="h-3 w-5/6 bg-surface-200 dark:bg-surface-800 rounded" />
            <div class="h-3 w-4/6 bg-surface-200 dark:bg-surface-800 rounded" />
          </div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="fetchError" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="mb-5 flex size-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
        <Briefcase class="size-7 text-surface-400" />
      </div>
      <h1 class="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">Job Not Found</h1>
      <p class="text-sm text-surface-500 mb-6 max-w-xs">
        This position may no longer be available or is not currently accepting applications.
      </p>
      <NuxtLink
        :to="$localePath('/jobs')"
        class="inline-flex items-center gap-1.5 rounded-xl border border-surface-300 dark:border-surface-700 px-5 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors shadow-sm"
      >
        <ArrowLeft class="size-4" />
        Browse all positions
      </NuxtLink>
    </div>

    <!-- Job detail -->
    <template v-else-if="job">
      <!-- Back link -->
      <NuxtLink
        :to="$localePath('/jobs')"
        class="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 transition-colors mb-6 group"
      >
        <ArrowLeft class="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        All positions
      </NuxtLink>

      <!-- Job hero card -->
      <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm overflow-hidden mb-5">
        <!-- Accent bar -->
        <div class="h-1 bg-gradient-to-r from-brand-500 to-brand-400" />

        <div class="p-6 sm:p-8">
          <!-- Meta chips -->
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span
              v-if="job.organizationName"
              class="inline-flex items-center gap-1.5 rounded-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1 text-xs font-medium text-surface-700 dark:text-surface-300"
            >
              <Building2 class="size-3.5 text-surface-400" />
              {{ job.organizationName }}
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-950 border border-brand-100 dark:border-brand-900 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
              <Briefcase class="size-3.5" />
              {{ typeLabels[job.type] ?? job.type }}
            </span>
            <span
              v-if="job.location"
              class="inline-flex items-center gap-1.5 rounded-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-1 text-xs font-medium text-surface-600 dark:text-surface-400"
            >
              <MapPin class="size-3.5 text-surface-400" />
              {{ job.location }}
            </span>
            <span
              v-if="formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryUnit)"
              class="inline-flex items-center gap-1.5 rounded-full border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-950 px-3 py-1 text-xs font-semibold text-success-700 dark:text-success-300"
            >
              {{ formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryUnit) }}
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-50 mb-2">
            {{ job.title }}
          </h1>

          <p class="inline-flex items-center gap-1.5 text-xs text-surface-400">
            <Calendar class="size-3.5" />
            Posted {{ formatDate(job.createdAt) }}
          </p>

          <!-- Apply CTA inline -->
          <div class="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-t border-surface-100 dark:border-surface-800 pt-5">
            <NuxtLink
              :to="$localePath(`/jobs/${job.slug}/apply`)"
              class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm"
            >
              Apply Now
              <ExternalLink class="size-3.5" />
            </NuxtLink>
            <p class="text-xs text-surface-400">Takes a few minutes · No account required</p>
          </div>
        </div>
      </div>

      <!-- Description card -->
      <div v-if="job.description" class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm overflow-hidden mb-5">
        <div class="border-b border-surface-100 dark:border-surface-800 px-6 sm:px-8 py-4">
          <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">About this role</h2>
        </div>
        <div class="px-6 sm:px-8 py-6">
          <MarkdownDescription :value="job.description" />
        </div>
      </div>

      <!-- Questions preview card -->
      <div v-if="job.questions && job.questions.length > 0" class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm overflow-hidden mb-5">
        <div class="border-b border-surface-100 dark:border-surface-800 px-6 sm:px-8 py-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Application questions</h2>
          <span class="rounded-full bg-surface-100 dark:bg-surface-800 px-2.5 py-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
            {{ job.questions.length }}
          </span>
        </div>
        <div class="px-6 sm:px-8 py-5">
          <p class="text-sm text-surface-500 mb-4">
            You'll be asked to answer {{ job.questions.length }}
            additional question{{ job.questions.length === 1 ? '' : 's' }} when you apply.
          </p>
          <ul class="divide-y divide-surface-100 dark:divide-surface-800">
            <li
              v-for="q in job.questions"
              :key="q.id"
              class="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span class="text-sm text-surface-700 dark:text-surface-300">{{ q.label }}</span>
              <span
                v-if="q.required"
                class="shrink-0 rounded-full bg-danger-50 dark:bg-danger-950 border border-danger-100 dark:border-danger-900 px-2 py-0.5 text-xs font-medium text-danger-600 dark:text-danger-400"
              >
                Required
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Apply CTA -->
      <div class="rounded-2xl border border-brand-100 dark:border-brand-900 bg-brand-50 dark:bg-brand-950/50 px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">Ready to apply?</p>
          <p class="text-sm text-surface-500 mt-0.5">Submit your application in just a few minutes.</p>
        </div>
        <NuxtLink
          :to="$localePath(`/jobs/${job.slug}/apply`)"
          class="shrink-0 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm"
        >
          Apply for this position
          <ExternalLink class="size-3.5" />
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
