# SalesAgent AI — Progress Report

> Last updated: 2026-06-04
> Project: Multi-Tenant AI Platform (AI Concierge / Sales Agent)

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
| **Phase 14: V1.6 Mobile Showcase** | ✅ Done | 100% |

**Total:** ~24,000 lines across ~340 files. 40+ API routes + SSE.
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

## Phase 14 — V1.6 Mobile Showcase ✅

> Completed: 2026-06-04

### 定位

Mobile 不是 Web 功能的缩水版。它是一个独立的 **Club Concierge Demo/Showcase 层**：

```
Web = 真实产品（不改业务逻辑）
Mobile = Showcase 层（Club Concierge 叙事）
Landing Page = 通用 AI Platform 定位
```

### 6 个页面

| 页面 | 路由 | 一句话 |
|------|------|--------|
| **Login** | `/login` | 品牌 + "Enter Demo →" 一键进入 |
| **Dashboard** | `/(tabs)/` | Members · Bookings · AI Resolve · Demo/Live Toggle |
| **Inbox 列表** | `/(tabs)/inbox` | AI 对话 + Confidence % + 导航 |
| **Inbox 详情** | `/(tabs)/inbox/[id]` | AI 回复 + Source Citation |
| **Knowledge Base** | `/(tabs)/kb` | Stats · 文档列表 · Upload Pipeline · Playground 入口 |
| **AI Playground** | `/playground` | ⭐ 6 步 RAG Pipeline 可视化（embed→search→rank→sources→generate→answer） |
| **System Overview** | `/system` | 多租户 · 架构层 · 技术栈（隐藏入口，KB Stats 区域点入） |

### Club Concierge 叙事

```
Dashboard: 1,247 Members · 38 Bookings · 94% AI Resolve · Active Concierge
Inbox: Sarah Wilson "Can I bring two guests..." 92% · AI 回复 + Guest Policy.pdf 引用
KB: Guest Policy.pdf · Court Rules.pdf · Membership Handbook.pdf · 24 docs · 1,382 chunks
Playground: "What is the guest policy?" → 6 步 Pipeline → Answer + Sources
System: 3 Clubs · 24 Documents · 42 Conversations · 2 Agents · 4 Workers
```

### 新增文件（20 个）

```
hooks/use-theme.ts, use-demo-mode.tsx
components/activity-item.tsx, message-bubble.tsx, source-citation.tsx,
          document-card.tsx, pipeline-step.tsx, stats-card.tsx,
          skeleton.tsx, empty-state.tsx
data/mock-dashboard.ts, mock-inbox.ts, mock-kb.ts, mock-playground.ts,
     mock-system.ts, index.ts
app/playground.tsx, app/system.tsx,
app/(tabs)/kb.tsx, app/(tabs)/inbox/[id].tsx
```

### 修改文件（7 个）

```
app/_layout.tsx      — 注册 playground + system 路由 + DemoModeProvider
app/(tabs)/_layout.tsx — 3 tabs, tab bar 64px height
app/(tabs)/index.tsx   — Dashboard 重设计
app/(tabs)/inbox.tsx   — 升级到 Club Concierge 叙事
app/login.tsx           — "Enter Demo →" 按钮
components/kpi-card.tsx — theme hook, 软阴影
components/conversation-item.tsx — theme hook, AI confidence, onPress
```

### Metro 配置

`apps/mobile/metro.config.js` — Monorepo workspace package 解析。所有导入使用主入口（`@salesagent/ui-tokens`）而非子路径（`@salesagent/ui-tokens/colors`），因为 Metro 不支持 package.json exports 子路径。

### 设计系统

- Luxury Nature 调色板（#265834, #E8E6DF, #1f2b1d, #656d4a, #b6ad90）
- 大留白（页面 padding 24px，卡片 padding 16-20px）
- 软阴影（shadowOpacity 0.06, shadowRadius 8）
- 无边框卡片（只有气泡 inbound 和分隔线有 border）
- Linear/Notion/Stripe 产品美学（不是 Admin Dashboard）

---

## Known Issues / TODOs

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
