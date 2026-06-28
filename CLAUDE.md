# CLAUDE.md

1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                        # Start web app (Next.js dev server)
pnpm dev-worker                 # Start worker explicitly (BullMQ consumers — uses Redis quota)

# Build all packages
pnpm build

# Run a specific app
pnpm --filter @salesagent/web dev
pnpm --filter @salesagent/worker start
pnpm --filter @salesagent/mobile start   # Expo dev server (scan QR with Expo Go)
pnpm --filter @salesagent/mobile web     # Web mode on http://localhost:8082
pnpm --filter @salesagent/mobile android # Android emulator
pnpm --filter @salesagent/mobile ios     # iOS simulator (macOS only)

# Database
pnpm --filter @salesagent/db generate    # Regenerate Prisma client
pnpm --filter @salesagent/db push        # Push schema to DB
pnpm --filter @salesagent/db prisma studio  # Open Prisma Studio
node packages/db/setup-vector.mjs        # Enable pgvector + embedding column

# Seeds
pnpm seed                          # Reset + seed demo data (destructive)
pnpm seed-prod <org-slug>          # Non-destructive: 3 scripts + 5 leads
pnpm seed-members <org-slug>       # RBAC test accounts
pnpm seed-demo                     # Acme Corp demo (15 leads, 3 agents, 10 conversations)
pnpm seed-verify-alice             # Mark alice@example.com as email-verified
pnpm clean-org <org-slug>          # Delete all conversations + campaigns + leads in an org

# Testing
pnpm --filter @salesagent/web test              # Unit tests (vitest, ~2s): 53 specs
pnpm --filter @salesagent/worker test            # Unit tests (vitest)
pnpm --filter @salesagent/web test:integration  # API integration tests
pnpm --filter @salesagent/web test:e2e          # Playwright E2E

# Deploy
npx vercel --cwd apps/web          # Deploy web app to Vercel
npx vercel --prod --cwd apps/web   # Deploy to production
# Worker auto-deploys via Railway on git push to main
```

## Architecture

**SalesAgent AI** is a pnpm + Turborepo monorepo for an AI SDR / outbound sales operating system. AI agents that qualify leads, compose follow-ups, and book meetings — with multi-channel conversation inbox, campaign orchestration, and real-time monitoring.

### Monorepo layout (V1.5)

```
apps/
  web/         — Next.js 14 app (App Router, RSC, React 18), 40+ API routes
  worker/      — BullMQ Worker consuming queues from Upstash Redis (concurrency 5)
  mobile/      — Expo 52 app (React Native) — 6-page Club Concierge demo showcase
packages/
  shared-types/ — API contract types extracted from apps/web/lib/
  domain/       — Business entities (LeadStage, CampaignStatus, etc.)
  ui-tokens/    — Corporate Green palette + Tailwind preset + JS tokens for RN
  ai-core/      — Unified DeepSeek client + prompt builders + agent execution
  rag-core/     — Full RAG pipeline (parse → chunk → embed → retrieve → cite)
  api-client/   — Type-safe fetch client (web + mobile share)
  db/           — Prisma 6 schema + client (PostgreSQL + pgvector, 14 models)
