# SalesAgent AI — Progress Report

> 最后更新：2026-07-07
> 项目：企业销售 AI 中枢操作系统（多租户 AI Agent 平台）
> 核心理念：AI 辅助而非替代。Human-in-the-Loop 贯穿全流程。

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
| **Phase 15: Security Audit & Production Readiness** | ✅ Done | 100% |
| **Phase 16: UI/UX Commercial Overhaul** | ✅ Done | 100% |
| **Phase 17: Production Hardening** | ✅ Done | 100% |
| **Phase 18: Production AI Builder** | ✅ Done | 100% |

**Total:** ~27,000 lines across ~390 files. 40+ API routes.
**Infrastructure:** Next.js 14 · React 18 · Expo 52 · Tailwind CSS · Prisma 6 · PostgreSQL (Supabase + pgvector) · 14 models · Upstash Redis · BullMQ (4 queues, prefix: "sales-agent") · DeepSeek AI · OpenAI Embeddings · Resend email · Sentry · Vercel + Railway.

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

## Phase 15 — Security Audit & Production Readiness ✅

> Completed: 2026-06-06 (audit) / 2026-06-07 (Vercel build fixes)

### 8-Domain Security Audit

Full-codebase security audit across 8 domains using 8 parallel agents (~435K tokens):

| Domain | CRITICAL | HIGH | MEDIUM | LOW |
|--------|----------|------|--------|-----|
| Auth & Session | 3 | 4 | 7 | 8 |
| API & RBAC (40+ routes) | 9 | 5 | 7 | 4 |
| Injection & Data Protection | 3 | 3 | 4 | 3 |
| Infrastructure & Congestion | 6 | 9 | 9 | 4 |
| RAG System | 0 | 6 | 8 | 4 |
| Database & KB Readiness | 1 | 8 | 8 | 2 |
| Worker & Email System | 6 | 6 | 9 | 4 |
| Deployment & Environment | 2 | 2 | 5 | 6 |
| **Total** | **30** | **43** | **57** | **35** |

### 32 Fixes Applied (Phase 15)

| Category | Fixes | Key items |
|----------|-------|-----------|
| Auth Security | 5 | Origin phishing (C2), emailVerified check (C3), JWT revocation (C1), login validation (M4), token in response (M5) |
| Prompt Injection | 6 | Worker PROMPT_ARMOR ×4 (C1-C3), KB ask (C2), generateScript (M9), conversation summaries (C3) |
| API Validation | 6 | 6 routes had zero Zod validation — all now validated |
| Worker Resilience | 4 | Timeout + retry config on all 4 queues, dynamic import → static, AI error sanitization |
| Infrastructure | 1 | pgvector table name fix (`document_chunks` → `"DocumentChunk"`) |
| UI Polish | 10 | Design token consistency, avatar consolidation, loading skeletons, a11y, micro-interactions |

### Vercel Build Fixes (2026-06-07)

| File | Issue | Fix |
|------|-------|-----|
| `upload/route.ts:43` | pdf-parse v1 default export → v2 `PDFParse` class | `(await import("pdf-parse")).default` → `new PDFParse({ data }).getText()` |
| `rag-core/pdf-parser.ts:8` | Same v1→v2 API | Same fix |
| `rag-core/declarations.d.ts:4` | Stale v1 type declaration | Updated to v2 `PDFParse` class |
| `upload/route.ts:90` | `Record<string,unknown>` → Prisma JSON type mismatch | `as any` cast |
| `members/route.ts:32,75` | TS narrowing on role comparison ("admin"|"operator"|"viewer" vs "owner") | `const role: string` intermediate variable |
| `injection.test.ts:264` | `res.body` is ReadableStream, not parsed JSON | Destructure `body` from fetchJSON |

### Third-Party Exposure Map (documented in SECURITY.md)

| Service | Data Sent | Risk |
|---------|-----------|------|
| DeepSeek API | Lead names, emails, messages, KB docs | AI training opt-out unclear |
| Resend | Lead email addresses, email content | Email delivery platform |
| DiceBear | User/lead email as seed in URL | PII to 3rd party, no DPA |
| Upstash Redis | JWT tokens (hashed), rate limit counters | KV storage |
| Supabase | All app data, bcrypt passwords, embeddings | Primary DB |

### Credential Exposure (2 issues found, mitigation recommended)

1. `.env.local` committed in early git history (4 commits) — rotate all keys
2. `.claude/settings.local.json` contained plaintext DB password — now gitignored

---

## Phase 16 — UI/UX Commercial Overhaul ✅

> Completed: 2026-06-28

### Avatar — Cartoon → Real Human Photos

- DiceBear `notionists` → Pravatar.cc deterministic real photos (seeded by email)
- Gradient initials fallback on load error
- CSP updated: `api.dicebear.com` → `i.pravatar.cc`
- Mobile: ConversationItem + System tenant avatars use `Image` with real photos

### Typography — Plus Jakarta Sans → Inter

- `next/font/google` Inter (variable `--font-sans`) — corporate SaaS standard
- Tailwind fontFamily updated

### Color System — Luxury Nature → Corporate Green

