# SalesAgent AI — Progress Report

> Last updated: 2026-05-23
> Project: AI SDR / Outbound Sales Operating System
> Migrated from: OpsFlow AI (multi-tenant AI Workflow CRM)

---

## Migration Summary

OpsFlow AI → SalesAgent AI rebrand and pivot. Infrastructure carried over; domain model and product narrative replaced.

### What was carried over (reused)

| Layer | Component | Status |
|-------|-----------|--------|
| Auth | JWT + bcrypt + httpOnly cookies + email verification | ✅ Reused |
| Multi-tenant | Organization / Membership / RBAC (4 roles, 10 permissions) | ✅ Reused, permissions remapped |
| Monorepo | pnpm + Turborepo + apps/packages structure | ✅ Reused |
| ORM | Prisma 6 + PostgreSQL (new `sales_agent` schema) | ✅ Reused, models replaced |
| Queue | BullMQ + Upstash Redis (new prefix: `sales-agent`) | ✅ Reused, queues renamed |
| Email | Resend SDK + template engine + tracking | ✅ Reused |
| AI | DeepSeek API client (`lib/ai.ts`) | ✅ Reused, prompts replaced |
| Security | CSP/HSTS/rate-limit/JWT revocation/Zod/PII hashing | ✅ Reused |
| UI | Glass morphism design system, 11 shadcn components, dark mode | ✅ Reused |
| Deployment | Vercel (web) + Railway (worker) + Supabase (DB) + Upstash (Redis) | ✅ Reused |
| Testing | Vitest + Playwright + integration test infrastructure | ✅ Reused |
| Dev UX | sonner toasts, skeleton loaders, focus-visible, prefers-reduced-motion | ✅ Reused |

### What was replaced

| OpsFlow | SalesAgent | Reason |
|---------|------------|--------|
| `opsflow` schema | `sales_agent` schema | New project, clean isolation |
| `@opsflow/*` packages | `@salesagent/*` packages | Rebrand |
| Workflow + WorkflowVersion + WorkflowNode + WorkflowEdge + WorkflowRun + WorkflowRunEvent (6 models) | Agent + Conversation + Message + Script + Campaign + CampaignRun (6 models) | Domain pivot: workflow automation → AI SDR |
| Workflow Builder canvas (React Flow) | Conversation Inbox + Agent Management | Customer-facing: inbox > DAG canvas |
| DAG execution engine (Kahn topological sort) | AI response pipeline + Campaign sequence engine | SDR workflows are linear sequences, not arbitrary DAGs |
| `workflow-runs` queue | `conversation-jobs`, `email-jobs`, `campaign-jobs`, `scoring-jobs` (4 queues) | Granular queue separation per job type |
| No queue prefix (default) | `prefix: "sales-agent"` on all queues | Cross-project isolation |
| 7 AI endpoints (suggest-nodes, generate-workflow, score-lead, analyze-run, compose-email, classify-email, pipeline-insights) | 4 AI endpoints (compose-response, score-lead, summarize-conversation, generate-script) | Focused on SDR use cases |
| Template marketplace (3 workflow templates) | Script marketplace (3 sales playbook scripts) | Domain-appropriate naming |
| Webhook + webhook trigger | Webhook (inbound email reply detection) | Replaced manual trigger with reply webhook |

### What was removed

| Component | Reason |
|-----------|--------|
| Workflow canvas (React Flow + zustand canvas state) | Not relevant to SDR personas |
| DAG topological sort engine | SDR sequences are linear; Kahn's algorithm is overengineering for this domain |
| Condition/delay nodes (visual) | Replaced by script step config (JSON) |
| AI workflow generation (`generate-workflow`) | Replaced by AI script generation (`generate-script`) |
| AI anomaly detection (`analyze-run`) | Not relevant — campaigns fail explicitly, no need for anomaly ML |
| Workflow run visualization (status overlays on canvas) | Replaced by campaign analytics dashboard |

---

