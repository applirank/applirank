---
name: 'Design System & Visual Language'
description: 'Landing page dark theme patterns, icon conventions (lucide-vue-next), glow effects, glass-morphism, and brand identity for Applirank'
applyTo: 'app/pages/index.vue,app/components/**,app/layouts/**'
---

# Design System — Visual Language & Patterns

Applirank uses a two-mode design approach:
- **Public pages** (landing, marketing): Dark aesthetic inspired by Linear/Resend/Raycast
- **Authenticated app** (dashboard, forms): Light semantic theme using `@theme` design tokens

---

## 1. Icon Library — `lucide-vue-next`

All icons use **`lucide-vue-next`** — a tree-shakeable, MIT-licensed icon library with 1400+ icons.

```vue
<script setup lang="ts">
import { ArrowRight, Database, ShieldCheck } from 'lucide-vue-next'
</script>

<template>
  <ArrowRight class="size-5" />
  <Database class="size-6 text-brand-500" />
  <ShieldCheck class="size-4 text-white/60" />
</template>
```

### Sizing convention

| Context | Size | Tailwind class |
|---------|------|---------------|
| Inline text icon | 16px | `size-4` |
| Button / nav icon | 20px | `size-5` |
| Card / feature icon | 24px | `size-6` |
| Hero / display icon | 32px+ | `size-8` |

### Brand logos

Lucide does not include brand icons. Use inline SVGs for:
- **Nuxt** — green `#00DC82` N-shaped logomark
- **PostgreSQL** — blue `#336791` elephant
- **Docker**, **MinIO**, etc. — official SVG logomarks

Keep inline brand SVGs compact (single `<svg>` with `<path>`). Wrap in a container with consistent sizing.

### What NOT to use

| Anti-pattern | Why |
|---|---|
| Heroicons | Non-standard — Lucide is the project standard |
| Font Awesome | Bloated, font-based — Lucide is tree-shakeable |
| Emoji in UI | Unprofessional, inconsistent cross-platform |
| Inline SVG for generic icons | Check Lucide first (https://lucide.dev/icons) |

---

## 2. Landing Page & Roadmap — Dark Theme

The public landing page (`app/pages/index.vue`) and roadmap page (`app/pages/roadmap.vue`) establish the brand identity. Both use the same dark aesthetic.

### Color palette

| Element | Tailwind classes | Notes |
|---------|-----------------|-------|
| Page background | `bg-[#09090b]` | Near-black zinc |
| Primary text | `text-white` | Headings, CTAs |
| Secondary text | `text-white/60` | Descriptions, subtitles |
| Tertiary text | `text-white/40` | Footer, meta text |
| Glass borders | `border-white/[0.06]` | Cards, nav, dividers |
| Card surface | `bg-white/[0.03]` | Feature cards |
| Card hover | `hover:bg-white/[0.06]` | Interactive elevation |
| Nav background | `bg-[#09090b]/80 backdrop-blur-md` | Sticky nav with blur |
| CTA button | `bg-gradient-to-r from-indigo-500 to-purple-600` | Primary action |
| CTA hover | `hover:from-indigo-400 hover:to-purple-500` | Lighter on hover |
| Link text | `text-indigo-400 hover:text-indigo-300` | Inline links |

### Glow effects

Decorative glowing blobs add depth and visual interest:

```vue
<!-- Hero glow — centered behind the title -->
<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

<!-- Section glow — offset, subtler -->
<div class="absolute -bottom-32 right-0 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
```

**Rules for glow elements:**
1. Always use `absolute` positioning inside a `relative` container
2. Always add `overflow-hidden` on the parent section to prevent extra scroll space
3. Use low opacity (`/10` to `/20`) — glows should be atmospheric, not distracting
4. Use `blur-3xl` or `blur-2xl` for soft, diffused effect

### Grid pattern overlay

A subtle grid texture adds depth to hero sections:

```vue
<div
  class="absolute inset-0"
  :style="{
    backgroundImage: `url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M60 0H0v60' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E\")`,
  }"
