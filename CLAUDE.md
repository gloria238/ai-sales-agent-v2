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
pnpm --filter @opsflow/web dev
pnpm --filter @opsflow/worker dev

# Database
pnpm seed                          # Seed demo data (destructive — drops all data)
pnpm seed-prod <org-slug>          # Non-destructive: 3 templates + 5 leads (idempotent by name)
pnpm seed-members <org-slug>       # RBAC test accounts (admin/operator/viewer @opsflow.test / test123456)
pnpm seed-demo                     # Client presentation demo (Acme Corp: 15 leads, 3 WFs, 10 runs)
pnpm seed-verify-alice             # Mark alice@example.com as email-verified
pnpm clean-org <org-slug>          # Delete all workflows + leads in an org (FK-safe)
pnpm --filter @opsflow/db generate # Regenerate Prisma client
pnpm --filter @opsflow/db push     # Push schema to DB
pnpm --filter @opsflow/db prisma studio  # Open Prisma Studio

# Testing
pnpm --filter @opsflow/web test              # 67 unit tests (vitest, ~2s): auth, password, permissions, rate-limit, AI prompts, feature flags
pnpm --filter @opsflow/worker test            # 18 unit tests (vitest): topologicalSort, evaluateCondition, unitToMs
pnpm --filter @opsflow/web test:integration  # 105 API integration tests (needs pnpm dev running): auth, workflows, leads, members, org-settings, audit-log, templates, export/import, api-keys
pnpm --filter @opsflow/web test:e2e          # Playwright E2E (needs Chromium: npx playwright install chromium)

# Total: 85 unit tests + 105 integration tests + 4 E2E specs

# Add dependencies
pnpm --filter @opsflow/web add <pkg>

# Deploy (no Git push — GFW blocked)
npx vercel --cwd apps/web          # Deploy web app to Vercel
npx vercel --prod --cwd apps/web   # Deploy to production
```

## Architecture

**OpsFlow AI** is a pnpm + Turborepo monorepo for an AI-powered workflow automation platform with lead management and CRM features.

### Monorepo layout

```
apps/
  web/         — Next.js 14 app (App Router, RSC, React 18), ~30 API routes
  worker/      — BullMQ Worker consuming queue from Upstash Redis (concurrency 5)
packages/
  db/          — Prisma 6 schema + client (PostgreSQL, `opsflow` schema, 10 models)
  core/        — (empty)
  ui/          — (empty)
