# V2 GuideBook — From AI SDR to Agent Platform

> **When:** 2026-06-03 · **Author:** Claude Opus 4.8 + gloria238  
> **Commit:** e2b5ec8 · **Files changed:** 99 · **+12,085 / -1,416 lines

---

## What happened

SalesAgent AI was transformed from a single-purpose AI SDR (Sales Development Representative) into a **Multi-Tenant AI Agent Platform**. This is the bridge document between V1 (the single product) and V2 (the platform).

### The old story:

> "AI SDR — an AI that qualifies leads, composes follow-ups, and books meetings."

### The new story:

> "Multi-tenant AI Agent Platform with Web, Mobile, Worker, and Knowledge Infrastructure. Build and deploy AI Sales, Concierge, and Support Agents on a shared platform."

---

## Architecture: Before / After

### V1 (left) vs V2 (right)

```
V1: apps/web, apps/worker, packages/db
         ↓
V2: 3 apps + 7 packages
```

```
apps/
  web/              — Next.js 14 App Router (unchanged core, imports re-wired)
  worker/           — BullMQ Worker (unchanged core, imports re-wired)
  mobile/           — Expo (NEW, 2 tabs: Dashboard + Inbox)

packages/
  shared-types/     — API contract types (wire format)
  domain/           — Business entities & rules (LeadStage, CampaignStatus, etc.)
  ui-tokens/        — Luxury Nature palette + Tailwind preset + typography/spacing/shadows
  ai-core/          — Unified AI client + prompts + agents (eliminated web/worker duplication)
  rag-core/         — Full RAG pipeline: parse → chunk → embed → index → retrieve → cite
  api-client/       — Type-safe fetch client (web + mobile share)
  db/               — Prisma schema + client (expanded: +Document, +DocumentChunk tables)
```

### The 3-layer architecture:

```
Presentation Layer
  ├── apps/web         — Next.js 14 (Server Components + Client Components)
  ├── apps/mobile      — Expo (React Native, shared types/tokens/client)

Application Layer
  ├── api-client       — Type-safe fetch (cookie auth for web, bearer for mobile)
  ├── ai-core          — DeepSeek client + prompt builders + agent execution
  ├── rag-core         — Document ingestion pipeline + vector retrieval

Core Layer
  ├── domain           — Business entities (9 domains: Lead, Campaign, Conversation,
  │                       Agent, Organization, KnowledgeBase, Document, Chunk, Citation)
  ├── shared-types     — API wire format (request/response shapes only)
  ├── db               — Prisma 6 + PostgreSQL + pgvector
  └── ui-tokens        — Design tokens (CSS vars for web, JS objects for RN)
```

---

## What was extracted (and why)

### 1. `shared-types` — extracted from `apps/web/lib/`

| Before | After |
|---|---|
| `apps/web/lib/api-types.ts` (all API shapes) | `packages/shared-types/src/api.ts` |
| `apps/web/lib/permissions.ts` (Role, Permission types) | `packages/shared-types/src/permissions.ts` |
| `apps/web/lib/auth.ts` (JwtPayload interface) | `packages/shared-types/src/auth.ts` |
| `apps/web/lib/session.ts` (Session interface) | `packages/shared-types/src/auth.ts` |
| `apps/web/lib/ai.ts` (DeepSeekMessage, etc.) | `packages/shared-types/src/ai.ts` |
| `apps/worker/src/index.ts` (ComposeResult, ScoreResult) | `packages/shared-types/src/ai.ts` |

**Runtime stays in web:** `signToken()`, `verifyToken()`, `getSession()`, `hasPermission()`, `isEnabled()`, etc.

### 2. `domain` — new package, no extraction

Business entities that every app must agree on. Not API shapes — **rules of the business**.