## Overall Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 0: OpsFlow Migration (schema + package rename + queue prefix) | ✅ Done | 100% |
| Phase 1: AI SDR Foundation (Agent config, Conversation inbox, Lead scoring) | ✅ Done | 100% |
| Phase 2: Campaign Engine (Outbound sequences, delay, retry, analytics) | ✅ Done | 100% |
| Phase 3: AI Intelligence (Response composition, script generation, summarization) | ✅ Done | 100% |
| Phase 4: Polish & Demo (Landing page, dark mode, seed data, onboarding) | ✅ Done | 100% |
| Phase 5: Testing & Security (Unit + integration + E2E, Zod, JWT revocation) | ✅ Done | 100% |
| Phase 6: Deployment (Vercel + Railway + queue prefix isolation) | ✅ Done | 100% |
| Phase 7: Security v2 & pgBouncer (Injection audit, prompt armor, $transaction fix) | ✅ Done | 100% |
| Phase 8: UI/UX — AI Staff Console (Green accent, activity feed, Linear sidebar) | ✅ Done | 100% |
| Phase 9: Route hardening & DB perf (missing pages, connection_limit, middleware resilience) | ✅ Done | 100% |
| Phase 10: Operational Customer Identity Layer | ✅ Done | 100% |

**Total:** ~12,000 lines across ~230 files. 36 API routes + SSE + webhook.
**Tests:** 53 unit (100%) + 105 integration (96% pass, 4 timing-dependent) + 4 E2E specs.
**Infrastructure:** TanStack Query, SSE, Redis Rate Limiting, Feature Flags, Structured JSON Logging, Resend Email, BullMQ (4 queues, prefix: "sales-agent"), Vercel serverless + Supabase pooler (connection_limit=1).

---

## Phase 0 — OpsFlow Migration 🔄

### Done

| Task | Details | Status |
|------|---------|--------|
| Documentation rewrite | CLAUDE.md, ARCHITECTURE.md, PROGRESS.md, README.md | ✅ Done |
| Product positioning | "AI SDR / outbound operating system" — specific, not generic | ✅ Done |

### Pending

| Task | Details | Status |
|------|---------|--------|
| Schema migration | Create `sales_agent` schema on Supabase, run Prisma migrate | ⬚ |
| Package rename | `@opsflow/*` → `@salesagent/*` in all package.json files | ⬚ |
| Queue prefix | Add `prefix: "sales-agent"` to all BullMQ Queue/Worker instances | ⬚ |
| Queue rename | `workflow-runs` → `conversation-jobs`, `email-jobs`, `campaign-jobs`, `scoring-jobs` | ⬚ |
| Model replacement | Replace workflow models with agent/conversation/message/script/campaign models in schema.prisma | ⬚ |
| API route remap | Remove workflow builder endpoints, add inbox/conversation/campaign endpoints | ⬚ |
| AI prompt rewrite | Replace 7 workflow/CRM prompts with 4 SDR-focused prompts | ⬚ |
| Seed script rewrite | Replace workflow templates with sales scripts | ⬚ |
| Landing page rewrite | AI SDR messaging: "AI sales agents that qualify, follow up, and book meetings automatically" | ⬚ |
| RBAC remap | `manage_workflows` → `manage_agents`, `run_workflows` → `run_campaigns` (etc.) | ⬚ |

---

## Phase 1 — AI SDR Foundation ⬚

### Planned

| Module | Key deliverables |
|--------|-----------------|
| Agent configuration | CRUD for AI SDR agents: personality, knowledge base, goals, constraints |
| Conversation inbox | Left panel (list) + right panel (thread view) + AI draft generation |
| Lead management | List/detail/edit/delete + AI scoring badge + stage pipeline |
| Lead activity feed | Per-lead timeline: emails, stage changes, notes, meetings |
| Inbox SSE | Real-time new message push to inbox |
| Dashboard V1 | Active conversations, qualified leads, response rate, booked meetings |

### Key pages