```

### Data model (10 models in `opsflow` PostgreSQL schema)

- **User / Organization / Membership** — Multi-tenant with 4 roles (owner, admin, operator, viewer) + 10 permissions. User has `emailVerified`, `loginToken`, `loginTokenExpires` for verification flow.
- **Workflow** — Versioned (WorkflowVersion), directed graph of WorkflowNode + WorkflowEdge
- **WorkflowNode** — Typed: trigger, action, condition, delay — with JSON config + canvas position
- **WorkflowRun** — Status lifecycle: queued → running → completed/failed/dead_letter
- **WorkflowRunEvent** — Per-node execution events within a run
- **Lead / LeadActivity** — CRM leads with stage tracking, activity log
- **AuditLog** — Immutable audit trail for org-level actions

### Key patterns

- **Web**: Server Components for data fetching, client components for interactivity. TanStack Query for data hooks, zustand for canvas state, SSE for real-time run streaming.
- **Auth**: Custom JWT (jose) + httpOnly cookies. Login issues JWT directly. Registration requires email verification link click (one-time). `lib/session.ts` extracts session server-side.
- **Security**: JWT secret enforced (no fallback). Upstash Redis sliding-window rate limiting (100 req/min, falls back to in-memory). CSP/HSTS/X-Frame-Options security headers. Login PII hashed in logs (SHA256). Cookie `secure: true` always. Password min 8 chars. Org enumeration prevented via generic error messages.
- **Registration flow**: `alice@example.com` → owner + new org. All others → viewer in alice's existing org. Verification link must be clicked to complete registration.
- **API layer**: 30+ Route Handlers with session + RBAC permission checks. JSON logging on auth/AI routes with PII hashing.
- **Worker**: BullMQ Worker consuming `workflow-runs` queue. DAG execution via Kahn's topological sort. Condition branching, delay nodes (BullMQ delay), retry with backoff.
- **AI**: DeepSeek API client. 4 AI endpoints: suggest-nodes, generate-workflow, score-lead, analyze-run. Feature flags via `lib/feature-flags.ts`.
- **Email**: Resend SDK. `apps/worker/src/email.ts` — template variable resolution (`{{lead.email}}`) + send. Worker `executeNode` calls real email when action is `send_email`.
- **DB**: PrismaClient singleton cached on `globalThis`. `experimental.serverComponentsExternalPackages: ["@prisma/client"]` in next.config for Vercel.
- **Design system**: CSS custom properties in `globals.css` (RGB triplets for Tailwind opacity support). All colors registered in `tailwind.config.js` as `rgb(var(--x) / <alpha-value>)`. 11 UI components in `components/ui/` use design tokens exclusively — never hardcoded colors. Glass morphism via `.glass-card` utility class.

### RBAC permissions (10 permissions)

| Permission | owner | admin | operator | viewer |
|---|---|---|---|---|
| manage_org | yes | - | - | - |
| manage_members | yes | yes | - | - |
| manage_workflows | yes | yes | yes | - |
| manage_leads | yes | yes | yes | - |
| delete_workflows | yes | yes | - | - |
| delete_leads | yes | yes | - | - |
| view_workflows | yes | yes | yes | yes |
| view_leads | yes | yes | yes | yes |
| view_members | yes | yes | yes | yes |
| view_audit_log | yes | yes | yes | yes |
| run_workflows | yes | yes | yes | - |

### Key files

```
apps/web/app/page.tsx                — Public landing page (static, unauthenticated visitors)
apps/web/middleware.ts               — Rewrites / → /home for authenticated users
apps/web/app/(dashboard)/home/page.tsx — Dashboard home (Bento grid, pipeline chart, worker health)
apps/web/app/(dashboard)/templates/  — Workflow template marketplace (browse + install)
apps/web/app/(dashboard)/docs/       — API documentation page (38 endpoints)
apps/web/app/(dashboard)/settings/api-keys/ — API key management
apps/web/app/(dashboard)/onboarding-card.tsx — 3-step onboarding wizard
apps/web/lib/auth.ts                — JWT sign/verify (jose), Edge-compatible, no fallback secret
apps/web/lib/password.ts            — bcrypt hash/verify (10 rounds), Node.js only (not Edge)
apps/web/lib/session.ts             — Server-side session from JWT cookie
apps/web/lib/audit.ts               — Audit log write helper (used in all mutation endpoints)
apps/web/lib/permissions.ts         — 10 RBAC permissions + role matrix (PERMISSION_MAP exported for tests)
apps/web/lib/rate-limit.ts          — Upstash Redis sliding-window rate limiter (in-memory fallback)
apps/web/lib/ai.ts                  — DeepSeek API client (callDeepSeek, callDeepSeekJSON, extractBalancedJSON)
apps/web/lib/feature-flags.ts       — Env-based feature toggles (8 flags: 6 AI + tables + realtime)
apps/web/lib/logger.ts              — Structured JSON logging (PII-safe)
apps/web/lib/prompts.ts             — AI system prompts + builders (6 prompt pairs: suggest, generate, score, analyze, compose, classify)
apps/web/middleware.ts              — JWT guard + Redis rate limiting (100 req/min per IP) + webhook bypass
apps/web/components/providers/theme-provider.tsx — Dark mode provider with flash prevention
apps/web/components/providers/theme-toggle.tsx   — Dark/light toggle button
apps/web/components/nav/mobile-nav.tsx           — Mobile hamburger menu with slide-out drawer
apps/web/components/leads/import-button.tsx      — CSV import dialog with file upload
apps/web/vitest.config.ts           — Unit test config (excludes integration/E2E files)
apps/web/vitest.integration.config.ts — Integration test config (sequential file execution)
apps/web/playwright.config.ts       — Playwright E2E config (Chromium, auto-starts dev server)
apps/web/lib/__tests__/             — 4 unit test files (32 tests) + helpers + 7 integration test files (82 tests)
apps/web/e2e/                       — 4 Playwright E2E specs
apps/worker/src/queue.ts            — Direct Redis connection + BullMQ Queue
apps/worker/src/email.ts            — Resend email sender + {{variable}} template resolver + open/click tracking
apps/worker/src/index.ts            — Worker: DAG execution, real actions (score_lead/update_lead/create_lead/compose_email), retry, condition eval, delay, HTTP healthcheck
apps/worker/src/ai.ts               — DeepSeek client for worker (mirrors web, self-contained)
packages/db/prisma/schema.prisma    — 10 models + apiKeys JSON field on Organization
packages/db/index.ts                — PrismaClient singleton export
packages/db/seed-production.ts      — 3 sellable workflow templates (email→update_lead) + 5 demo leads
packages/db/seed-demo.ts            — Client demo: Acme Corp, 15 leads, 3 WFs, 10 runs, metrics
packages/db/seed-members.ts         — RBAC test accounts (admin/operator/viewer @opsflow.test)
packages/db/seed-verify-alice.ts    — Mark alice@example.com emailVerified=true
packages/db/clean-demo-org.ts       — FK-safe org cleanup before re-seed
```

### State of the project (2026-05-18)

- **Phase 7 complete: Security Hardening**. 10 vulnerabilities fixed.
- **Phase 8 complete: Testing (3 layers)**. 85 unit + 105 integration + 4 E2E specs.
- **Phase 9: Polish**. Dashboard metrics, pipeline chart, focus states, reduced-motion, Resend emails.
- **Phase 10: Productization & AI Enhancement**. AI prompts fixed, 5 worker actions (no stubs), 3 new AI endpoints, landing page, dark mode, CSV import/export, template marketplace, onboarding, API keys, API docs, mobile nav, email tracking.
- **Phase 11: Security v2**. Timing-safe webhook, Zod validation (16 schemas), JWT revocation (Redis blacklist), error sanitization.
- **Phase 12: Commercial UI/UX**. Plus Jakarta Sans font, Liquid Glass design system, glass-morphism sidebar/cards, Bento grid dashboard, premium login/register/landing, refined shadows/transitions/animations.
- **~9,500 lines** across ~195 files. 38 API routes + SSE + webhook trigger.
- Web app: ✅ Vercel (JWT + API key auth, email verification, glass UI, dashboard, workflows, leads, runs, settings, members, audit log, templates, docs, api-keys).
- Worker: ✅ Railway (BullMQ + Redis, DAG execution, real DeepSeek scoring/compose_email/update_lead/create_lead, Resend tracking, healthcheck).
- Email: ✅ Resend verification + AI-composed emails with open/click tracking. Template variables {{lead.name}}, {{lead.email}}.
- Templates: 3 workflow templates browsable in-app (`/templates`). One-click install.
- Demo: `pnpm seed-demo` → Acme Corp (15 leads, 3 WFs, 10 runs). Login: demo@acmecorp.com / demo123456.
- Landing: Public page at `/` with glass navbar, premium hero, features, CTAs.
- UX: Plus Jakarta Sans font, glass-morphism sidebar/cards, dark mode, mobile nav, breadcrumbs, Bento grid dashboard, onboarding wizard, skeleton loaders, smooth 200ms transitions, focus-visible rings, prefers-reduced-motion.
- Security: Timing-safe webhook comparison, Zod input validation, JWT revocation via Redis, error sanitization, SHA256 API key hashing, CSP/HSTS, rate limiting.
- Known: pgBouncer incompatible with interactive `$transaction`. API key Bearer auth pending (Edge runtime constraint).
- GitHub push via Desktop. `npx vercel --prod --cwd apps/web` for Vercel deploy.

### Seed scripts reference

| Command | What it does | Safe to re-run? |
|---------|-------------|-----------------|
| `pnpm seed` | Full reset + demo data (destructive) | Drops all data |
| `pnpm seed-prod <slug>` | 3 templates + 5 leads, idempotent by name/email | Yes |
| `pnpm seed-members <slug>` | Test accounts with all 4 roles | Yes (checks duplicates) |
| `pnpm seed-verify-alice` | Sets emailVerified=true for alice@example.com | Yes |
| `pnpm clean-org <slug>` | FK-safe delete of all workflows + leads in org | Destructive |

### Vercel deployment gotchas (lessons learned)

1. **Prisma engine binary**: Three changes needed: (a) Add `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to schema.prisma generator. (b) Set `experimental.serverComponentsExternalPackages: ["@prisma/client"]` in next.config.js (NOT top-level `serverExternalPackages` — Next.js 14.2 only supports it under `experimental`). (c) Add `.npmrc` with `node-linker=hoisted` — pnpm virtual store deep paths prevent Vercel's file tracer from finding `.so.node` files.
2. **Prisma generate before build**: `vercel.json` buildCommand = `pnpm --filter @opsflow/db generate && pnpm --filter @opsflow/web build`
3. **No dotenv**: Vercel provides env vars natively. Don't use dotenv in next.config.js.
4. **Workspace imports**: Dynamic `import()` for packages that need env vars not set on Vercel (worker/queue needs REDIS_URL)
5. **Edge vs Node**: Middleware runs Edge Runtime — don't import bcryptjs there. Split password functions into separate file.
6. **Postinstall**: Root `postinstall` runs `prisma generate`. The `@prisma/client` postinstall warning about "schema not found" is harmless.
7. **pnpm hoisted mode**: `.npmrc` with `node-linker=hoisted` is required for Vercel. It flattens node_modules so the Prisma engine binary at `node_modules/.prisma/client/` is traced properly. Without it, the engine is buried in `node_modules/.pnpm/@prisma+client@.../node_modules/.prisma/client/` and Vercel can't find it.
8. **Client components need org slug from server**: Don't extract org slug from `window.location.pathname` in client components — the root dashboard path `/` yields `undefined`. Always pass `orgSlug` as a prop from the server component which has it from the session/JWT. Otherwise the fallback "demo-org" won't match production orgs (which are generated as `{email-prefix}-workspace` during registration).
9. **Re-issue JWT on slug change**: When updating the org slug via PATCH, the JWT cookie MUST be re-signed with the new `orgSlug`. Otherwise the session carries the old slug and every subsequent API call (members, workflows, leads, etc.) returns 404 because the membership lookup uses the stale slug.
10. **Toast notifications via sonner**: `Toaster` is in root layout. Use `toast.success()` / `toast.error()` from `sonner` for user feedback. Never use `alert()`. On navigation after success, keep button `loading=true` — `router.push()` will unmount the component, so no need to reset loading state.
11. **Prisma config conflict**: If `prisma.config.ts` exists, Prisma skips automatic `.env` loading. Delete this file unless you explicitly load env vars in it.
12. **.env location**: Prisma looks for `.env` relative to the schema file. Keep a `.env` in `packages/db/` with `DATABASE_URL` and `DIRECT_URL`.
13. **Supabase pooler V2**: New Supabase projects (2025+) use V2 pooler (`aws-1-{region}.pooler.supabase.com`), NOT V1 (`aws-0-...`). If you get `FATAL: Tenant or user not found`, check the pooler version in Supabase Dashboard → Connection string. The username format is `postgres.{project-ref}` for the pooler, `postgres` for direct connection. Always copy the full URI from Supabase Dashboard — don't compose it manually.

### Railway deployment (worker)

Worker is a standalone Node.js process (BullMQ consumer) that executes workflow runs from Upstash Redis queue. Without it, workflow runs stay in `queued` status forever.

**Config**: `railway.toml` at project root — `nixpacks` builder. Root `package.json` has `"start"` script for nixpacks auto-detection.

**Build command**: `pnpm install --frozen-lockfile && pnpm --filter @opsflow/db generate`  
**Start command**: `npx tsx apps/worker/src/index.ts` (from root)

**Env vars needed**: `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`

**GitHub-linked deployment**: Push to `main` triggers auto-deploy. Railway dashboard can override start command — must ensure it matches railway.toml.

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
| `EMAIL_FROM` | Worker | Sender address for workflow emails |
