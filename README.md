<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/pgvector-Hybrid%20Search-4169E1?logo=postgresql" />
  <img src="https://img.shields.io/badge/Expo-Mobile-000020?logo=expo" />
  <img src="https://img.shields.io/badge/BullMQ-4%20Queues-DC2626" />
  <img src="https://img.shields.io/badge/Redis-Idempotent-red?logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/ReAct-Agent%20Executor-8B5CF6" />
  <img src="https://img.shields.io/badge/RAG-Hybrid%20Retrieval-4F46E5" />
  <img src="https://img.shields.io/badge/Resend-Email-7C3AED" />
  <img src="https://img.shields.io/badge/DeepSeek-AI-4F46E5" />
  <img src="https://img.shields.io/badge/Sentry-Observability-362D59?logo=sentry" />
  <img src="https://img.shields.io/badge/Vercel-Web%20Deploy-black?logo=vercel" />
  <img src="https://img.shields.io/badge/Railway-Worker-0B0D0E?logo=railway" />
</p>

<h1 align="center">
  SalesAgent AI
</h1>

<p align="center">
  Multi-tenant AI Agent Platform with Web, Mobile, Worker, and Knowledge Infrastructure.
</p>

<p align="center">
  Build and deploy AI Sales, Concierge, and Support Agents on a shared platform.
</p>

---

## What is this?

SalesAgent AI is a **Multi-Tenant AI Agent Platform**.

Not a chatbot wrapper. Not a workflow builder. Not a generic CRM.

It's infrastructure for running domain-specific AI agents — sales agents that qualify leads and book meetings, concierge agents that answer knowledge-base questions, support agents that handle inquiries — all on a shared, multi-tenant platform with web, mobile, and background worker.

### Three layers:

```
Presentation  →  Web (Next.js 14)  +  Mobile (Expo)
Application   →  AI Core  +  RAG Core  +  API Client
Foundation    →  Domain entities  +  Types  +  Database (PostgreSQL + pgvector)
```

### AI Engineering Highlights

| Capability | Implementation | Why it matters |
|---|---|---|
| **Agent Lifecycle** | 4 BullMQ queues with timeout, retry, exponential backoff | AI tasks never block HTTP requests |
| **RAG Pipeline** | Hybrid search (pgvector + tsvector → RRF fusion), recursive chunking, source citation, multi-tenant isolation | Semantics + exact keywords, fallback to regex |
| **Prompt Injection Defense** | PROMPT_ARMOR + `<user_data>` context boundary on all 4 agent functions | Prevents lead-originated prompt injection |
| **Human-in-the-loop** | Explicit `awaiting_approval` state machine, AI drafts never auto-sent | Safety boundary — AI assists, humans decide |
| **Prompt Versioning** | Registry with Feature Flag-driven canary rollout (rollout% + per-org rules) | A/B test prompts without redeploy |
| **AI Observability** | AICallMetric model: token usage, P50/P95 latency, cost tracking, requestId tracing (HTTP→Queue→LLM→DB) | End-to-end visibility into every AI call |
| **Job Idempotency** | Redis SET NX dedup on all 4 queues | Exactly-once processing on retry storms |
| **Feature Flags** | DB-backed with 5-layer evaluation (cache→DB per-org→DB global→env→default) | Runtime toggles, canary rollout, cost boundary control |

---

## Platform Capabilities

### AI Agents
Configure agents with personality, knowledge, and goals. Each agent handles conversations autonomously — qualifying leads, answering questions, booking meetings.

### Knowledge Base (RAG)
Upload PDFs, DOCXs, FAQs, and documents. The platform chunks, embeds, indexes, and retrieves — so agents answer with source citations, not hallucinations.

```
Upload → Parse → Chunk → Embed → pgvector + tsvector → Hybrid RRF → Answer + Citations
```

### Conversation Inbox
Unified inbox across all channels. See conversations, AI drafts (⏳ awaiting approval), lead context, and qualification scores. Split-pane design — no page navigation. HITL: human approves every AI draft before send.

### Outbound Campaigns
Multi-step sequences with AI-personalized emails, delays, and automatic reply detection. Campaigns run in the background via BullMQ worker. Idempotent job processing prevents duplicate sends.

### Lead Qualification
AI scores leads across 5 BANT dimensions (intent, budget, authority, need, timeline). Hot leads route to humans. Warm leads stay in AI nurture.

### AI Health Dashboard
`/analytics?tab=ai` — Real-time metrics: token usage trends, P50/P95 latency, cost attribution per job type, fallback rate alerts, daily usage charts.