| File | Contents |
|---|---|
| `lead.ts` | LeadStage enum, STAGE_TRANSITIONS map, LeadScoreLabel, scoreThresholds |
| `campaign.ts` | CampaignStatus enum, CAMPAIGN_TRANSITIONS |
| `conversation.ts` | ConversationStatus, ConversationChannel, MessageDirection |
| `agent.ts` | AgentGoalType enum, SalesMethodology |
| `organization.ts` | MembershipRole enum |
| `activity.ts` | LeadActivityType enum |

### 3. `ui-tokens` — new package

Single source of truth for the entire visual system.

```
colors.ts          — Luxury Nature palette (#265834, #579360, #1f2b1d, #656d4a, #E8E6DF, #b6ad90)
typography.ts      — Font family, sizes, weights
spacing.ts         — 4px base scale + border radius
shadows.ts         — Elevation + glass effects (light/dark)
tailwind-preset.ts — Consumed by apps/web/tailwind.config.js
```

### 4. `ai-core` — merged from web + worker

**Problem:** DeepSeek client duplicated in `apps/web/lib/ai.ts` and `apps/worker/src/ai.ts`. Prompts duplicated too (builders in web, inline strings in worker). Worker had no prompt injection armor.

**Solution:** 3 files, no over-engineering:

| File | From |
|---|---|
| `client.ts` | Merged from web (`callDeepSeek` with 15s timeout) + worker (added timeout) |
| `prompts.ts` | Moved from web — PROMPT_ARMOR + 4 system prompts + 4 builders |
| `agents.ts` | New — `composeResponse()`, `scoreLead()`, `generateScript()`, `summarizeConversation()` |

**Deleted:** `apps/web/lib/ai.ts`, `apps/web/lib/prompts.ts`, `apps/worker/src/ai.ts`

### 5. `rag-core` — new package

Full ingestion pipeline: **Upload → Parse → Chunk → Embed → Store → Retrieve → Cite**

```
types.ts           — Chunk, EmbeddedChunk, SearchResult, Citation, DocumentMetadata
parser.ts          — Document type detection → specific parser dispatch
pdf-parser.ts      — PDF → raw text (pdf-parse)
docx-parser.ts     — DOCX → raw text (mammoth, optional)
txt-parser.ts      — Plain text (zero deps)
faq-parser.ts      — JSON/CSV Q&A → structured text
chunker.ts         — Recursive character split (paragraph → sentence → fixed-size)
embeddings.ts      — OpenAI-compatible embedding provider (pluggable interface)
indexer.ts         — Orchestrator: chunk → embed → store
storage.ts         — StorageAdapter interface + InMemoryStorage
pgvector-storage.ts — PostgreSQL pgvector adapter
retriever.ts       — Cosine similarity search (with keyword fallback)
sources.ts         — Chunk → source citation
reranker.ts        — Reranker interface + NoopReranker (reserved for future)
```

**Design decisions:**
- No reranker implementation — retriever + cosine similarity is enough for portfolio
- Embedding is optional — graceful fallback to PostgreSQL `~*` keyword search
- pgvector for production, InMemoryStorage for tests
- Multi-tenant: all chunks tagged with `organizationId`, queries scoped to org

### 6. `api-client` — new package

Type-safe fetch client. Same code on web and mobile.

```ts
// Web (cookie auth)
const api = createClient({ baseUrl: "/api" });
const leads = await api.leads.list({ orgSlug: "acme", page: 1 });

// Mobile (bearer auth)
const api = createClient({ baseUrl: "https://app.salesagent.ai/api", authMode: "bearer", token });
```

8 endpoint modules: `auth`, `leads`, `conversations`, `campaigns`, `agents`, `scripts`, `analytics`, `organizations`.

---

## What was CUT (and why)

| Package | Reason |
|---|---|
| `memory-core` | No real memory system exists — just chat history + KB. Build when clients ask. |
| `tool-registry` | No tool-calling agent yet. Build when you have Booking/Support/Sales agents. |
| `workflow-engine` | Campaign Automation already works. Don't over-abstract until visual canvas is needed. |

---

## New Knowledge Base System

### Database

