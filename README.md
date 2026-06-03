<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/pgvector-Embeddings-4169E1?logo=postgresql" />
  <img src="https://img.shields.io/badge/Expo-Mobile-000020?logo=expo" />
  <img src="https://img.shields.io/badge/BullMQ-Async%20Queue-DC2626" />
  <img src="https://img.shields.io/badge/Redis-Background%20Jobs-red?logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/RAG-Knowledge%20Base-4F46E5" />
  <img src="https://img.shields.io/badge/Resend-Email-7C3AED" />
  <img src="https://img.shields.io/badge/DeepSeek-AI-4F46E5" />
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

---

## Platform Capabilities

### AI Agents
Configure agents with personality, knowledge, and goals. Each agent handles conversations autonomously — qualifying leads, answering questions, booking meetings.

### Knowledge Base (RAG)
Upload PDFs, FAQs, and documents. The platform chunks, embeds, indexes, and retrieves — so agents answer with source citations, not hallucinations.

```
Upload PDF → Parse → Chunk → Embed → pgvector → Retrieve → Answer + Citations
```

### Conversation Inbox
Unified inbox across all channels. See conversations, AI drafts, lead context, and qualification scores. Split-pane design — no page navigation.

### Outbound Campaigns
Multi-step sequences with AI-personalized emails, delays, and automatic reply detection. Campaigns run in the background via BullMQ worker.

### Lead Qualification
AI scores leads across 5 dimensions (intent, budget, authority, need, timeline). Hot leads route to humans. Warm leads stay in AI nurture.

### Mobile App
Expo app with Dashboard + Inbox tabs. Shares types, API client, and design tokens with the web app.

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Web** | Next.js 14 App Router, React 18, Tailwind CSS |
| **Mobile** | Expo SDK 52, React Native |
| **Language** | TypeScript (strict) |
| **Design** | Luxury Nature palette, glass morphism, design tokens |
| **Database** | PostgreSQL (Supabase) + pgvector |
| **ORM** | Prisma 6 |
| **Queue** | BullMQ + Upstash Redis (4 queues, prefix: `sales-agent`) |
| **Email** | Resend (AI composition, template engine, open/click tracking) |
| **AI** | DeepSeek API (compose, score, summarize, generate-script) |
| **RAG** | OpenAI Embeddings → pgvector || PostgreSQL keyword fallback |
| **Auth** | Custom JWT (jose) + bcryptjs + httpOnly cookies |
| **Monorepo** | pnpm workspaces + Turborepo |
| **Hosting** | Vercel (web) + Railway (worker) |

---

## Architecture

```
apps/
  web/       — Next.js 14 (App Router, ~40 API routes, SSE)
  worker/    — BullMQ Worker (AI + campaigns + email + scoring)
  mobile/    — Expo (Dashboard + Inbox)

packages/
  shared-types/  — API contract types (wire format)
  domain/        — Business entities (LeadStage, CampaignStatus, etc.)
  ui-tokens/     — Luxury Nature palette + Tailwind preset
  ai-core/       — Unified AI client + prompts + agents
  rag-core/      — Full RAG pipeline (parse → chunk → embed → retrieve → cite)
  api-client/    — Type-safe fetch client (web + mobile share)
  db/            — Prisma schema + pgvector (12 models)
```

### Database (12 models)

```
Organization  ──< Memberships >── User
      │
      ├──< Agent ──< Conversation ──< Message
      ├──< Lead ──< LeadActivity
      ├──< Script ──< Campaign ──< CampaignRun
      ├──< Document ──< DocumentChunk (pgvector)
      └──< AuditLog
```

### Multi-Tenant RBAC

| Role | Manage Org | Manage Members | Manage Agents | View All |
|------|:---:|:---:|:---:|:---:|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Admin | — | ✅ | ✅ | ✅ |
| Operator | — | — | ✅ | ✅ |
| Viewer | — | — | — | ✅ |

---

## Color System

**Luxury Nature palette** — Premium Enterprise SaaS aesthetic (Notion / Linear / Stripe / Ramp).

| Token | Hex | Role |
|---|---|---|
| Primary | `#265834` | CTAs, active states |
| Hover | `#579360` | Hover / dark mode accent |
| Dark BG | `#1f2b1d` | Dark mode background |
| Olive | `#656d4a` | Sidebar, secondary surfaces |
| Card | `#E8E6DF` | Cards, elevated surfaces |
| Sage | `#d6d9c3` | Badges, highlights |
| Tan | `#b6ad90` | Dividers, muted accents |

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
node packages/db/setup-vector.mjs     # Enable pgvector + embedding column
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
```

### Develop

```bash
pnpm dev              # Web app
pnpm dev-worker       # Worker
pnpm seed-demo        # Demo data (Acme Corp)
pnpm --filter @salesagent/web test  # 53 tests
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

## V1.5 Changelog (2026-06-03)

- **7 new packages**: shared-types, domain, ui-tokens, ai-core, rag-core, api-client, db (expanded)
- **RAG pipeline**: Upload → Parse → Chunk → Embed → pgvector → Retrieve → Cite
- **Knowledge Base**: `/kb` page + `/kb/playground` + 3 API routes
- **Mobile app**: Expo with Dashboard + Inbox tabs, shared types/tokens/client
- **Color redesign**: Green/slate → Luxury Nature palette
- **Eliminated duplication**: AI client merged from web + worker, prompts unified with injection armor
- **Build**: ✅ | **Tests**: 53/53

---

## Author

**Gloria Han**

Focus: AI Agent Platforms · Multi-Tenant SaaS · RAG Infrastructure · Full-Stack Product Engineering