### Mobile App
Expo app with Dashboard + Inbox + Knowledge Base + AI Playground. Shares types, API client, and design tokens with the web app.

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Web** | Next.js 14 App Router, React 18, Tailwind CSS |
| **Mobile** | Expo SDK 52, React Native |
| **Language** | TypeScript (strict) |
| **Design** | Corporate Green palette, glass morphism, design tokens |
| **Database** | PostgreSQL (Supabase) + pgvector + tsvector (hybrid search) |
| **ORM** | Prisma 6 |
| **Queue** | BullMQ + Upstash Redis (4 queues, idempotent, prefix: `sales-agent`) |
| **Email** | Resend (AI composition, template engine, open/click tracking) |
| **AI** | DeepSeek API (compose w/RAG, score, summarize, generate-script, translate, ReAct agent) |
| **RAG** | Hybrid: pgvector cosine + PostgreSQL FTS → RRF fusion; keyword fallback |
| **Observability** | AICallMetric model + AI Health dashboard + Sentry + structured logging with PII redaction + distributed tracing (requestId) |
| **Auth** | Custom JWT (jose) + bcryptjs 12 rounds + httpOnly cookies + Redis blacklist |
| **Monorepo** | pnpm workspaces + Turborepo |
| **Hosting** | Vercel (web) + Railway (worker) |

---

## Architecture

```
apps/
  web/       — Next.js 14 (App Router, ~40 API routes)
  worker/    — BullMQ Worker (AI + campaigns + email + scoring)
  mobile/    — Expo (Dashboard + Inbox + KB + Playground)

packages/
  shared-types/  — API contract types (wire format)
  domain/        — Business entities (LeadStage, CampaignStatus, etc.)
  ui-tokens/     — Corporate Green palette + Tailwind preset
  ai-core/       — Unified AI client + prompts (versioned) + agents + metrics
  rag-core/      — Full RAG pipeline (parse → chunk → embed → hybrid retrieve → cite) + eval
  api-client/    — Type-safe fetch client (web + mobile share)
  db/            — Prisma schema + pgvector (15 models)
```

### Database (15 models)

```
Organization  ──< Memberships >── User
      │
      ├──< Agent ──< Conversation ──< Message
      ├──< Lead ──< LeadActivity
      ├──< Script ──< Campaign ──< CampaignRun
      ├──< Document ──< DocumentChunk (pgvector + tsvector)
      ├──< AICallMetric (token usage, latency, cost)
      ├──< AuditLog
      ├──< ApiKey
      └──< FeatureFlag (DB-backed, per-org rollout%)
```

### Multi-Tenant RBAC

| Role | Manage Org | Manage Members | Manage Agents | View All | Customer Portal |
|------|:---:|:---:|:---:|:---:|:---:|
| Owner | ✅ | ✅ | ✅ | ✅ | — |
| Admin | — | ✅ | ✅ | ✅ | — |
| Operator | — | — | ✅ | ✅ | — |
| Viewer | — | — | — | ✅ | — |
| Customer | — | — | — | — | ✅ |

---

## Color System

**Corporate Green palette** — Premium Enterprise SaaS aesthetic (Notion / Linear / Stripe / Ramp).

| Token | Hex | CSS Variable | Role |
|---|---|---|---|
| Primary | `#166534` | `--accent` | CTAs, active states |
| Dark Accent | `#4ADE80` | `--accent` (dark) | Dark mode vibrant green |
| Dark BG | `#0a1108` | `--bg` (dark) | Near-OLED black |
| Light BG | `#F8F9FA` | `--bg` (light) | Cool slate |
| Card | `#FFFFFF` | `--bg-card` (light) | Pure white cards |
| Dark Card | `#111A0E` | `--bg-card` (dark) | Dark surfaces |
| Accent Secondary | `#849b70` | `--accent-secondary` | Dividers, muted accents |

---

## Getting Started

### Prerequisites
- Node.js 20+, pnpm 9+
- PostgreSQL (Supabase) + pgvector extension
- Upstash Redis

### Install

```bash
pnpm install
pnpm --filter @salesagent/db push     # Push schema
pnpm --filter @salesagent/db generate  # Generate Prisma client
node packages/db/setup-vector.mjs     # Enable pgvector + embedding + tsvector
```

### Environment

```bash
# packages/db/.env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# apps/web/.env.local
JWT_SECRET="64-char-random-string"
DEEPSEEK_API_KEY="sk-..."
REDIS_URL="redis://..."

# Optional: for vector search (falls back to keyword search)
EMBEDDING_API_KEY="sk-..."   # OpenAI API key
EMBEDDING_MODEL="text-embedding-3-small"

# Optional: Sentry error tracking
SENTRY_DSN="https://..."
```

### Develop

```bash
pnpm dev              # Web app
pnpm dev-worker       # Worker
pnpm seed-demo        # Demo data (Acme Corp)
pnpm --filter @salesagent/web test  # Unit tests
pnpm --filter @salesagent/rag-core eval  # RAG evaluation
```

### Deploy

```bash
npx vercel --prod --cwd apps/web     # Web → Vercel
# Worker auto-deploys via Railway on git push
```

---

## Seed Scripts

| Command | What |
|---------|------|
| `pnpm seed` | Full reset + demo data |
| `pnpm seed-prod <slug>` | 3 scripts + 5 leads (idempotent) |
| `pnpm seed-members <slug>` | RBAC test accounts |
| `pnpm seed-verify-alice` | Verify alice@example.com |
| `pnpm seed-demo` | Acme Corp demo org |
| `pnpm clean-org <slug>` | FK-safe org cleanup |

