# Changelog

All notable changes to Reqcore are documented here, organized by date.

Format follows [Keep a Changelog](https://keepachangelog.com). Categories: **Added**, **Changed**, **Fixed**, **Removed**.

---

## Unreleased

### Added

* **blog:** add Cluster 8 career page articles — pillar (career-page-that-converts) and two supporting articles (career-page-seo, google-for-jobs-structured-data)
* **blog:** add incoming links to career page content from how-applicant-tracking-systems-work, open-source-applicant-tracking-system, and self-hosted-vs-cloud-ats

---

## [1.5.0](https://github.com/reqcore-inc/reqcore/compare/v1.4.0...v1.5.0) (2026-05-17)


### ✨ Features

* add pgDumpEnv utility to secure environment variable handling ([6fe4900](https://github.com/reqcore-inc/reqcore/commit/6fe490000487779ad008277ee650ded375bdbcf9))
* enhance color mode functionality and improve UI responsiveness ([8068e4e](https://github.com/reqcore-inc/reqcore/commit/8068e4ec7eecb6c087d6ae45e6ce2a3e6c60374e))
* implement nonce-based CSP middleware for enhanced security ([bfb4483](https://github.com/reqcore-inc/reqcore/commit/bfb44830d3205dc9e8c5392fdabdb8da4ed37a5e))
* implement nonce-based CSP middleware for enhanced security ([6fe4900](https://github.com/reqcore-inc/reqcore/commit/6fe490000487779ad008277ee650ded375bdbcf9))


### 🐛 Bug Fixes

* enhance rate limiting logic and add tests ([6fe4900](https://github.com/reqcore-inc/reqcore/commit/6fe490000487779ad008277ee650ded375bdbcf9))
* update comments for clarity and enhance rate limiting logic in production ([921ea39](https://github.com/reqcore-inc/reqcore/commit/921ea399bc35fbb006274d98faf7433fedf88aa5))
* update overrides to resolve high-severity CVEs blocking dep PRs ([a1edd32](https://github.com/reqcore-inc/reqcore/commit/a1edd32486b91edc60dec80e95d74b8c6d24b877))


### 🧪 Testing

* add security tests for recent fixes ([6fe4900](https://github.com/reqcore-inc/reqcore/commit/6fe490000487779ad008277ee650ded375bdbcf9))
* add unit tests for pgDumpEnv utility ([6fe4900](https://github.com/reqcore-inc/reqcore/commit/6fe490000487779ad008277ee650ded375bdbcf9))

## [1.4.0](https://github.com/reqcore-inc/reqcore/compare/v1.3.0...v1.4.0) (2026-04-30)


### ✨ Features

* add AI chatbot feature with configuration, access control, and attachment management ([e139b72](https://github.com/reqcore-inc/reqcore/commit/e139b7296c1f3b0275ade32f5f44bac373559bf3))
* add AI chatbot feature with configuration, access control, and attachment management ([912d55d](https://github.com/reqcore-inc/reqcore/commit/912d55d864efee44bf6f17c18c4dff77dfd0a86a))
* add ApplicationDetailDrawer and CandidateDetailDrawer components ([1371e7d](https://github.com/reqcore-inc/reqcore/commit/1371e7ddfdefb09d152b3945951c5abbce068602))
* add column visibility management to Applications and Candidates views ([a5237a5](https://github.com/reqcore-inc/reqcore/commit/a5237a54448cc5f6de88e2509d44ee3701e96975))
* add docker entrypoint script to derive NUXT_PUBLIC_* flags from environment variables ([39e098e](https://github.com/reqcore-inc/reqcore/commit/39e098ece0e8823513be402a8d68636bd3ebea3d))
* add Docker support with pre-built image instructions and CI workflow ([753b37e](https://github.com/reqcore-inc/reqcore/commit/753b37ea15eeb3c8ccbe6249d634d736574da13a))
* add Docker support with pre-built image instructions and CI workflow ([6f9223d](https://github.com/reqcore-inc/reqcore/commit/6f9223d520baa5dada4379cd175c78738837d290))
* add document re-parsing functionality and improve error handling in candidate analysis ([8842c6f](https://github.com/reqcore-inc/reqcore/commit/8842c6fb69b78b3f07326bba98c14032ff7a02e6))
* add experience level and quick notes fields to job and candidate schemas ([d36b5a0](https://github.com/reqcore-inc/reqcore/commit/d36b5a07ae2aecb0ffc3faa52eabf5219f8da468))
* add new migration entries for candidate demographics organization settings and salary negotiable ([36e3e81](https://github.com/reqcore-inc/reqcore/commit/36e3e8171fc367c89afe17c38522e0ea447e0911))
* add Nitro plugin to recompute public auth-provider flags at server startup ([6b7b699](https://github.com/reqcore-inc/reqcore/commit/6b7b6999a6c12f21009f8bd9b474412fdf86c9fc))
* add OIDC SSO environment validation and unit tests ([1b23af3](https://github.com/reqcore-inc/reqcore/commit/1b23af31b04d150e277701401e29424a07f9b8a8))
* add organization localization settings and candidate demographics ([f828877](https://github.com/reqcore-inc/reqcore/commit/f828877ff1090cc9001ede9e5be3cfdfa26cec7f))
* add property management utilities and schemas ([a62eea1](https://github.com/reqcore-inc/reqcore/commit/a62eea1f5644ba0cd4cd892cea14a376746994ce))
* add property management utilities and schemas ([4dc5aad](https://github.com/reqcore-inc/reqcore/commit/4dc5aad0252a67306633b9f63e56d9d5737bce7d))
* add raw tag support for Docker image publishing ([29775cb](https://github.com/reqcore-inc/reqcore/commit/29775cb1b17d560f76bfe2e73e5d5dc2c5d99a9c))
* add salary input change handlers and update permissions for organization ([6c238c2](https://github.com/reqcore-inc/reqcore/commit/6c238c2fae2341639bde2f961ba1bbd36708044f))
* add site origin computation for dynamic redirect URI in SSO setup ([9e5aa68](https://github.com/reqcore-inc/reqcore/commit/9e5aa688006e9254bc44f4c93c180c300ed9ad12))
* add SSO provider schema and relations for better authentication integration ([62fdf39](https://github.com/reqcore-inc/reqcore/commit/62fdf399d79132e30889ded51b312642454de2f9))
* **ai-config:** add connection test functionality and update AI settings UI ([c9f4afd](https://github.com/reqcore-inc/reqcore/commit/c9f4afd15b8787ce4c9414db2bde7a21ed3ffc10))
* enhance authentication security with stricter password policy, email verification, and session management ([aaae17f](https://github.com/reqcore-inc/reqcore/commit/aaae17f66c6ee3f669843526c38d9f38983aa662))
* enhance forgot password functionality and improve SSRF protection ([8e0abd6](https://github.com/reqcore-inc/reqcore/commit/8e0abd6efcc1b1ad8bceacd32491d46909fea46c))
* enhance OIDC endpoint origin fetching to directly inject discovered origins into trusted-origins list ([ee34d86](https://github.com/reqcore-inc/reqcore/commit/ee34d86125e3de07b2ca0e200c52f94c4d8f87a2))
* Enhance PostHog proxy handling with explicit header management and error handling ([8b9ea20](https://github.com/reqcore-inc/reqcore/commit/8b9ea205c32b86e43268d2ffb26cc6972a9855cb))
* enhance property management with new color variables and update component interactions ([349ec6a](https://github.com/reqcore-inc/reqcore/commit/349ec6a76f2bec70a0b1410e1c8fdd990fa28600))
* enhance PropertyFilterBar and PropertySchemaEditor with improved element references and state management ([cd7524e](https://github.com/reqcore-inc/reqcore/commit/cd7524e4b7d716dc4c732ee88ca60d4c66c91c7e))
* enhance SSO sign-in and sign-up error handling, and enforce email requirement in profile mapping ([76c54b4](https://github.com/reqcore-inc/reqcore/commit/76c54b4026eb3de9e5aa6de57eaf682393f24a27))
* enhance trusted origins resolution for CSRF checks and OIDC discovery ([3c24417](https://github.com/reqcore-inc/reqcore/commit/3c244175cd07e428624217a6d609bd5d3ae155a5))
* enhance trusted origins resolution for SSO provider registration ([b5832b6](https://github.com/reqcore-inc/reqcore/commit/b5832b64c975c9dab88ba2a3b84208758bb1fbc9))
* enhance workflows and documentation for release process, including PR title linting and release verification ([4785db5](https://github.com/reqcore-inc/reqcore/commit/4785db56bd7d282ce28f63a18f3687c976c525e0))
* implement forgot password and reset password functionality ([aa00e89](https://github.com/reqcore-inc/reqcore/commit/aa00e8947d5c0b37410971624d3e036504ca8ceb))
* implement forgot password and reset password functionality ([ad864ef](https://github.com/reqcore-inc/reqcore/commit/ad864efff2456ad08aa7038d7f1e9a312263d9a9))
* implement OIDC endpoint origin prefetching for trusted origins resolution ([9c355ab](https://github.com/reqcore-inc/reqcore/commit/9c355abc6720fe129255107462472fada48ba76e))
* implement social sign-in for Google, GitHub, and Microsoft with configuration support ([d4ceaf8](https://github.com/reqcore-inc/reqcore/commit/d4ceaf811134d881af5fe74d70db78d85717f802))
* implement social sign-in for Google, GitHub, and Microsoft with configuration support ([0e4d4bd](https://github.com/reqcore-inc/reqcore/commit/0e4d4bd686c9c7014a149289f2e87b2c359c395d))
* Implement two-tier consent model for PostHog analytics ([0d51cd5](https://github.com/reqcore-inc/reqcore/commit/0d51cd53dbae1c20267a04220f2b6bd42e3ae2c9))
* Implement two-tier consent model for PostHog analytics ([ef7fee5](https://github.com/reqcore-inc/reqcore/commit/ef7fee50cfa5cf0fa079f264453cdba873fa97df))
* implement unique default chatbot agent constraint and enhance related logic for attachment management ([f11a78f](https://github.com/reqcore-inc/reqcore/commit/f11a78fced7dcc82e1a98bce28b94f2010bfe705))
* improve edit element reference handling in PropertyFilterBar ([486d0e1](https://github.com/reqcore-inc/reqcore/commit/486d0e148b7a10ba36d59931c776a26ea6b1ee77))
* refactor authentication handling to use runtime-config for providers and remove entrypoint script ([ad91cc9](https://github.com/reqcore-inc/reqcore/commit/ad91cc9ae61ee7d30c95fed4bc52cf09596ada1e))
* streamline authentication configuration by removing deprecated social sign-in options and enhancing OAuth token encryption ([b94ffd9](https://github.com/reqcore-inc/reqcore/commit/b94ffd925fc250c59aa397924a0e4b303406c342))
* update button styles for social sign-in and sign-up to improve user interaction ([d8d0e6e](https://github.com/reqcore-inc/reqcore/commit/d8d0e6ebbcb6456797051f6baeb6bddaec43f033))
* update color classes for property options to enhance visual consistency ([c827d56](https://github.com/reqcore-inc/reqcore/commit/c827d56f358dc18f0864444dc9ae051629f38d99))
* Update PostHog consent model to use sessionStorage for cookieless tracking ([1368dbb](https://github.com/reqcore-inc/reqcore/commit/1368dbb4da7efa58ed18eb041fff605565d7da7d))


### 🐛 Bug Fixes

* address CodeRabbit review comments on PR [#166](https://github.com/reqcore-inc/reqcore/issues/166) ([3b9e52b](https://github.com/reqcore-inc/reqcore/commit/3b9e52bd33c597346b6defeb0ab1d4c068b03feb))
* correct syntax error in prefetchOidcEndpointOrigins function ([3f6a56b](https://github.com/reqcore-inc/reqcore/commit/3f6a56bb21f3ca5648f1f8874c1579b07748bc7a))
* register migrations 0023 and 0024 in drizzle journal ([93ed4b1](https://github.com/reqcore-inc/reqcore/commit/93ed4b1cd341e3f8cb7d541fd7dd595241dd618b))
* remove orphaned code after &lt;/template&gt; in candidates/new.vue ([a976d8d](https://github.com/reqcore-inc/reqcore/commit/a976d8d45292e051d9a51a48fd348024ef56c9ca))
* resolve esbuild and typecheck errors in PR validation ([e3d9994](https://github.com/reqcore-inc/reqcore/commit/e3d9994ecc05cc03d4086443e97497e76156bc50))
* Rewrite Host headers in proxyRequest to prevent Cloudflare errors ([fee0be6](https://github.com/reqcore-inc/reqcore/commit/fee0be64df209fee9cddc1844863a395460b3c31))
* update token reference in release-please workflow to prioritize RELEASE_PLEASE_TOKEN ([7a57891](https://github.com/reqcore-inc/reqcore/commit/7a57891bcfae98080e9268a2d38bce5dec29c71d))
* update token reference in release-please workflow to use GITHUB_TOKEN ([b2733f8](https://github.com/reqcore-inc/reqcore/commit/b2733f89c69f3dfff1005368f8a15d6e49081ecd))

## [1.3.0](https://github.com/reqcore-inc/reqcore/compare/v1.2.0...v1.3.0) (2026-04-03)


### ✨ Features

* add AI configuration seeding and demo data reset script ([927cf1e](https://github.com/reqcore-inc/reqcore/commit/927cf1ed6fea90325e0dadf362b4ab2000c767f3))
* add db:reseed script and implement demo organization deletion script ([f0f8b2e](https://github.com/reqcore-inc/reqcore/commit/f0f8b2e41ec3fa0c315b5cf9167e89e371da9d3f))
* add Deploy on Railway badge to README, enhance ScoreBreakdown component with caching, and introduce DemoUpsellBanner component ([c372668](https://github.com/reqcore-inc/reqcore/commit/c372668570a16723870868c605382c0876cca3ab))
* add document parsing functionality ([e6279d0](https://github.com/reqcore-inc/reqcore/commit/e6279d004612cc1544f1f1c9f957cef55bb4440e))
* add robots.txt for SEO optimization and allow indexing of job board pages ([0c387ba](https://github.com/reqcore-inc/reqcore/commit/0c387ba70d0c46b26253f0fe62c26be72f7af2ca))
* add Settings page for job management and update job tabs in AppTopBar ([7dba4da](https://github.com/reqcore-inc/reqcore/commit/7dba4dac492d31a75b2d5faab176cbe4a693960f))
* add Source Tracking page with initial layout and SEO metadata ([750dc0b](https://github.com/reqcore-inc/reqcore/commit/750dc0bed5eb0daa790453ac7013485b525a7fa4))
* add tracking link schemas for creation, update, and querying ([9d60aaf](https://github.com/reqcore-inc/reqcore/commit/9d60aaf694787a6e65f527fed313535a312aa808))
* add tracking link schemas for creation, update, and querying ([558e054](https://github.com/reqcore-inc/reqcore/commit/558e054d71a8f8fc496d02f6876220ebf3f3bf83))
* add WordExtractor type declarations and update document permissions ([6f66efd](https://github.com/reqcore-inc/reqcore/commit/6f66efdbf34dbf38f1c6867dd9995f8001047dc3))
* **ai-analysis:** add AI analysis dashboard and stats endpoint with tests ([c09ea21](https://github.com/reqcore-inc/reqcore/commit/c09ea21741f63bf7b3c175418ff6ab552489c2d3))
* **ai:** enhance AI scoring and configuration with rate limiting and error handling improvements ([71f0185](https://github.com/reqcore-inc/reqcore/commit/71f0185d55c029cd8e20525828b4d196a426bd73))
* **analytics:** enhance PostHog consent management and user identification for GDPR compliance ([0632620](https://github.com/reqcore-inc/reqcore/commit/063262098bc4172c8ddecf6fa5a5740e45a9b338))
* **api:** add candidate timeline endpoint and tracking link stats endpoint ([46e1e15](https://github.com/reqcore-inc/reqcore/commit/46e1e154b5346f90b9bad0cd46ba7665f300aa04))
* **delete-demo-org:** invalidate sessions for demo organization before deletion ([b8ee811](https://github.com/reqcore-inc/reqcore/commit/b8ee81198f8f558ab921684ef1b27495fab0ab67))
* enhance analytics consent management with cross-domain linking and event buffering ([7a9dd82](https://github.com/reqcore-inc/reqcore/commit/7a9dd82ede3ae275c97f66ebbcd8efba0d0b6353))
* enhance analytics event handling by flushing pending events on consent and organization creation ([2212af8](https://github.com/reqcore-inc/reqcore/commit/2212af82b1d7ebb949bd3a50014fb40dd55ce8a9))
* enhance event tracking by persisting pending events in sessionStorage ([95c48ce](https://github.com/reqcore-inc/reqcore/commit/95c48cee281e4a35b0f237bcb88668812ed13011))
* enhance LanguageSwitcher component with drop-up option and impr… ([5aea684](https://github.com/reqcore-inc/reqcore/commit/5aea684d31412734786fd96b7816fc9322865936))
* enhance LanguageSwitcher component with drop-up option and improve layout for candidate and job detail pages ([ccc829e](https://github.com/reqcore-inc/reqcore/commit/ccc829ea2f757a9beb1f8be9c317fb435ca0106a))
* enhance mobile responsiveness and scrollbar visibility across components ([ab939bb](https://github.com/reqcore-inc/reqcore/commit/ab939bbd644264608e6788cfe48d04f71bb279d0))
* enhance mobile responsiveness and scrollbar visibility across components ([5ecc098](https://github.com/reqcore-inc/reqcore/commit/5ecc098d777b2141c696d4687f3baa54c96de4b3))
* enhance resume parser with PDF polyfills and dynamic import for pdf-parse ([2d6dea5](https://github.com/reqcore-inc/reqcore/commit/2d6dea5bb7a2d92150cca330cbd334526cd619e4))
* enhance timeline functionality with collapsible sections and candidate grouping ([b8c6ab9](https://github.com/reqcore-inc/reqcore/commit/b8c6ab91f9b8d5dcb8e71186b4c10198ea394a10))
* Implement AI scoring system with provider integration and criteria management ([6ba3159](https://github.com/reqcore-inc/reqcore/commit/6ba31596f7fe239611901b99c2c60f430166e84a))
* Implement AI scoring system with provider integration and criteria management ([8158718](https://github.com/reqcore-inc/reqcore/commit/8158718f8421903c5df639bb5731f6361d39685f))
* implement autoScoreApplication for AI-driven application scoring ([5222980](https://github.com/reqcore-inc/reqcore/commit/5222980ea02aa92fa44b048157717bc23c3e370a))
* implement combined demo-check and sign-out endpoint for fresh sign-up flow ([a5632bd](https://github.com/reqcore-inc/reqcore/commit/a5632bd865610f6f1a4fb9196df9b95d06d9db93))
* implement demo-aware signup redirect with server-side session check ([092d324](https://github.com/reqcore-inc/reqcore/commit/092d3241a96ff78b7ddc9068c1c0f8bfac6e00ba))
* implement internationalization for navigation and hero sections across multiple languages ([7720fc8](https://github.com/reqcore-inc/reqcore/commit/7720fc85fb3dba24fda9f87dc595522e235504ef))
* implement server-side demo organization check for fresh sign-up flow ([3075a17](https://github.com/reqcore-inc/reqcore/commit/3075a17cb9d87c64a81d947bd51efb5e99f34583))
* implement Timeline page with activity log and infinite scroll functionality ([5b1c694](https://github.com/reqcore-inc/reqcore/commit/5b1c6941af4b4f203cc9ad0a784bce01b7e25017))
* implement Timeline page with activity log and infinite scroll functionality ([abda1a3](https://github.com/reqcore-inc/reqcore/commit/abda1a3e325feb919d51e6887d0bf69c7c76bb0e))
* implement tracking for various user actions and API events in the application ([674993c](https://github.com/reqcore-inc/reqcore/commit/674993c330ee1c3200015e8a51d243cfa662d40c))
* improve demo organization check by ensuring demo slug is validated before redirecting ([b60b9bc](https://github.com/reqcore-inc/reqcore/commit/b60b9bc9a102c4086fb30cc32b0d90d057aaecea))
* **jobs:** add remote status and experience level fields to job creation form ([405ee5b](https://github.com/reqcore-inc/reqcore/commit/405ee5bb9c2f7b7123ef6067855403b05410e869))
* **jobs:** enhance job application form with AI integration warnings and improved field descriptions ([2bcae86](https://github.com/reqcore-inc/reqcore/commit/2bcae86ee89f51364f11a406ec2b26ff6ffcd936))
* **logging:** integrate OpenTelemetry for structured logging to PostHog ([3f62f29](https://github.com/reqcore-inc/reqcore/commit/3f62f29793dffe3eea610c6c738cedd2f95104ed))
* **logging:** refine log attributes type for improved type safety in PostHog API tracking ([38f46b3](https://github.com/reqcore-inc/reqcore/commit/38f46b3711e1fe3a200c86067a2ce2fe685c8ad6))
* **logging:** replace console.error with structured logging for error handling across multiple modules and add Vitest setup for logging stubs ([ded88f8](https://github.com/reqcore-inc/reqcore/commit/ded88f8f683ee3f3038ca1ae4b95ba7d63ae63ad))
* **logging:** replace console.error with structured logging for error handling across various modules ([4451b95](https://github.com/reqcore-inc/reqcore/commit/4451b954f7329ed9dc6bedb76225503551bbafec))
* migrate analytics consent management from localStorage to cross-domain cookies ([59e5e33](https://github.com/reqcore-inc/reqcore/commit/59e5e33026451c640acea1ef9b977d617aec6fdd))
* propagate source tracking parameters through job application flow ([60bdc55](https://github.com/reqcore-inc/reqcore/commit/60bdc55ef55390744aaa8555506cdd741352a323))
* refactor demo session checks to use user email for demo account detection ([c747d24](https://github.com/reqcore-inc/reqcore/commit/c747d24f346f6169444abfee2d163ab221fe6cd2))
* refactor demo sign-up flow by removing demo-fresh-signup endpoint and handling session checks in fresh-signup component ([58be8e0](https://github.com/reqcore-inc/reqcore/commit/58be8e0096005c8ffad56937134cc3abbc7126c8))
* refactor demo sign-up flow by replacing POST endpoint with GET for better cookie handling ([e4268eb](https://github.com/reqcore-inc/reqcore/commit/e4268eb346df996379bae987705dada182fe78df))
* refactor timeline component to simplify candidate grouping and remove unused action groups ([8d226c8](https://github.com/reqcore-inc/reqcore/commit/8d226c86819743f46a6b80d615d81c4be6f2c8ea))
* **session-management:** implement session expiration handling and UI feedback for demo accounts ([3a6c1f4](https://github.com/reqcore-inc/reqcore/commit/3a6c1f40922df16520f679d58789e02aaa34e3ab))
* **source-tracking:** add tracking links management and attribution ([8d25601](https://github.com/reqcore-inc/reqcore/commit/8d256017c9bed1a279cebaeda93fa5c34be27a29))
* **source-tracking:** enhance tracking links management with dynamic URL generation and sorting functionality ([877d03c](https://github.com/reqcore-inc/reqcore/commit/877d03c1b515864f9204f3b9eeff6a7da53636f2))
* **timeline:** enhance timeline action styles and status badges ([475e643](https://github.com/reqcore-inc/reqcore/commit/475e6433d665afb2bf364bd418319419685cc62b))
* **timeline:** implement TimelineDateLink component for date navigation and update date displays across applications ([be4a438](https://github.com/reqcore-inc/reqcore/commit/be4a438047c830bf0f2d5ad59973398e231fc818))
* **tracking-links:** implement collision handling for unique tracking code generation and enhance validation for tracking codes ([88489e6](https://github.com/reqcore-inc/reqcore/commit/88489e604485fb35b343ac8f795517eed1e1377e))
* update button labels for clarity and consistency in job creation flow ([850383c](https://github.com/reqcore-inc/reqcore/commit/850383c81066470f665bc3fb323619f8a0c134d4))
* update Open Graph image and disable exception autocapture in server config ([ad98fae](https://github.com/reqcore-inc/reqcore/commit/ad98faee2ee4678e8fbfc852add91e26c5184c15))
* update scoring criteria steps in candidate application, job creation, and resume upload tests ([30d87f0](https://github.com/reqcore-inc/reqcore/commit/30d87f07583d4eba9dbf3db35a0e604425ebcfb9))


### ♻️ Refactoring

* update layout and styling for settings pages ([2cb9723](https://github.com/reqcore-inc/reqcore/commit/2cb97235c7f4a0282268edddbc2983d134f020a9))
* update status and transition classes for improved UI consistency ([597f069](https://github.com/reqcore-inc/reqcore/commit/597f069962e0b0677d04f555dd9a6c74bdeaa6ce))

## [1.2.0](https://github.com/reqcore-inc/reqcore/compare/v1.1.0...v1.2.0) (2026-03-16)


### ✨ Features

* add email template management system ([616ada5](https://github.com/reqcore-inc/reqcore/commit/616ada516992a2fd7c33b941b7b12f7a6b5467c0))
* add email template validation schemas and pre-made templates ([7879e38](https://github.com/reqcore-inc/reqcore/commit/7879e38e2e54f7f3ac07d84faec3e36103ea0ded))
* add fullscreen toggle functionality to job detail view ([a94e4b6](https://github.com/reqcore-inc/reqcore/commit/a94e4b628922e41154abbeafd351be67e33e5685))
* add functionality to move applications directly to interview stage without scheduling ([22e6a0a](https://github.com/reqcore-inc/reqcore/commit/22e6a0ac2a80c41d5e38ca2164f7cf70fd3c4832))
* add Greenhouse vs Open Source ATS comparison article and enhance existing content with links ([8c2e225](https://github.com/reqcore-inc/reqcore/commit/8c2e2259b71cdf52405378c514594b3feed8b1c1))
* add iCalendar generation for interview invitations ([57e692a](https://github.com/reqcore-inc/reqcore/commit/57e692a253befb4675487e58ef2d5475b284a218))
* add interview scheduling functionality with sidebar integration ([0eb29b0](https://github.com/reqcore-inc/reqcore/commit/0eb29b068d38f04f7289589051e9d53d4c5a2f57))
* add interview validation schemas for creation, updating, and querying ([a93da4e](https://github.com/reqcore-inc/reqcore/commit/a93da4ec16862dacd43ebb9efbb339a84492f502))
* add interview validation schemas for creation, updating, and querying ([be8f623](https://github.com/reqcore-inc/reqcore/commit/be8f62375cb7a5798f9133dcf454eea7f835617b))
* add interviews dashboard page with filtering, editing, and deleting functionalities ([59bdb36](https://github.com/reqcore-inc/reqcore/commit/59bdb36d5ba33a280f20c39ceb9b9eb53fa2eeec))
* add middleware for 301 redirect from legacy domain to canonical domain ([5525cf6](https://github.com/reqcore-inc/reqcore/commit/5525cf6efa0c7e94220f58d2af2e7cf5e145affd))
* add realistic interview data and scheduling logic to seed script ([e3b1881](https://github.com/reqcore-inc/reqcore/commit/e3b188148eaf7bb484bff148b8cbe45a8eda1cb8))
* add realistic interview data and scheduling logic to seed script ([467cc56](https://github.com/reqcore-inc/reqcore/commit/467cc56a98504d53445e0538526a63f572a60602))
* add script to backfill google_calendar_event_link for existing interviews ([c46d13d](https://github.com/reqcore-inc/reqcore/commit/c46d13da86b1bd5937b354647e98bf7e3561fe61))
* add teleport target prop to modals for improved flexibility in rendering ([78a3ae8](https://github.com/reqcore-inc/reqcore/commit/78a3ae8729fff28622104a7e8cdbca4d66c27dd7))
* add use case guide for open source ATS adoption by company size and industry ([f9770e5](https://github.com/reqcore-inc/reqcore/commit/f9770e56d947f6b1ca9e387febcb2cebc6115e68))
* **AppTopBar:** remove unused transition classes for user menu ([49976c3](https://github.com/reqcore-inc/reqcore/commit/49976c38d587ee05c09b59dd2226632529cadb33))
* **auth:** add fresh signup page with redirect functionality ([f0ae97f](https://github.com/reqcore-inc/reqcore/commit/f0ae97f93ced497b3544615d7cebaaef8fc5cb57))
* **auth:** enhance error handling for sign-in and sign-up processes, including BETTER_AUTH_URL mismatch detection ([dd29c49](https://github.com/reqcore-inc/reqcore/commit/dd29c4949feb422d54a75097dfb3517bbae1bf2e))
* **auth:** improve BETTER_AUTH_URL handling for Railway environments and enhance validation ([e368cc8](https://github.com/reqcore-inc/reqcore/commit/e368cc8834bd07f0fe5674e9f25960d5b43224a1))
* **auth:** improve BETTER_AUTH_URL handling for Railway environments… ([ef155aa](https://github.com/reqcore-inc/reqcore/commit/ef155aa8f35666f5ec129f2bb288365581a43138))
* **calendar:** add Google Calendar integration with OAuth2 flow ([08f778a](https://github.com/reqcore-inc/reqcore/commit/08f778a49feacfd41f3b78853b66251998bd499f))
* **calendar:** add Google Calendar sync status indicators in interview components ([bb5244a](https://github.com/reqcore-inc/reqcore/commit/bb5244adc2ce0e61e1ecd9b7f8a725de675ede66))
* **calendar:** update webhook renewal to require specific permissions and enhance error handling in sync process ([140d6ac](https://github.com/reqcore-inc/reqcore/commit/140d6ac690b0752d6205035df0d069f61ec2e418))
* centralize system email templates in shared module for improved maintainability ([e05b877](https://github.com/reqcore-inc/reqcore/commit/e05b8778defb25981658bdf197ff311d43f0cb71))
* create HMAC-signed tokens for candidate interview responses ([57e692a](https://github.com/reqcore-inc/reqcore/commit/57e692a253befb4675487e58ef2d5475b284a218))
* **dark mode:** enhance checkbox and radio styles for dark mode rendering ([728feb2](https://github.com/reqcore-inc/reqcore/commit/728feb2443087d893feacc7e0afa3db12c9ed5b0))
* **dashboard:** enhance job management and pipeline tracking ([a60f489](https://github.com/reqcore-inc/reqcore/commit/a60f4893a633768525adfdea7eaf1ed5b5a17f50))
* **dashboard:** update job pipeline display logic to use application count ([b75b0e5](https://github.com/reqcore-inc/reqcore/commit/b75b0e51442fa7d96b2d5bd07ea77baa5debd3eb))
* **demo:** add 'Get Started' options for demo mode in AppTopBar and enhance PreviewUpsellModal ([8c530cf](https://github.com/reqcore-inc/reqcore/commit/8c530cf58f90932d915e8ffd5bec2f07b83d6997))
* **demo:** add 'Get Started' options for demo mode in AppTopBar and enhance PreviewUpsellModal ([e607520](https://github.com/reqcore-inc/reqcore/commit/e607520af5e118a32c7e0bf496d90642fe471831))
* **docker:** add CHANGELOG.md to Docker image for runtime access ([b7af4ce](https://github.com/reqcore-inc/reqcore/commit/b7af4ce41414bcca89ee3b51f9fbe62ff944463d))
* enhance interview management with inline editing and rescheduling features ([ef5cdbb](https://github.com/reqcore-inc/reqcore/commit/ef5cdbb68a2421c6c00c080edece1e93406417ff))
* enhance webhook handling with cron secret validation and improve interview ID validation ([457af10](https://github.com/reqcore-inc/reqcore/commit/457af10fe8f160c066e7ae4611e8c0e5a5e3b8a0))
* **google-calendar:** update integration instructions and add environment variable details ([be9ccbd](https://github.com/reqcore-inc/reqcore/commit/be9ccbd669c19f5eb9d60241abe3f70080246eac))
* implement advanced filtering and sorting options for job applications ([27f179e](https://github.com/reqcore-inc/reqcore/commit/27f179ec274545fb485cfc9aad56b986415a2ad7))
* implement sortable candidate and application tables with improved UI ([9188d3b](https://github.com/reqcore-inc/reqcore/commit/9188d3b5bb6dcdb4f105ae35a2c009721317a9f9))
* improve date formatting helper to return local timezone date string ([ddda624](https://github.com/reqcore-inc/reqcore/commit/ddda62492e58a38a79eb5f67a46311f32a0d6c58))
* integrate email template selection for interview invitations ([771917f](https://github.com/reqcore-inc/reqcore/commit/771917fd9b180b4babcfb6eb0c0192c4b5e44ebb))
* **interview:** add Google Calendar notification preferences and customization options ([6c942d0](https://github.com/reqcore-inc/reqcore/commit/6c942d0b6015f0a74d60c74612d8392e1ea6c4b4))
* **interview:** enhance interview scheduling with Google Calendar integration and email validation ([58810b1](https://github.com/reqcore-inc/reqcore/commit/58810b17e10064336d80a8de508a043070e7963d))
* make candidate email addresses clickable for improved user interaction ([2c01f77](https://github.com/reqcore-inc/reqcore/commit/2c01f77eacf98dc94a196d067cc5395532e0eb98))
* refactor interview management with enhanced status transitions and email template integration ([6033d06](https://github.com/reqcore-inc/reqcore/commit/6033d065e7bb1985af78dc12ee2091b96a52ca18))
* **tracking:** implement privacy-respecting event tracking across various pages and actions ([ebb22c9](https://github.com/reqcore-inc/reqcore/commit/ebb22c91a1d60f86f75a089e25b529ae851a5da8))
* **updates:** add API endpoints for update management, backup, chang… ([e8432e5](https://github.com/reqcore-inc/reqcore/commit/e8432e52cde8c035a704d26b2b7bd79523b3ce2e))
* **updates:** add API endpoints for update management, backup, changelog, system info, and version check ([3a5d96e](https://github.com/reqcore-inc/reqcore/commit/3a5d96e8e5c453974a3d17a5b470b924f656aaf5))
* **updates:** enhance backup functionality and improve update checks with error handling ([1921be8](https://github.com/reqcore-inc/reqcore/commit/1921be8c883085b4590497cda2157f39959b31e6))


### 🐛 Bug Fixes

* cast return type of getAuth function to Auth ([665e059](https://github.com/reqcore-inc/reqcore/commit/665e05932061f83c1c3b73aa729a54a3ef571ffb))
* correct promise chaining for Google Calendar event creation ([a935615](https://github.com/reqcore-inc/reqcore/commit/a935615e2eae720111672fa34d135163f31f4121))
* **issue-template:** enable blank issues in configuration ([b634752](https://github.com/reqcore-inc/reqcore/commit/b6347524088d46401b7ff48776666d839c0ee509))
* update G2 ranking link for Greenhouse in ATS comparison article ([c46549e](https://github.com/reqcore-inc/reqcore/commit/c46549ec9e258a85d8e9c3bd63cbea549f0ec630))


### ♻️ Refactoring

* simplify refreshNuxtData calls in useInterview composable and remove unused migration placeholder ([b9533fe](https://github.com/reqcore-inc/reqcore/commit/b9533fece569f9c2d4f1ae75960f28f17a115f29))

## [1.1.0](https://github.com/reqcore-inc/reqcore/compare/v1.0.0...v1.1.0) (2026-03-10)


### ✨ Features

* add new article on best free ATS software for startups and update related content ([021f8db](https://github.com/reqcore-inc/reqcore/commit/021f8db2351260cd5e2ac738aa571da85e91f4dc))
* add new article on the differences between open source and free ATS, including a comprehensive guide and internal links ([da31e77](https://github.com/reqcore-inc/reqcore/commit/da31e77ba6187f7c8faa6ddb1d626c1fdfe57d82))
* add release automation configuration and update versioning ([a37c1cc](https://github.com/reqcore-inc/reqcore/commit/a37c1cc8f032816ab10a184ad3b487d65b5997a7))
* **analytics:** integrate PostHog for user analytics and consent management ([8bd4bd5](https://github.com/reqcore-inc/reqcore/commit/8bd4bd50cb62254e9d39f8c92214c2af24b8671c))
* **analytics:** integrate PostHog for user analytics and consent management ([619f239](https://github.com/reqcore-inc/reqcore/commit/619f239c06a865a2d1a091a1d5f85a941548b5a7))
* **consent:** implement consent banner for analytics tracking and update privacy policy ([24a9201](https://github.com/reqcore-inc/reqcore/commit/24a920163ecf9a3a9a65d4476f115dd34357a34b))
* **consent:** simplify consent message for clarity in analytics tracking ([c28356a](https://github.com/reqcore-inc/reqcore/commit/c28356a27eea15715e686cd83686ac7cdb6bd29b))
* **consent:** update wording in consent banner for improved clarity ([91c6550](https://github.com/reqcore-inc/reqcore/commit/91c655032d8e3cf515b065b9fe13e216f460c90d))
* **database:** enhance database URL resolution with fallback handling for environment variables ([0302102](https://github.com/reqcore-inc/reqcore/commit/0302102c984b04642cd2e4de2bbb4cdcdf88b185))
* **dependencies:** update PostHog CLI and related packages for improved functionality ([f532a3e](https://github.com/reqcore-inc/reqcore/commit/f532a3e3c53d522b1d11c93314cf91252400a6f3))
* **interviews:** add Interview interface for managing interview data structure ([da4e78d](https://github.com/reqcore-inc/reqcore/commit/da4e78dc6552b14201432429229a10363eaf5748))
* **navbar:** replace static navbar with reusable PublicNavBar component across blog, catalog, docs, and roadmap pages ([a0d17db](https://github.com/reqcore-inc/reqcore/commit/a0d17dbcfe3613d2f5817f54ee9b46758a350ad5))
* **nuxt:** conditionally load PostHog module based on API key availability to prevent crashes ([ddb1f59](https://github.com/reqcore-inc/reqcore/commit/ddb1f599ea56b4d938cb8c50b754fac4561070fd))
* **posthog:** add PostHog configuration for server-side event capture ([9958fe5](https://github.com/reqcore-inc/reqcore/commit/9958fe5d37ea75366216bcbd5a2187346c62c938))
* **posthog:** enhance analytics consent management and data minimization in PostHog integration ([92588d9](https://github.com/reqcore-inc/reqcore/commit/92588d9a3a3801eea7e63bae46d773a9e2dc771c))
* **posthog:** enhance PostHog integration with consent handling and graceful shutdown ([5e708fa](https://github.com/reqcore-inc/reqcore/commit/5e708faf1b3808fc24f4a6c51285eb9a4920004b))
* **posthog:** replicate safe accessor for PostHog in composables and plugins to ensure compatibility when not configured ([1e948cb](https://github.com/reqcore-inc/reqcore/commit/1e948cbc2e9543e54756f553327454e70c726702))
* **posthog:** update PostHog integration with environment variables and consent handling ([4b745ec](https://github.com/reqcore-inc/reqcore/commit/4b745ec2f9e768ad11e113799d3b63e17a6cef60))
* **posthog:** update PostHog integration with environment variables and consent handling ([4c11f99](https://github.com/reqcore-inc/reqcore/commit/4c11f99c9bc1331989c80b78bf793dd63ec2584f))


### 🐛 Bug Fixes

* add config and manifest file parameters to release-please action ([ff30b11](https://github.com/reqcore-inc/reqcore/commit/ff30b11bbcaea0d7ab92be887e008edc656ba5cc))
* **posthog:** read server PostHog config from env vars directly ([74ae687](https://github.com/reqcore-inc/reqcore/commit/74ae6874e2019944bf8d71f314fb2dfc988b7658))
* **posthog:** update proxy targets for PostHog integration with environment variable notes ([da4e78d](https://github.com/reqcore-inc/reqcore/commit/da4e78dc6552b14201432429229a10363eaf5748))
* **release:** remove pull request header from release configuration ([9636fd5](https://github.com/reqcore-inc/reqcore/commit/9636fd5581032283af5c89b8be654ea01ae5fa6f))
* update token in release-please action for proper authentication ([5ae917e](https://github.com/reqcore-inc/reqcore/commit/5ae917e3c30cd5e819a1be97045e4890d4ac0f7b))

## 2026-03-08

### Added

- **Blog: Best Free ATS Software for Startups (2026)** — Cluster 2 supporting roundup article. Compares 7 free ATS tools across three "free" models (free-forever, free trial, open source), with startup-specific evaluation criteria and upgrade signals. Published to `content/blog/best-free-ats-software-for-startups.md`
- **Internal links** — added cross-links from `best-open-source-applicant-tracking-systems.md` (Cluster 2 pillar) and `open-source-vs-free-ats.md` (Cluster 1) to new article

## 2026-03-07

### Added

- **Blog: Open Source vs Free ATS: Why They Aren't the Same** — Cluster 1 supporting article. Explains the difference between free (proprietary) and open source ATS, introduces a 4-category ATS pricing spectrum framework, and includes real infrastructure cost data. Published to `content/blog/open-source-vs-free-ats.md`
- **Internal link** — added cross-link from `open-source-applicant-tracking-system.md` (Cluster 1 pillar) to new supporting article

## 2026-03-04

### Added

- **Blog: How Does an Applicant Tracking System Work?** — Cluster 1 supporting article. Covers the ATS workflow from job posting to hiring decision, resume parsing mechanics, pipeline stages, candidate scoring methods (keyword vs rules vs AI), data ownership, and integrations. Published to `content/blog/how-applicant-tracking-systems-work.md`
- **Internal link** — added cross-link from `open-source-applicant-tracking-system.md` (Cluster 1 pillar) to new supporting article

## 2026-02-28

### Added

- **Blog: OpenCATS vs Reqcore: Open Source ATS Head-to-Head** — Published to `content/blog/opencats-vs-reqcore.md`
- **Internal link** — added cross-link from `best-open-source-applicant-tracking-systems.md` to new post

## 2026-02-22

### Added

- **Blog: Best Open Source Applicant Tracking Systems [2026]** — Cluster 2 pillar page. 3,800-word comparison of 7 open source ATS platforms with TCO analysis, evaluation framework, and FAQ. Published to `content/blog/best-open-source-applicant-tracking-systems.md`
- **Internal link** — added cross-link from `self-hosted-vs-cloud-ats.md` to new pillar page

### Fixed

- **Railway PR seed execution** — removed hard `.env` dependency from `db:seed`; seeding now works with platform-injected env vars and still supports local `.env` loading in `seed.ts`

### Changed

- **Unified Railway seeding path** — Railway predeploy now runs `db:seed` (same script as standard demo data), removing PR-specific seed divergence between preview and production-like environments
- **Preview demo defaults aligned** — runtime preview fallbacks now target `reqcore-demo` and `demo@reqcore.com` to match `server/scripts/seed.ts`

### Removed

- **PR-only seed script** — removed `server/scripts/seed-pr.ts` and the `db:seed:pr` npm script

---
## 2026-02-21

### Fixed

- **Dependency security remediation** — resolved all `npm audit --audit-level=high` findings by upgrading `@aws-sdk/client-s3` (pulling patched `@aws-sdk/xml-builder`) and regenerating lockfile resolution
- **Transitive vulnerability pinning** — added npm `overrides` for `fast-xml-parser`, `minimatch`, `tar`, and `readdir-glob` to keep vulnerable transitive ranges out of the install graph
- **Demo write-protection enforcement** — hardened server demo guard so `POST`/`PATCH`/`PUT`/`DELETE` requests are consistently blocked for the configured demo organization and no longer silently fail open when demo org lookup fails
- **Dashboard preview UX** — write attempts in preview mode now trigger a dedicated upsell modal instead of only inline/API errors, while keeping action buttons visible

### Changed

- **Lockfile hygiene** — refreshed dependency graph with `npm install` + `npm dedupe` to remove stale vulnerable transitive entries
- **Demo env guidance** — `.env.example` demo slug example now matches seeded demo organization slug (`reqcore-demo`) to reduce configuration drift

---
## 2026-02-19

### Changed

- **Deployment platform migration** — migrated from Hetzner VPS (Caddy + systemd) to Railway (managed Nuxt service, Railway PostgreSQL, Railway Storage Buckets)
- **S3 path style now configurable** — `S3_FORCE_PATH_STYLE` env var controls path-style vs virtual-hosted-style S3 URLs (MinIO vs Railway Buckets/AWS S3)
- **S3 bucket plugin** — skips bucket initialization on managed providers (Railway/AWS) where buckets are pre-provisioned
- **`.env.example`** — expanded with full documentation, Railway-specific variable references, and all env vars

### Added

- **`start` script in `package.json`** — `node .output/server/index.mjs` for Railway Nixpacks detection

---
## 2026-02-18

### Added

- **Organic SEO foundation** — `@nuxtjs/seo` (Sitemap, Robots, Schema.org, SEO Utils, Site Config) and `@nuxt/content` v3 (Markdown blog engine with typed collections)
- **Dynamic sitemap** — all open job postings auto-included via `/api/__sitemap__/urls`
- **Robots directives** — `/dashboard/`, `/auth/`, `/api/`, `/onboarding/` blocked from crawling; `noindex` on auth, onboarding, apply, and confirmation pages
- **JSON-LD structured data** — `JobPosting` on job detail (salary, location, remote, employment type), `Organization` + `WebSite` + `WebPage` on landing page, `Article` on blog posts
- **Job SEO fields** — `salaryMin`, `salaryMax`, `salaryCurrency`, `salaryUnit`, `remoteStatus`, `validThrough` added to job schema and all CRUD endpoints
- **Full OG + Twitter Card meta** on all public pages (landing, job board, job detail, roadmap, blog)
- **Blog** — listing page, article detail page with `@tailwindcss/typography` prose styling, seed article "Self-Hosted vs Cloud ATS: Pros, Cons, and When to Switch"
- **ISR route rules** — `/jobs/**` (3600s stale-while-revalidate), prerender for `/`, `/roadmap`, `/blog/**`
- **SVG favicon** — purple rounded rect with white "A"

### Changed

- **Landing page H1** — from "The recruitment engine you actually own" to "The open-source ATS you actually own" for keyword targeting
- **Landing page meta description** — optimized for "open source ATS", "self-hosted", "applicant tracking system" keywords
- **Public job API** — now joins organization table to expose `organizationName` for JSON-LD `hiringOrganization`
- **Navigation** — "Blog" link added to landing page navbar/footer and roadmap page navbar

---
## 2026-02-16

### Added

- **In-app feedback** — floating button in the dashboard opens a modal to submit bug reports or feature requests directly as GitHub Issues. Server-side GitHub API integration with fine-grained PAT (token never exposed to client). Per-user rate limiting (5/hour). Auto-labels issues (`bug` / `enhancement`). Includes reporter context (name, email, page URL). Gracefully hidden when `GITHUB_FEEDBACK_TOKEN` / `GITHUB_FEEDBACK_REPO` env vars are not set.
- **Production deployment** — deployed to Hetzner Cloud CX23 (2 vCPU, 4GB RAM, Ubuntu 24.04) with Caddy reverse proxy, systemd service management, and one-command deploy script (`~/deploy.sh`)
- **Cloudflare CDN** — DNS, DDoS protection, edge caching, SSL termination (Full strict mode), and AI training bot blocking via Cloudflare Free plan
- **Deploy workflow** — `ssh deploy@server '~/deploy.sh'` pulls latest code, installs deps, builds, and restarts the systemd service
- **UFW firewall** — only ports 22 (SSH), 80 (HTTP), 443 (HTTPS) open

### Fixed

- **S3 bucket policy MinIO compatibility** — replaced `PutBucketPolicy` with `DeleteBucketPolicy` because MinIO doesn't support the `aws:PrincipalType` condition key used in the deny-anonymous policy; buckets without a policy are private by default in MinIO

### Changed

- **S3 bucket privacy strategy** — instead of setting an explicit deny-all policy (which used AWS-only condition keys), the startup plugin now deletes any existing bucket policy to ensure MinIO's default private behavior

---
## 2026-02-15

### Added

- **Recruiter dashboard** (`app/pages/dashboard/index.vue`) — at-a-glance overview with four stat cards (Open Jobs, Total Candidates, Applications, Unreviewed), pipeline breakdown bar chart with color-coded status segments, jobs by status breakdown, recent applications list with relative timestamps, and top active jobs with new-application badges
- **Dashboard stats API** (`server/api/dashboard/stats.get.ts`) — single endpoint returning all dashboard data: summary counts, pipeline breakdown, jobs by status, recent 10 applications with candidate/job info, and top 5 active jobs by application count — all org-scoped with parallel query execution
- **Dashboard composable** (`app/composables/useDashboard.ts`) — wraps stats endpoint with computed unwrappers for all dashboard sections
- Quick action buttons (Create Job, Add Candidate) in dashboard header
- Welcome empty state for new organizations with CTA to create first job
- Loading skeleton states for all dashboard widgets
- **Public roadmap page** (`app/pages/roadmap.vue`) — cinematic horizontal-scrolling timeline with 15 glassmorphism milestone cards, color-coded by status (shipped/building/vision), scroll-tracking progress glow on the timeline axis, smooth mousewheel-to-horizontal scroll conversion via requestAnimationFrame, and intro card centered on page load
- **Roadmap showcase section on landing page** — "Built in the open" section with mini timeline showing Shipped/Building/Vision counts and prominent CTA to full roadmap
- **Roadmap navigation links** — Roadmap link added to landing page navbar and footer

---
## 2026-02-14

### Added

- **Dynamic sidebar job tabs** — when viewing a specific job (`/dashboard/jobs/:id/*`), the sidebar shows contextual sub-navigation: Overview, Pipeline, Application Form
- **Application Form tab page** (`app/pages/dashboard/jobs/[id]/application-form.vue`) — dedicated page for custom questions management and shareable application link
- **Sidebar icons** — all main nav items now display Lucide icons (LayoutDashboard, Briefcase, Users, Inbox, LogOut)
- **"All Jobs" sidebar back-link** — quick return to jobs list from any job sub-page

### Changed

- **Sidebar redesign** — replaced scoped CSS with Tailwind utility classes; added dynamic job context section with tab-based navigation
- **Dashboard layout** — removed `max-w-4xl` wrapper from `dashboard.vue`; each page now controls its own `mx-auto max-w-*` for proper centering
- **All dashboard pages** — added `mx-auto` to root elements for centered content within the main area
- **Dashboard index** — converted from `<style scoped>` to Tailwind utility classes
- **Job detail page** — removed "Back to Jobs" link, "View Pipeline" button, application link section, and Application Form Questions section (all moved to sidebar tabs / dedicated application-form page)
- **Pipeline page** — removed "Back to Job" link (sidebar provides navigation)

### Removed

- **"Back to X" links** on job sub-pages — sidebar now provides all navigation context
- **Scoped CSS** in `AppSidebar.vue` and `dashboard/index.vue` — replaced with Tailwind utilities

---
