---
name: 'Vue Frontend & Nuxt App'
description: 'Vue 3 SFC patterns, Nuxt 4 data fetching, composables, pages, layouts, and auth client for the Applirank ATS frontend'
applyTo: 'app/**'
---

# Vue Frontend — Pages, Components, Composables & Auth

Applirank is a **Nuxt 4** app (Vue 3 + Composition API). All client-side source code lives in the `app/` directory.
The `~` alias resolves to `app/`. This is a **multi-tenant ATS** — the active organization comes from the user session.

Reference docs:
- [Vue 3 Composition API](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue composables](https://vuejs.org/guide/reusability/composables.html)
- [Nuxt data fetching](https://nuxt.com/docs/getting-started/data-fetching)
- [Better Auth Nuxt integration](https://www.better-auth.com/docs/integrations/nuxt)

---

## 1. Project Structure — Where Frontend Code Lives

```
app/
├── app.vue                  # Root component (NuxtRouteAnnouncer + NuxtPage)
├── assets/                  # CSS, fonts, images (processed by build)
├── components/              # Auto-imported Vue components
│   ├── AppHeader.vue
│   ├── ui/                  # Generic UI components (buttons, inputs, modals)
│   └── jobs/                # Feature-scoped components
├── composables/             # Auto-imported composables (useXxx)
├── layouts/                 # Layout components (default.vue, auth.vue)
├── middleware/              # Client-side route middleware
├── pages/                   # File-based routing
│   ├── index.vue            # → /
│   ├── login.vue            # → /login
│   └── dashboard/
│       ├── index.vue        # → /dashboard
│       └── jobs/
│           ├── index.vue    # → /dashboard/jobs
│           └── [id].vue     # → /dashboard/jobs/:id
├── plugins/                 # Client-side Nuxt plugins
└── utils/                   # Auto-imported utility functions
    └── auth-client.ts       # Better Auth Vue client
```

### Rules

- `server/`, `public/`, `modules/` live at project root — **NEVER** inside `app/`.
- `~` resolves to `app/` — use `~/components/Foo.vue`, `~/composables/useFoo`, etc.
- Components, composables, and utils in their respective directories are **auto-imported** — no manual `import` statements needed.
- Component auto-import names match their file path: `components/ui/AppButton.vue` → `<UiAppButton>` or configure via `components.dirs` in `nuxt.config.ts`.

---

## 2. Single-File Component (SFC) Conventions

### Template

```vue
<script setup lang="ts">
// 1. Imports (only for non-auto-imported items)
import type { Job } from '~/types'

// 2. Props and emits
const props = defineProps<{
  jobId: string
  title: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
  (e: 'delete'): void
}>()

// 3. Composables and state
const { data: session } = await authClient.useSession(useFetch)
const isOpen = ref(false)
const formattedTitle = computed(() => props.title.toUpperCase())

// 4. Functions
function handleDelete() {
  emit('delete')
}
</script>

<template>
  <div>
    <h2>{{ formattedTitle }}</h2>
    <button @click="handleDelete">Delete</button>
  </div>
</template>
```

### Rules

| Rule | Details |
|------|---------|
| Always use `<script setup lang="ts">` | Never use Options API or `setup()` function return |
| Props: use type-based declaration | `defineProps<{ ... }>()` — not runtime `defineProps({ ... })` |
| Emits: use type-based declaration | `defineEmits<{ ... }>()` |
| Script section order | imports → props/emits → composables/state → computed → functions |
| Template: use `kebab-case` for native HTML or `PascalCase` for components | `<AppButton>` not `<app-button>` for custom components |
| No `this` keyword | Composition API — everything is a local variable |
| Prefer `ref()` over `reactive()` | `ref` is destructure-safe and composable-friendly |

### Defining default prop values

```ts
// ✅ Nuxt 4 / Vue 3.5+ — withDefaults with defineProps
const props = withDefaults(defineProps<{
  status?: string
  count?: number
}>(), {
  status: 'draft',
  count: 0,
})

// ✅ Also valid — destructure with defaults (Vue 3.5+)
const { status = 'draft', count = 0 } = defineProps<{
  status?: string
  count?: number
}>()
```

---

## 3. Data Fetching — Nuxt 4 Patterns

### Critical Nuxt 4 difference: `shallowRef` by default

All `useFetch` / `useAsyncData` return `shallowRef` data. Mutating nested properties **will not trigger reactivity**.

```ts
// data.value.nested.field = 'x'  ← WON'T trigger updates!

// ✅ Replace the entire value
data.value = { ...data.value, nested: { ...data.value.nested, field: 'x' } }

// ✅ Or opt into deep reactivity (performance cost)
const { data } = await useFetch('/api/jobs', { deep: true })
```

### Which API to use

| Context | API | Why |
|---------|-----|-----|
| Component `<script setup>` | `useFetch` / `useAsyncData` | SSR-safe, prevents double fetch |
| Event handlers, after user interaction | `$fetch` | No SSR concerns, direct call |
| Composable wrapping fetches | `useAsyncData` + `$fetch` | Full control over key and options |
| Server-side only (`server/api/`) | `$fetch` or direct DB query | No client hydration |

### `useFetch` — simple component data loading

```ts
// ✅ Basic usage — type is inferred from server route return type
const { data: jobs, status, error, refresh } = await useFetch('/api/jobs')

// ✅ With query params (reactive)
const page = ref(1)
const { data: jobs } = await useFetch('/api/jobs', {
  query: { page, limit: 20 },  // auto-refetches when page changes
})

// ✅ POST request
const { data: created } = await useFetch('/api/jobs', {
  method: 'POST',
  body: { title: 'Engineer', description: '...' },
})
```

### `useAsyncData` — complex async logic

```ts
// ✅ When you need custom logic or manual key control
const { data: dashboard } = await useAsyncData('dashboard', async () => {
  const [jobs, candidates, stats] = await Promise.all([
    $fetch('/api/jobs'),
    $fetch('/api/candidates'),
    $fetch('/api/stats'),
  ])
  return { jobs, candidates, stats }
})
```

### Singleton keys — shared refs across components

In Nuxt 4, all `useFetch`/`useAsyncData` calls with the **same key** share the same `data`, `error`, and `status` refs.

```ts
// ✅ Extract shared data fetching into composables to stay consistent
// app/composables/useJobs.ts
export function useJobs() {
  return useFetch('/api/jobs', {
    key: 'jobs',
  })
}

// Both ComponentA and ComponentB calling useJobs() share the same ref — no duplicate API call
```

**Rules for shared keys:**
- All calls with the same key **MUST** have identical `deep`, `transform`, `pick`, `getCachedData`, and `default` options.
- Extract shared fetches into composables in `app/composables/` to prevent option mismatches.

### SSR cookie forwarding

When calling protected API routes during SSR, cookies are NOT automatically sent:

```ts
// ❌ WRONG — cookie not forwarded during SSR (returns 401)
const { data } = await useFetch('/api/dashboard')

// ✅ CORRECT — forward cookies for SSR
const { data } = await useFetch('/api/dashboard', {
  headers: useRequestHeaders(['cookie']),
})
```

### `$fetch` for user-triggered actions

```ts
// ✅ In event handlers, after user action — $fetch is correct
async function createJob(formData: { title: string; description: string }) {
  const job = await $fetch('/api/jobs', {
    method: 'POST',
    body: formData,
  })
  // Refresh the jobs list after creation
  await refreshNuxtData('jobs')
}

async function deleteJob(id: string) {
  await $fetch(`/api/jobs/${id}`, { method: 'DELETE' })
  await refreshNuxtData('jobs')
}
```

### `getCachedData` with context (Nuxt 4)

```ts
const { data } = await useAsyncData('jobs', () => $fetch('/api/jobs'), {
  getCachedData: (key, nuxtApp, ctx) => {
    // ctx.cause: 'initial' | 'refresh:hook' | 'refresh:manual' | 'watch'
    if (ctx.cause === 'refresh:manual') return undefined  // always refetch on manual refresh
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
  },
})
```

---

## 4. Authentication — Better Auth Vue Client

### Client setup — `app/utils/auth-client.ts`

```ts
import { createAuthClient } from 'better-auth/vue'
import { organizationClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [
    organizationClient(),
  ],
})
```

- `authClient` is auto-imported (lives in `app/utils/`).
- **NEVER** import from `better-auth/client` or `better-auth/react` — always `better-auth/vue`.

### Session access

```ts
// In <script setup> — SSR-safe
const { data: session } = await authClient.useSession(useFetch)
// session.value?.user, session.value?.session

// In route middleware
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)
  if (!session.value) {
    return navigateTo('/login')
  }
})
```

**Rules:**
- Always pass `useFetch` to `useSession()` for SSR compatibility: `authClient.useSession(useFetch)`
- Without `useFetch`, session is client-only and will flash/flicker on SSR pages
- The session object has `session.value.user` and `session.value.session` (note the nesting)

### Auth actions

```ts
// Sign in with email/password
await authClient.signIn.email({ email, password })

// Sign in with social provider
await authClient.signIn.social({ provider: 'github' })

// Sign up
await authClient.signUp.email({ email, password, name })

// Sign out
await authClient.signOut()

// Access active organization
const { data: session } = await authClient.useSession(useFetch)
const orgId = session.value?.session.activeOrganizationId
```

### Organization management (from `organizationClient` plugin)

```ts
// List user's organizations
const { data: orgs } = await authClient.organization.list(useFetch)

// Set active organization
await authClient.organization.setActive({ organizationId: 'org_xxx' })

// Create organization
await authClient.organization.create({ name: 'Acme Corp', slug: 'acme' })
```

---

## 5. Composables — Patterns & Rules

Composables live in `app/composables/` and are auto-imported.

### Naming

- File: `useFoo.ts` or `useBar.ts`
- Export: `export function useFoo() { ... }`
- Prefix: **always `use`** — this is a Vue/Nuxt convention, not optional

### Structure pattern

```ts
// app/composables/useJobs.ts
export function useJobs(options?: { status?: string }) {
  // 1. Fetch data with SSR-safe method
  const query = computed(() => ({
    ...(options?.status && { status: options.status }),
  }))

  const { data: jobs, status: fetchStatus, error, refresh } = useFetch('/api/jobs', {
    key: 'jobs',
    query,
    headers: useRequestHeaders(['cookie']),
  })

  // 2. Derived state
  const activeJobs = computed(() =>
    jobs.value?.filter(j => j.status === 'open') ?? []
  )
  const jobCount = computed(() => jobs.value?.length ?? 0)

  // 3. Actions
  async function createJob(data: { title: string; description: string }) {
    const created = await $fetch('/api/jobs', {
      method: 'POST',
      body: data,
    })
    await refresh()
    return created
  }

  async function deleteJob(id: string) {
    await $fetch(`/api/jobs/${id}`, { method: 'DELETE' })
    await refresh()
  }

  // 4. Return plain object of refs + functions
  return {
    jobs,
    activeJobs,
    jobCount,
    fetchStatus,
    error,
    refresh,
    createJob,
    deleteJob,
  }
}
```

### Rules

| Rule | Details |
|------|---------|
| Always return a **plain object** of refs | Never return a `reactive()` object — destructuring loses reactivity |
| Use `useState` for cross-component shared state | `useState('key', () => initialValue)` — SSR-safe, survives navigation |
| Never use bare `ref()` for shared state | Causes hydration mismatches and multiple instances |
| Composables must be called in `<script setup>` | Cannot be called in event handlers or callbacks (Vue restriction) |
| Accept reactive inputs | Use `toValue()` inside `watchEffect()` if inputs may be ref/getter |

### Action-only composable (no SSR fetch)

For composables that only provide user-triggered actions (no page data loading):

```ts
// app/composables/useDocuments.ts — action-only, no useFetch
export function useDocuments() {
  async function uploadDocument(candidateId: string, file: File, type: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    const result = await $fetch(`/api/candidates/${candidateId}/documents`, {
      method: 'POST', body: formData,
    })
    await refreshNuxtData(`candidate-${candidateId}`)
    return result
  }

  async function downloadDocument(documentId: string) {
    const { url } = await $fetch(`/api/documents/${documentId}/download`)
    window.open(url, '_blank')
  }

  // Synchronous — returns the API endpoint URL (server streams the PDF)
  function getPreviewUrl(documentId: string): string {
    return `/api/documents/${documentId}/preview`
  }

  async function deleteDocument(documentId: string, candidateId: string) {
    await $fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
    await refreshNuxtData(`candidate-${candidateId}`)
  }

  return { uploadDocument, downloadDocument, getPreviewUrl, deleteDocument }
}
```

**Key pattern**: `getPreviewUrl()` is synchronous — it returns the API endpoint path directly. The server streams the PDF bytes, so the iframe `src` points to a same-origin URL. No presigned URLs are involved on the client.

### `useState` for SSR-safe shared state

```ts
// ✅ Shared state — survives SSR and client navigation
export function useSidebar() {
  const isOpen = useState('sidebar-open', () => false)

  function toggle() { isOpen.value = !isOpen.value }
  function open() { isOpen.value = true }
  function close() { isOpen.value = false }

  return { isOpen, toggle, open, close }
}

// ❌ WRONG — bare ref creates separate instances, hydration mismatch
export function useSidebar() {
  const isOpen = ref(false)  // Every component gets its own copy!
  return { isOpen }
}
```

---

## 6. Pages & Routing

### File-based routing

```
app/pages/
├── index.vue               → /           (public landing page — dark theme, no auth required)
├── roadmap.vue             → /roadmap    (public roadmap — horizontal timeline, dark theme)
├── auth/
│   ├── sign-in.vue         → /auth/sign-in
│   └── sign-up.vue         → /auth/sign-up
├── dashboard/
│   ├── index.vue           → /dashboard
│   ├── candidates/
│   │   ├── index.vue       → /dashboard/candidates
│   │   ├── new.vue         → /dashboard/candidates/new
│   │   └── [id].vue        → /dashboard/candidates/:id
│   ├── applications/
│   │   ├── index.vue       → /dashboard/applications
│   │   └── [id].vue        → /dashboard/applications/:id
│   └── jobs/
│       ├── index.vue       → /dashboard/jobs           (list/gallery view)
│       ├── new.vue         → /dashboard/jobs/new
│       └── [id]/
│           ├── index.vue           → /dashboard/jobs/:id              (overview, edit, delete)
│           ├── pipeline.vue        → /dashboard/jobs/:id/pipeline     (Kanban board, full width)
│           └── application-form.vue→ /dashboard/jobs/:id/application-form (questions + link)
├── jobs/                                     (public job board — no auth, `public` layout)
│   ├── index.vue           → /jobs           (browse open positions)
│   └── [slug]/
│       ├── index.vue       → /jobs/:slug       (job detail)
│       ├── apply.vue       → /jobs/:slug/apply (application form)
│       └── confirmation.vue→ /jobs/:slug/confirmation
├── onboarding/
│   └── create-org.vue      → /onboarding/create-org
└── [...slug].vue           → catch-all 404

⚠️ **Routing rule**: If a directory `[id]/` exists with child routes, do NOT also
create `[id].vue` — Nuxt treats the file as a parent layout. Use `[id]/index.vue` instead.
```

### Page meta

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',           // Use layouts/dashboard.vue
  middleware: ['auth'],           // Apply named middleware
  title: 'Jobs',                  // Accessible in middleware via to.meta.title
})

// Page-level <head> management
useSeoMeta({
  title: 'Jobs — Applirank',
  description: 'Manage your open positions',
})
</script>
```

### Dynamic route params

```vue
<!-- app/pages/dashboard/jobs/[id].vue -->
<script setup lang="ts">
const route = useRoute()
const jobId = computed(() => route.params.id as string)

const { data: job, error } = await useFetch(() => `/api/jobs/${jobId.value}`, {
  headers: useRequestHeaders(['cookie']),
})

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Job not found' })
}
</script>
```

---

## 7. Layouts

```
app/layouts/
├── default.vue      # Default (landing, login)
├── auth.vue         # Auth pages (sign-in, sign-up) — centered card layout
├── dashboard.vue    # Authenticated app shell (sidebar + full-width main area)
└── public.vue       # Public-facing pages (job board, apply form) — simple header/footer
```

### Layout component pattern

```vue
<!-- app/layouts/dashboard.vue -->
<script setup lang="ts">
const { data: session } = await authClient.useSession(useFetch)
</script>