- Light: warm cream → cool slate (`#F8F9FA` bg, `#FFFFFF` cards)
- Dark: deep forest → near-OLED black (`#0a1108`)
- Primary: `#265834` → `#166534` (green-800)
- Dark accent: `#579360` → `#4ADE80` (green-400)
- Glass: more opaque (82%) for professional look
- 26 files changed across web + mobile + packages

---

## Phase 17 — Production Hardening ✅

> Completed: 2026-06-28

### Security (10 items)

| Item | Description |
|------|-------------|
| Auth rate limiting | Login 10/min, register 5/min, verify 20/min per IP (defense-in-depth) |
| Fail-closed options | `RATE_LIMIT_FAIL_CLOSED` + `TOKEN_REVOCATION_FAIL_CLOSED` env vars |
| IP protection | `TRUSTED_PROXY_RANGES` validation for x-forwarded-for |
| Bcrypt upgrade | 10→12 rounds, auto re-hash on login |
| CSP hardening | `unsafe-eval` removed (zero codebase dependency) |
| Dead try/catch | Removed around `checkPermission()` in 4 files (never throws) |
| File upload security | 10MB cap + magic byte validation (PDF/TXT/JSON/MD) |
| Logger enhancement | Log levels, PII redaction (email/JWT), requestId tracing |
| API key model | JSON column → proper `ApiKey` Prisma model with indexes |
| API 401 JSON | API routes return 401 JSON instead of 302 redirect |

### API Versioning

- `/api/v1/:path*` rewrites mapping to existing handlers (zero duplication)
- `Deprecation`/`Sunset`/`Link` headers on non-versioned paths

### Error Tracking

- `@sentry/nextjs` graceful opt-in (`SENTRY_DSN`)
- Centralized `lib/api-error.ts` with status mapping
- 14 `error.tsx` boundaries (11 routes + dashboard group + root + global)

### Feature Flags v2

- DB-backed `FeatureFlag` model (per-org, rollout%, rules JSON)
- Memory cache (60s TTL) + env-var fallback
- 2 unused flags removed (advanced_tables, realtime_updates)

### E2E Tests

- New `e2e/security.spec.ts`: CSP headers, auth bypass, rate limiting, API versioning

### Mobile Productionization

- Login page wired to real `/api/v1/auth/login` with loading/error states
- `use-demo-mode` defaults to "live" in production builds
- `apiBaseUrl` exposed for live API mode

### 43 files changed, 2268 lines added, 133 removed

---

## Phase 18 — Production AI Builder ✅

> Completed: 2026-07-04

### 8 任务，35 文件 (+1,715 / −276 lines)

### L1 — AI Runtime

- **Token usage tracking**: `AICallMetric` 模型捕获每次 AI 调用的 token 使用、延迟、成本。`DeepSeekResponse` 增加 `usage` 字段（之前被丢弃）。
- **Worker 去重**: 删除 `apps/worker/src/ai.ts`（300+ 行重复 DeepSeek client），Worker 改为直接使用 `@salesagent/ai-core`。
- **AI Metrics Collection**: `packages/ai-core/src/metrics.ts` — `buildMetric()`, `estimateCost()` (DeepSeek $0.14/$0.28 per 1M)。

### L2 — AI Retrieval

- **Hybrid Search**: pgvector cosine + PostgreSQL tsvector → RRF (k=60) 融合。并行检索，`kb/ask/route.ts` 集成。
- **RAG Evaluation**: 20 条 Golden Dataset, Precision/Recall/MRR/NDCG 纯计算指标, LLM-as-Judge (Faithfulness + Relevancy) 在 CLI 边界注入。
- **全文搜索迁移**: `setup-vector.mjs` 追加 `search_vector` tsvector 列 + GIN 索引 + 自动更新触发器。
- **DOCX 支持**: `mammoth` 依赖安装，`docx-parser.ts` 可用。

### L3 — AI Observability

- **AI Health Dashboard**: `/analytics?tab=ai` — Sales/AI Health 双标签。P50/P95 延迟、成本、回调量分组、30天 token 趋势、告警。
- **Aggregation API**: `GET /api/v1/metrics/ai-health?period=24h|7d|30d` — summary, byJobType, dailyTokens, alerts。
- **分布式追踪**: `requestId` 传播 HTTP → BullMQ Job (`JobContext`) → Worker log → AICallMetric。全链路可追溯。
- **Logger 增强**: `TraceContext` 类型, `withTrace()` 辅助函数。

### L4 — AI Reliability

- **Job Idempotency**: Redis SET NX 去重, `checkAndMarkDedup()` 在 4 个 Worker processor 中注入。24h TTL, fail-open 降级。
- **HITL Formalization**: `awaiting_approval` 状态机, Inbox ⏳ Needs Review 过滤标签 + 橙色徽章, `hitl.ts` 文档。
- **BullMQ 修复**: `defaultJobOptions` readonly 错误修复 — 选项移到 queue 构造函数。
- **Prisma Schema Drift**: `searchVector Unsupported("tsvector")` + `embedding Unsupported("vector")` 注解防止 `db push` 删除 pgvector 列。

### Prompt Engineering

- **Version Registry**: `prompt-registry.ts` — 4 种 prompt 用 `VersionedPromptConfig` 注册，Feature Flag 控制灰度 (`getPromptVersionFlag()`)。
- **A/B Test 就绪**: `FeatureFlag.rules.promptVersion` + rollout% → hash-bucketed 分组 → 运行时 prompt 切换。