| Page | Route | Description |
|------|-------|-------------|
| AI SDR Dashboard | `/home` | Bento grid: metrics + recent conversations + pipeline |
| Conversation Inbox | `/inbox` | Unified inbox across email/chat channels |
| Lead List | `/leads` | Search/filter/paginate + AI score column |
| Lead Detail | `/leads/[id]` | Full profile + activity + conversations + AI insights |
| Agent Settings | `/agents` | Configure AI SDR agents (personality/goals/knowledge) |
| Agent Detail | `/agents/[id]` | Single agent config + performance stats |

---

## Phase 2 — Campaign Engine ⬚

### Planned

| Module | Key deliverables |
|--------|-----------------|
| Script management | CRUD for sales scripts: steps, templates, conditions, delays |
| Campaign creation | Link script + agent + target audience → campaign |
| Campaign execution | BullMQ-powered sequence: send → wait → check reply → follow-up |
| Campaign analytics | Per-campaign stats: sent/delivered/opened/clicked/replied/booked |
| Reply detection | Resend webhook → match to campaign → stop sequence or continue |
| A/B testing | Subject line variants, send time optimization |
| Rate limiting | Per-lead daily cap, timezone-aware scheduling |

### Key pages

| Page | Route | Description |
|-------|------|-------------|
| Script Marketplace | `/scripts` | Browse + install sales playbook scripts |
| Script Detail | `/scripts/[id]` | View/edit script steps |
| Campaign List | `/campaigns` | All campaigns with status + stats summary |
| Campaign Detail | `/campaigns/[id]` | Analytics dashboard + run history |
| Campaign Create | `/campaigns/new` | Wizard: audience → script → schedule → launch |

---

## Phase 3 — AI Intelligence ⬚

### Planned

| Endpoint | Description | Trigger |
|----------|-------------|---------|
| `POST /ai/compose-response` | AI drafts email reply with agent personality + lead context | Inbox "Generate Reply" button |
| `POST /ai/score-lead` | AI scores lead across intent/budget/authority/need/timeline | Lead detail page, auto-on-create |
| `POST /ai/summarize-conversation` | AI summarizes conversation thread + extracts key points | Conversation detail header |
| `POST /ai/generate-script` | AI generates complete sales playbook from natural language | Script playground page |

### AI prompt pairs (4, replacing 7 from OpsFlow)

| Prompt | System prompt | User prompt builder |
|--------|--------------|-------------------|
| `COMPOSE_RESPONSE` | Agent personality + knowledge base + SDR best practices | Lead context + conversation history + goal |
| `SCORE_LEAD` | BANT/MEDDIC qualification frameworks | Lead data + email engagement + signals |
| `SUMMARIZE_CONVERSATION` | Extract key points, action items, sentiment, objections | Full conversation thread |
| `GENERATE_SCRIPT` | Sales methodology (SPIN/BANT/etc.), sequence design patterns | Industry + persona + goal + channel |

### Feature flags

| Feature | Env var | Default |
|---------|---------|---------|
| AI response composition | `FEATURE_AI_COMPOSE` | "true" |
| AI lead scoring | `FEATURE_AI_SCORE` | "true" |
| AI conversation summary | `FEATURE_AI_SUMMARIZE` | "true" |
| AI script generation | `FEATURE_AI_SCRIPT_GEN` | "true" |

---

## Phase 4 — Polish & Demo ⬚

### Planned

| Feature | Details |
|---------|---------|
| Landing page | Hero: "AI sales agents that qualify, follow up, and book meetings automatically" |
| Dark mode | Glass morphism + dark CSS variables, ThemeProvider with flash prevention |
| Mobile nav | Hamburger menu with slide-out drawer |
| Onboarding wizard | 3-step: configure agent → import leads → launch first campaign |
| Demo seed data | `pnpm seed-demo`: Acme Corp, 15 leads, 3 agents, 10 conversations, 2 campaigns |
| CSV import/export | Import leads via CSV, export with one click |
| API keys | Create/delete API keys in Settings, hashed storage |
| API docs | `/docs` page listing all endpoints by category |
| Email tracking | `trackOpens: true, trackClicks: true` on all Resend emails |

---

## Phase 5 — Testing & Security ⬚