<template>
  <div class="flex min-h-screen">
    <AppSidebar />
    <main class="flex-1 overflow-y-auto bg-surface-50 px-6 py-8">
      <slot />
    </main>
  </div>
</template>
```

The dashboard layout provides only the sidebar + a full-width `<main>` area. **Each page controls its own width**:
- Content pages: `<div class="mx-auto max-w-3xl">` or `mx-auto max-w-4xl`
- Full-width pages (e.g., pipeline Kanban): no `max-w-*` constraint
- **Always include `mx-auto`** alongside `max-w-*` for centering

### Sidebar — Dynamic Job Context

The `AppSidebar` component auto-detects when the route matches `/dashboard/jobs/:id/*` and shows contextual tabs:
- **Overview** → `/dashboard/jobs/:id`
- **Pipeline** → `/dashboard/jobs/:id/pipeline`
- **Application Form** → `/dashboard/jobs/:id/application-form`

Job sub-pages should NOT include "Back to X" links — the sidebar provides all navigation.

Set layout per page with `definePageMeta({ layout: 'dashboard' })`.

---

## 8. Route Middleware (Client-Side)

Middleware lives in `app/middleware/` and runs on navigation (client + SSR).

### Auth protection

```ts
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)

  if (!session.value) {
    return navigateTo('/login')
  }
})
```

### Organization-required middleware

```ts
// app/middleware/require-org.ts
export default defineNuxtRouteMiddleware(async () => {
  const { data: session } = await authClient.useSession(useFetch)

  if (!session.value?.session.activeOrganizationId) {
    return navigateTo('/onboarding/create-org')
  }
})
```

### Middleware return values

| Return | Effect |
|--------|--------|
| nothing / `undefined` | Continue navigation |
| `navigateTo('/path')` | Redirect (302 on server) |
| `navigateTo('/path', { redirectCode: 301 })` | Permanent redirect |
| `abortNavigation()` | Cancel navigation |
| `abortNavigation(createError({ ... }))` | Cancel with error |

### Applying middleware

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'require-org'],  // Applied in order
})
</script>
```

Global middleware: name the file `*.global.ts` (e.g., `app/middleware/tracking.global.ts`).

---

## 9. `<head>` Management (Unhead v2)

```ts
// ✅ Preferred — useSeoMeta for SEO tags
useSeoMeta({
  title: 'Dashboard — Applirank',
  description: 'Manage your recruitment pipeline',
  ogTitle: 'Dashboard — Applirank',
  ogImage: '/og-image.png',
})

// ✅ useHead for non-SEO head tags
useHead({
  meta: [{ name: 'robots', content: 'noindex' }],
  link: [{ rel: 'canonical', href: 'https://applirank.com/dashboard' }],
})

// ❌ REMOVED in Nuxt 4 — do NOT use vmid or hid
useHead({
  meta: [{ name: 'description', content: '...', hid: 'desc' }]  // WRONG
})
```

Import from `#imports` — not `@unhead/vue`:

```ts
// ✅ Correct
import { useHead, useSeoMeta } from '#imports'

// ❌ Works but not recommended
import { useHead } from '@unhead/vue'
```

---

## 10. Reactivity — Quick Reference

### Prefer `ref` over `reactive`

```ts
// ✅ ref — destructure-safe, composable-friendly
const count = ref(0)
const user = ref<User | null>(null)

// ⚠️ reactive — NOT destructure-safe, has limitations
const state = reactive({ count: 0 })
const { count } = state  // ← LOSES REACTIVITY
```

### Computed values

```ts
const fullName = computed(() => `${user.value.firstName} ${user.value.lastName}`)
```

### Watchers

```ts
// Watch a single ref
watch(jobId, async (newId) => {
  await loadJob(newId)
})

// Watch multiple sources
watch([page, filter], async ([newPage, newFilter]) => {
  await loadJobs(newPage, newFilter)
})

// watchEffect — auto-tracks dependencies
watchEffect(() => {
  console.log(`Current job: ${jobId.value}`)
})
```

### `shallowRef` awareness (Nuxt 4 default for data fetching)

```ts
// useFetch returns shallowRef by default in Nuxt 4
const { data } = await useFetch('/api/jobs')

// ❌ Won't trigger reactivity updates
data.value.someNestedField = 'new'

// ✅ Replace the entire value
data.value = { ...data.value, someNestedField: 'new' }

// ✅ Or use triggerRef to force update
import { triggerRef } from 'vue'
data.value.someNestedField = 'new'
triggerRef(data)

// ✅ Or opt into deep reactivity
const { data } = await useFetch('/api/jobs', { deep: true })
```

---

## 11. TypeScript Patterns

### Typing props and emits

```ts
// Props with types
defineProps<{
  job: Job
  isEditing: boolean
  onSave?: (job: Job) => void
}>()

// Emits with types
const emit = defineEmits<{
  save: [job: Job]
  cancel: []
  'update:modelValue': [value: string]
}>()
```

### Typing template refs

```ts
const inputRef = useTemplateRef<HTMLInputElement>('input')
// In template: <input ref="input" />

onMounted(() => {
  inputRef.value?.focus()
})
```

### Typing composable returns

```ts
// Let TypeScript infer — don't manually type the return
export function useJobs() {
  const { data, error } = useFetch('/api/jobs')
  return { data, error }  // Types are inferred from useFetch
}
```

### Using server model types

```ts
// Types are inferred from server route response types
// No need to duplicate — Nuxt generates these automatically
const { data: job } = await useFetch(`/api/jobs/${id}`)
// job is typed based on what server/api/jobs/[id].get.ts returns
```

---

## 12. Error Handling

### Page-level errors

```vue
<script setup lang="ts">
const { data, error } = await useFetch('/api/jobs')

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: 'Failed to load jobs',
  })
}
</script>
```

### `<NuxtErrorBoundary>` for component-level errors

```vue
<template>
  <NuxtErrorBoundary>
    <JobsList />
    <template #error="{ error, clearError }">
      <div class="error-state">
        <p>Something went wrong: {{ error.message }}</p>
        <button @click="clearError">Try again</button>
      </div>
    </template>
  </NuxtErrorBoundary>
</template>
```

### Global error page — `app/error.vue`

```vue
<!-- app/error.vue -->
<script setup lang="ts">
const props = defineProps<{
  error: { statusCode: number; statusMessage: string; message: string }
}>()

function handleClear() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.statusMessage }}</p>
    <button @click="handleClear">Go home</button>
  </div>
</template>
```

---

## 13. NEVER Do These

| Anti-pattern | Why | Do this instead |
|-------------|-----|-----------------|
| Use `$fetch` in `<script setup>` for page data | Causes double fetch (SSR + hydration) | Use `useFetch` or `useAsyncData` |
| Import from `better-auth/react` or `better-auth/client` | Wrong framework binding | `import { createAuthClient } from 'better-auth/vue'` |
| Call `authClient.useSession()` without `useFetch` | Client-only — flashes on SSR pages | `authClient.useSession(useFetch)` |
| Use `reactive()` for composable return | Breaks destructuring, loses reactivity | Return plain object of `ref`s |
| Use bare `ref()` for cross-component shared state | Hydration mismatch, multiple instances | Use `useState('key', () => init)` |
| Put `server/` inside `app/` directory | Wrong Nuxt 4 structure | `server/` stays at project root |
| Use Options API (`data()`, `methods`, `computed`) | Not compatible with Composition API patterns | Use `<script setup>` with `ref`, `computed` |
| Use `vmid` or `hid` in `useHead()` | Removed in Unhead v2 (Nuxt 4) | Just declare `meta` array directly |
| Import from `@unhead/vue` directly | Not recommended in Nuxt context | Import from `#imports` |
| Manually import auto-imported composables | Unnecessary, clutters code | Rely on Nuxt auto-imports |
| Access `route.meta.name` for route name | Deduplicated in Nuxt 4 | Use `route.name` |
| Mutate nested `shallowRef` data expecting reactivity | `useFetch` returns `shallowRef` in Nuxt 4 | Replace entire value or use `deep: true` |
| Trust org ID from URL params for authorization | Tenant spoofing — security vulnerability | Get org ID from session: `session.value.session.activeOrganizationId` |
| Create pages without `definePageMeta` for protected routes | No auth protection | Always add `middleware: ['auth']` on protected pages |
| Use presigned S3 URLs as iframe `src` | Cross-origin blocking, URL leakage | Use same-origin server-proxied endpoint as iframe `src` |
| Add `sandbox` attribute to PDF preview iframes | Browser PDF viewer needs scripts to render | Omit `sandbox` — trust same-origin server-proxied content |

---

## 14. Complete Page Example

```vue
<!-- app/pages/dashboard/jobs/index.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

useSeoMeta({
  title: 'Jobs — Applirank',
  description: 'Manage your open positions',
})

// Data fetching — SSR-safe with cookie forwarding
const { data: jobs, status, error, refresh } = await useFetch('/api/jobs', {
  headers: useRequestHeaders(['cookie']),
})

// Local UI state
const showCreateModal = ref(false)

// Actions using $fetch (after user interaction)
async function handleCreate(formData: { title: string; description: string }) {
  await $fetch('/api/jobs', {
    method: 'POST',
    body: formData,
  })
  showCreateModal.value = false
  await refresh()
}

async function handleDelete(id: string) {
  if (!confirm('Are you sure?')) return
  await $fetch(`/api/jobs/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <header class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Jobs</h1>
      <button @click="showCreateModal = true">
        Create Job
      </button>
    </header>

    <!-- Loading state -->
    <div v-if="status === 'pending'">
      Loading jobs...
    </div>

    <!-- Error state -->
    <div v-else-if="error">
      <p>Failed to load jobs: {{ error.message }}</p>
      <button @click="refresh()">Retry</button>
    </div>

    <!-- Data loaded -->
    <div v-else-if="jobs?.length">
      <div v-for="job in jobs" :key="job.id" class="border rounded p-4 mb-3">
        <NuxtLink :to="`/dashboard/jobs/${job.id}`" class="font-semibold">
          {{ job.title }}
        </NuxtLink>
        <span class="ml-2 text-sm text-gray-500">{{ job.status }}</span>
        <button class="ml-auto text-red-600" @click="handleDelete(job.id)">
          Delete
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else>
      <p>No jobs yet. Create your first position.</p>
    </div>
  </div>
</template>
```

---

## 15. Complete Composable Example

```ts
// app/composables/useCurrentOrg.ts

/**
 * Returns the active organization ID from the current session.
 * Must be called in <script setup> context.
 */