### 新增文件 (11)

```
packages/ai-core/src/metrics.ts              — AI 指标 + 成本估算
packages/ai-core/src/prompt-registry.ts      — Prompt 版本注册表
packages/rag-core/src/keyword-search.ts      — PostgreSQL FTS 封装
packages/rag-core/src/rrf.ts                 — RRF 融合算法
packages/rag-core/eval/types.ts              — Eval 类型
packages/rag-core/eval/dataset.ts            — 20 Golden Q&A
packages/rag-core/eval/metrics.ts            — 检索指标 + runEvaluation()
packages/rag-core/eval/cli.ts                — CLI (LLM judge 注入)
apps/web/app/(dashboard)/analytics/ai-health.tsx   — AI Health Tab
apps/web/app/api/v1/metrics/ai-health/route.ts     — Aggregation API
apps/web/lib/hitl.ts                         — HITL 状态机
apps/worker/src/dedup.ts                     — Redis SET NX 幂等
```

### 修改文件 (14)

```
packages/shared-types/src/ai.ts              — DeepSeekResponse + usage
packages/ai-core/src/client.ts               — { content, usage } / { result, usage }
packages/ai-core/src/agents.ts               — 解构 + promptVersion
packages/ai-core/src/prompts.ts              — registry 引用
packages/db/prisma/schema.prisma             — AICallMetric + HITL status + Unsupported 注解
packages/db/setup-vector.mjs                 — search_vector 列 + GIN + trigger
apps/worker/src/queue.ts                     — JobContext + defaultJobOptions fix
apps/worker/src/index.ts                     — metrics + idempotency + trace + HITL
apps/web/lib/feature-flags-v2.ts             — 4 prompt version flags + getPromptVersionFlag()
apps/web/lib/logger.ts                       — TraceContext + withTrace()
apps/web/app/(dashboard)/analytics/page.tsx  — Tab 布局
apps/web/app/(dashboard)/inbox/inbox-client.tsx — HITL ⏳ Needs Review
apps/web/app/api/orgs/[slug]/kb/ask/route.ts — Hybrid search
apps/web/app/api/orgs/[slug]/conversations/[id]/messages/route.ts — context 注入
apps/web/app/api/orgs/[slug]/campaigns/[id]/start/route.ts — context 注入
```

### 删除文件 (1)

```
apps/worker/src/ai.ts — 300+ 行重复 DeepSeek client, 已由 @salesagent/ai-core 接管
```

---


## Phase 19 — China Market Adaptation

> Completed: 2026-07-05

### L1 — Data Truth & i18n
- **Lead.dealAmount**: Pipeline Value 从硬编码 $5K -> SUM(dealAmount) 真实聚合，支持人民币显示
- **Lead.userId + User.leads**: Customer Portal 数据模型基础，外部客户与内部成员分离
- **全界面中文化** (~17 files): 导航/工作台/收件箱/分析/AI健康/Boss/外呼活动/客户管理/设置/AI助理/脚本/Portal
- **AI Health 中文化**: 标签/指标/趋势图/提示全部翻译，费用 $ -> 人民币, 延迟 ms -> 毫秒/秒, job type 中文映射

### L2 — Channel Abstraction (Feature Flag)
- **Feature Flags**: `email_channel` (default: false) + `wechat_channel` (default: true) — 6 active flags total
- **Worker integration**: campaign-jobs 发邮件前检查 isChannelEnabled()，禁用时降级到日志
- **Seed defaults**: 中国租户自动写入 email_channel=false

### L3 — Customer Portal
- **数据模型**: Lead.userId (可选) -> User.leads 反向关联
- **路由**: `/portal/login` + `/portal/conversations` + `/portal/conversations/[id]`
- **认证**: /api/auth/login 双路径 — Membership -> dashboard / Lead.userId -> portal (JWT role=customer, redirectTo)
- **RBAC**: 新增 customer 角色 (ROLES 数组), 权限通过 Lead.userId scoping 而非 Membership

### L4 — ReAct Agent + Reranker
- **agent-executor.ts**: ReAct Agent 循环 (Thought->Action->Input->Observation, max 6 steps)
- **4 工具**: get_lead_history / search_knowledge_base / get_lead_info / send_followup_message
- **Campaign step type="react"**: Worker 新增 ReAct 步骤类型，自主跟进客户并记录 agentSteps 到 aiMetadata
- **Reranker**: CohereReranker (rerank-multilingual-v3.0) + NoopReranker fallback + createReranker() 工厂
- **AgentThinkingPanel**: 可折叠推理链路 UI (Inbox 消息气泡下方)

### L5 — AI Draft RAG Integration
- **ai-draft/route.ts**: AI 草稿先检索知识库 (hybrid search -> RRF -> top-5 chunks) 再注入 prompt
- **KB grounding**: LLM 被指示产品/定价/竞品必须从 KB 引用，KB 没有的诚实说不知道
- **kbChunksUsed**: API response 返回使用了几个 KB 块

