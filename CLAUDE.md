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
# Development (starts all apps/packages)
pnpm dev

# Build all packages
pnpm build

# Run a specific app
pnpm --filter @salesagent/web dev
pnpm --filter @salesagent/worker dev

# Database
pnpm seed                          # Seed demo data (destructive — drops all data)
pnpm seed-prod <org-slug>          # Non-destructive: 3 scripts + 5 leads (idempotent by name)
pnpm seed-members <org-slug>       # RBAC test accounts (admin/operator/viewer @salesagent.test / test123456)
pnpm seed-demo                     # Client presentation demo (Acme Corp: 15 leads, 3 agents, 10 conversations)
pnpm seed-verify-alice             # Mark alice@example.com as email-verified
pnpm clean-org <org-slug>          # Delete all conversations + campaigns + leads in an org (FK-safe)
pnpm --filter @salesagent/db generate # Regenerate Prisma client
pnpm --filter @salesagent/db push     # Push schema to DB
pnpm --filter @salesagent/db prisma studio  # Open Prisma Studio

# Testing
pnpm --filter @salesagent/web test              # Unit tests (vitest, ~2s): auth, password, permissions, rate-limit, AI prompts, feature flags
pnpm --filter @salesagent/worker test            # Unit tests (vitest): response composition, intent detection, lead scoring
pnpm --filter @salesagent/web test:integration  # API integration tests (needs pnpm dev running)
pnpm --filter @salesagent/web test:e2e          # Playwright E2E (needs Chromium: npx playwright install chromium)

# Add dependencies
pnpm --filter @salesagent/web add <pkg>

# Deploy (no Git push — GFW blocked)
npx vercel --cwd apps/web          # Deploy web app to Vercel
npx vercel --prod --cwd apps/web   # Deploy to production
```

## Architecture

**SalesAgent AI** is a pnpm + Turborepo monorepo for an AI SDR / outbound sales operating system. AI agents that qualify leads, compose follow-ups, and book meetings — with multi-channel conversation inbox, campaign orchestration, and real-time monitoring.

### Monorepo layout

```
apps/
  web/         — Next.js 14 app (App Router, RSC, React 18), ~30 API routes
  worker/      — BullMQ Worker consuming queues from Upstash Redis (concurrency 5)
packages/
  db/          — Prisma 6 schema + client (PostgreSQL, `sales_agent` schema, 10 models)
  core/        — (empty)
  ui/          — (empty)