export function useCurrentOrg() {
  const { data: session } = authClient.useSession(useFetch)

  const orgId = computed(() => session.value?.session.activeOrganizationId ?? null)
  const isOrgSelected = computed(() => !!orgId.value)

  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => !!session.value)

  return {
    session,
    orgId,
    isOrgSelected,
    user,
    isAuthenticated,
  }
}
```

---

## 16. Styling — Tailwind CSS v4

All component styling uses **Tailwind CSS v4 utility classes** applied directly in templates.
For full conventions, see the dedicated [Tailwind CSS instructions](tailwindcss.instructions.md).

### Quick rules

| Rule | Details |
|------|---------|
| Use utility classes in templates | `class="flex items-center gap-2 px-4 py-2 text-sm"` |
| Avoid `<style scoped>` | Only for complex animations or third-party overrides |
| Custom theme tokens in `@theme` | Defined in `app/assets/css/main.css` — NOT `tailwind.config.js` |
| No string interpolation for classes | `bg-${color}-500` won't work — use object maps instead |
| Dark mode via `dark:` variant | `class="bg-white dark:bg-gray-900"` |
| Responsive via breakpoint prefixes | `class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"` |

```vue
<!-- ✅ Correct Tailwind styling -->
<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
      <h1 class="text-xl font-bold text-gray-900">Title</h1>
    </div>
  </div>
</template>

<!-- ❌ Don't do this — use Tailwind utilities instead -->
<template>
  <div class="layout-auth">...</div>
</template>
<style scoped>
.layout-auth { min-height: 100vh; display: flex; }
</style>
```