```sql
-- 2 new tables in sales_agent schema
Document (id, organizationId, name, type, status, chunkCount, metadata)
DocumentChunk (id, documentId, organizationId, content, chunkIndex, metadata, embedding vector)
```

### API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/orgs/[slug]/kb/upload` | Upload PDF/TXT/MD/JSON → parse → chunk → embed → pgvector |
| POST | `/api/orgs/[slug]/kb/ask` | Question → retrieve → LLM → answer + citations |
| GET | `/api/orgs/[slug]/kb/documents` | List all indexed documents |

### Pages

| Route | Page |
|---|---|
| `/kb` | Document list (table) + upload button |
| `/kb/playground` | Q&A input → answer + source citations + retrieved chunks |

### V1.5 Definition of Done

```
Upload PDF → auto-chunk → auto-embed → auto-index
    ↓
Ask question → search → retrieve → LLM answer → source citations
    ↓
Web + Mobile both functional
```

---

## Color Palette: Luxury Nature

### Why the change

Old: `#22C55E` (green-500) + slate neutrals → "AI SaaS startup" aesthetic  
New: Deep forest + olive + sage + warm cream → "Premium Enterprise SaaS" aesthetic (Notion/Linear/Stripe/Ramp)

### Complete palette

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| Primary | `#265834` | `--accent` | CTAs, active states, links |
| Primary Hover | `#579360` | `--accent-hover` | Hover / dark mode accent |
| Dark BG | `#1f2b1d` | `--bg` (dark) | Dark mode background |
| Secondary BG | `#656d4a` | `--bg-secondary` | Sidebar, secondary surfaces |
| Card | `#E8E6DF` | `--bg-card` | Cards, elevated surfaces |
| Sage Highlight | `#d6d9c3` | `--bg-sage` | Badges, highlights only |
| Warm Accent | `#b6ad90` | `--accent-secondary` | Dividers, muted accents |
| Danger | `#B4463C` | `--danger` | Errors, destructive actions |

### Files updated

- `globals.css` — all 50+ CSS custom properties
- `tailwind.config.js` — all color families, keyframes
- `home/page.tsx` — donut charts, KPI icons, campaign bars
- `analytics/page.tsx` — pipeline bars, KPI icons, status badges
- `skeleton.tsx`, `empty-state.tsx` — hardcoded zinc → CSS vars
- `time.ts` — presence colors → palette colors
- `sidebar.tsx` — added Knowledge Base nav item

---

## Mobile App

### Stack

- Expo SDK 52 + Expo Router 4
- Shared packages: `@salesagent/shared-types`, `@salesagent/domain`, `@salesagent/api-client`, `@salesagent/ui-tokens`

### Screens (2 tabs, MVP)

| Tab | Content |
|---|---|
| Dashboard | 4 KPI cards (Pipeline, Meetings, Reply Rate, AI Autopilot) |
| Inbox | Conversation list with avatars + score badges + previews |

### Why 2 tabs, not 3

- Dashboard = proves "mobile exists"
- Inbox = proves "AI conversations work on mobile"
- Leads management on mobile = 3 extra days, same demo value

---

## Build & Tests

```
pnpm build  → ✅ Compiled successfully (25 pages)
pnpm test   → ✅ 53/53 passed (5 test files)
```

---

## What comes next

### Milestone B: RAG Playground polish
- Better chunk visualization
- Confidence scores per source
- Direct "jump to document" from citation

### Milestone C: Agent Playground
- Prompt + knowledge base + temperature + goal → real-time sandbox test
- Lets clients SEE the agent work without deploying a campaign

### P2: FAQ Upload, DOCX Upload
### P3: Mobile KB tab
### P4: Advanced reranker (Cohere/BGE/Jina)

---

## One-sentence pitch

> **Multi-tenant AI Agent Platform with shared Web, Mobile, Worker, and RAG infrastructure.**

Or for clients:

> **Build and deploy AI Sales, Concierge, and Support Agents on a shared multi-tenant platform.**
