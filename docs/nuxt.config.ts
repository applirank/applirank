export default defineNuxtConfig({
  extends: ['docus'],

  compatibilityDate: '2025-07-15',

  // ─────────────────────────────────────────────
  // Site config — used by SEO modules and LLMs
  // ─────────────────────────────────────────────
  site: {
    name: 'Reqcore',
    url: 'https://docs.reqcore.com',
  },

  // ─────────────────────────────────────────────
  // LLMs — AI-ready content files (llms.txt, llms-full.txt, /raw/ endpoint)
  // Optimized for ChatGPT, Perplexity, Claude, Gemini citation
  // ─────────────────────────────────────────────
  llms: {
    domain: 'https://docs.reqcore.com',
    title: 'Reqcore Documentation',
    description: 'Official documentation for Reqcore, the open-source applicant tracking system. Self-hosted ATS with transparent AI, no per-seat pricing, and full data ownership.',
    full: {
      title: 'Reqcore Documentation — Complete Reference',
      description: 'Complete reference documentation for Reqcore, covering installation, configuration, API reference, deployment, and self-hosting guides for the open-source ATS.',
    },
  },

  // ─────────────────────────────────────────────
  // MCP Server — connects docs to AI tools (Cursor, VS Code, Claude)
  // ─────────────────────────────────────────────
  mcp: {
    name: 'Reqcore Documentation',
  },

  // ─────────────────────────────────────────────
  // Assistant — AI-powered chat on documentation pages
  // ─────────────────────────────────────────────
  assistant: {
    mcpServer: '/mcp',
  },
})