### L6 — Translation + Boss Dashboard
- **翻译 API**: `/api/v1/translate` — DeepSeek 翻译, 支持 10 语言, session guard
- **Inbox 翻译按钮**: 草稿翻译 -> 预览 -> 替换原文/保留原文
- **detectLanguage() / translateText()**: ai-core 导出
- **Boss Dashboard**: `/analytics?tab=boss` (owner/admin only) — 团队规模/HITL率/AI成本/成功率/成本趋势/Agent表现/漏斗/7天活跃度
- **COMPOSE_RESPONSE_SYSTEM**: 语言自动检测规则 (客户用什么语言->相同语言回复)

### Known Bug Fixes
- **kb/ask SQL 列名**: snake_case -> camelCase (4 queries, 从 Phase 18 起就存在)
- **embedding provider**: apiKey -> effectiveKey (fallback to DEEPSEEK_API_KEY)
- **Portal route conflict**: (portal) -> portal/ (route group -> real path prefix, 修复 Vercel build)
- **seed-chinese-demo**: Chinese quote -> corner bracket, connection pool (Promise.all -> sequential), FK cleanup (Prisma API), jsonb cast (::jsonb)

### 新增文件 (16)
```
packages/ai-core/src/agent-executor.ts              — ReAct Agent loop
apps/web/app/(portal)/layout.tsx                    — Portal layout (no sidebar)
apps/web/app/(portal)/login/page.tsx                — Portal login (magic-link skeleton)
apps/web/app/(portal)/conversations/page.tsx        — Portal conversation list
apps/web/app/(portal)/conversations/[id]/page.tsx   — Portal conversation detail
apps/web/app/api/v1/translate/route.ts              — Translation API
apps/web/app/api/orgs/[slug]/conversations/[id]/ai-draft/route.ts — RAG-grounded AI draft
apps/web/components/inbox/AgentThinkingPanel.tsx     — ReAct reasoning UI
packages/db/seed-chinese-demo.ts                    — 中文 Demo: 5成员/3AI/15客户/4KB文档
packages/db/seed-qicloud-accounts.ts                — Portal账号 + 补充成员
packages/rag-core/eval/knowledge-base/              — 6 启云科技 KB docs (~40KB)
```

### 修改文件 (35)
```
apps/web/lib/validation.ts, permissions.ts, feature-flags-v2.ts, middleware.ts
apps/web/(dashboard)/** — 17 files 中文化 + Boss tab + translate button
apps/worker/src/index.ts — channel flags + ReAct agent step type="react"
packages/ai-core/src/agents.ts, prompts.ts, index.ts — detectLanguage, translateText, language rule
packages/rag-core/src/embeddings.ts, retriever.ts, reranker.ts, index.ts — bugfix + Cohere reranker
packages/db/prisma/schema.prisma — Lead.dealAmount, Lead.userId, User.leads
CLAUDE.md, ARCHITECTURE.md, PROGRESS.md, README.md, package.json — docs + scripts
```

### Stats
- **~55 files**, +2,800 / -500 lines. 16 new files, 35 modified, 0 deleted.
- Build: green (web + worker, 0 errors). Prisma Client: v6.19.3.

---

## Phase 20 — RAG 检索质量工程化 ✅

> Completed: 2026-07-07

### 6 Tasks, 15 files (+1,850 / −180 lines)

### T1 — Reranker 死代码修复 + 统一检索管线

- **hybrid-retriever.ts** (new): 统一检索管线 — 替代 kb/ask 和 ai-draft 中 60+ 行重复 SQL。Pipeline: 查询改写 → 问题路由 → 混合检索(vector+keyword) → RRF融合 → Reranker → 置信度门控
- **kb/ask/route.ts** (refactor): 从 162 行直写 SQL 缩减为调用 `hybridRetrieve()` → 60 行。Reranker 现在实际生效。
- **ai-draft/route.ts** (refactor): 同上, `searchKnowledgeBase()` 函数从 75 行 SQL 缩减为 10 行调用 `hybridRetrieve()`

### T2 — 查询改写模块

- **query-rewriter.ts** (new): `QueryRewriter` 接口 + `NoopQueryRewriter` + `LLMQueryRewriter`
  - 策略: 原始查询(保底) → 关键词提取(BM25优化) → 同义改写(语义搜索) → 子问题分解
  - LLMRewriter 通过回调注入 DeepSeek, 保持 rag-core 无 LLM 硬依赖
  - 失败优雅降级到原始查询

### T3 — 问题路由模块

- **query-router.ts** (new): `QueryRouter` 接口 + `KeywordQueryRouter`(快速,免费) + `LLMQueryRouter`(精准)
  - 分类: faq / product / pricing / competitor / case / general
  - 每类独立的检索参数: topK, vectorWeight, keywordWeight, minScore
  - `CATEGORY_PARAMS` 查表 — FAQ 类向量权重偏高, 定价类严格阈值

### T4 — 置信度门控 + 二次检索

- **hybrid-retriever.ts** 内置: 首次检索 top-1 < 0.7 → 自动触发 expanded search(放宽 topK+降低阈值) → 合并去重
- 返回 `secondaryRetrievalUsed` 标志用于 metrics fallback 追踪

### T5 — RAG Eval 真实化

- **dataset-sales.ts** (new): 30 条启云科技领域 Golden Q&A, 覆盖 FAQ(8)/Product(7)/Pricing(5)/Competitor(4)/Case(3)/General(3)
- **retriever-adapter.ts** (new): 连接真实 PgVector + hybridRetrieve 到 eval 框架, 支持 `--real --org-id <id>`
- **cli.ts** (refactor): 支持 `--dataset sales|club`, `--real` 模式, 按类别分组的指标报告

