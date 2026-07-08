# CLAUDE.md

> **SalesAgent AI** — 企业销售团队 AI 中枢操作系统 → 未来演进方向 **CompanyOS**（sales 作为首个业务板块，架构预留了客服/HR/运营等横向扩展能力）。
> 自研 RAG 检索管线（六阶段：查询改写→问题路由→混合检索→Reranker→置信度门控→语义缓存）、WebSocket 实时聊天、ReAct Agent 编排引擎、多租户 RBAC。TypeScript 全栈，~34,000 行，~470 文件，22 个 Phase 持续迭代。
>
> **2026-07-08 Phase 22**: Inbox 全面加固（安全性 / 诚实性 / 性能 / HITL 审计 / 可观测性）+ 企业 UI 扁平化重构 + GitHub Actions CI/CD。
>
> **核心理念**：AI 辅助而非替代。Human-in-the-Loop 贯穿全流程——AI 起草但不发送，人类做最终决策。
>
> **部署拓扑**：Vercel (Web, Serverless) + Railway (Worker, 长期容器) + Supabase (PostgreSQL+pgvector) + Upstash (Redis, REST+TCP 双协议)
>
> **技术栈**：Next.js 14 · React 18 · Prisma 6 · DeepSeek · Socket.IO · BullMQ · Cohere Rerank · Tailwind CSS · TypeScript strict

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
pnpm --filter @salesagent/web dev-socket  # Start Socket.IO chat server (port 3001, required for real-time chat)

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
node packages/db/setup-vector.mjs        # Enable pgvector + embedding + tsvector columns

# Seeds
pnpm seed                          # 全量重置 + Demo 数据（破坏性）
pnpm seed-prod <org-slug>          # 幂等种子：3 脚本 + 5 线索
pnpm seed-members <org-slug>       # RBAC 测试账号
pnpm seed-demo                     # Acme Corp Demo (15 线索, 3 Agent, 10 对话)
pnpm seed-chinese-demo             # 启云科技中文 Demo (5 成员, 3 AI, 15 客户, 4 KB)
pnpm seed-kb-full                  # 生成 12 份三层知识库文档 (核心层/销售参考层/运营支撑层)
pnpm seed-verify-alice             # 将 alice@example.com 标记为 email-verified
pnpm clean-org <org-slug>          # FK-safe 删除指定组织下所有对话+活动+线索

# Testing
pnpm --filter @salesagent/web test              # Unit tests (vitest, ~3s): 54 specs
pnpm --filter @salesagent/worker test            # Unit tests (vitest)
pnpm --filter @salesagent/web test:integration  # API integration tests
pnpm --filter @salesagent/web test:e2e          # Playwright E2E
pnpm --filter @salesagent/rag-core eval          # RAG evaluation (20-case golden dataset)
pnpm --filter @salesagent/rag-core eval:retrieval # RAG eval — retrieval metrics only (no LLM judge)


# Deploy
npx vercel --cwd apps/web          # Deploy web app to Vercel
npx vercel --prod --cwd apps/web   # Deploy to production
# Worker auto-deploys via Railway on git push to main
```

## Architecture

**SalesAgent AI** is a pnpm + Turborepo monorepo for an AI SDR / outbound sales operating system. AI agents that qualify leads, compose follow-ups, and book meetings — with multi-channel conversation inbox, campaign orchestration, and real-time monitoring.

### Monorepo layout (V1.9)

```
apps/
  web/         — Next.js 14 app (App Router, RSC, React 18), 40+ API routes
  worker/      — BullMQ Worker consuming queues from Upstash Redis (concurrency 5, idempotent)
  mobile/      — Expo 52 app (React Native) — 6-page Club Concierge demo showcase
packages/
  shared-types/ — API contract types extracted from apps/web/lib/
  domain/       — Business entities (LeadStage, CampaignStatus, etc.)
  ui-tokens/    — Corporate Green palette + Tailwind preset + JS tokens for RN
  ai-core/      — Unified DeepSeek client + prompt builders (versioned) + agent execution (ReAct) + metrics + translate
  rag-core/     — Full RAG pipeline (parse → chunk → embed → hybrid retrieve → rerank → cite) + eval + KB docs
  api-client/   — Type-safe fetch client (web + mobile share)
  db/           — Prisma 6 schema + client (PostgreSQL + pgvector + tsvector, 16 models)