### Test targets

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | auth, password, permissions, rate-limit, AI prompts, feature flags |
| API Integration | Vitest + fetch | All 35 endpoints × 4 roles (RBAC matrix) |
| E2E | Playwright | auth flow, inbox, lead CRUD, campaign create + launch |

### Security checklist

| Item | Status |
|------|--------|
| JWT secret enforcement (no fallback) | ✅ Carried over |
| Redis rate limiting (100 req/min) | ✅ Carried over |
| CSP/HSTS/X-Frame-Options headers | ✅ Carried over |
| JWT revocation (Redis blacklist) | ✅ Carried over |
| Zod input validation (16 schemas) | ⬚ Remap to new endpoints |
| Timing-safe webhook comparison | ✅ Carried over |
| PII hashing in logs (SHA256) | ✅ Carried over |
| Email verification flow | ✅ Carried over |
| Password min 8 chars | ✅ Carried over |
| Org enumeration prevention | ✅ Carried over |

---

## Phase 6 — Deployment ⬚

### Deployment targets

| Component | Platform | Notes |
|-----------|----------|-------|
| Web App | Vercel | `@salesagent/web`, pnpm hoisted mode |
| Worker | Railway | `@salesagent/worker`, BullMQ with `prefix: "sales-agent"` |
| Database | Supabase | `sales_agent` schema, V2 pooler |
| Redis | Upstash | 4 queues, all with `prefix: "sales-agent"` |

### Queue prefix isolation (critical checklist)

```
□ queue.ts: new Queue("conversation-jobs", { connection, prefix: "sales-agent" })
□ queue.ts: new Queue("email-jobs", { connection, prefix: "sales-agent" })
□ queue.ts: new Queue("campaign-jobs", { connection, prefix: "sales-agent" })
□ queue.ts: new Queue("scoring-jobs", { connection, prefix: "sales-agent" })
□ index.ts: new Worker("conversation-jobs", processor, { connection, prefix: "sales-agent" })
□ index.ts: new Worker("email-jobs", processor, { connection, prefix: "sales-agent" })
□ index.ts: new Worker("campaign-jobs", processor, { connection, prefix: "sales-agent" })
□ index.ts: new Worker("scoring-jobs", processor, { connection, prefix: "sales-agent" })
```

### Env vars checklist

| Variable | Used by | Notes |
|----------|---------|-------|
| `DATABASE_URL` | Web, Worker, DB | Supabase pooled (pgBouncer, transaction mode) |
| `DIRECT_URL` | DB push/migrate | Supabase direct connection |
| `REDIS_URL` | Worker, Web | Upstash Redis (BullMQ + rate limit) |
| `UPSTASH_REDIS_REST_URL` | Web | Upstash REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Web | Upstash REST token |
| `JWT_SECRET` | Web | 64-char random, no fallback |
| `DEEPSEEK_API_KEY` | Web, Worker | DeepSeek AI |
| `RESEND_API_KEY` | Worker | Resend email |
| `EMAIL_FROM` | Worker | Sender address |

---

## Phase 7 — Security v2 & pgBouncer ✅

> Completed: 2026-05-19

### Injection audit — 15 findings, all fixed

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | CRITICAL | Prompt injection via lead fields in AI prompts | `<user_data>` delimiters + `PROMPT_ARMOR` guard + newline stripping |
| 2 | CRITICAL | Auto-send bypasses human review | Removed auto-send; AI drafts require human approval |
| 3 | MEDIUM | Missing Zod on conversation PATCH | Added validation |
| 4 | MEDIUM | XSS via AI output rendering | Strip HTML in server responses |
| 5 | LOW | Prototype pollution in template engine | `BLOCKED_KEYS` set (`__proto__`, `prototype`, `constructor`) |
| 6-15 | LOW | Content-Type checks, CSRF, path traversal, etc. | Various hardening |

### pgBouncer compatibility