### T6 — KB API CRUD 完善

- **kb/documents/[id]/route.ts** (new): GET(单文档+chunk列表) / PATCH(更新名称/元数据) / DELETE(级联删除chunks)
- **kb/documents/[id]/reindex/route.ts** (new): POST — 批量重嵌所有chunk, 支持切换 embedding 模型后重建
- **retriever.ts** (refactor): 优先使用 `storage.search()` 原生 pgvector 搜索 ← 替代 JS 全量余弦计算

### Wiring & Init

- **rag-init.ts** (new): `initRagPipeline()` — 应用启动时自动检测 DEEPSEEK_API_KEY, 动态注入 LLM 驱动的 Rewriter + Router
- **declarations.d.ts** (update): 新增 `@salesagent/ai-core` 和 `@prisma/client` 动态导入类型声明

### Eval Scripts

```bash
pnpm --filter @salesagent/rag-core eval                    # Mock, SalesAgent dataset
pnpm --filter @salesagent/rag-core eval:sales              # 同上
pnpm --filter @salesagent/rag-core eval:sales:retrieval    # 仅检索指标
pnpm --filter @salesagent/rag-core eval:real -- --org-id <id> # 真实 PgVector
```

### New Files (9)
```
packages/rag-core/src/hybrid-retriever.ts        — Unified retrieval pipeline
packages/rag-core/src/query-rewriter.ts           — Query expansion module
packages/rag-core/src/query-router.ts             — Query classification module
packages/rag-core/src/rag-init.ts                 — LLM rewiring at startup
packages/rag-core/eval/dataset-sales.ts           — 30 Q&A SalesAgent golden dataset
packages/rag-core/eval/retriever-adapter.ts       — Real PgVector eval adapter
apps/web/app/api/orgs/[slug]/kb/documents/[id]/route.ts      — GET/PATCH/DELETE doc
apps/web/app/api/orgs/[slug]/kb/documents/[id]/reindex/route.ts — Re-embed endpoint
```

### Modified Files (7)
```
packages/rag-core/src/index.ts                    — Export new modules
packages/rag-core/src/retriever.ts                — Use storage.search() natively
packages/rag-core/src/declarations.d.ts           — Dynamic import type declarations
packages/rag-core/package.json                    — New eval scripts + exports
packages/rag-core/eval/cli.ts                     — --real mode + sales dataset
apps/web/app/api/orgs/[slug]/kb/ask/route.ts      — hybridRetrieve() replaces inline SQL
apps/web/app/api/orgs/[slug]/conversations/[id]/ai-draft/route.ts — hybridRetrieve() replaces inline SQL
```

### Stats
- **15 files**, +1,850 / -180 lines. 9 new files, 7 modified.
- rag-core: TypeScript check passes (0 errors).
- Reranker (Cohere) is now actually called in production requests (was dead code).
- RAG eval now supports real PgVector retrieval + SalesAgent domain dataset (was mock tennis club).

---

## Phase 21 — RAG 性能工程 + 实时消息 ✅

> Completed: 2026-07-07

### T7 — QA Semantic Cache (Redis)

- **semantic-cache.ts** (new): `SemanticCache` 接口 + `RedisSemanticCache` + `NoopSemanticCache`
  - 两层缓存: Exact match (SHA-256 of normalized query) + Semantic match (cosine ≥ 0.95)
  - Redis key: `rag:cache:exact:{orgId}:{queryHash}` / `rag:cache:embeddings:{orgId}:*`
  - 失效策略: TTL (1h) + `invalidateOrg()` on KB update + `invalidateDocuments()` on doc change
  - FAQ 场景预计缓存命中率 60%+, 延迟 2s → 50ms

### T8 — Incremental Indexing + Content Hash

- **content-hash.ts** (new): `fingerprintContent()` (SHA-256), `diffChunks()` (增量 diff), `generateChunkId()` (稳定 ID)
- **chunker.ts** (update): `stableIds` 选项 (默认 true), chunk ID 基于 docId+index+timestamp prefix
- **kb/upload/route.ts** (update): 上传时计算 SHA-256 → 查重 (完全一致→跳过) → 同名更新 (删旧 chunk→重建)
  - 返回 `{ deduplicated: true }` 或 `{ updated: true }` 标志
  - 上传后自动调用 `semanticCache.invalidateOrg()` 清除缓存

### T9 — WebSocket Real-time Chat

- **socket-server.ts** (new): Standalone Socket.IO server (port 3001)
  - JWT cookie 验证 → Room-based (per conversationId)
  - Events: `join` / `message` / `typing` / `leave` / `presence`
  - Message 持久化到 Prisma (channel="chat", aiMetadata 中存 senderInfo)
- **use-socket.ts** (new): React hook — `useSocket(conversationId)` → { messages, sendMessage, typing, isConnected }
  - WebSocket 优先, HTTP long-polling 降级
  - 自动重连 (10 attempts, 指数退避)
- **chat-window.tsx** (new): 复用聊天 UI 组件
  - 消息气泡 (客户右侧绿色/Agent 左侧白色)
  - 连接状态栏 (实时/轮询) + 对方在线状态 + 正在输入动画
  - Enter 发送, REST fallback when Socket.IO unavailable
