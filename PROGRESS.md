# SalesAgent AI — Progress Report

> Last updated: 2026-07-05
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

## Known Issues / TODOs

1. **Stripe billing** — Not implemented.
2. **SSO/OAuth** — Not implemented (enterprise requirement).
3. **Upstash Redis free tier** — 500K daily limit. Upgrade when scaling.
4. **Reranker** — NoopReranker only. Cohere Rerank or Cross-Encoder can be plugged in when needed.
5. **Credential rotation** — `.env.local` exposed in early git history. Rotate all secrets.
6. **Sentry worker** — `@sentry/node` for the worker not yet installed.
7. **CI/CD** — No GitHub Actions workflow. Tests run locally only.

### Resolved from Previous TODOs

| Issue | Resolution |
|-------|------------|
| ~~API Key Bearer auth~~ | ApiKey Prisma model with SHA-256 hashing, proper indexes |
| ~~Auth rate limiting~~ | Defense-in-depth: middleware + per-route rate limits |
| ~~CSP unsafe-eval~~ | Removed from CSP |
| ~~Logger PII redaction~~ | Email/JWT pattern matching + SHA-256 hashing |
| ~~DOCX parser~~ | `mammoth` installed (Phase 18), `docx-parser.ts` functional |
| ~~Embedding fallback~~ | Hybrid search: pgvector + tsvector → RRF, regex fallback |
| ~~Worker client duplication~~ | `apps/worker/src/ai.ts` deleted, worker uses `@salesagent/ai-core` |