/>
```

### Body background override

Dark pages embedded in a light-mode layout must override the body background:

```ts
useHead({
  bodyAttrs: {
    style: 'background-color: #09090b;',
  },
})
```

This prevents the light body color from `@layer base` in `main.css` from bleeding below the page content.

---

## 3. Page Sections — Landing Page Structure

The landing page follows a common SaaS marketing page structure:

| Section | Purpose | Key visual |
|---------|---------|-----------|
| **Navbar** | Navigation, logo, auth-aware CTA | Fixed, backdrop-blur, glass border |
| **Hero** | Value proposition, primary CTA | Centered text, glow blob, grid pattern |
| **Value Props** | 4 UVP cards (ownership, AI, pricing, privacy) | Icon + title + description cards |
| **How It Works** | 3-step getting started flow | Numbered steps with icons |
| **Tech Stack** | Technology badges with icons | Grid of tech items with brand SVGs |
| **CTA** | Final conversion prompt | Gradient CTA button, GitHub link |
| **Footer** | Links, copyright | Muted text, border-top |

### Auth-aware rendering

The navbar and hero conditionally show content based on session state:

```ts
const { data: session } = await authClient.useSession(useFetch)
```

```vue
<NuxtLink v-if="session" to="/dashboard">Dashboard</NuxtLink>
<template v-else>
  <NuxtLink to="/auth/sign-in">Sign In</NuxtLink>
  <NuxtLink to="/auth/sign-up">Get Started</NuxtLink>
</template>
```

---

## 4. Authenticated App — Light Theme

Dashboard and form pages use the semantic `@theme` tokens from `app/assets/css/main.css`:

| Element | Light | Dark |
|---------|-------|------|
| Page bg | `bg-surface-50` | `dark:bg-surface-950` |
| Card bg | `bg-white` | `dark:bg-surface-900` |
| Primary text | `text-surface-900` | `dark:text-surface-100` |
| Secondary text | `text-surface-500` | `dark:text-surface-400` |
| Borders | `border-surface-200` | `dark:border-surface-800` |
| Primary button | `bg-brand-600 text-white` | Same (brand works in both modes) |
| Active sidebar item | `bg-brand-50 text-brand-700 font-medium` | `dark:bg-brand-950 dark:text-brand-400` |
| Sidebar text | `text-surface-600` | `dark:text-surface-400` |
| Sidebar hover | `hover:bg-surface-100 hover:text-surface-900` | `dark:hover:bg-surface-800` |

### Dashboard layout pattern

The dashboard layout provides a sidebar + full-width main area. Each page controls its own width:

```vue
<!-- Page root element — always include mx-auto with max-w-* -->
<div class="mx-auto max-w-3xl">
  <!-- page content -->
</div>
```

Full-width pages (e.g., pipeline Kanban board) omit `max-w-*`.

### Sidebar styling conventions

- Uses Tailwind utility classes only (no `<style scoped>`)
- Nav items use Lucide icons (`size-4`) with `gap-2.5` spacing
- Active state: `bg-brand-50 text-brand-700 font-medium`
- Dynamic job context section separated by `border-t border-surface-200`

---

## 5. Tone & Voice

Applirank's design communicates:
- **Professional** — engineering-grade, not flashy marketing
- **Transparent** — "Glass Box" philosophy extends to the UI: show data, explain decisions
- **Efficient** — clean layouts, no clutter, fast visual scanning
- **High-integrity** — no dark patterns, no misleading CTAs

### Copy guidelines
- Headlines: Short, declarative, benefit-focused ("Own Your Talent Pipeline")
- Descriptions: One sentence, concrete ("Your hiring data stays on your servers")
- CTAs: Action verbs ("Get Started", "Deploy Now", "View Dashboard")
- Avoid: marketing superlatives ("revolutionary", "game-changing"), exclamation marks
