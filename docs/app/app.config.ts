export default defineAppConfig({
  // ─────────────────────────────────────────────
  // SEO — global metadata for all pages
  // ─────────────────────────────────────────────
  seo: {
    title: 'Reqcore Documentation',
    description: 'Official documentation for Reqcore — the open-source applicant tracking system with transparent AI, no per-seat pricing, and full data ownership.',
  },

  // ─────────────────────────────────────────────
  // Header — branding
  // ─────────────────────────────────────────────
  header: {
    title: 'Reqcore',
    logo: {
      light: '/logo-dark.svg',
      dark: '/logo-light.svg',
      alt: 'Reqcore Logo',
    },
  },

  // ─────────────────────────────────────────────
  // Social links — shown in header and footer
  // ─────────────────────────────────────────────
  socials: {
    github: 'https://github.com/reqcore-inc/reqcore',
    x: 'https://x.com/reqcore',
  },

  // ─────────────────────────────────────────────
  // GitHub — enables "Edit this page" and "Report an issue" links
  // ─────────────────────────────────────────────
  github: {
    url: 'https://github.com/reqcore-inc/reqcore',
    branch: 'main',
    rootDir: 'docs',
  },

  // ─────────────────────────────────────────────
  // Table of contents — right sidebar configuration
  // ─────────────────────────────────────────────
  toc: {
    title: 'On this page',
    bottom: {
      title: 'Community',
      links: [
        {
          icon: 'i-lucide-github',
          label: 'GitHub Discussions',
          to: 'https://github.com/reqcore-inc/reqcore/discussions',
          target: '_blank',
        },
        {
          icon: 'i-lucide-bug',
          label: 'Report a Bug',
          to: 'https://github.com/reqcore-inc/reqcore/issues/new',
          target: '_blank',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // UI colors
  // ─────────────────────────────────────────────
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'zinc',
    },
  },

  // ─────────────────────────────────────────────
  // Assistant — AI chat FAQ questions
  // ─────────────────────────────────────────────
  assistant: {
    faqQuestions: [
      {
        category: 'Getting Started',
        items: [
          'How do I install Reqcore?',
          'How do I self-host Reqcore with Docker?',
          'What are the system requirements?',
        ],
      },
      {
        category: 'Configuration',
        items: [
          'How do I configure environment variables?',
          'How do I set up S3 storage?',
          'How do I connect a custom domain?',
        ],
      },
      {
        category: 'Features',
        items: [
          'How does the candidate pipeline work?',
          'How do I create custom application forms?',
          'How does multi-tenancy work?',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // Locale — single-language English docs
  // ─────────────────────────────────────────────
  docus: {
    locale: 'en',
  },
})
