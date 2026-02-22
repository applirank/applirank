// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

const railwayEnvironmentName = process.env.RAILWAY_ENVIRONMENT_NAME?.toLowerCase() ?? ''
const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.toLowerCase() ?? ''
const isRailwayPreview =
  railwayEnvironmentName.startsWith('pr')
  || railwayEnvironmentName.includes('pr-')
  || railwayEnvironmentName.includes('pull request')
  || railwayEnvironmentName.includes('pull-request')
  || railwayEnvironmentName.includes('preview')
  || railwayPublicDomain.includes('-pr-')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/seo', '@nuxt/content'],

  css: ['~/assets/css/main.css'],

  // ─────────────────────────────────────────────
  // Site config — shared across all SEO modules
  // ─────────────────────────────────────────────
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://applirank.com',
    name: 'Applirank',
    description: 'Open-source applicant tracking system with transparent AI, no per-seat pricing, and full data ownership. Self-host on your own infrastructure.',
    defaultLocale: 'en',
  },

  // ─────────────────────────────────────────────
  // Global <head> — lang, title template, favicon
  // ─────────────────────────────────────────────
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s — Applirank',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      meta: [
        { name: 'theme-color', content: '#09090b' },
      ],
      script: [
        {
          defer: true,
          'data-domain': 'applirank.com',
          src: 'https://test-plausible.kjadfu.easypanel.host/js/script.js',
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      /** When set, the dashboard shows a read-only demo banner for this org slug */
      demoOrgSlug: process.env.DEMO_ORG_SLUG || (isRailwayPreview ? 'applirank-pr-demo' : ''),
      /** Public live-demo account email used to prefill sign-in */
      liveDemoEmail:
        process.env.LIVE_DEMO_EMAIL
        || process.env.DEMO_EMAIL
        || (isRailwayPreview ? 'pr.user1@applirank.dev' : 'demo@applirank.com'),
      /** Public live-demo secret used to prefill sign-in */
      liveDemoSecret:
        process.env.LIVE_DEMO_SECRET
        || process.env.PR_SEED_PASSWORD
        || process.env.DEMO_PASSWORD
        || 'demo1234',
      /** Whether in-app feedback via GitHub Issues is enabled */
      feedbackEnabled: !!(process.env.GITHUB_FEEDBACK_TOKEN && process.env.GITHUB_FEEDBACK_REPO),
    },
  },

  vite: {
    // @ts-expect-error - Vite version mismatch between @tailwindcss/vite and Nuxt's bundled Vite
    plugins: [tailwindcss()],
  },

  // ─────────────────────────────────────────────
  // Robots — block crawlers from authenticated/API routes
  // ─────────────────────────────────────────────
  robots: {
    disallow: ['/dashboard/', '/auth/', '/api/', '/onboarding/'],
  },

  // ─────────────────────────────────────────────
  // Sitemap — include dynamic public job pages
  // ─────────────────────────────────────────────
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },

  // ─────────────────────────────────────────────
  // Schema.org — default organization identity
  // ─────────────────────────────────────────────
  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Applirank',
      url: 'https://applirank.com',
      logo: 'https://applirank.com/og-image.png',
      sameAs: ['https://github.com/applirank/applirank'],
    },
  },

  // ─────────────────────────────────────────────
  // OG Image — disable automatic generation (we use static images)
  // ─────────────────────────────────────────────
  ogImage: {
    enabled: false,
  },

  // ─────────────────────────────────────────────
  // Route rules — prerender/ISR for public pages
  // ─────────────────────────────────────────────
  routeRules: {
    '/': { prerender: true },
    '/roadmap': { prerender: true },
    '/blog': { prerender: true },
    '/blog/**': { prerender: true },
    '/jobs': { isr: 3600 },
    '/jobs/**': { isr: 3600 },
  },

  // ─────────────────────────────────────────────
  // Nuxt Content — blog collection
  // ─────────────────────────────────────────────
  content: {
    // content.config.ts handles collection definitions
  },

  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'X-XSS-Protection': '1; mode=block',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        },
      },
      // Allow same-origin framing for inline PDF preview in the sidebar iframe
      '/api/documents/*/preview': {
        headers: {
          'X-Frame-Options': 'SAMEORIGIN',
          'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
        },
      },
    },
  },
})
