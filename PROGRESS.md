# SalesAgent AI — Progress Report

> Last updated: 2026-06-03
> Project: Multi-Tenant AI Agent Platform

## Overall Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 0: OpsFlow Migration | ✅ Done | 100% |
| Phase 1: AI SDR Foundation | ✅ Done | 100% |
| Phase 2: Campaign Engine | ✅ Done | 100% |
| Phase 3: AI Intelligence | ✅ Done | 100% |
| Phase 4: Polish & Demo | ✅ Done | 100% |
| Phase 5: Testing & Security | ✅ Done | 100% |
| Phase 6: Deployment | ✅ Done | 100% |
| Phase 7: Security v2 & pgBouncer | ✅ Done | 100% |
| Phase 8: UI/UX — AI Staff Console | ✅ Done | 100% |
| Phase 9: Route hardening & DB perf | ✅ Done | 100% |
| Phase 10: Operational Customer Identity Layer | ✅ Done | 100% |
| Phase 11: UX Rework & Demo Login | ✅ Done | 100% |
| Phase 12: Bugfix Sprint & Polish | ✅ Done | 100% |
| **Phase 13: V1.5 Agent Platform** | ✅ Done | 100% |

**Total:** ~20,000 lines across ~300 files. 40+ API routes + SSE.
**Tests:** 53 unit (100% pass). Build: ✅ green.
**Infrastructure:** Next.js 14 · React 18 · Expo 52 · Tailwind CSS · Prisma 6 · PostgreSQL (Supabase + pgvector) · Upstash Redis · BullMQ (4 queues, prefix: "sales-agent") · DeepSeek AI · OpenAI Embeddings · Resend email · Vercel + Railway.

---

## Phase 13 — V1.5 Agent Platform ✅

> Completed: 2026-06-03

### Monorepo refactor (3 apps + 7 packages)

```
apps/                     packages/
  web   (Next.js 14)        shared-types   — API contract types
  worker (BullMQ)           domain         — Business entities
  mobile (Expo, NEW)        ui-tokens      — Luxury Nature palette + Tailwind preset
                            ai-core        — Unified AI client + prompts + agents
                            rag-core       — Full RAG pipeline
                            api-client     — Type-safe fetch client
                            db             — Prisma + pgvector (expanded)
```

### Packages created

| Package | Files | Source |
|---------|-------|--------|
| `shared-types` | 7 | Extracted from `apps/web/lib/api-types.ts`, `permissions.ts`, `auth.ts`, `session.ts`, `time.ts`, `feature-flags.ts`, `ai.ts` |
| `domain` | 6 | New — LeadStage, CampaignStatus, ConversationStatus, MembershipRole, AgentGoal, LeadActivityType |
| `ui-tokens` | 6 | New — colors, typography, spacing, shadows, Tailwind preset |
| `ai-core` | 4 | Merged from `apps/web/lib/ai.ts` + `apps/web/lib/prompts.ts` + `apps/worker/src/ai.ts` + `apps/worker/src/index.ts` |
| `rag-core` | 14 | New — types, parser, pdf/docx/txt/faq-parser, chunker, embeddings, indexer, storage, pgvector-storage, retriever, sources, reranker |
| `api-client` | 10 | New — client + 8 endpoint modules |

### Knowledge Base (RAG)

- **2 new DB tables**: `Document` + `DocumentChunk` (pgvector embedding column)
- **3 API routes**: `POST /kb/upload`, `POST /kb/ask`, `GET /kb/documents`
- **2 new pages**: `/kb` (document list + upload), `/kb/playground` (Q&A + citations)
- **Embedding fallback**: No EMBEDDING_API_KEY → PostgreSQL `~*` keyword search
- **pgvector**: Enabled on Supabase, `setup-vector.mjs` script

### Mobile app

- Expo SDK 52 + Expo Router 4
- 2 tabs: Dashboard (KPI cards) + Inbox (conversation list)
- Shares: `shared-types`, `domain`, `api-client`, `ui-tokens`

### Color redesign

- Old: `#22C55E` green + slate neutrals → "AI startup" aesthetic
- New: Luxury Nature palette → "Premium Enterprise SaaS" (Notion/Linear/Stripe/Ramp)
- 6 core colors: `#265834`, `#579360`, `#1f2b1d`, `#656d4a`, `#E8E6DF`, `#b6ad90`
- Updated: `globals.css`, `tailwind.config.js`, all dashboard/analytics/skeleton/empty-state components

### AI deduplication

- `apps/web/lib/ai.ts` → DELETED (→ `packages/ai-core/src/client.ts`)
- `apps/web/lib/prompts.ts` → DELETED (→ `packages/ai-core/src/prompts.ts`)
- `apps/worker/src/ai.ts` → DELETED (merged into ai-core)
- Worker inline prompts → replaced with prompt builders (now has `<user_data>` injection armor)

### What was CUT

| Package | Why |
|---------|-----|
| memory-core | No real memory system. Build when clients ask. |
| tool-registry | No tool-calling agent yet. Build with Booking/Support agents. |
| workflow-engine | Campaign Automation already works. Keep until visual canvas needed. |

---

## Known Issues / TODOs

1. **Stripe billing** — Not implemented.
2. **API Key Bearer auth** — Pending (Edge runtime Prisma limitation).
3. **Upstash Redis free tier** — 500K daily limit.
4. **Embedding fallback** — Works (keyword search), but vector search needs OpenAI API key.
5. **DOCX parser** — `mammoth` peer dependency declared, not installed. PDF works.
6. **Reranker** — Interface reserved, NoopReranker only. Build when needed.

---

## What comes next (V1.5 Milestones)

| Milestone | Description | Priority |
|-----------|-------------|----------|
| **B** | RAG Playground polish — better chunk viz, confidence scores | P1 |
| **C** | Agent Playground — real-time sandbox test for agents | P1 |
| **D** | FAQ upload support in UI | P2 |
| **E** | DOCX upload support | P2 |
| **F** | Mobile KB tab | P3 |
| **G** | Advanced reranker (Cohere/BGE) | P4 |