```

### Data model (10 models in `sales_agent` PostgreSQL schema)

- **User / Organization / Membership** — Multi-tenant with 4 roles (owner, admin, operator, viewer) + 10 permissions. User has `emailVerified`, `loginToken`, `loginTokenExpires` for verification flow.
- **Agent** — AI sales agent configuration per org: personality, tone, knowledge base, goals, isActive flag.
- **Lead** — CRM leads with stage tracking (new → contacted → qualified → proposal → negotiation → closed_won → closed_lost), AI score, source, assigned owner.
- **LeadActivity** — Immutable activity log per lead (note, stage_change, assignment, email_sent, email_received).
- **Conversation** — Thread between agent and lead: channel (email/chat), status (active/closed/archived), subject.
- **Message** — Individual message in a conversation: direction (inbound/outbound), content, channel, AI metadata (sentiment, intent).
- **Script** — Sales playbook: name, description, steps (JSON array of triggers/actions/templates).
- **Campaign** — Outbound campaign: linked to script + agent, target audience filters, schedule, stats (sent/opened/replied/converted).
- **CampaignRun** — Execution record per campaign: status lifecycle queued → running → completed/failed, per-lead delivery tracking.
- **AuditLog** — Immutable audit trail for org-level actions.

### Key patterns

- **Web**: Server Components for data fetching, client components for interactivity. TanStack Query for data hooks, zustand for inbox state, SSE for real-time conversation streaming.
- **Auth**: Custom JWT (jose) + httpOnly cookies. Login issues JWT directly. Registration requires email verification link click (one-time). `lib/session.ts` extracts session server-side.
- **Security**: JWT secret enforced (no fallback). Upstash Redis sliding-window rate limiting (100 req/min, falls back to in-memory). CSP/HSTS/X-Frame-Options security headers. Login PII hashed in logs (SHA256). Cookie `secure: true` always. Password min 8 chars. Org enumeration prevented via generic error messages.
- **Registration flow**: `alice@example.com` → owner + new org. All others → viewer in alice's existing org. Verification link must be clicked to complete registration.
- **API layer**: 30+ Route Handlers with session + RBAC permission checks. JSON logging on auth/AI routes with PII hashing.
- **Worker**: BullMQ Worker consuming `conversation-jobs`, `email-jobs`, `campaign-jobs`, `scoring-jobs` queues. AI response composition + lead qualification + campaign delivery. Uses `prefix: "sales-agent"` on all queue connections to prevent cross-project conflicts.
- **AI**: DeepSeek API client. 4 AI endpoints: compose-response, score-lead, summarize-conversation, generate-script. Feature flags via `lib/feature-flags.ts`.
- **Email**: Resend SDK. `apps/worker/src/email.ts` — template variable resolution (`{{lead.email}}`) + send. Worker composes AI responses and sends via Resend.
- **DB**: PrismaClient singleton cached on `globalThis`. `experimental.serverComponentsExternalPackages: ["@prisma/client"]` in next.config for Vercel.
- **Design system**: CSS custom properties in `globals.css` (RGB triplets for Tailwind opacity support). All colors registered in `tailwind.config.js` as `rgb(var(--x) / <alpha-value>)`. 11 UI components in `components/ui/` use design tokens exclusively — never hardcoded colors. Glass morphism via `.glass-card` utility class.
- **Identity Stack**: Operational Customer Identity Layer — every customer-facing entity shows: avatar (DiceBear `notionists` + gradient fallback), presence state (derived from `updatedAt` recency), AI ownership (agent name + confidence %), lead intent (score bar), activity timestamp. `IdentityCard` component (compact/expanded variants) used consistently across inbox, leads, and dashboard. Presence states: online/idle/away/offline/ai-processing/handoff-required/syncing. No new DB columns — presence is pure logic on existing timestamps; avatars use free DiceBear API seeded by email.

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
apps/web/app/page.tsx                — Public landing page (static, unauthenticated visitors)
apps/web/middleware.ts               — Rewrites / → /home for authenticated users
apps/web/app/(dashboard)/home/page.tsx — Dashboard home (Bento grid, pipeline chart, worker health)
apps/web/app/(dashboard)/inbox/      — Conversation inbox (unified view across channels)
apps/web/app/(dashboard)/agents/     — AI agent management (configure personality, knowledge base)
apps/web/app/(dashboard)/scripts/    — Sales script marketplace (browse + install playbooks)
apps/web/app/(dashboard)/campaigns/  — Outbound campaign list + create + analytics
apps/web/app/(dashboard)/campaigns/new/ — Campaign creation wizard (agent + script picker)
apps/web/app/(dashboard)/scripts/[id]/ — Script detail view (steps, linked campaigns)
apps/web/app/(dashboard)/scripts/new/ — AI script generation playground
apps/web/app/(dashboard)/agents/[id]/ — Agent detail with inline editing + conversations/campaigns
apps/web/app/(dashboard)/docs/       — API documentation page
apps/web/app/(dashboard)/settings/api-keys/ — API key management
apps/web/app/(dashboard)/onboarding-card.tsx — 3-step onboarding wizard
apps/web/lib/auth.ts                — JWT sign/verify (jose), Edge-compatible, no fallback secret
apps/web/lib/password.ts            — bcrypt hash/verify (10 rounds), Node.js only (not Edge)
apps/web/lib/session.ts             — Server-side session from JWT cookie
apps/web/lib/audit.ts               — Audit log write helper (used in all mutation endpoints)
apps/web/lib/permissions.ts         — 10 RBAC permissions + role matrix (PERMISSION_MAP exported for tests)
apps/web/lib/rate-limit.ts          — Upstash Redis sliding-window rate limiter (in-memory fallback)
apps/web/lib/ai.ts                  — DeepSeek API client (callDeepSeek, callDeepSeekJSON, extractBalancedJSON)
apps/web/lib/feature-flags.ts       — Env-based feature toggles (6 AI + tables + realtime)
apps/web/lib/logger.ts              — Structured JSON logging (PII-safe)
apps/web/lib/prompts.ts             — AI system prompts + builders (4 prompt pairs: compose, score, summarize, generate-script)
apps/web/middleware.ts              — JWT guard + Redis rate limiting (100 req/min per IP) + webhook bypass
apps/web/components/providers/theme-provider.tsx — Dark mode provider with flash prevention
apps/web/components/providers/theme-toggle.tsx   — Dark/light toggle button
apps/web/components/nav/mobile-nav.tsx           — Mobile hamburger menu with slide-out drawer
apps/web/components/leads/import-button.tsx      — CSV import dialog with file upload
apps/web/components/identity/avatar.tsx          — DiceBear notionists avatar + gradient fallback + presence dot
apps/web/components/identity/identity-card.tsx   — Operational Identity Cell (compact list + expanded header)
apps/web/components/identity/presence.tsx        — Presence dot with pulse animation for AI states
apps/web/lib/time.ts                            — relativeTime(), presenceFromDate(), presenceLabel()
apps/web/vitest.config.ts           — Unit test config (excludes integration/E2E files)
apps/web/vitest.integration.config.ts — Integration test config (sequential file execution)
apps/web/playwright.config.ts       — Playwright E2E config (Chromium, auto-starts dev server)
apps/web/lib/__tests__/             — Unit + integration test files
apps/web/e2e/                       — Playwright E2E specs
apps/worker/src/queue.ts            — Direct Redis connection + BullMQ Queues (prefix: "sales-agent")
apps/worker/src/email.ts            — Resend email sender + {{variable}} template resolver + open/click tracking
apps/worker/src/index.ts            — Worker: AI response composition, lead scoring, campaign delivery, retry, HTTP healthcheck
apps/worker/src/ai.ts               — DeepSeek client for worker (mirrors web, self-contained)
packages/db/prisma/schema.prisma    — 10 models + apiKeys JSON field on Organization
packages/db/index.ts                — PrismaClient singleton export
packages/db/seed-production.ts      — 3 sellable scripts + 5 demo leads (idempotent)
packages/db/seed-demo.ts            — Client demo: Acme Corp, 15 leads, 3 agents, 10 conversations
packages/db/seed-members.ts         — RBAC test accounts (admin/operator/viewer @salesagent.test)
packages/db/seed-verify-alice.ts    — Mark alice@example.com emailVerified=true
packages/db/clean-demo-org.ts       — FK-safe org cleanup before re-seed
```