```

### Data model (14 models in `sales_agent` PostgreSQL schema)

- **User / Organization / Membership** — Multi-tenant with 4 roles + 10+ permissions.
- **ApiKey** — Per-org API keys: SHA-256 hashed, prefix for display, lastUsedAt tracking.
- **Agent** — AI agent configuration per org: personality, tone, knowledge base, goals, isActive.
- **Lead** — CRM leads with stage tracking, AI score, source, assigned owner.
- **LeadActivity** — Immutable activity log per lead.
- **Conversation** — Thread between agent and lead: channel, status, subject.
- **Message** — Individual message in a conversation: direction, content, AI metadata.
- **Script** — Sales playbook: name, description, steps (JSON).
- **Campaign** — Outbound campaign: linked to script + agent, target audience, schedule, stats.
- **CampaignRun** — Execution record per campaign.
- **Document** — KB document: name, type, status, chunkCount, metadata.
- **DocumentChunk** — KB chunk: content, embedding (pgvector), metadata.
- **AuditLog** — Immutable audit trail for org-level actions.
- **FeatureFlag** — Per-org feature toggles with rollout%, rules targeting, DB-backed.

### Key patterns

- **Web**: Server Components for data fetching, client components for interactivity. TanStack Query for data hooks, zustand for inbox state, SSE for real-time conversation streaming.
- **Auth**: Custom JWT (jose) + httpOnly cookies. Login issues JWT directly. Registration requires email verification link click (one-time). `lib/session.ts` extracts session server-side.
- **Security**: JWT secret enforced (no fallback). Upstash Redis sliding-window rate limiting (100 req/min API, 10/min auth, falls back to in-memory with TTL). Auth-specific rate limits on login/register/verify (defense-in-depth). Fail-closed options via env vars. IP validation via TRUSTED_PROXY_RANGES. Bcrypt 12 rounds with auto re-hash on login. CSP/HSTS/X-Frame-Options security headers. CSP `unsafe-eval` removed. Login PII hashed in logs (SHA256). Cookie `secure: true` always. Password min 8 chars. Org enumeration prevented via generic error messages. API routes return 401 JSON (not 302 redirect). File upload 10MB cap + magic byte validation.
- **Registration flow**: `alice@example.com` → owner + new org. All others → viewer in alice's existing org. Verification link must be clicked to complete registration.
- **API layer**: 40+ Route Handlers with session + RBAC permission checks. API versioning via `/api/v1/` prefix (Next.js rewrites, zero route duplication). JSON logging on auth/AI routes with PII hashing. Centralized error handler (`lib/api-error.ts`) with typed status mapping.
- **Worker**: BullMQ Worker consuming `conversation-jobs`, `email-jobs`, `campaign-jobs`, `scoring-jobs` queues. AI response composition + lead qualification + campaign delivery. Uses `prefix: "sales-agent"` on all queue connections to prevent cross-project conflicts.
- **AI**: DeepSeek API client. 4 AI endpoints: compose-response, score-lead, summarize-conversation, generate-script. Feature flags via DB-backed system (`lib/feature-flags-v2.ts`) with per-org control, rollout%, rules targeting, memory cache (60s TTL), and env-var fallback for backward compat.
- **Email**: Resend SDK. `apps/worker/src/email.ts` — template variable resolution (`{{lead.email}}`) + send. Worker composes AI responses and sends via Resend.
- **DB**: PrismaClient singleton cached on `globalThis`. `experimental.serverComponentsExternalPackages: ["@prisma/client"]` in next.config for Vercel.
- **Design system**: CSS custom properties in `globals.css` (RGB triplets for Tailwind opacity support). All colors registered in `tailwind.config.js` as `rgb(var(--x) / <alpha-value>)`. 11 UI components in `components/ui/` use design tokens exclusively — never hardcoded colors. Glass morphism via `.glass-card` utility class. Typography: Inter (Google Font, loaded via next/font). Corporate Green palette (green-800/700/400 + slate) — evolved from Luxury Nature for professional SaaS feel. Error boundaries on all 11 dashboard routes + root level.
- **Error tracking**: @sentry/nextjs integration (graceful opt-in via SENTRY_DSN env var). Centralized `handleApiError()` with status code mapping + PII-safe logging. 14 `error.tsx` files (11 route-level + dashboard group + root app + global-error).
- **Feature flags**: DB-backed system (`FeatureFlag` model) with per-org toggles, rollout% (hash-based user bucketing), role/user targeting rules. Memory cache (60s TTL). Env-var fallback preserves backward compatibility with existing 4 flags.
- **Identity Stack**: Operational Customer Identity Layer — every customer-facing entity shows: avatar (pravatar.cc real human photos + gradient fallback), presence state (derived from `updatedAt` recency), AI ownership (agent name + confidence %), lead intent (score bar), activity timestamp. `IdentityCard` component (compact/expanded variants) used consistently across inbox, leads, and dashboard. Presence states: online/idle/away/offline/ai-processing/handoff-required/syncing. No new DB columns — presence is pure logic on existing timestamps; avatars use pravatar.cc deterministic by email seed.

### RBAC permissions (10 permissions)

| Permission | owner | admin | operator | viewer |
|---|---|---|---|---|
| manage_org | yes | - | - | - |
| manage_members | yes | yes | - | - |
| manage_agents | yes | yes | yes | - |
| manage_leads | yes | yes | yes | - |
| delete_leads | yes | yes | - | - |
| manage_campaigns | yes | yes | yes | - |
| view_agents | yes | yes | yes | yes |
| view_leads | yes | yes | yes | yes |
| view_members | yes | yes | yes | yes |
| view_audit_log | yes | yes | yes | yes |
| run_campaigns | yes | yes | yes | - |

### Key files

```
apps/web/app/page.tsx                — Public landing page with "Try Live Demo →" CTA
apps/web/middleware.ts               — JWT guard + rate-limit + /→/home redirect + /login?clear=1 stale cookie clearing
apps/web/app/(dashboard)/home/page.tsx — Dashboard (dense full-viewport, donut charts, KPI cards, activity feed)
apps/web/app/(dashboard)/home/donut-chart.tsx — SVG donut chart (zero deps, stroke-dasharray)
apps/web/app/(dashboard)/inbox/      — Conversation inbox (unified single-page split-pane, no navigation)
apps/web/app/(dashboard)/analytics/   — Analytics dashboard (pipeline, campaign perf, conversion rates)
apps/web/app/(dashboard)/agents/     — AI agent management (configure personality, knowledge base)
apps/web/app/(dashboard)/scripts/    — Sales script marketplace (browse + install playbooks)
apps/web/app/(dashboard)/campaigns/  — Outbound campaign list + create + analytics
apps/web/app/(dashboard)/campaigns/new/ — Campaign creation wizard (agent + script picker)
apps/web/app/(dashboard)/scripts/[id]/ — Script detail view (steps, linked campaigns)
apps/web/app/(dashboard)/scripts/new/ — AI script generation playground
apps/web/app/(dashboard)/agents/[id]/ — Agent detail with inline editing + conversations/campaigns
apps/web/app/(dashboard)/docs/       — API documentation page
apps/web/app/api/demo-login/route.ts — Quick demo login (auto-seeds, signs JWT, redirects /home)
apps/web/app/(dashboard)/settings/api-keys/ — API key management
apps/web/app/(dashboard)/onboarding-card.tsx — 3-step onboarding wizard
apps/web/lib/auth.ts                — JWT sign/verify (jose), Edge-compatible, no fallback secret
apps/web/lib/password.ts            — bcrypt hash/verify (12 rounds), auto re-hash on login, Node.js only (not Edge)
apps/web/lib/session.ts             — Server-side session from JWT cookie
apps/web/lib/audit.ts               — Audit log write helper (used in all mutation endpoints)
apps/web/lib/permissions.ts         — 12 RBAC permissions + role matrix (PERMISSION_MAP exported for tests)
apps/web/lib/rate-limit.ts          — Upstash Redis sliding-window rate limiter (configurable window, fail-closed option, in-memory TTL fallback)
apps/web/lib/token-blacklist.ts     — JWT revocation via Redis SET with TTL (fail-closed option)
apps/web/lib/feature-flags.ts       — Backward-compat re-export from feature-flags-v2 (4 active flags)
apps/web/lib/feature-flags-v2.ts    — DB-backed feature flags: per-org, rollout%, rules targeting, memory cache, env fallback
apps/web/lib/api-error.ts           — Centralized error handler: status mapping, safe JSON, PII-free responses
apps/web/lib/logger.ts              — Structured JSON logging with log levels, PII redaction, requestId tracing
apps/web/middleware.ts              — JWT guard + auth rate limiting (10/min) + API rate limiting (100/min) + API versioning headers + IP validation
apps/web/components/providers/theme-provider.tsx — Dark mode provider with flash prevention
apps/web/components/providers/theme-toggle.tsx   — Dark/light toggle button
apps/web/components/nav/sidebar.tsx              — Collapsible sidebar (ChatGPT-style), user menu at bottom
apps/web/components/nav/page-title.tsx           — Page title from path segment (no UUIDs in header)
apps/web/components/nav/mobile-nav.tsx           — Mobile hamburger menu with slide-out drawer
apps/web/components/leads/import-button.tsx      — CSV import dialog with file upload
apps/web/components/identity/avatar.tsx          — Pravatar.cc real photo avatar + gradient fallback + presence dot
apps/web/components/identity/identity-card.tsx   — Operational Identity Cell (compact list + expanded header)
apps/web/components/identity/presence.tsx        — Presence dot with pulse animation for AI states
apps/web/lib/time.ts                            — relativeTime(), presenceFromDate(), presenceLabel()
apps/web/vitest.config.ts           — Unit test config (excludes integration/E2E files)
apps/web/vitest.integration.config.ts — Integration test config (sequential file execution)
apps/web/playwright.config.ts       — Playwright E2E config (Chromium, auto-starts dev server)
apps/web/lib/__tests__/             — Unit + integration test files (52 specs)
apps/web/e2e/                       — Playwright E2E specs (5 specs: auth, leads, rbac, agents, security)
apps/web/instrumentation.ts         — Next.js instrumentation hook for Sentry server/edge init
apps/web/sentry.client.config.ts    — Sentry client-side config (opt-in via SENTRY_DSN)
apps/web/sentry.server.config.ts    — Sentry server-side config (API routes + RSC)
apps/web/sentry.edge.config.ts     — Sentry edge runtime config (middleware)
apps/web/components/ui/error-boundary.tsx — Reusable error boundary with retry + dashboard navigation
apps/web/app/error.tsx              — Root-level error boundary
apps/web/app/global-error.tsx       — Global error boundary (root layout errors)
apps/web/app/(dashboard)/error.tsx  — Dashboard group error boundary (11 routes)
SECURITY.md                          — Phase 15 audit report (165 findings, 32 fixed) [gitignored]
apps/mobile/app/_layout.tsx           — Root layout + theme + DemoModeProvider + playground/system routes
apps/mobile/app/(tabs)/_layout.tsx    — 3 tabs: Dashboard / Inbox / Knowledge Base
apps/mobile/app/(tabs)/index.tsx      — Dashboard: 4 KPI cards + recent activity feed + Demo/Live toggle
apps/mobile/app/(tabs)/inbox.tsx      — Inbox: conversation list with AI confidence %, navigates to detail
apps/mobile/app/(tabs)/inbox/[id].tsx — Inbox detail: message thread + AI replies + source citations
apps/mobile/app/(tabs)/kb.tsx         — Knowledge Base: stats row + document list + upload pipeline + Playground entry
apps/mobile/app/playground.tsx        — ⭐ AI Playground: 6-step RAG pipeline visualization (embed→search→rank→sources→generate→answer)
apps/mobile/app/system.tsx            — System Overview: multi-tenant, pipeline, architecture layers, tech stack
apps/mobile/app/login.tsx             — Login: email/password form + real API auth + loading/error states + "Enter Demo →" CTA
apps/mobile/hooks/use-theme.ts        — Shared theme hook (all components use this)
apps/mobile/hooks/use-demo-mode.tsx   — Demo/Live toggle Context
apps/mobile/components/kpi-card.tsx   — KPI card (icon + value + label, soft shadow, no border)
apps/mobile/components/activity-item.tsx — Activity feed row with icon + description + time
apps/mobile/components/conversation-item.tsx — Conversation list row with AI confidence % + onPress
apps/mobile/components/message-bubble.tsx   — Chat bubble (inbound/outbound) with AI label + source citations
apps/mobile/components/source-citation.tsx  — RAG source block: document name, chunk #, score, excerpt
apps/mobile/components/document-card.tsx    — Document card: file icon, type badge, status dot, chunk count
apps/mobile/components/pipeline-step.tsx    — Pipeline step component (used in Playground, KB, System Overview)
apps/mobile/components/stats-card.tsx       — Compact stat card (icon + value + label)
apps/mobile/components/skeleton.tsx         — Skeleton loaders (KPI, conversation, document variants)
apps/mobile/components/empty-state.tsx      — Empty state with icon, title, description
apps/mobile/data/index.ts             — Barrel export for all mock data
apps/mobile/data/mock-dashboard.ts    — Club Concierge KPI + activity mock data
apps/mobile/data/mock-inbox.ts        — 5 conversations with full message threads + RAG sources
apps/mobile/data/mock-kb.ts           — 24 documents + stats mock data
apps/mobile/data/mock-playground.ts   — Pre-scripted Q&A pairs with citations
apps/mobile/data/mock-system.ts       — System architecture mock data
apps/mobile/metro.config.js           — Metro bundler config for monorepo resolution
apps/worker/src/queue.ts            — Direct Redis connection + BullMQ Queues (prefix: "sales-agent")
apps/worker/src/email.ts            — Resend email sender + {{variable}} template resolver + open/click tracking
apps/worker/src/index.ts            — Worker: AI response composition, lead scoring, campaign delivery, retry, HTTP healthcheck
packages/db/prisma/schema.prisma    — 14 models in sales_agent schema (incl. ApiKey + FeatureFlag for production)
packages/db/index.ts                — PrismaClient singleton export
packages/db/setup-vector.mjs        — Enable pgvector + embedding column on Supabase
packages/ai-core/src/client.ts      — Unified DeepSeek client (callDeepSeek, callDeepSeekJSON, 15s timeout)
packages/ai-core/src/prompts.ts     — AI system prompts + builders + PROMPT_ARMOR injection defense
packages/ai-core/src/agents.ts      — composeResponse(), scoreLead(), generateScript(), summarizeConversation()
packages/rag-core/src/index.ts      — Full RAG pipeline barrel export
packages/rag-core/src/pgvector-storage.ts — PostgreSQL pgvector StorageAdapter implementation
packages/domain/src/lead.ts         — LeadStage, STAGE_TRANSITIONS, LeadScoreLabel
packages/ui-tokens/src/colors.ts    — Corporate Green palette (#166534, #4ADE80, #0a1108, #475540, #FFFFFF, #849b70)
packages/api-client/src/client.ts   — createClient() type-safe fetch wrapper (cookie + bearer auth)
packages/db/seed-production.ts      — 3 sellable scripts + 5 demo leads (idempotent)
packages/db/seed-demo.ts            — Client demo: Acme Corp, 15 leads, 3 agents, 10 conversations
packages/db/seed-members.ts         — RBAC test accounts (admin/operator/viewer @salesagent.test)
packages/db/seed-verify-alice.ts    — Mark alice@example.com emailVerified=true
packages/db/clean-demo-org.ts       — FK-safe org cleanup before re-seed
```

### State of the project (2026-06-28)

- **Phase 1-12**: Foundation → CRM → Campaigns → AI → Polish → Testing → Security → UI/UX → Identity Layer → Route hardening → UX Rework → Bugfix Sprint.
- **Phase 13 (V1.5)**: Monorepo refactor into 3 apps + 7 packages. RAG knowledge base (pgvector). Mobile Expo app.
- **Phase 14 (V1.6)**: Mobile Showcase — 6-page Club Concierge Demo. Demo/Live toggle, RAG Pipeline visualization.
- **Phase 15 (Production Readiness)**: 8-domain security audit (165 findings, 32 fixed). Prompt injection armor. API validation. Worker retry config. Vercel build fixes.
- **Phase 16 (UI/UX Commercial Overhaul — 2026-06-28)**: Real human avatars (pravatar.cc replacing DiceBear cartoons). Inter typography. Corporate Green palette (green-800/700/400 + slate — evolved from Luxury Nature). 26 files changed across web + mobile + packages.
- **Phase 17 (Production Hardening — 2026-06-28)**: Auth rate limiting (10/min login, 5/min register). Rate limiter fail-closed option. IP spoofing protection. Bcrypt 12 rounds. CSP unsafe-eval removed. Dead try/catch cleanup. File upload 10MB cap + magic bytes. Logger: levels + PII redaction + requestId. ApiKey Prisma model (was JSON column). FeatureFlag Prisma model (DB-backed with rollout%). API versioning (/api/v1/ rewrites). Sentry integration (graceful opt-in). Centralized error handler. 14 error.tsx boundaries. Mobile login wired to real API. 5 E2E specs. 43 files changed.
- **~27,000 lines** across ~390 files. 40+ API routes + SSE + webhook. 52 unit tests. 14 models.
- Web app: ✅ Vercel (JWT, API versioning, Sentry, Identity Stack, Knowledge Base, RAG Playground).
- Worker: ✅ Railway (4 BullMQ workers, `prefix: "sales-agent"`, AI compose, scoring, campaign delivery, healthcheck).
- Mobile: ✅ Expo 52 (7 pages). Club Concierge demo. Real API auth wired. Demo/Live toggle functional.
- Email: ✅ Resend verification + AI-composed sales emails with open/click tracking.
- RAG: ✅ pgvector + embeddings (with keyword search fallback). Full pipeline: parse → chunk → embed → store → retrieve → cite.
- Design: ✅ Corporate Green palette (#166534, #4ADE80, #0a1108, #475540, #FFFFFF, #849b70). Premium Enterprise SaaS (Notion/Linear/Stripe/Ramp). Inter typography. Real human avatars via pravatar.cc. 14 error boundaries.
- Security: Auth rate limiting (defense-in-depth), fail-closed options, IP protection, bcrypt 12, CSP unsafe-eval removed, file upload validation, PII redaction, API key model, API 401 JSON responses.
- Known: Upstash Redis 500K free limit. DOCX parser not installed. Stripe billing not implemented. SSO/OAuth not implemented.

### Seed scripts reference

| Command | What it does | Safe to re-run? |
|---------|-------------|-----------------|
| `pnpm seed` | Full reset + demo data (destructive) | Drops all data |
| `pnpm seed-prod <slug>` | 3 scripts + 5 leads, idempotent | Yes |
| `pnpm seed-members <slug>` | RBAC test accounts with all 4 roles | Yes |
| `pnpm seed-verify-alice` | Sets emailVerified=true for alice@example.com | Yes |
| `pnpm seed-demo` | Acme Corp demo (15 leads, 3 agents, 10 conversations) | Drop first |
| `pnpm clean-org <slug>` | FK-safe delete of all conversations + campaigns + leads | Destructive |

### Vercel deployment gotchas (lessons learned)

1. **Prisma engine binary**: Three changes needed: (a) Add `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to schema.prisma generator. (b) Set `experimental.serverComponentsExternalPackages: ["@prisma/client"]` in next.config.js (NOT top-level `serverExternalPackages` — Next.js 14.2 only supports it under `experimental`). (c) Add `.npmrc` with `node-linker=hoisted` — pnpm virtual store deep paths prevent Vercel's file tracer from finding `.so.node` files.
2. **Prisma generate before build**: `vercel.json` buildCommand = `pnpm --filter @salesagent/db generate && pnpm --filter @salesagent/web build`
3. **No dotenv**: Vercel provides env vars natively. Don't use dotenv in next.config.js.
4. **Workspace imports**: Dynamic `import()` for packages that need env vars not set on Vercel (worker/queue needs REDIS_URL)
5. **Edge vs Node**: Middleware runs Edge Runtime — don't import bcryptjs there. Split password functions into separate file.
6. **Postinstall**: Root `postinstall` runs `prisma generate`. The `@prisma/client` postinstall warning about "schema not found" is harmless.
7. **pnpm hoisted mode**: `.npmrc` with `node-linker=hoisted` is required for Vercel. It flattens node_modules so the Prisma engine binary at `node_modules/.prisma/client/` is traced properly. Without it, the engine is buried in `node_modules/.pnpm/@prisma+client@.../node_modules/.prisma/client/` and Vercel can't find it.
8. **Client components need org slug from server**: Don't extract org slug from `window.location.pathname` in client components — the root dashboard path `/` yields `undefined`. Always pass `orgSlug` as a prop from the server component which has it from the session/JWT. Otherwise the fallback "demo-org" won't match production orgs (which are generated as `{email-prefix}-workspace` during registration).
9. **Re-issue JWT on slug change**: When updating the org slug via PATCH, the JWT cookie MUST be re-signed with the new `orgSlug`. Otherwise the session carries the old slug and every subsequent API call (members, leads, etc.) returns 404 because the membership lookup uses the stale slug.
10. **Toast notifications via sonner**: `Toaster` is in root layout. Use `toast.success()` / `toast.error()` from `sonner` for user feedback. Never use `alert()`. On navigation after success, keep button `loading=true` — `router.push()` will unmount the component, so no need to reset loading state.
11. **Prisma config conflict**: If `prisma.config.ts` exists, Prisma skips automatic `.env` loading. Delete this file unless you explicitly load env vars in it.
12. **.env location**: Prisma looks for `.env` relative to the schema file. Keep a `.env` in `packages/db/` with `DATABASE_URL` and `DIRECT_URL`.
13. **Supabase pooler V2**: New Supabase projects (2025+) use V2 pooler (`aws-1-{region}.pooler.supabase.com`), NOT V1 (`aws-0-...`). If you get `FATAL: Tenant or user not found`, check the pooler version in Supabase Dashboard → Connection string. The username format is `postgres.{project-ref}` for the pooler, `postgres` for direct connection. Always copy the full URI from Supabase Dashboard — don't compose it manually.
14. **Prisma connection_limit in serverless**: Without `connection_limit=1` in the DATABASE_URL, Prisma opens `num_cpus * 2 + 1` connections per serverless instance. On Vercel with 30+ routes, this can exhaust Supabase's free-tier pool, causing slow queries and timeouts. `packages/db/index.ts` appends `&connection_limit=1` automatically if not present. Supabase pooler (pgBouncer) + `connection_limit=1` = safe for serverless.
15. **Seed scripts bypass `@salesagent/db` singleton**: All 5 seed scripts (`seed-demo.ts`, `seed-production.ts`, `seed-members.ts`, `seed-verify-alice.ts`, `clean-demo-org.ts`) create their own `new PrismaClient()` directly from `@prisma/client` — this bypasses `packages/db/index.ts` which auto-appends `connection_limit=1`. Each script must manually inject `connection_limit=1` via `datasources.db.url`. Without it, parallel writes (e.g. `Promise.all(leadData.map(...))`) exhaust the pgBouncer pool and throw P1001 "Can't reach database server".
16. **Inbox height calc**: Dashboard layout header is `h-14` (3.5rem), not 4rem. `<main>` has `p-4 lg:p-8`. Inbox pages use a wrapper `<div className="-m-4 lg:-m-8 h-[calc(100vh-3.5rem)]">` to negate main padding and fill the viewport correctly. Inner containers use `h-full`.
17. **sendMessageSchema**: `conversationId` is optional — the ID comes from the URL path `/api/orgs/{slug}/conversations/{id}/messages`, not the request body. Client sends only `{ content, channel }`.
18. **pdf-parse v2 API**: The installed version is 2.4.5 which uses a class-based API (`new PDFParse({ data }).getText()`), NOT the v1 default export function (`await pdfParse(buffer)`). Import `{ PDFParse }` (named), not default. See `packages/rag-core/src/pdf-parser.ts` for reference.
19. **SECURITY.md is gitignored**: Contains detailed vulnerability findings including credential names. Kept locally for reference, never committed.

### Railway deployment (worker)

Worker is a standalone Node.js process (BullMQ consumer) that handles AI response composition, lead scoring, and campaign delivery from Upstash Redis queues. Without it, conversations don't get AI responses and campaigns stay in `queued` status forever.

**Config**: `railway.toml` at project root — `nixpacks` builder. Root `package.json` has `"start"` script for nixpacks auto-detection.

**Build command**: `pnpm install --frozen-lockfile && pnpm --filter @salesagent/db generate`  
**Start command**: `npx tsx apps/worker/src/index.ts` (from root)

**Env vars needed**: `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`

**GitHub-linked deployment**: Push to `main` triggers auto-deploy. Railway dashboard can override start command — must ensure it matches railway.toml.

### BullMQ queue isolation (critical)

All queues MUST use `prefix: "sales-agent"` to avoid conflicts with other projects sharing the same Upstash Redis instance:

```typescript
const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

// ALL queues use the same prefix
const conversationQueue = new Queue("conversation-jobs", { connection, prefix: "sales-agent" });
const emailQueue = new Queue("email-jobs", { connection, prefix: "sales-agent" });
const campaignQueue = new Queue("campaign-jobs", { connection, prefix: "sales-agent" });
const scoringQueue = new Queue("scoring-jobs", { connection, prefix: "sales-agent" });

// Workers MUST also use the same prefix
const worker = new Worker("conversation-jobs", processor, { connection, prefix: "sales-agent" });
```

Without the prefix, BullMQ queue names will collide with other projects, workers will consume each other's jobs, job names will duplicate, and retry state will cross-contaminate.

### Production env vars checklist

| Variable | Used by | Notes |
|----------|---------|-------|
| `DATABASE_URL` | Web, Worker, DB | Supabase pooled connection (pgBouncer) |
| `DIRECT_URL` | DB push/migrate | Supabase direct connection |
| `REDIS_URL` | Worker, Web | Upstash Redis (BullMQ + rate limiting) |
| `UPSTASH_REDIS_REST_URL` | Web | Upstash REST API for serverless rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Web | Upstash REST API token |
| `JWT_SECRET` | Web | 64-char random string, NO fallback allowed |
| `DEEPSEEK_API_KEY` | Web, Worker | DeepSeek AI API |
| `EMBEDDING_API_KEY` | Web, Worker | OpenAI API key for embeddings (optional — falls back to keyword search) |
| `EMBEDDING_BASE_URL` | Web | Optional: custom embedding endpoint |
| `EMBEDDING_MODEL` | Web | Optional: model name (default: text-embedding-3-small) |
| `RESEND_API_KEY` | Worker | Resend email delivery |
| `EMAIL_FROM` | Worker | Sender address for AI-composed emails |
| `SENTRY_DSN` | Web | Sentry error tracking (optional — graceful opt-in) |
| `RATE_LIMIT_FAIL_CLOSED` | Web | When `true`, deny requests on Redis outage (default: fail-open) |
| `TOKEN_REVOCATION_FAIL_CLOSED` | Web | When `true`, deny tokens when Redis unavailable |
| `TRUSTED_PROXY_RANGES` | Web | Comma-separated CIDR/IP ranges for trusted proxies |
| `LOG_LEVEL` | Web | Minimum log level: debug, info, warn, error (default: info) |