- **Dashboard Chat**: `/(dashboard)/chat/page.tsx` — Agent 与客户实时聊天
  - Server Component 加载历史消息 + ChatWindow client component
- **Portal Chat**: `portal/conversations/[id]/page.tsx` — 升级为真实实时聊天
  - JWT verify → customer lead ownership check → ChatWindow
- **REST Fallback**: `POST /api/orgs/{slug}/conversations/{id}/chat-messages` + `GET` polling
  - 当 Socket.IO 不可用时 (Vercel serverless) 自动降级到 REST
- **Portal Fallback**: `POST /api/chat/conversations/{id}/messages`

### New Files (7)
```
packages/rag-core/src/semantic-cache.ts           — Redis-backed QA cache
packages/rag-core/src/content-hash.ts             — SHA-256 fingerprinting + incremental diff
apps/web/socket-server.ts                         — Socket.IO standalone server (port 3001)
apps/web/lib/use-socket.ts                        — React Socket.IO hook
apps/web/components/chat/chat-window.tsx           — Reusable real-time chat component
apps/web/app/(dashboard)/chat/page.tsx            — Agent chat dashboard
apps/web/app/(dashboard)/chat/layout.tsx           — Chat layout
apps/web/app/api/orgs/[slug]/conversations/[id]/chat-messages/route.ts — REST fallback
apps/web/app/api/chat/conversations/[id]/messages/route.ts            — Portal REST fallback
```

### Modified Files (4)
```
packages/rag-core/src/index.ts                    — Export semantic-cache + content-hash
packages/rag-core/src/chunker.ts                  — stableIds option
packages/rag-core/package.json                    — New exports + eval scripts
apps/web/app/api/orgs/[slug]/kb/upload/route.ts   — Content hash dedup + cache invalidation
apps/web/app/portal/conversations/[id]/page.tsx  — Real WebSocket chat replaces disabled textarea
apps/web/package.json                             — socket.io, socket.io-client, ioredis + dev scripts
```

### Stats
- **12 files**, +1,500 / −100 lines. 9 new files, 4 modified.
- rag-core: TypeScript check passes (0 errors).
- Chat: real-time WebSocket with REST fallback for serverless.

---

## Phase 22 — Inbox 全面加固 + 企业 UI 重构 + 可观测性闭环 ✅

> Completed: 2026-07-08

### L1 — Safety

- **WebSocket 内容校验对齐**: socket-server.ts 加 5000 字符上限 + `emit("error")` 替代 throw
- **`safe()` 误用清理**: chat-messages/route.ts 移除 `safe()` — 聊天消息不进 LLM prompt, 不需要防注入。`safe()` 只在 ai-draft 的 prompt 构建时使用
- **ai-draft prompt injection 补全**: history / latestInbound / lastOutbound 全部包裹 `<user_data>` 标签 — 发现这些是唯一没包裹的用户输入
- **score-lead → 入队化**: 删除同步 DeepSeek 调用, 改为 `scoringQueue.add()`。Worker 已有 retry + PROMPT_ARMOR + AICallMetric

### L2 — Honesty

- **删除假延迟**: inbox-client.tsx + inbox-detail-client.tsx 删除 `setTimeout(Math.random())` 假延迟。替换为 AbortController 30s 超时 + toast。`clearTimeout` 放 `finally`
- **删除 BANT 伪造数据**: inbox-detail-client.tsx 的 5 维 `Math.random()` BANT 条 → 单一 `lead.score` 条。null score → "评分数据待接入" placeholder
- **inbox-detail-client.tsx 孤儿处置**: 路由 `/inbox/[id]` page.tsx 走 InboxDetailClient (三栏 + AI 智能分析面板), 不再用 inbox-client.tsx
- **score-lead UI 诚实化**: 按钮改为 "评分中...", 500ms 后 `router.refresh()`, toast "已提交评分任务"

### L3 — Performance

- **消息 cursor 分页**: GET /messages 加 `?cursor=&limit=50`, `take: limit+1` 判 hasMore (防边界误判)
- **前端加载更多**: inbox-client + inbox-detail-client 加 `loadMoreMessages()` + scrollHeight 位移保持滚动位置
- **Server Component 并行化**: `/inbox/[id]` page.tsx `Promise.all` 并行查 list + detail (之前是串行 waterfall)
- **SSR 消息量限制**: page.tsx 初始加载 `take: 50` — 防止 500 条消息的对话 TTFB 爆炸

### L4 — HITL Audit Trail

- **Message.reviewAction 字段** (Prisma schema + `db push`): "approved" | "rejected" | null
- **sendMessageSchema 扩展**: `reviewAction` 可选 enum
- **PATCH endpoint**: `messages/[messageId]/route.ts` — `checkPermission("manage_agents")`, Zod `{ reviewAction: enum }`
- **双路径写入**: 客户端 AI 草稿 (POST body 带 reviewAction) + Worker 草稿 (PATCH 已有 message)
- **前端审核按钮**: sendReply 写入 `reviewAction: "approved"`, 放弃/丢弃按钮非阻塞 PATCH `reviewAction: "rejected"`
- **patchWorkerDraft()**: 从 messages 倒数找第一条 outbound 且无 reviewAction 的 Worker 草稿

### L5 — Observability