---

## Demo

```bash
pnpm seed-demo
```

Creates **Acme Corp** with 15 leads, 3 AI agents, 10 conversations, 2 campaigns.

Login: `demo@acmecorp.com` / `demo123456`

---

## Phase 18 Changelog (2026-07-04)

### L1 — AI Runtime
- **Token usage tracking**: `AICallMetric` model captures prompt/completion tokens, latency, cost per AI call. Previously discarded by `DeepSeekResponse` type.
- **Worker deduplication**: Eliminated 300+ line duplicate DeepSeek client in `apps/worker/src/ai.ts` — worker now uses `@salesagent/ai-core`.

### L2 — AI Retrieval
- **Hybrid search**: pgvector cosine + PostgreSQL tsvector → RRF (Reciprocal Rank Fusion). BM25 keyword + vector semantic, parallel retrieval with `k=60` fusion.
- **RAG evaluation framework**: 20-case golden dataset, precision/recall/MRR/NDCG metrics, LLM-as-Judge injected at CLI boundary. Run via `pnpm eval`.
- **DOCX parsing**: `mammoth` dependency installed — KB now supports Word documents.

### L3 — AI Observability
- **AI Health dashboard**: `/analytics?tab=ai` — P50/P95 latency, token cost, fallback rate, daily usage charts, alert thresholds (latency >10s, fallback >10%).
- **Distributed tracing**: `requestId` propagates HTTP → BullMQ Job → DeepSeek API → AICallMetric. Full-chain traceable.
- **Sentry globalThis fix**: Replaced fragile `globalThis.__SENTRY__` pattern (no-op cleanup).

### L4 — AI Reliability
- **Job idempotency**: Redis SET NX dedup on all 4 BullMQ queues. Exactly-once processing on retry storms.
- **HITL formalization**: `awaiting_approval` state machine, Inbox ⏳ Needs Review badge, `hitl.ts` documentation.
- **BullMQ bug fix**: `defaultJobOptions` readonly error (pre-existing in BullMQ 5.x) moved to queue constructor.
- **Prisma schema drift fix**: `Unsupported("tsvector")` + `Unsupported("vector")` annotations prevent `db push` from dropping pgvector columns.

### Prompt Engineering
- **Version registry**: 4 prompt types registered with version + deployedAt. Feature Flag `compose_prompt_version = "v2"` enables canary rollout.
- **A/B testing ready**: `getPromptVersionFlag()` reads DB rules → hash-bucketed rollout → runtime prompt switch.

### Stats
- **35 files**, +1,715 / −276 lines. 11 new files, 14 modified, 1 deleted, 1 DB migration.
- Build: ✅ green (web + worker, 0 errors). Prisma Client: v6.19.3.

---

### V1.9 (2026-07-05) — China Market Adaptation
- Customer Portal (Lead.userId, /portal routes, customer JWT login)
- Full Chinese i18n (17 dashboard files — navigation, inbox, analytics, campaigns, leads, agents, settings)
- Channel Feature Flags (email_channel/wechat_channel) — same codebase, different markets
- Real pipeline value (Lead.dealAmount) replacing hardcoded $5K
- ReAct Agent executor (agent-executor.ts) + AgentThinkingPanel UI + Worker campaign step type="react"
- AI draft RAG integration (Knowledge Base grounding before composing replies)
- Cohere Reranker with NoopReranker fallback (createReranker factory)
- Translation API (/api/v1/translate) + inbox translate button + detectLanguage()
- Boss Dashboard tab (/analytics?tab=boss) — HITL rate, AI cost trends, agent performance
- AI Health full Chinese translation + RMB cost display
- AI auto-detects customer language and matches response language (prompt rule)
- 启云科技 Chinese Demo seed (5 members, 3 AI, 15 customers, 4 KB docs with 31 chunks)
- ~55 files, +2,800 / -500 lines. Build: green.

## Previous Changelog

### V1.7 (2026-06-28) — Production Hardening
- Auth rate limiting (defense-in-depth), bcrypt 12 rounds, CSP unsafe-eval removed
- API versioning (`/api/v1/` rewrites), Sentry graceful opt-in, 14 error boundaries
- Feature flags v2 (DB-backed, per-org rollout%), file upload 10MB cap + magic bytes
- PII redaction logger, API 401 JSON responses, E2E security spec

### V1.6 (2026-06-28) — UI/UX Commercial Overhaul
- Real human avatars (Pravatar.cc), Inter typography, Corporate Green palette
- 26 files changed across web + mobile + packages

### V1.5 (2026-06-03) — Agent Platform
- Monorepo refactor: 3 apps + 7 packages
- RAG pipeline (pgvector), Knowledge Base, Mobile Expo app
- AI deduplication, Luxury Nature palette

---

## Author

**Gloria Han**

Focus: AI Agent Platforms · Multi-Tenant SaaS · RAG Infrastructure · Full-Stack Product Engineering