```

### Data model (16 models in `sales_agent` PostgreSQL schema)

- **User / Organization / Membership** — Multi-tenant with 5 roles (owner/admin/operator/viewer/customer) + 13 permissions.
- **ApiKey** — Per-org API keys: SHA-256 hashed, prefix for display, lastUsedAt tracking.
- **Agent** — AI agent configuration per org: personality, tone, knowledge base, goals, isActive.
- **Lead** — CRM leads with stage tracking, AI score, source, assigned owner, dealAmount (real pipeline value), userId (Customer Portal link).
- **LeadActivity** — Immutable activity log per lead.
- **Conversation** — Thread between agent and lead: channel, status (active|awaiting_approval|approved|closed|archived), subject.
- **Message** — Individual message in a conversation: direction, content, AI metadata (agentSteps for ReAct reasoning chain).
- **Script** — Sales playbook: name, description, steps (JSON, supports type: "react" for ReAct Agent).
- **Campaign** — Outbound campaign: linked to script + agent, target audience, schedule, stats.
- **CampaignRun** — Execution record per campaign.
- **Document** — KB document: name, type, status, chunkCount, metadata.
- **DocumentChunk** — KB chunk: content, embedding (pgvector, Unsupported type), searchVector (tsvector, Unsupported type), metadata.
- **AICallMetric** (V1.8) — AI call telemetry: jobType, promptTokens, completionTokens, llmLatencyMs, success, fallbackUsed, requestId.
- **AuditLog** — Immutable audit trail for org-level actions.
- **FeatureFlag** — Per-org feature toggles: email_channel, wechat_channel, 4 AI flags, rollout% + rules targeting, DB-backed.

### Key patterns

- **Web**: Server Components for data fetching, client components for interactivity. Inbox state: 7 useState + cursor-based pagination + channel filtering. Message loading via `?cursor=&limit=50` with scrollHeight preservation on "load earlier". `channel` field filters Email vs Chat messages — both streams isolated in one Message table.
- **Auth**: Custom JWT (jose) + httpOnly cookies. Login issues JWT directly. Registration requires email verification link click (one-time). `lib/session.ts` extracts session server-side.
- **Security**: JWT secret enforced (no fallback). Upstash Redis sliding-window rate limiting (100 req/min API, 10/min auth, falls back to in-memory with TTL). Auth-specific rate limits on login/register/verify (defense-in-depth). Fail-closed options via env vars. IP validation via TRUSTED_PROXY_RANGES. Bcrypt 12 rounds with auto re-hash on login. CSP/HSTS/X-Frame-Options security headers. CSP `unsafe-eval` removed. Login PII hashed in logs (SHA256). Cookie `secure: true` always. Password min 8 chars. Org enumeration prevented via generic error messages. API routes return 401 JSON (not 302 redirect). File upload 10MB cap + magic byte validation.
- **Registration flow**: `alice@example.com` → owner + new org. All others → viewer in alice's existing org. Verification link must be clicked to complete registration.
- **API layer**: 40+ Route Handlers with session + RBAC permission checks. API versioning via `/api/v1/` prefix (Next.js rewrites, zero route duplication). JSON logging on auth/AI routes with PII hashing. Centralized error handler (`lib/api-error.ts`) with typed status mapping.
- **Worker**: BullMQ Worker consuming `conversation-jobs`, `email-jobs`, `campaign-jobs`, `scoring-jobs` queues. AI response composition + lead qualification + campaign delivery. Uses `prefix: "sales-agent"` on all queue connections to prevent cross-project conflicts.
- **AI**: DeepSeek API client. 6 AI capabilities: compose-response (with RAG KB grounding), score-lead, summarize-conversation, generate-script, translate, detect-language. ReAct Agent executor (`agent-executor.ts`) with tool-calling loop. AI draft API searches knowledge base before composing replies. Feature flags via DB-backed system.
- **Email**: Resend SDK. `apps/worker/src/email.ts` — template variable resolution (`{{lead.email}}`) + send. Worker composes AI responses and sends via Resend.
- **DB**: PrismaClient singleton cached on `globalThis`. `experimental.serverComponentsExternalPackages: ["@prisma/client"]` in next.config for Vercel.
- **Design system**: Enterprise flat aesthetic (Linear / Stripe / Ramp). CSS custom properties in `globals.css` (RGB triplets). All colors registered in `tailwind.config.js` as `rgb(var(--x) / <alpha-value>)`. No glass morphism, no backdrops, no gradients, no glow shadows. Cards: `rounded-md border border-[var(--border)]`. Buttons: `rounded-md transition-colors` (no `active:scale`, no `shadow`). Badges: `rounded px-1.5 py-0.5` (no `rounded-full`, no border gloss). Typography: Inter (Google Font). 14 error boundaries on all dashboard routes + root.
- **Error tracking**: @sentry/nextjs integration (graceful opt-in via SENTRY_DSN env var). Centralized `handleApiError()` with status code mapping + PII-safe logging. 14 `error.tsx` files (11 route-level + dashboard group + root app + global-error).
- **Feature flags**: DB-backed system (6 active flags). Channel flags: `email_channel` (default off for China) + `wechat_channel` (default on). 4 AI flags. Per-org toggles, rollout%, rules targeting. Memory cache (60s TTL), env-var fallback.
- **Channel abstraction**: Feature Flag controls email/wechat enablement per org. Worker checks flag before sending. Single codebase supports both overseas (email) and domestic (wechat) markets.
- **i18n**: Full Chinese UI — all dashboard pages, labels, error messages, stage/score badges translated. AI auto-detects customer language + matches response language. Translation API + inbox translation button for sales handoff.
- **Customer Portal**: Standalone `/portal` route (no dashboard sidebar). Customers log in via Lead.userId → JWT(role=customer) → only see their own conversations. Auth API supports dual-path login (Membership → dashboard / Lead.userId → portal).
- **Identity Stack**: Operational Customer Identity Layer — every customer-facing entity shows: avatar (pravatar.cc real human photos + gradient fallback), presence state (derived from `updatedAt` recency), AI ownership (agent name + confidence %), lead intent (score bar), activity timestamp. `IdentityCard` component (compact/expanded variants) used consistently across inbox, leads, and dashboard. Presence states: online/idle/away/offline/ai-processing/handoff-required/syncing. No new DB columns — presence is pure logic on existing timestamps; avatars use pravatar.cc deterministic by email seed.

### RBAC permissions (13 permissions, 5 roles)

| Permission | owner | admin | operator | viewer | customer |
|---|---|---|---|---|---|
| manage_org | yes | - | - | - | - |
| manage_members | yes | yes | - | - | - |
| manage_agents | yes | yes | yes | - | - |
| manage_leads | yes | yes | yes | - | - |
| delete_leads | yes | yes | - | - | - |
| manage_campaigns | yes | yes | yes | - | - |
| view_agents | yes | yes | yes | yes | - |
| view_leads | yes | yes | yes | yes | - |
| view_members | yes | yes | yes | yes | - |
| view_audit_log | yes | yes | yes | yes | - |
| run_campaigns | yes | yes | yes | - | - |
| manage_api_keys | yes | yes | - | - | - |
| view_api_keys | yes | yes | - | - | - |
 | read:own_conversations | - | - | - | - | yes (Lead.userId) |
 | write:own_messages | - | - | - | - | yes (Lead.userId) |

### Key files

```
apps/web/app/page.tsx                — Public landing page with "Try Live Demo →" CTA
apps/web/middleware.ts               — JWT guard + rate-limit + /→/home redirect + /login?clear=1 + portal bypass
apps/web/app/(dashboard)/home/page.tsx — Dashboard (dense full-viewport, donut charts, KPI cards, activity feed, ¥ pipeline)
apps/web/app/(dashboard)/inbox/      — Conversation inbox (unified single-page split-pane) + HITL review + translate button
apps/web/app/(dashboard)/analytics/   — Analytics dashboard (pipeline, campaign perf) + AI Health tab + Boss tab (Phase 19)
apps/web/app/(dashboard)/analytics/ai-health.tsx — AI Health dashboard: P50/P95, cost, fallback, daily tokens (Phase 18, 中文 Phase 19)
apps/web/app/(portal)/               — Customer Portal (Phase 19): login + conversation list + detail
apps/web/app/api/v1/translate/route.ts — DeepSeek translation API (Phase 19)
apps/web/app/api/orgs/[slug]/conversations/[id]/ai-draft/route.ts — AI draft with RAG knowledge base (Phase 19)
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
apps/web/lib/permissions.ts         — 13 RBAC permissions + 5 roles (incl. customer), PERMISSION_MAP exported for tests
apps/web/lib/rate-limit.ts          — Upstash Redis sliding-window rate limiter (configurable window, fail-closed option, in-memory TTL fallback)
apps/web/lib/token-blacklist.ts     — JWT revocation via Redis SET with TTL (fail-closed option)
apps/web/lib/feature-flags.ts       — Backward-compat re-export from feature-flags-v2 (4 active flags)
apps/web/lib/feature-flags-v2.ts    — DB-backed feature flags: per-org, rollout%, rules targeting, memory cache, env fallback
apps/web/lib/api-error.ts           — Centralized error handler: status mapping, safe JSON, PII-free responses
apps/web/lib/logger.ts              — Structured JSON logging with log levels, PII redaction, requestId tracing, TraceContext (Phase 18)
apps/web/lib/hitl.ts                — HITL state machine documentation + helpers (Phase 18)
apps/web/middleware.ts              — JWT guard + auth rate limiting (10/min) + API rate limiting (100/min) + API versioning headers + IP validation
apps/web/components/providers/theme-provider.tsx — Dark mode provider with flash prevention
apps/web/components/providers/theme-toggle.tsx   — Dark/light toggle button
apps/web/components/nav/sidebar.tsx              — Collapsible sidebar (ChatGPT-style), user menu at bottom
apps/web/components/nav/page-title.tsx           — Page title from path segment (no UUIDs in header)
apps/web/components/nav/mobile-nav.tsx           — Mobile hamburger menu with slide-out drawer
apps/web/components/leads/import-button.tsx      — CSV import dialog with file upload
apps/web/components/identity/avatar.tsx          — Pravatar.cc real photo avatar + gradient fallback + presence dot
apps/web/components/identity/identity-card.tsx   — Operational Identity Cell (compact list + expanded header)
apps/web/components/inbox/AgentThinkingPanel.tsx — ReAct Agent reasoning chain UI (collapsible, Phase 19)
apps/web/components/chat/chat-window.tsx         — Reusable real-time chat (Portal + Dashboard), AI draft bubble with approve/discard/regenerate (Phase 21-22)
apps/web/app/(dashboard)/analytics/ai-metrics.tsx — Four-layer AI metrics dashboard (system/quality/business/risk), Phase 22
apps/web/app/api/orgs/[slug]/metrics/ai/route.ts  — AI metrics aggregation API: percentile_cont P50/P95, status distribution, handoff rate (Phase 22)
apps/web/app/api/orgs/[slug]/conversations/[id]/messages/[messageId]/route.ts — PATCH reviewAction for HITL audit trail (Phase 22)
apps/web/lib/use-socket.ts                      — Socket.IO React hook with Vercel detection + REST fallback (Phase 21)
apps/web/socket-server.ts                       — Standalone Socket.IO chat server (port 3001), JWT auth, room-based (Phase 21)
.github/workflows/ci.yml                        — GitHub Actions CI: unit tests + type check + RAG eval (Phase 22)
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
docs/architecture/SECURITY.md        — Phase 15 audit report (165 findings, 32 fixed) [gitignored]
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
apps/worker/src/queue.ts            — Direct Redis connection + BullMQ Queues (prefix: "sales-agent", idempotent with JobContext)
apps/worker/src/email.ts            — Resend email sender + {{variable}} template resolver + open/click tracking
apps/worker/src/index.ts            — Worker: AI response composition, lead scoring, campaign delivery, retry, HTTP healthcheck, metrics logging
apps/worker/src/dedup.ts            — Redis SET NX idempotency helper (Phase 18)
packages/db/prisma/schema.prisma    — 14 models in sales_agent schema (incl. ApiKey + FeatureFlag for production)
packages/db/index.ts                — PrismaClient singleton export
packages/db/setup-vector.mjs        — Enable pgvector + embedding column on Supabase
packages/ai-core/src/client.ts      — Unified DeepSeek client (callDeepSeek, callDeepSeekJSON, 15s timeout, returns usage)
packages/ai-core/src/prompts.ts     — AI system prompts + builders + PROMPT_ARMOR injection defense
packages/ai-core/src/agents.ts      — composeResponse(), scoreLead(), generateScript(), summarizeConversation(), detectLanguage(), translateText()
packages/ai-core/src/agent-executor.ts — ReAct Agent loop (runReActAgent) with tool-calling (Phase 19)
packages/ai-core/src/prompt-registry.ts — Prompt version registry (Feature Flag canary rollout, Phase 18)
packages/ai-core/src/metrics.ts     — AICallMetric builder + cost estimation (Phase 18)
packages/rag-core/src/index.ts      — Full RAG pipeline barrel export
packages/rag-core/src/reranker.ts   — CohereReranker + NoopReranker + createReranker() factory (Phase 19)
packages/rag-core/src/pgvector-storage.ts — PostgreSQL pgvector StorageAdapter implementation
packages/rag-core/src/keyword-search.ts — PostgreSQL tsvector FTS keyword search (Phase 18)
packages/rag-core/src/rrf.ts           — Reciprocal Rank Fusion for hybrid search (Phase 18)
packages/rag-core/eval/                — RAG evaluation: Golden Dataset (20 Q&A), metrics, CLI (Phase 18)
packages/domain/src/lead.ts         — LeadStage, STAGE_TRANSITIONS, LeadScoreLabel
packages/ui-tokens/src/colors.ts    — Corporate Green palette (#166534, #4ADE80, #0a1108, #475540, #FFFFFF, #849b70)
packages/api-client/src/client.ts   — createClient() type-safe fetch wrapper (cookie + bearer auth)
packages/db/seed-production.ts      — 3 sellable scripts + 5 demo leads (idempotent)
packages/db/seed-demo.ts            — Client demo: Acme Corp, 15 leads, 3 agents, 10 conversations
packages/db/seed-chinese-demo.ts    — 启云科技中文 Demo: 5 members, 3 AI, 15 customers, 10 convos, 4 KB docs (Phase 19)
packages/db/seed-qicloud-accounts.ts — Supplementary: 3 customer portal accounts + 3 team members (Phase 19)
packages/db/seed-members.ts         — RBAC test accounts (admin/operator/viewer @salesagent.test)
packages/db/seed-verify-alice.ts    — Mark alice@example.com emailVerified=true
packages/db/clean-demo-org.ts       — FK-safe org cleanup before re-seed
packages/rag-core/eval/knowledge-base/ — 6 启云科技 KB docs (product/pricing/FAQ/objections/cases/competitors) for RAG testing
```

### State of the project (2026-07-07)

- **Phase 1-12**: Foundation → CRM → Campaigns → AI → Polish → Testing → Security → UI/UX → Identity Layer → Route hardening → UX Rework → Bugfix Sprint.
- **Phase 13-14**: Monorepo refactor, RAG (pgvector), Mobile Expo app, Club Concierge showcase.
- **Phase 15-17**: Security audit 165 findings→32 fixed, UI/UX overhaul (Corporate Green, Inter, Pravatar), Production hardening (auth rate limits, bcrypt 12, CSP, Sentry, Feature Flags, 14 error boundaries).
- **Phase 18**: AICallMetric, Hybrid search (pgvector+tsvector→RRF), AI Health dashboard, prompt version registry, job idempotency, HITL formalization, distributed tracing, RAG eval.
- **Phase 19**: Customer Portal, full Chinese i18n, ReAct Agent executor, Cohere Reranker, AI Draft RAG integration, Translation API, Boss Dashboard, 启云科技中文 Demo.
- **Phase 20**: Unified RAG pipeline (`hybrid-retriever.ts`), Query Rewriter (LLM 3-variant), Query Router (6 categories), Confidence Gate, RAG Eval connected to real PgVector, 30-case SalesAgent Golden Dataset, KB API CRUD.
- **Phase 21**: Redis semantic cache (exact + cosine ≥0.95), SHA-256 incremental indexing, Socket.IO WebSocket real-time chat, ChatWindow with Email/Chat toggle + AI Draft, 12-document 3-layer knowledge base.
- **Phase 22 (2026-07-08)**: **Inbox full-stack hardening** — safety (WebSocket content validation aligned with REST, `safe()` misuse corrected, ai-draft prompt injection remediation via `<user_data>` tags), honesty (fake delays removed, `Math.random()` BANT bars replaced with real `lead.score`), performance (messages cursor pagination + scrollHeight preservation, `Promise.all` parallel Server Component queries), HITL audit trail (`Message.reviewAction` approved/rejected field + PATCH endpoint + dual-path write), observability (four-layer AI metrics dashboard with `percentile_cont` P50/P95, `draftAdoptionRate` awaiting data accumulation). **Enterprise UI overhaul** — all glass morphism / gradients / glows / large radii / colored shadows removed, unified to Linear/Stripe flat aesthetic. **CI/CD** — GitHub Actions 3 parallel jobs (unit tests + type check + RAG eval). **Documentation** — 9-module interview deep-dive at `docs/interview/`.
- **~34,000 lines** across ~470 files. 50+ API routes. 54 unit tests. 16 models.
- Web: ✅ Vercel (JWT, API versioning, Customer Portal, Full Chinese UI, RAG-grounded AI drafts, ReAct reasoning UI, Hybrid Search, AI Health + Boss + AI Metrics dashboards, Translation API, WebSocket real-time chat, Enterprise flat UI).
- Worker: ✅ Railway (4 BullMQ workers, idempotent, channel feature flags, ReAct agent campaign steps, job dedup).
- Mobile: ✅ Expo 52 (7 pages). Club Concierge demo.
- Email: ✅ Resend with per-org Feature Flag control.
- RAG: ✅ 6-stage pipeline (Query Rewriting → Query Routing → Hybrid pgvector+tsvector→RRF → Cohere Reranker → Confidence Gate → Semantic Cache). 30-case Golden Dataset + eval.
- Chat: ✅ Socket.IO WebSocket (Room-based, JWT auth, REST polling fallback), ChatWindow with AI Draft.
- Observability: ✅ AICallMetric, AI Health dashboard (P50/P95/cost/fallback), AI Metrics dashboard (4-layer: system/quality/business/risk), Sentry, structured logging, distributed tracing.
- Design: ✅ Enterprise flat (Linear/Stripe/Ramp). No glass morphism. Full Chinese UI. Inter typography. 14 error boundaries.
- Security: Auth rate limiting, fail-closed, IP protection, bcrypt 12, CSP, file upload validation, prompt armor (`<user_data>` tags), customer role isolation, WebSocket content validation, `safe()` only used in prompt contexts.
- CI/CD: ✅ GitHub Actions (unit tests 54/54, type-check ai-core/rag-core/worker, RAG eval with EMBEDDING_API_KEY opt-in).

### Seed scripts reference

| Command | What it does | Safe to re-run? |
|---------|-------------|-----------------|
| `pnpm seed` | Full reset + demo data (destructive) | Drops all data |
| `pnpm seed-prod <slug>` | 3 scripts + 5 leads, idempotent | Yes |
| `pnpm seed-members <slug>` | RBAC test accounts with all 4 roles | Yes |
| `pnpm seed-verify-alice` | Sets emailVerified=true for alice@example.com | Yes |
| `pnpm seed-demo` | Acme Corp demo (15 leads, 3 agents, 10 conversations) | Drop first |
| `pnpm seed-chinese-demo` | 启云科技中文 Demo (5 成员, 3 AI, 15 客户, 10 对话, 4 KB, channel=chat) | Drop first |
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
20. **Route groups don't change URLs**: `(auth)/login` and `(portal)/login` both resolve to `/login` — Next.js will reject the build with "two parallel pages resolve to the same path." Route group parentheses `()` are purely organizational. To have separate URL paths, use real path prefixes without parentheses (e.g. `portal/login` → `/portal/login`).
21. **Prisma $queryRawUnsafe column names**: Prisma columns without `@map` use **camelCase** in the database (not snake_case). Writing `SELECT document_id FROM "DocumentChunk"` will fail with `column "document_id" does not exist`. Always use quoted camelCase: `SELECT "documentId" FROM "DocumentChunk"`.
22. **JSONB cast in raw SQL**: When inserting into JSONB columns via `$queryRawUnsafe`, PostgreSQL requires an explicit `::jsonb` cast on string parameters. Without it: `column "metadata" is of type jsonb but expression is of type text`.
23. **Chinese curly quotes break esbuild/tsx**: Chinese punctuation `""` (U+201C/U+201D) in `.ts` strings are misinterpreted as JS string delimiters by esbuild on Windows. Use corner brackets `「」` (U+300C/U+300D) for quoted Chinese text in source files.
24. **connection_limit=1 forbids parallel writes**: `Promise.all([create1, create2, ...])` with `connection_limit=1` causes timeout P2024. Seeds must write sequentially: `for (const d of data) { await prisma.create(...) }`.
25. **Leads → Organizations cascade**: Prisma marks `onDelete: Cascade` on Lead→Organization, but not on all relations. FK-safe cleanup must delete in dependency order: AICallMetric→Message→Conversation→LeadActivity→CampaignRun→Campaign→DocumentChunk→Document→Lead→ApiKey→FeatureFlag→AuditLog→Script→Agent→Membership→Organization.
26. **keyword-search.ts uses snake_case in SQL**: The `keywordSearch()` function had raw SQL with `document_id`, `chunk_index`, `organization_id` — but Prisma columns without `@map` use camelCase (`"documentId"`, `"chunkIndex"`, `"organizationId"`). Vercel deployment hit `column "document_id" does not exist` (error 42703). Fixed in Phase 21. Always use quoted camelCase in raw SQL against Prisma-managed tables.
27. **`safe()` is NOT a general-purpose sanitizer**: `safe()` only strips `\r\n` — it prevents prompt injection smuggling (newline escaping from `<user_data>` tags), not XSS or general input sanitization. Do NOT use it on chat messages or any content that doesn't enter a LLM prompt. It was mistakenly used in `chat-messages/route.ts` — removed in Phase 22. Correct usage: only in ai-draft/route.ts prompt construction, wrapped in `<user_data>` tags.
28. **WebSocket auth skips JWT blacklist check**: `socket-server.ts` verifies JWT signature and expiry, but does NOT call `isTokenRevoked()`. A user logged-out via HTTP can still use an active WebSocket connection. Known gap, not yet fixed.
29. **Inbox orphan file**: `inbox-detail-client.tsx` was orphaned (0 imports) after a refactor that switched to `inbox-client.tsx`. Wire it to `/inbox/[id]` page route for 3-column layout with AI intelligence panel — done in Phase 22.
30. **CI needs dummy DATABASE_URL**: The `@salesagent/db` singleton throws on import if `DATABASE_URL` is unset. GitHub Actions needs `DATABASE_URL: postgresql://ci:dummy@localhost:5432/ci?connection_limit=1` in the `env:` block of each job — the connection is never actually made, it just passes the env-var guard.

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