- **四层 AI 指标 API**: `GET /api/orgs/{slug}/metrics/ai?days=7` — percentile_cont P50/P95 (raw SQL), statusDistribution, handoffRate, timeouts
- **AI 指标看板前端**: analytics page 第四个 Tab, `AIMetricsTab` 组件 — 4 层卡片 (系统/质量/业务/风险), null → "数据待接入"
- **draftAdoptionRate 准备**: API 已返回 null, 前端已处理 null。等 reviewAction 数据积累一周后接上 (1 个 SQL 聚合即可)

### L6 — Enterprise UI Overhaul

- **globals.css**: 删除所有 glass morphism / liquid-glass CSS 类, 统一 RGB token (`--text-primary`, `--accent-subtle`, `--border`)
- **tailwind.config.js**: 默认 border-radius → `0.375rem`, 删除 glass/surface/shadow-xl 自定义色, 旧 token alias 兼容
- **60+ 文件批量对齐** (sed): 删除 `backdrop-blur-*`, `glass-card` → `rounded-md border border-border`, `rounded-2xl` → `rounded-lg`, `shadow-xl/lg` → `shadow-sm`
- **UI 组件重写**: Badge (`rounded-full` → `rounded`), Button (`active:scale` 删除, `shadow-sm` 删除, `rounded-md`), Card (`hover:-translate-y` 删除), Input (`ring-2` → `ring-1`), Dialog (统一 radius)
- **动画清理**: 删除 `animate-bounce`, `animate-ping`, `transition-all`, stream-cursor, 只保留 fade-in/slide-up/scale-in/skeleton
- **Sidebar**: 纯色背景, 激活态 `bg-accent-subtle text-accent-text`, icon `size-4`. 删除 `backdrop-blur`, `border-lp-border/30`

### L7 — CI/CD

- **`.github/workflows/ci.yml`**: 3 并行 job — unit tests (54/54) + type check (ai-core/rag-core/worker) + RAG eval (EMBEDDING_API_KEY opt-in)
- **DATABASE_URL dummy**: CI 需要 `postgresql://ci:dummy@localhost:5432/ci?connection_limit=1` — 只过 env-var guard, 无真连接

### L8 — Seed Data

- **seed-chinese-demo.ts**: 全部 51 处 `channel: "email"` → `"chat"` — 中国客户用 chat
- **seed-demo.ts**: 删除 `Math.random()` 假 confidence, 固定 0.88

### Modified Files (15 core + 60+ UI bulk)
```
apps/web/socket-server.ts                  — 5000-char limit + content validation
apps/web/lib/validation.ts                 — sendMessageSchema +reviewAction
apps/web/lib/__tests__/permissions.test.ts  — ROLES: 4→5 (customer Phase 19), +customer role tests
apps/web/app/api/orgs/[slug]/ai/score-lead/route.ts       — sync DeepSeek → scoringQueue
apps/web/app/api/orgs/[slug]/conversations/[id]/ai-draft/route.ts — <user_data> tags
apps/web/app/api/orgs/[slug]/conversations/[id]/chat-messages/route.ts — remove safe()
apps/web/app/api/orgs/[slug]/conversations/[id]/messages/route.ts — cursor pagination + reviewAction
apps/web/app/api/orgs/[slug]/conversations/[id]/messages/[messageId]/route.ts — NEW (PATCH)
apps/web/app/api/orgs/[slug]/metrics/ai/route.ts — NEW (four-layer aggregation)
apps/web/app/(dashboard)/inbox/inbox-client.tsx — fake delay removal + AbortController + loadMore + reviewAction
apps/web/app/(dashboard)/inbox/[id]/inbox-detail-client.tsx — same + BANT fix + scoring state
apps/web/app/(dashboard)/inbox/[id]/page.tsx — Promise.all + InboxDetailClient
apps/web/app/(dashboard)/analytics/page.tsx — 4th tab "AI 指标"
apps/web/app/(dashboard)/analytics/ai-metrics.tsx — NEW (four-layer dashboard)
apps/web/components/chat/chat-window.tsx — AI draft bubble alignment with email pattern
.github/workflows/ci.yml — NEW
packages/db/prisma/schema.prisma — Message.reviewAction
packages/db/seed-chinese-demo.ts — channel: email → chat
packages/db/seed-demo.ts — Math.random() → 0.88
```

### New Files (6)
```
apps/web/app/api/orgs/[slug]/metrics/ai/route.ts
apps/web/app/api/orgs/[slug]/conversations/[id]/messages/[messageId]/route.ts
apps/web/app/(dashboard)/analytics/ai-metrics.tsx
.github/workflows/ci.yml
docs/interview/ (10 files, ~25,000 字)
```

### Stats
- **15 core files**, +796 / −120 lines. 60+ UI bulk files. 6 new files. 10 interview docs.
- Build: green (web + worker, 0 TS errors). Tests: 54/54.
- CSS: −451 lines of glass morphism/liquid-glass/blur utilities. ~50 files aligned to enterprise flat tokens.
- AI metrics dashboard: 4-layer with null-placeholder pattern for missing data fields.