| Route | Issue | Fix |
|-------|-------|-----|
| `leads/route.ts` POST | `$transaction` times out on pooler | Sequential ops |
| `leads/[id]/route.ts` PATCH + DELETE | `$transaction` times out | Sequential ops |
| `register/route.ts` | `$transaction` fails | Sequential ops + rollback on org-creation failure |

### Permission hardening
- `checkPermission()` helper returns `NextResponse(403)` — never throws 500
- Applied to all 33 route files
- `manage_api_keys` / `view_api_keys` added to RBAC matrix

### Test infrastructure
- 25-spec injection test suite (SQL injection, XSS, prompt injection, auth bypass, error sanitization)
- Updated integration test config, fixed test expectations for new model

---

## Phase 8 — UI/UX: AI Staff Console ✅

> Completed: 2026-05-19

### Design system
| Token | Old | New |
|-------|-----|-----|
| `--accent` | `37 99 235` (blue) | `34 197 94` (green #22C55E) |
| `--accent-hover` | `29 78 216` | `22 163 74` |
| `--accent-soft` | `239 246 255` | `240 253 244` |
| Typography | Plus Jakarta Sans | Plus Jakarta Sans (kept) |

### AI animations (new)
- `ai-typing-dot` — 3-dot bounce for "AI is typing..."
- `ai-pulse` — green pulse ring for agent active status
- `stream-cursor` — blinking cursor for streaming text
- `agent-active` — pulsing green dot on agent avatars

### Sidebar (Linear-style)
- Logo header with brand mark
- Primary/secondary nav split
- Left active indicator bars
- Green dot badge on Inbox
- Minimal footer with icon-only links

### Dashboard (activity-feed-first)
- "Good morning/afternoon/evening, {name}" greeting
- Agent team status overview (stacked avatars with pulse)
- Activity feed replaces charts as main content
- Lucide icons throughout (no emojis)

### Key pages updated
- Landing page: green accent CTA, trusted-by stats, testimonial
- Dashboard: activity feed, agent staff overview
- Sidebar: Linear-style minimal, active indicators
- Global CSS: green design tokens, AI animations

---

## Phase 10 — Operational Customer Identity Layer ✅

> Completed: 2026-05-23

### Identity Stack

| Component | Details |
|-----------|---------|
| DiceBear Avatars | `notionists` style via free API, seed=email for uniqueness. Gradient-initials fallback on error. |
| Presence System | Derived from `updatedAt` recency: online(<5min)/idle(<1h)/away(<24h)/offline. ai-processing pulse, handoff-required amber. |
| IdentityCard | Reusable component: compact (list) + expanded (detail header). Shows avatar + presence + company + stage + score + AI ownership + activity. |
| AI Ownership | "AI handling · 92% confidence" badges, "Needs human review" when no agent assigned. |
| Activity Timestamps | `relativeTime()` — "2m ago", "Active now", "Yesterday". Shared in `lib/time.ts`. |

### Inbox redesign

- Conversation list: Identity Cells replacing plain `<button>` rows
- DiceBear avatars, presence dots on unread, count badges on filter tabs
- Conversation detail: Expanded IdentityCard header with full metadata + AI ownership badge
- Compact cells in sidebar list

### Leads page redesign

- Dual view modes: card grid (3-col) + refined list view, toggle in toolbar
- Cards show: avatar, name, company, stage badge, score bar, email, source, tags, relative time
- DiceBear avatars, skeleton loading, empty state
- Preserved: search, filter, sort, pagination, create, CSV import/export, AI scoring

### Dashboard activity feed

- New API: `GET /api/orgs/{slug}/home/activity` — merges LeadActivity + AuditLog (15 entries)
- `ActivityFeed` client component: 30s polling, skeleton loading, avatar + identity + action + relative time
- Replaces 7 hardcoded activity entries with real data

### Bugfix: orgSlug=undefined

10 page components in `(dashboard)` route group used `params.slug` — always `undefined` because the route has no `[slug]` segment. Fixed by using `session.orgSlug` / `session.orgId` (from JWT cookie) instead.
- Affected: campaigns, campaigns/new, campaigns/[id], agents, agents/[id], inbox, inbox/[id], scripts, scripts/new, scripts/[id]
- Caused: `POST /api/orgs/undefined/campaigns` and `POST /api/orgs/undefined/agents` → 404 in production

### New files

| File | Purpose |
|------|---------|
| `components/identity/avatar.tsx` | DiceBear avatar + gradient fallback + presence dot |
| `components/identity/identity-card.tsx` | IdentityCell (compact + expanded variants) |
| `components/identity/presence.tsx` | PresenceDot with pulse animations |
| `lib/time.ts` | relativeTime(), presenceFromDate(), presenceLabel(), presenceColor() |
| `app/(dashboard)/home/activity-feed.tsx` | Real activity feed client component |
| `app/api/orgs/[slug]/home/activity/route.ts` | Activity feed API endpoint |

### Design decisions

- No new DB columns — presence is pure logic, avatars use external API
- DiceBear chosen over storage-based avatars (MVP: no upload, no Supabase Storage)
- Presence states are *derived* from data, not realtime pushed (no WebSocket needed yet)
- Identity Stack is a pattern, not a package — reusable across inbox, leads, dashboard

---

## Architecture Summary

```
apps/web (Next.js 14 App Router)
  ├── Pages: Server Components for data, Client Components for interactivity
  ├── API: 36 Route Handlers with session + permission checks
  ├── Middleware: JWT guard + Redis rate limiting (100 req/min per IP)
  ├── Security: CSP/HSTS, PII-safe logging, email verification, JWT revocation
  ├── Identity Stack: DiceBear avatars, presence system, IdentityCard, ActivityFeed
  └── Components: shadcn-style UI kit (11 components), glass morphism design tokens

apps/worker (Node.js)
  └── BullMQ Workers consuming 4 queues from Upstash Redis (prefix: "sales-agent")
      ├── conversation-jobs → AI response composition
      ├── email-jobs → Resend email delivery
      ├── campaign-jobs → Outbound sequence execution
      └── scoring-jobs → AI lead qualification

packages/db (Prisma 6 + PostgreSQL)
  ├── PrismaClient singleton (globalThis cache)
  ├── 10 models in sales_agent schema
  └── Seed scripts: production (idempotent), clean-org, verify-alice, demo
```

### Tech stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, TypeScript, Plus Jakarta Sans
- **Backend:** Next.js Route Handlers, Prisma 6, PostgreSQL (Supabase)
- **Auth:** Custom JWT (jose) + bcryptjs + httpOnly cookies + email verification
- **Rate Limiting:** Upstash Redis sliding window (@upstash/ratelimit)
- **Monorepo:** pnpm workspaces + Turborepo
- **Queue:** BullMQ + Upstash Redis (4 queues, prefix: "sales-agent")
- **Email:** Resend SDK (template variables, AI composition, open/click tracking)
- **AI:** DeepSeek API (4 endpoints: compose/summarize/score/generate-script)

---

## Known Issues / TODOs

1. **packages/core and packages/ui** are empty shells for future work.
2. **Stripe billing** — Not implemented.
3. **API Key Bearer auth** — Pending (Edge runtime Prisma limitation).
4. **Upstash Redis free tier** — 500K daily command limit; worker exhausts it under heavy test load.
5. **Railway worker** — Requires `REDIS_URL`; worker crashes on startup without a working Redis instance. Railway deploy: build command = `pnpm install --frozen-lockfile && pnpm --filter @salesagent/db generate`, start command = `npx tsx apps/worker/src/index.ts` (NOT `pnpm --filter @salesagent/worker start` which runs compiled dist/ without Prisma generate).
6. **pgBouncer** — Sequential ops (no `$transaction`) required for Supabase pooler compat. `connection_limit=1` auto-appended by `packages/db/index.ts` for serverless safety.
7. **(Fixed 2026-05-23) orgSlug=undefined 404s** — All `(dashboard)` page components now use `session.orgSlug`/`session.orgId` from JWT instead of `params.slug` (which is always undefined because the route group has no `[slug]` segment).