---

## 17. Icons — `lucide-vue-next`

Use **`lucide-vue-next`** for all icons. Import individual icons by name — they are tree-shakeable.

```vue
<script setup lang="ts">
import { ArrowRight, Database, ShieldCheck } from 'lucide-vue-next'
</script>

<template>
  <ArrowRight class="size-5" />
  <Database class="size-6 text-brand-500" />
</template>
```

### Rules

| Rule | Details |
|------|---------|
| Import from `lucide-vue-next` | Always import individual icons — tree-shakeable |
| Size with Tailwind | `class="size-4"`, `class="size-5"`, `class="size-6"` |
| Color with Tailwind | `class="text-white"`, `class="text-brand-500"` |
| Browse icons | https://lucide.dev/icons |
| Brand logos | Use inline SVG — Lucide doesn't include brand icons (Nuxt, PostgreSQL, etc.) |

### What NOT to do

| Anti-pattern | Why |
|---|---|
| Heroicons, Font Awesome, etc. | Standardize on Lucide for consistency |
| Inline SVG paths for generic icons | Lucide has 1400+ icons — check there first |
| Emoji for UI indicators | Use Lucide icons for professional appearance |
| `<i class="fa-...">` | Font-based icons are bloated — Lucide is tree-shakeable |

---

## 18. Landing Page Patterns

The public landing page (`app/pages/index.vue`) is a standalone dark-mode marketing page. The roadmap page (`app/pages/roadmap.vue`) uses the same dark aesthetic with a horizontal-scrolling card timeline. These patterns apply when building similar public pages.

### Dark page in a light-mode app

When a page has a dark background but the app's base CSS uses a light body color, override the body:

```ts
// Prevents light body background from showing below the page content
useHead({
  bodyAttrs: {
    style: 'background-color: #09090b;',
  },
})
```

### Auth-aware rendering

Show different CTAs based on authentication status:

```ts
const { data: session } = await authClient.useSession(useFetch)
```

```vue
<template>
  <NuxtLink v-if="session" to="/dashboard">Dashboard</NuxtLink>
  <NuxtLink v-else to="/auth/sign-in">Sign In</NuxtLink>
</template>
```

### Overflow containment for decorative elements

When using decorative glow blobs or elements with `translate-y-*`, wrap the container in `overflow-hidden`:

```vue
<!-- ✅ Prevents glow blob from adding extra scroll space -->
<section class="relative overflow-hidden py-24">
  <div class="absolute -bottom-32 left-1/2 h-64 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
  <!-- section content -->
</section>
```