### Resolved from Previous TODOs
| Issue | Resolution |
|-------|------------|
| ~~Math.random() fake data~~ | BANT bars → real lead.score; confidence → fixed 0.88 |
| ~~Fake AI draft delays~~ | Removed; AbortController 30s timeout instead |
| ~~AI draft prompt injection gap~~ | `<user_data>` tags on history/latestInbound/lastOutbound |
| ~~`safe()` misuse on chat messages~~ | Removed from chat-messages route; only used in prompt context now |
| ~~Orphan inbox-detail-client.tsx~~ | Wired to `/inbox/[id]` route |
| ~~Messages no pagination~~ | Cursor-based `?cursor=&limit=50` API + frontend load-more |
| ~~score-lead sync DeepSeek~~ | Enqueued to scoringQueue (retry, PROMPT_ARMOR, metrics) |
| ~~No CI~~ | GitHub Actions 3 parallel jobs |
| ~~No reviewAction audit trail~~ | Message.reviewAction column + PATCH endpoint + dual-path write |
| ~~Glass morphism AI aesthetic~~ | 60+ files cleaned; enterprise flat design tokens |
| ~~No AI metrics dashboard~~ | Four-layer dashboard at /analytics?tab=metrics |

---

## Known Issues / TODOs

1. **CI/CD** — No GitHub Actions workflow. Tests run locally only.
2. **Sentry worker** — `@sentry/node` for the worker not yet installed.
3. **Credential rotation** — `.env.local` exposed in early git history. Rotate all secrets.
4. **Upstash Redis free tier** — 500K daily limit. Upgrade when scaling.
5. **Product analytics (PostHog)** — Planned for Phase 22.

## Phase 21 Extras (2026-07-07) — KB Expansion + Eval + QA

### KB 文档大幅扩充
- 11 份文档重写为密集中文 QA/表格/案例格式, ~16KB 精选内容
- 3 层架构 (核心层/销售参考层/运营支撑层) 在 KB 页面文件树可视化展示
- `seed-kb-to-db.ts`: 直接将 KB 文档解析→分块→embed→写入 PostgreSQL
  - 直接 fetch SiliconFlow API (绕开 monorepo workspace 解析问题)
  - 有 EMBEDDING_API_KEY → 写向量, 没有 → keyword search 兜底
  - 0-chunk 空壳自动删除重建

### RAG Eval 真实化
- 中文字符 bigram 匹配替代英文分词, 解决中文评测全零问题
- `scripts/test-kb-eval.ts`: 独立评测脚本, 104 KB chunks 对 15 题
- 基准分 Precision@5=0.617, 15/15 全命中
- Landing page 数字同步: "0.62 Precision@5 · 104 chunks · 15 题全命中"

### Embedding 升级
- SiliconFlow Qwen/Qwen3-Embedding-4B, Matryoshka 1536 维
- `embeddings.ts` 支持 `dimensions` 参数 (OpenAI 兼容)
- Vercel 部署: embedding 不可用→ keyword search 降级, 不 500

### Bug Fixes (今日)
- **keyword-search.ts snake_case→camelCase** (Vercel `column "document_id" does not exist`)
- **kb/ask 500**: `embedder.embed()` 加 try/catch, embedding 失败静默降级 keyword
- **Email/Chat 通道隔离**: inbox 消息按 `channel` 字段过滤, 两边不再互通
- **Vercel WebSocket 降级**: use-socket 自动检测 vercel.app→只 polling+不重连, 消除 WS 报错
- **Portal 中文化**: 导航/标题/资源中心全中文
- **Landing page CTA**: /docs 链接修复, hero video 上线, 按钮 token 统一

### Docs Reorganization
- 根目录 md 文件迁入 docs/ 子目录 (analysis/architecture/guides/reference)
- 根目录仅保留 CLAUDE.md + README.md

### Resolved from Previous TODOs
| Issue | Resolution |
|-------|------------|
| ~~Reranker dead code~~ | hybrid-retriever.ts unified pipeline |
| ~~KB API CRUD~~ | GET/PATCH/DELETE + reindex |
| ~~RAG Eval mock~~ | retriever-adapter + SalesAgent dataset + bigram matching |
| ~~No query rewriting/routing~~ | LLMQueryRewriter + LLMQueryRouter |
| ~~No low-confidence fallback~~ | Confidence Gate in hybrid-retriever |
| ~~QA semantic cache~~ | RedisSemanticCache (Phase 21) |
| ~~Incremental indexing~~ | SHA-256 content hash (Phase 21) |
| ~~WebSocket chat~~ | Socket.IO + ChatWindow + REST fallback (Phase 21) |
| ~~keyword-search snake_case~~ | Fixed → camelCase (Phase 21 Extra) |
| ~~Stripe billing~~ | Removed — internal OS |
| ~~API Key Bearer auth~~ | ApiKey Prisma model with SHA-256 hashing, proper indexes |
| ~~Auth rate limiting~~ | Defense-in-depth: middleware + per-route rate limits |
| ~~CSP unsafe-eval~~ | Removed from CSP |
| ~~Logger PII redaction~~ | Email/JWT pattern matching + SHA-256 hashing |
| ~~DOCX parser~~ | `mammoth` installed (Phase 18), `docx-parser.ts` functional |
| ~~Embedding fallback~~ | Hybrid search: pgvector + tsvector → RRF, regex fallback |
| ~~Worker client duplication~~ | `apps/worker/src/ai.ts` deleted, worker uses `@salesagent/ai-core` |