### State of the project (2026-05-23)

- **Phase 1: Foundation**. Auth + RBAC + DB Schema + package rename (`@opsflow` → `@salesagent`).
- **Phase 2: CRM + Conversations**. Lead management, conversation inbox, AI-powered messaging.
- **Phase 3: Agent Configuration**. Agent personality, knowledge base, goal configuration per org.
- **Phase 4: AI Intelligence**. Response composition, lead scoring, conversation summarization, script generation.
- **Phase 5: Campaign Engine**. Outbound campaign creation, scheduling, delivery tracking, analytics.
- **Phase 6: Polish & Demo**. Landing page, dark mode, mobile nav, demo seed data, onboarding.
- **Phase 7: Testing & Security**. 53 unit + 105 integration + 4 E2E specs. CSP/HSTS/rate-limit/JWT revocation/Zod.
- **Phase 8: Security v2 & pgBouncer**. Injection audit (15 findings fixed). Prompt injection armor. `$transaction` → sequential ops.
- **Phase 9: UI/UX — AI Staff Console**. Green accent (#22C55E). Linear sidebar. Activity-feed-first dashboard. AI animations.
- **Phase 10: Operational Customer Identity Layer**. DiceBear avatars, presence system (online/idle/ai-processing/handoff-required), IdentityCard components, inbox redesign with Identity Cells, leads page card grid + list view, real activity feed from LeadActivity + AuditLog.
- **Bugfix (2026-05-23)**: Seed scripts P1001 — all 5 seed scripts now inject `connection_limit=1` into PrismaClient (previously they created `new PrismaClient()` without it, exhausting Supabase pooler under parallel writes). `seed-demo.ts` serialized 15 parallel lead creates → sequential loop.
- **Bugfix (2026-05-23)**: Inbox empty for new orgs — registration creates zero conversations/leads/agents. Use `pnpm seed-demo` (Acme Corp) or `pnpm seed-prod <slug>` to populate. Inbox page wrapper now uses correct height `calc(100vh-3.5rem)` with `-m-4 lg:-m-8` to offset main padding (was `calc(100vh-4rem)` causing page shift). `sendMessageSchema.conversationId` made optional (ID is in URL path, client doesn't send it — caused 400 on send).
- **~12,000 lines** across ~230 files. 36 API routes + SSE + webhook.
- Web app: ✅ Vercel (JWT + API key auth, Identity Stack UI, DiceBear avatars, presence dots, activity feed).
- Worker: ✅ Railway (4 BullMQ workers, `prefix: "sales-agent"`, AI compose, scoring, campaign delivery, healthcheck).
- Email: ✅ Resend verification + AI-composed sales emails with open/click tracking.
- Demo: `pnpm seed-demo` → Acme Corp.
- UX: Identity Stack (avatar + presence + AI ownership + activity), card grid/refined list toggle, Inbox Identity Cells, real activity feed.
- Security: Prompt injection armor, auto-send removed, prototype pollution blocked, CSV injection sanitized, checkPermission 403, Zod (16 schemas), CSP/HSTS, rate limiting, JWT revocation.
- Queue isolation: All BullMQ queues + Workers use `prefix: "sales-agent"`.
- Serverless DB: PrismaClient auto-appends `connection_limit=1` for Vercel + Supabase pooler compat.
- Known: Upstash Redis 500K free limit exhausts under heavy test load. API key Bearer auth pending (Edge runtime).

### Seed scripts reference

| Command | What it does | Safe to re-run? |
|---------|-------------|-----------------|
| `pnpm seed` | Full reset + demo data (destructive) | Drops all data |
| `pnpm seed-prod <slug>` | 3 scripts + 5 leads, idempotent by name/email | Yes |
| `pnpm seed-members <slug>` | Test accounts with all 4 roles | Yes (checks duplicates) |
| `pnpm seed-verify-alice` | Sets emailVerified=true for alice@example.com | Yes |
| `pnpm clean-org <slug>` | FK-safe delete of all conversations + campaigns + leads in org | Destructive |

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
| `RESEND_API_KEY` | Worker | Resend email delivery |
| `EMAIL_FROM` | Worker | Sender address for AI-composed emails |
