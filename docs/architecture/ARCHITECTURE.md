# SalesAgent AI — Architecture Document (V2.2)

> 企业销售团队 AI 中枢操作系统 — 自研 RAG 管线 + WebSocket 实时聊天 + AI Agent 编排引擎
> 多租户 AI Agent 平台，覆盖 Web、Worker、Mobile 三大应用端和七层共享基础设施。
> ~34,000 行 | 470+ 文件 | 50+ API Routes | 16 数据模型
> 最新：Phase 22 — Inbox 全面加固 + 企业 UI 重构 + HITL 审计 + AI 四层指标体系 + CI/CD

---

## 目录

1. [系统总览](#1-系统总览)
2. [Monorepo 结构](#2-monorepo-结构)
3. [三层架构](#3-三层架构)
4. [数据模型](#4-数据模型)
5. [认证与安全](#5-认证与安全)
6. [多租户与权限](#6-多租户与权限)
7. [AI Agent 引擎](#7-ai-agent-引擎)
8. [RAG 知识库系统](#8-rag-知识库系统)
9. [对话收件箱](#9-对话收件箱)
10. [外呼活动引擎](#10-外呼活动引擎)
11. [异步任务队列](#11-异步任务队列)
12. [邮件系统](#12-邮件系统)
13. [前端架构](#13-前端架构)
14. [移动端](#14-移动端)
15. [设计系统](#15-设计系统)
16. [部署架构](#16-部署架构)

---

## 1. 系统总览

### 1.1 产品定位

SalesAgent AI 是一个 **多租户 AI Agent 平台**。不是单一用途的 AI SDR —— 而是一个可以承载多类垂直 Agent（销售、客服、礼宾、支持）的共享基础设施。

```text
Presentation Layer    apps/web + apps/mobile
Application Layer     ai-core + rag-core + api-client
Foundation Layer      domain + shared-types + db + ui-tokens
```

### 1.2 核心能力矩阵

| 能力域 | 功能 | 实现 |
|--------|------|------|
| **AI Agent** | 自动回复、线索评分、脚本生成、对话总结 | DeepSeek API + Agent 配置 |
| **RAG 知识库** | PDF/TXT/FAQ 上传 → 分块 → 嵌入 → 检索 → 引用 | pgvector + OpenAI Embeddings |
| **Conversation Inbox** | 多渠道统一收件箱、AI 草稿、SSE 实时推送 | Next.js + SSE |
| **Outbound Campaigns** | 外呼序列编排、延迟、重试、AI 个性化 | BullMQ + Redis |
| **Multi-tenant** | 组织隔离、4 角色 RBAC、10+ 权限 | Prisma org-scoped 查询 |
| **Mobile** | Dashboard + Inbox，共享类型和 API 客户端 | Expo + React Native |
| **Design System** | 统一设计令牌，Web + Mobile 共享颜色/字体 | ui-tokens 包 |

### 1.3 技术栈

```
用户界面层
  Web:     Next.js 14 · React 18 · Tailwind CSS · glass morphism
  Mobile:  Expo 52 · React Native · shared design tokens

应用层
  AI Core: DeepSeek 客户端 · 提示词构建器 · Agent 执行函数
  RAG Core: 文档解析 · 分块 · 嵌入 · pgvector 存储 · 检索 · 引用
  API Client: 类型安全 fetch 客户端 (cookie + bearer 认证)

基础设施层
  Database: PostgreSQL (Supabase) + pgvector
  Queue:    BullMQ + Upstash Redis (4 队列, prefix: "sales-agent")
  Email:    Resend (AI 组合 + 模板引擎)
  Auth:     自定义 JWT (jose) + bcryptjs + httpOnly cookies
```

---

## 2. Monorepo 结构

```
apps/
  web/                          — Next.js 14 App Router
  │   ├── app/
  │   │   ├── (auth)/           — 登录/注册
  │   │   ├── (dashboard)/      — home, inbox, leads, agents, campaigns,
  │   │   │   kb/               —     scripts, analytics, kb, settings
  │   │   │   kb/playground/    — KB Q&A playground
  │   │   ├── page.tsx          — 公开落地页
  │   │   └── api/              — 40+ Route Handlers + SSE
  │   ├── components/
  │   │   ├── ui/               — 11 基础组件
  │   │   ├── nav/              — 侧边栏、PageTitle、移动端导航
  │   │   ├── inbox/            — 收件箱组件
  │   │   ├── agents/           — Agent 配置组件
  │   │   ├── identity/         — Avatar, Presence, IdentityCard
  │   │   └── leads/            — 线索组件
  │   └── lib/                  — 运行时函数（auth, session, permissions 等）
  │
  worker/                        — BullMQ Worker (独立 Node.js 进程)
  │   └── src/
  │       ├── index.ts          — 4 个 Worker: conversation, email, campaign, scoring
  │       ├── queue.ts          — Redis 连接 + 队列定义
  │       └── email.ts          — Resend 邮件发送
  │
  mobile/                        — Expo App (新)
      └── app/
          ├── _layout.tsx       — 根布局 + 主题
          ├── login.tsx         — 登录
          └── (tabs)/
              ├── index.tsx     — Dashboard (KPI 卡片)
              └── inbox.tsx     — 对话列表

packages/
  shared-types/                  — API 合约类型 (wire format only)
  domain/                        — 业务实体和规则 (LeadStage, CampaignStatus 等)
  ui-tokens/                     — 设计令牌 (色彩/字体/间距/阴影/Tailwind preset)
  ai-core/                       — 统一 AI 层 (client + prompts + agents)
  rag-core/                      — RAG 管线 (parse → chunk → embed → retrieve → cite)
  api-client/                    — 类型安全 API 客户端 (web + mobile 共享)
  db/                            — Prisma 6 schema + pgvector (14 models)
```

---

## 3. 三层架构

### Presentation Layer

```
apps/web (Next.js 14)          apps/mobile (Expo)
  ├── Server Components (数据获取)  ├── React Native 组件
  ├── Client Components (交互)      ├── 共享 api-client
  ├── API Routes (40+)             ├── 共享 ui-tokens
  └── SSE (实时推送)                └── 共享 domain 实体
```

### Application Layer

```
packages/ai-core                packages/rag-core
  ├── client.ts                    ├── parser/      (PDF/DOCX/TXT/FAQ)
  │   └── DeepSeek API 调用         ├── chunker.ts   (递归字符分割)
  ├── prompts.ts                   ├── embeddings.ts(可插拔提供者)
  │   └── 4 系统提示 + 4 构建器      ├── indexer.ts   (编排分块→嵌入→存储)
  └── agents.ts                    ├── storage.ts   (适配器接口 + InMemory)
      └── composeResponse()         ├── pgvector-storage.ts (生产)
      └── scoreLead()              ├── retriever.ts (余弦相似度 + 关键词回退)
      └── generateScript()         ├── sources.ts   (引用生成)
      └── summarizeConversation()  └── reranker.ts  (接口 + Noop 实现)

packages/api-client
  ├── client.ts (fetch 封装, cookie/bearer 认证)
  └── endpoints/ (8 模块: auth, leads, conversations, campaigns,
                   agents, scripts, analytics, organizations)
```

### Foundation Layer

```
packages/domain                 packages/shared-types
  ├── lead.ts                      ├── auth.ts (JWT, Session, API 形状)
  │   └── LeadStage, TRANSITIONS   ├── api.ts  (LeadResponse, 等)
  ├── campaign.ts                  ├── ai.ts   (DeepSeek 消息, 结果)
  │   └── CampaignStatus           ├── permissions.ts (Role, Permission)
  ├── conversation.ts              ├── presence.ts
  └── agent.ts, org.ts, activity.ts└── feature-flags.ts

packages/ui-tokens              packages/db
  ├── colors.ts (企业绿调色板)        ├── schema.prisma (14 models)
  ├── typography.ts                ├── index.ts (PrismaClient 单例)
  ├── spacing.ts                   └── setup-vector.mjs (pgvector)
  ├── shadows.ts
  └── tailwind-preset.ts
```

---

## 4. 数据模型

### 4.1 实体关系图

```
User ──< Membership >── Organization ──< ApiKey
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    Agent ──< Conversation ──< Message    Document ──< DocumentChunk
          │                   │                   │     (pgvector + tsvector)
    Campaign ──< CampaignRun  Lead ──< LeadActivity   AICallMetric
          │                                         (token, latency, cost)
    Script              FeatureFlag (per-org, rollout%, promptVersion)
```

### 4.2 模型清单 (15 模型)

| 模型 | 用途 | 主要字段 |
|------|------|---------|
| **User** | 登录标识 | email, passwordHash (bcrypt 12轮), emailVerified |
| **Organization** | 多租户工作空间 | name, slug |
| **Membership** | 用户-组织关系 | role (owner/admin/operator/viewer) |
| **ApiKey** | API 密钥 (V1.7) | name, prefix, hashedKey (SHA-256), lastUsedAt |
| **Agent** | AI 代理配置 | personality, goals, knowledgeBase, isActive |
| **Lead** | CRM 线索 | name, email, company, stage, score, source |
| **LeadActivity** | 线索活动日志 | type, content, metadata |
| **Conversation** | AI 对话线程 | leadId, agentId, channel, status (active\|awaiting_approval\|approved\|closed\|archived) |
| **Message** | 对话消息 | direction, content, aiMetadata |
| **Script** | 话术模板 | name, category, steps (JSON) |
| **Campaign** | 外呼活动 | scriptId, agentId, targetAudience, stats |
| **CampaignRun** | 活动执行记录 | status, recipientCount, stats |
| **Document** | KB 文档 | name, type, status, chunkCount |
| **DocumentChunk** | KB 分块 | content, chunkIndex, embedding (pgvector), searchVector (tsvector) |
| **AICallMetric** | AI 调用指标 (V1.8) | jobType, promptTokens, completionTokens, llmLatencyMs, success, fallbackUsed, requestId |
| **AuditLog** | 不可变审计日志 | action, targetType, targetId, metadata |
| **FeatureFlag** | 功能开关 (V1.7) | key, enabled, rolloutPercent, rules (JSON, 含 promptVersion) |

### 4.3 Pipeline 阶段

```
new → contacted → qualified → proposal → negotiation → closed_won
                                                    → closed_lost
```

---

## 5. 认证与安全

### 5.1 认证流程

```
注册: email + password → 邮箱验证链接 → JWT + httpOnly cookie
登录: email + password → JWT + httpOnly cookie (7天)
登出: 清除 cookie + JWT 列入 Redis 黑名单
```

### 5.2 请求守卫链

```
请求 → middleware.ts
  ├── 公开路径? → 放行
  ├── IP 提取 (TRUSTED_PROXY_RANGES 验证)
  ├── Auth 限流 (Redis 10 req/min login, 5 reg, 20 verify)
  ├── API 限流 (Redis 100 req/min)
  ├── API 版本化头 (非 v1 路径加 Deprecation 头)
  ├── JWT 验证 + 黑名单检查 (可 fail-closed)
  ├── API 路由: 401 JSON (非 302 重定向)
  └── Route Handler → getSession() → 权限检查 → org-scoped 查询
```

### 5.3 安全清单

| 层级 | 措施 | 文件 |
|------|------|------|
| 传输 | HTTPS, HSTS, Secure cookies | `next.config.js` |
| 注入 | React XSS 转义, Prisma 参数化查询 | 全局 |
| AI 注入 | `PROMPT_ARMOR` + `<user_data>` 标签 | `ai-core/prompts.ts` |
| JWT | HS256 + 强制密钥 + Redis 黑名单 (fail-closed 选项) | `lib/auth.ts` |
| 限流 | Upstash 滑动窗口 (API 100/min, auth 10/min) + 内存 TTL 回退 | `lib/rate-limit.ts` |
| 验证 | 19 Zod schemas, 全部变更端点 | `lib/validation.ts` |
| PII | SHA256 哈希日志 + 自动脱敏 (email/JWT 模式) | `lib/logger.ts` |
| 上传 | 10MB 上限 + 魔数校验 (PDF/TXT/JSON/MD) | `kb/upload/route.ts` |
| 密码 | Bcrypt 12 轮 + 登录时自动 re-hash 旧密码 | `lib/password.ts` |
| CSP | `unsafe-eval` 已移除, `unsafe-inline` 用于 Next.js 内联脚本 | `next.config.js` |

---

## 6. 多租户与权限

### 6.1 角色定义

| 角色 | 权限 |
|------|------|
| **Owner** | 完全控制，包括删除组织 |
| **Admin** | 管理成员、Agent、线索、活动 |
| **Operator** | 管理 Agent、线索、活动（不可删除） |
| **Viewer** | 只读所有数据 |

### 6.2 租户隔离

```typescript
// 所有查询都在 organizationId 范围内
const data = await prisma.conversation.findMany({
  where: { organizationId: membership.organizationId },
});
```

---

## 7. AI Agent 引擎

### 7.1 Agent 配置模型

```typescript
interface AgentConfig {
  name: string;
  personality: { tone, style, methodology };
  goals: Array<{ type, priority, successCriteria }>;
  knowledgeBase: { productDescription, pricing, faq, competitors };
  constraints: { maxMessagesPerDay, workingHours };
}
```

### 7.2 AI 管线 (统一在 ai-core)

```
composeResponse()     — 回复组合 (temperature 0.7)
scoreLead()           — 线索评分 (temperature 0.3, 5 BANT/MEDDIC 维度)
summarizeConversation() — 对话总结
generateScript()      — 脚本生成
```

### 7.3 Prompt 版本管理 (V1.8)

每个 prompt 有版本注册表 (`prompt-registry.ts`)，支持 Feature Flag 驱动的灰度切换：

```
PROMPT_REGISTRY.compose_response
  ├── v1 (2025-06-01) — 当前默认
  ├── v2 (待注册)     — A/B Test 候选
  └── current: "v1"   ← Feature Flag 可覆盖为 "v2"
```

通过 `getPromptVersionFlag("compose_prompt_version", orgId)` 读取 DB 或 env var 中的版本选择，配合 `rolloutPercent` 实现按用户 hash 分桶的渐进推出。

### 7.4 AI 调用指标 (V1.8)

每次 LLM 调用后写入 `AICallMetric` 表，记录：
- **延迟**: P50/P95 across all calls
- **Token**: prompt/completion tokens, estimated cost (DeepSeek $0.14/$0.28 per 1M)
- **质量**: success/failure, fallback triggers, retry count
- **追踪**: requestId 全链路关联 (HTTP → Queue → LLM → DB)

### 7.5 安全装甲

所有用户数据包裹在 `<user_data>...</user_data>` 标签中。PROMPT_ARMOR 前缀指示模型永不执行用户数据内的指令。

---

## 8. RAG 知识库系统 (V2.0 — Unified Pipeline + Semantic Cache + Incremental Indexing)

### 8.1 管线 (V1.9 — Hybrid Search + Reranker + AI Draft Integration)

```
PDF/DOCX/TXT/MD/FAQ
       ↓
  parser.ts    — 类型检测 → 特定解析器 (pdf-parse v2 PDFParse 类, mammoth DOCX)
       ↓
  chunker.ts   — 递归字符分割 (段落 → 句子 → 固定大小)
       ↓
  indexer.ts   — 编排分块 → 嵌入 → 存储
       ↓
  embeddings.ts — 文本 → 向量 (OpenAI 兼容, 可插拔)
       ↓
  pgvector + tsvector — 存储分块 + 嵌入向量 + 全文搜索向量 (org-scoped)
       ↓
  Hybrid Retrieval (Parallel):
    ├── Vector:  query → embedding → pgvector <=> 余弦相似度 → top-10
    └── Keyword: query → ts_rank(to_tsquery) → top-10
       ↓
  RRF Fusion (k=60): 1/(60+rank) 分数融合 → top-5
       ↓
  sources.ts   — 分块 → 源引用
```

### 8.2 评估框架 (V1.8)

`pnpm --filter @salesagent/rag-core eval` — 20 条 Golden Dataset:
- **Retrieval 指标**: Precision@5, Recall@5, MRR, NDCG@5 (纯计算)
- **Generation 指标**: Faithfulness, Answer Relevancy (LLM-as-Judge, CLI 边界注入)
- `--retrieval-only` 跳过 LLM judge, 仅跑纯计算指标

### 8.3 API 路由

| 方法 | 路径 | 权限 | 描述 |
|------|------|------|------|
| POST | `/api/orgs/{slug}/kb/upload` | manage_agents | 上传文档 → 管线 |
| POST | `/api/orgs/{slug}/kb/ask` | view_agents | 提问 → 检索 → LLM 回答 |
| GET | `/api/orgs/{slug}/kb/documents` | view_agents | 列出已索引文档 |

### 8.4 RAG 赋能 AI 草稿 (V1.9)

收件箱的「AI 草稿」按钮不仅读对话历史，还会先检索知识库：
```
客户最新消息 -> searchKnowledgeBase() -> Hybrid Search -> RRF -> Top-5 chunks
             + 完整对话历史 + Agent 配置 -> DeepSeek -> 基于 KB 事实的回复草稿
```
AI 被明确告知「产品/定价/竞品必须从知识库引用，KB 没有的诚实说不知道」，大幅减少幻觉。

### 8.5 设计决策

- **Hybrid Search**: pgvector 余弦 + tsvector FTS → RRF 融合。向量捕捉语义相似，BM25 捕捉精确关键词匹配，两者互补
- **嵌入可选**: 无 EMBEDDING_API_KEY 时快速回退到 PostgreSQL ~* 关键词搜索
- **多租户**: 分块标记 `organizationId`，检索限定 org 范围
- **重排序器 (V1.9)**: CohereReranker (rerank-multilingual-v3.0) — 有 COHERE_API_KEY 时自动启用，失败降级到 NoopReranker。createReranker() 工厂函数零配置。
- **pgvector + tsvector**: 都在 PostgreSQL 内，一次查询同时做向量+全文搜索，零额外基础设施
- **评估**: Golden Dataset (20 Q&A) + 4 retrieval metrics + 2 generation metrics (LLM judge), 可 CI 运行
- **知识库文档 (V1.9)**: 6 份启云科技 KB 文件 (产品介绍/定价/FAQ/异议处理/客户案例/竞品对比，~40KB) 用于 RAG 测试和演示

### 8.6 RAG Pipeline 2.0 (Phase 20-21)

```
Query → [Query Rewriter] → [Query Router] → [Semantic Cache?]
         3 variants          6 categories       Redis exact+semantic
              ↓                    ↓              ↓ hit → return cached
         [Hybrid Search: Vector + Keyword]    [Miss → Full Pipeline]
              ↓
         [RRF Fusion k=60] → [Confidence Gate] → [Cohere Reranker] → Results
                                 ↓ (<0.7)
                          [Secondary Retrieval]
```

- **查询改写 (Phase 20)**: DeepSeek 生成 3 变体 — 原始/关键词/同义改写。`LLMQueryRewriter` (可插拔, 失败降级 Noop)
- **问题路由 (Phase 20)**: 6 分类 (faq/product/pricing/competitor/case/general) → 差异化检索参数 (`CATEGORY_PARAMS`)
- **置信度门控 (Phase 20)**: top-1 < 0.7 → 自动 expanded search (topK×3) → 去重合并 → 第二次 RRF
- **语义缓存 (Phase 21)**: Redis 两层缓存 — SHA-256 exact match + embedding cosine ≥0.95. FAQ 命中率 60%+, 延迟 2s→50ms
- **增量索引 (Phase 21)**: SHA-256 content hash → 完全一致 skip / 同名更新 (删旧+重建) / 新文档正常索引. 上传后自动 invalidate cache

### 8.7 实时聊天 (Phase 21)

- **WebSocket (Socket.IO)**: Standalone server (port 3001), JWT cookie 验证, Room-based per conversationId
- **ChatWindow 组件**: 复用组件 — Portal (客户) + Dashboard (Agent) 共用, 连接状态栏 + 正在输入动画
- **REST Fallback**: `POST/GET chat-messages` API — Vercel serverless 不支持 WebSocket 时自动降级到 HTTP polling

---

## 9. 对话收件箱 (V2.2 — Enterprise UI + HITL Audit)

双页面模式：
- `/inbox` — 两栏 (列表 + 详情), `setSelectedId()` state 切换, `InboxClient`
- `/inbox/[id]` — 三栏 (列表 + 消息 + AI 智能分析面板), `InboxDetailClient`

左侧列表: 5 筛选标签 (all\|active\|⏳ Needs Review\|needs_reply\|closed), 计数徽章
右侧详情: IdentityCard(expanded) + Email/Chat toggle + 消息流 (cursor分页) + compose 区
Email 模式: Textarea + AI 草稿虚线气泡 (发送/丢弃/重新生成) + 翻译按钮
Chat 模式: ChatWindow (WebSocket + REST fallback), AI 草稿同 Email 模式气泡

### HITL 状态机

```
active → inbound received → [AI drafts] → awaiting_approval
                                              ├── [Approve] → reviewAction="approved" → 发送
                                              ├── [Reject]  → reviewAction="rejected" → active
                                              └── [24h timeout] → active (draft expired)
```

### reviewAction 审计 (Phase 22)
- `Message.reviewAction`: "approved" | "rejected" | null
- 双路径写入: 客户端草稿 POST 时带 + Worker 草稿 PATCH 单独写
- HITL 审核决策全量可追溯 → draftAdoptionRate 可在数据积累后自动聚合

### 消息分页 (Phase 22)
- `GET /messages?cursor=&limit=50` — cursor-based, `take: limit+1` 防边界误判
- 前端 `loadMoreMessages()` + scrollHeight 位移保持滚动位置
- 初始 SSR load: `take: 50` — 防止大对话 TTFB 爆炸

---

## 10. 外呼活动引擎

三种模式: Cold Outreach, Re-engagement, Trigger-based

```
Campaign "Start" → 受众解析 → BullMQ 分派 → Worker 执行步骤
  → AI 个性化 → Resend 发送 → 追踪 → 下一延迟步骤
  → 回复检测 → 停止序列 → 创建对话
```

---

## 11. 异步任务队列 (V1.8 — Idempotent)

4 个 BullMQ 队列 (prefix: `sales-agent`):
- `conversation-jobs` → AI 回复组合 (concurrency: 5)
- `email-jobs` → 邮件投递 (concurrency: 5)
- `campaign-jobs` → 活动序列执行 (concurrency: 3)
- `scoring-jobs` → 线索评分 (concurrency: 3)

重试: 3 attempts, 指数退避 (2^n s, max 60s) | 健康检查: HTTP `/health` + `.worker-health.json`

### 幂等性 (V1.8)

所有 4 个队列通过 `JobContext.requestId` + Redis SET NX 实现 exactly-once 处理：
- 相同的 `requestId` 重复入队 → 第二个 job 检测到已处理 key → skip
- 幂等 key TTL: 24h, 降级: fail-open (Redis 不可用时跳过检查)
- `dedup.ts` 封装 `checkAndMarkDedup()` 函数

---

## 12. 邮件系统

- Resend SDK + AI 组合
- `{{lead.name}}` 模板变量解析 (防原型污染)
- 打开/点击追踪
- 回复检测通过 Resend webhook

---

## 13. 前端架构

### 13.1 渲染策略

- **Server Components**: 数据获取、会话验证、权限检查
- **Client Components**: 交互、状态管理、API 调用、SSE、动画

### 13.2 状态管理

| 工具 | 用途 |
|------|------|
| **TanStack Query** | 数据缓存、乐观更新 |
| **Zustand** | Inbox 状态、Agent 配置草稿 |
| **SSE** | 新消息实时推送 |

### 13.3 Identity Stack

```text
IdentityCard
├── Avatar (Pravatar.cc 真实人像 + 渐变首字母回退)
├── PresenceDot (online/idle/ai-processing/handoff-required/...)
├── CustomerMeta (姓名, 公司, 邮箱)
├── AIState ("AI handling · 92% confidence")
├── LeadIntent (评分条 + hot/warm/cold)
└── ActivityTimestamp (相对时间)
```

---

## 14. 移动端

Expo SDK 52 + Expo Router 4 — **Club Concierge Showcase**:

### 定位
Mobile 是独立的 Demo/Showcase 层，用 Club Concierge 叙事让客户在 3 分钟内相信产品。

```
Web = 真实产品（不改业务逻辑）
Mobile = Showcase 层（Club Concierge 叙事）+ 可选 Live 模式（接真实 API）
Landing Page = 通用 AI Platform 定位
```

### 7 个页面

| 页面 | 路由 | 叙事 |
|------|------|------|
| **Login** | `/login` | 真实 API 登录 + loading/error 状态 + "Enter Demo →" 绕过 |
| **Dashboard** | `/(tabs)/` | Members, Bookings, AI Resolve, Demo/Live Toggle |
| **Inbox** | `/(tabs)/inbox` | AI 自动回复，AI Confidence % |
| **Inbox Detail** | `/(tabs)/inbox/[id]` | AI 回复 + Source Citation |
| **Knowledge Base** | `/(tabs)/kb` | 文档列表 + Stats + Upload Pipeline + Playground 入口 |
| **AI Playground** | `/playground` | ⭐ 6 步 RAG Pipeline 可视化 |
| **System Overview** | `/system` | 多租户、架构层、技术栈 |

### 架构

```
apps/mobile/
  hooks/           use-theme.ts, use-demo-mode.tsx (默认 "live" 在生产构建)
  components/      10 个组件（含真实人像头像）
  data/            5 个 mock 数据文件 + barrel export（demo 模式回退）
  app/             Expo Router 文件路由
```

### Demo/Live 模式

- **Demo**: 使用本地 mock 数据，零网络依赖，适合展示
- **Live**: 调用 `/api/v1/` 真实 API（cookie 认证），登录页面线真实 auth
- 切换立即生效，无页面刷新
- 共享包: shared-types, domain, api-client, ui-tokens
- 主题: 自动亮/暗模式, Corporate Green 调色板
- 设计: 大留白、软阴影、无边框卡片、Linear/Notion 产品美学

---
## 17. API 版本化 (V1.7 新增)

```
/api/auth/login     → /api/v1/auth/login (通过 Next.js rewrites)
/api/orgs/{s}/leads → /api/v1/orgs/{s}/leads

非版本化路径（/api/...）= 可用但标记 Deprecation / Sunset 头
版本化路径（/api/v1/...）= 推荐使用
```

**零路由重复** — rewrites 映射 `/api/v1/:path*` → `/api/:path*` 内部处理。

---
## 18. 错误追踪与容错 (V1.7 新增)

- **Sentry**: `@sentry/nextjs`（仅当 `SENTRY_DSN` 设置时激活，可 graceful opt-in）
- **集中式错误处理**: `lib/api-error.ts` — 类型化状态码映射 (Zod→400, Not Found→404, Unique→409)
- **错误边界**: 全部 11 个仪表盘路由有 `error.tsx` + 根级 `app/error.tsx` + `app/global-error.tsx` + 可复用 `ErrorBoundary` 组件
- **功能开关**: DB-backed FeatureFlag 模型，支持 per-org 切换、rollout%、角色/用户定向规则 (含 promptVersion)。内存缓存 60s TTL。env-var 回退。

---

## 19. AI Observability (V1.8 新增)

### 19.1 AI 调用指标

`AICallMetric` 模型记录每次 LLM 调用：

| 字段 | 内容 |
|------|------|
| `jobType` | compose_response / score_lead / summarize_conversation / generate_script / campaign_ai / kb_ask |
| `promptTokens` / `completionTokens` / `totalTokens` | DeepSeek API usage |
| `llmLatencyMs` / `totalLatencyMs` | 纯 LLM 延迟 / 端到端延迟 |
| `success` / `fallbackUsed` / `errorType` | 成功/降级/失败 |
| `requestId` | HTTP→Queue→LLM→DB 全链路追踪 |
| `estimatedCostUSD` | (promptTokens×$0.14 + completionTokens×$0.28) / 1M |

### 19.2 AI Health Dashboard

`/analytics?tab=ai` — 代理视角:
- **Sales**: 原有 Pipeline、Campaign 指标
- **AI Health**: P50/P95 延迟, 总成本, 成功率, 回退率, 按 jobType 分组的调用量/延迟/成本, 30 天 token 趋势, 告警 (延迟 >10s, 回退 >10%)

### 19.3 AI 四层指标看板 (Phase 22)

`/analytics?tab=metrics` — 质量视角:
- **系统层**: P50/P95 (`percentile_cont` 原始 SQL), AI 回复总量, KB 命中率 (待接入)
- **能力质量层**: 每日 AI 调用量趋势, KB 命中率趋势 (待接入)
- **业务结果层**: 对话状态分布, AI 参与率 (handoffRate), 草稿采纳率 (draftAdoptionRate, 数据积累中)
- **风险指标层**: 超时中断次数 (errorType ILIKE '%timeout%'), 置信度门控触发次数 (待接入)
- 数据源: `GET /api/orgs/{slug}/metrics/ai?days=7` → AICallMetric + Conversation + Message.aggregate
- Null placeholder 模式: 缺失字段返回 `null` → 前端显示 "数据待接入" (非 0 或空白)

### 19.3 分布式追踪

`requestId` 从 HTTP Request 注入 BullMQ Job (`JobContext.requestId`)，Worker 处理后写入 AICallMetric 和日志：

```
HTTP Request (x-request-id or UUID)
  → BullMQ Job (context.requestId)
  → Worker log (JSON: requestId + spanId)
  → DeepSeek API (requestId in error)
  → AICallMetric (requestId column)
  → DB write (conversation/message)
```

同一个 requestId 可在 Vercel logs + Worker logs + AICallMetric 表中串联全链路。

---

## 15. 设计系统 (V2.2 — Enterprise Flat)

Phase 22 完成全面重构，从 glass morphism → Linear/Stripe/Ramp 风格的企业级扁平设计。

### 15.1 设计令牌 (CSS 自定义属性)

| Token | Light | Dark | 用途 |
|-------|-------|------|------|
| `--bg` | `#F8F9FA` | `#0A1108` | 页面背景 |
| `--bg-card` | `#FFFFFF` | `#111A0E` | 卡片表面 |
| `--bg-subtle` | `#F3F4F6` | `#1A2617` | 输入框, hover 背景 |
| `--border` | `#E5E7EB` | `#1F2F1B` | 标准边框 |
| `--text-primary` | `#111827` | `#F9FAFB` | 主文本 |
| `--text-secondary` | `#374151` | `#D1D5DB` | 次要文本 |
| `--text-muted` | `#6B7280` | `#9CA3AF` | 辅助文本, 标签 |
| `--accent` | `#166534` | `#4ADE80` | CTA, 激活态 |
| `--accent-subtle` | `#F0FDF4` | `#052E16` | 微绿背景 |
| `--accent-text` | `#166534` | `#86EFAC` | 绿色文本 |

### 15.2 组件规范

- **卡片**: `rounded-md border border-[var(--border)]` — 无 glass, 无 backdrop, 无发光阴影
- **按钮**: `rounded-md transition-colors` — 无 `active:scale`, 无 `shadow`, 无 `ring`
- **Badge**: `rounded px-1.5 py-0.5` — 无 `rounded-full`, 无 border gloss
- **数字**: 全部 `tabular-nums` — 防止数字跳动
- **Hover**: 只改 `bg`, 不改 `shadow` / `scale` / `translate-y`

### 15.3 已淘汰

- `.glass-card`, `.glass`, `.liquid-glass` 全部删除
- `backdrop-blur-*`, `shadow-xl/lg`, `rounded-2xl/3xl`, `animate-ping/bounce`
- 装饰性渐变 (`bg-gradient-to-*` 用于卡片/侧栏)
- 图标渐变背景容器
- KPI "霓虹数字" 效果 (`bg-clip-text text-transparent`)

---

## 16. 部署架构

```
                      ┌──────────────┐
    users ──────────→ │   Vercel     │ ← Next.js Web App
                      │   (US-East)  │
                      └──────┬───────┘
                             │
                 ┌───────────┼───────────┐
                 │           │           │
           ┌─────┴─────┐ ┌──┴──────┐ ┌──┴──────────┐
           │  Supabase │ │ Upstash │ │  DeepSeek   │
           │ PostgreSQL│ │  Redis  │ │  API        │
           │ + pgvector│ │         │ └─────────────┘
           └─────┬─────┘ └────────┘
                 │
           ┌─────┴─────┐
           │  Railway  │ ← BullMQ Worker
           │  (US)     │   AI + Campaigns + Email
           └───────────┘
```

---

## 附录: 命令速查

```bash
pnpm dev                        # Web 开发服务器
pnpm dev-worker                 # Worker 启动
pnpm build                      # Turborepo 全量构建
pnpm seed-demo                  # Acme Corp demo 数据
pnpm seed-prod <slug>           # 幂等种子数据
node packages/db/setup-vector.mjs  # 启用 pgvector
pnpm --filter @salesagent/web test       # 52 单元测试
pnpm --filter @salesagent/web test:e2e   # 5 E2E 测试
```
