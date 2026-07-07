<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/pgvector-Hybrid%20Search-4169E1?logo=postgresql" />
  <img src="https://img.shields.io/badge/Socket.IO-Real--time-010101?logo=socket.io" />
  <img src="https://img.shields.io/badge/BullMQ-4%20Queues-DC2626" />
  <img src="https://img.shields.io/badge/Redis-Idempotent-red?logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/ReAct-Agent%20Executor-8B5CF6" />
  <img src="https://img.shields.io/badge/RAG-Hybrid%20Retrieval-4F46E5" />
  <img src="https://img.shields.io/badge/Resend-Email-7C3AED" />
  <img src="https://img.shields.io/badge/DeepSeek-AI-4F46E5" />
  <img src="https://img.shields.io/badge/Sentry-Observability-362D59?logo=sentry" />
  <img src="https://img.shields.io/badge/Vercel-Web%20Deploy-black?logo=vercel" />
  <img src="https://img.shields.io/badge/Railway-Worker-0B0D0E?logo=railway" />
  <img src="https://img.shields.io/badge/Phase-21-22C55E" />
</p>

<h1 align="center">SalesAgent AI</h1>

<p align="center">
  <strong>企业销售团队的 AI 中枢操作系统</strong>
</p>

<p align="center">
  自研 RAG 检索管线 · WebSocket 实时聊天 · AI Agent 编排引擎 · 多租户 RBAC · 全链路可观测
</p>

<p align="center">
  TypeScript 全栈 · ~32,000 行 · 440+ 文件 · 21 个 Phase 持续迭代
</p>

---

## 这是什么

SalesAgent AI 是一个**企业内部的销售运营 OS 平台**。它不是对外售卖的 SaaS 产品，也不是 LangChain demo——它是一个真实的、工程化落地的 AI 系统。

核心理念：**AI 辅助而非替代**。AI 负责线索评分、回复起草、知识检索、活动编排等重复性工作，人类销售负责关系建立和最终决策。Human-in-the-Loop 贯穿全流程。

### 三层架构

```
表示层   →  Next.js 14 (App Router)  +  Socket.IO 实时聊天  +  Expo Mobile
应用层   →  AI Core (6 大能力 + ReAct Agent)  +  RAG Core (六阶段检索管线 + 评测框架)
基础层   →  Domain 实体 + Shared Types + PostgreSQL + pgvector + tsvector
```

### AI 工程亮点

| 能力 | 实现 | 为什么重要 |
|------|------|-----------|
| **RAG 检索管线** | 查询改写 → 问题路由 → 混合检索(pgvector+tsvector→RRF) → Cohere Reranker → 置信度门控 → 语义缓存 | 不是"扔向量搜一下"，是六阶段完整信息检索管线 |
| **评测框架** | 30 条 Golden Dataset + 4 检索指标 + LLM-as-Judge 生成评测，连接生产 PgVector 做真实评测 | 每次调参有量化反馈，不是凭感觉 |
| **双通道沟通** | Email (Resend + HITL 审批) + WebSocket 实时聊天 (Socket.IO, REST polling 降级) | 同一 Inbox 一键切换 Email/Chat |
| **Agent 引擎** | ReAct Agent (Thought→Action→Observation), 4 内置 Tool, AgentThinkingPanel 可视化 | 自主推理，推理链路透明 |
| **Prompt 安全** | PROMPT_ARMOR + `<user_data>` 标签 + HITL 审批 | AI 起草但不发送，人类做最终决策 |
| **AI 可观测性** | AICallMetric 模型：Token、延迟、成本、requestId 全链路追踪 | 每次 AI 调用可追溯 |
| **语义缓存** | Redis 两层缓存 (SHA-256 exact + cosine ≥0.95) | FAQ 命中 60%+，延迟 2s→50ms |
| **增量索引** | SHA-256 内容寻址：上传查重、同名更新自动重建、缓存自动失效 | 文档更新不重建全量 |
| **多租户 RBAC** | 5 角色 × 13 权限，数据 org-scoped 隔离，Customer Portal 独立认证 | 企业内部多团队协作 |
| **降级设计** | Embedding→Keyword、Cohere→Noop、Redis→内存，每层有 fallback | 系统不会因单个外部服务挂掉而完全不可用 |

---

## 平台功能

### AI Agent
配置 Agent 的个性化特征、知识库和目标。每个 Agent 自主处理对话——评分线索、回答问题、起草回复。ReAct Agent 支持多步推理和工具调用。

### RAG 知识库
上传 PDF、DOCX、FAQ、Markdown——系统自动解析、分块、向量化、双索引存储。检索时走完整六阶段管线，AI 回答带引用溯源。12 份文档分 3 层架构（核心层/销售参考层/运营支撑层）。

```
查询 → 改写 → 路由 → 混合检索 → RRF 融合 → Reranker → 置信度门控 → 生成 + 引用
```

### 对话收件箱
统一 Split-Pane 界面。Email 和 Chat 双通道一键切换。AI 草稿 + HITL 审批流——Agent 审核后才发送。ReAct 推理链路可视化面板。

### 外呼活动引擎
多步骤序列编排——每步骤支持 AI 个性化改写。BullMQ 延迟执行，自动回复检测暂停序列。幂等去重防止重复发送。

### AI Health Dashboard
实时 Token 消耗趋势、P50/P95 延迟、成本归因、回退率告警。requestId 全链路串联（HTTP → Queue → LLM → DB）。

### 客户端门户
客户独立登录（JWT 双路径认证），查看自己的对话历史，与 Agent 实时聊天。

### Mobile App
Expo 52 + React Native。Dashboard + Inbox + KB + AI Playground（6 步 RAG 管线可视化）。Demo/Live 双模式。

---

## 技术栈

| 层 | 技术 |
|----|------|
| **Web** | Next.js 14 App Router, React 18, Tailwind CSS, Socket.IO |
| **Mobile** | Expo SDK 52, React Native |
| **语言** | TypeScript (strict) |
| **设计** | 企业绿调色板 (Corporate Green), Glass Morphism, Inter 字体 |
| **数据库** | PostgreSQL 16 (Supabase) + pgvector + tsvector 全文搜索 |
| **ORM** | Prisma 6 |
| **队列** | BullMQ + Upstash Redis (4 队列, 幂等, prefix: `sales-agent`) |
| **实时通信** | Socket.IO (WebSocket → HTTP long-polling 自动降级) |
| **邮件** | Resend (AI 组合 + 模板引擎) |
| **AI** | DeepSeek API (6 大能力 + ReAct Agent) |
| **RAG** | Hybrid: pgvector cosine + tsvector FTS → RRF k=60 + Cohere Reranker |
| **可观测性** | AICallMetric + AI Health Dashboard + Sentry + 结构化日志 + requestId 分布式追踪 |
| **认证** | 自定义 JWT (jose) + bcryptjs 12 轮 + httpOnly Cookies + Redis 黑名单 |
| **Monorepo** | pnpm workspaces + Turborepo |
| **部署** | Vercel (Web, Serverless) + Railway (Worker, 长期容器) |

---

## 项目结构

```
apps/
  web/       — Next.js 14 (App Router, 50+ API Routes, Socket.IO Chat Server)
  worker/    — BullMQ Worker (AI + Email + Campaign + Scoring)
  mobile/    — Expo (Dashboard + Inbox + KB + AI Playground + System Overview)

packages/
  shared-types/  — API 合约类型
  domain/        — 业务实体 (LeadStage, CampaignStatus 等)
  ui-tokens/     — 企业绿调色板 + Tailwind preset + JS tokens (RN 共享)
  ai-core/       — 统一 AI 客户端 + Prompt (版本化) + Agents + ReAct + Metrics
  rag-core/      — 完整 RAG 管线 (parse→chunk→embed→hybrid retrieve→cite) + eval
  api-client/    — 类型安全 fetch 客户端 (web + mobile 共享)
  db/            — Prisma 6 schema + pgvector (16 数据模型)
```

### 数据模型 (16 个)

```
Organization  ──< Memberships >── User
      │
      ├──< Agent ──< Conversation ──< Message
      ├──< Lead ──< LeadActivity
      ├──< Script ──< Campaign ──< CampaignRun
      ├──< Document ──< DocumentChunk (pgvector + tsvector)
      ├──< AICallMetric (token, 延迟, 成本)
      ├──< AuditLog (不可变审计)
      ├──< ApiKey (SHA-256 哈希)
      └──< FeatureFlag (DB-backed, per-org rollout%)
```

---

## 快速开始

### 前置条件
- Node.js 20+, pnpm 9+
- PostgreSQL (Supabase) + pgvector 扩展
- Upstash Redis

### 安装

```bash
pnpm install
pnpm --filter @salesagent/db push
pnpm --filter @salesagent/db generate
node packages/db/setup-vector.mjs
```

### 环境变量

```bash
# packages/db/.env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# apps/web/.env.local
JWT_SECRET="64-char-random-string"
DEEPSEEK_API_KEY="sk-..."
REDIS_URL="redis://..."

# 可选：向量搜索（无 Key 时自动降级到关键词搜索）
EMBEDDING_API_KEY="sk-..."
EMBEDDING_MODEL="text-embedding-3-small"

# 可选：Cohere Reranker（无 Key 时自动 Noop 透传）
COHERE_API_KEY="..."

# 可选：Sentry 错误追踪
SENTRY_DSN="https://..."
```

### 开发

```bash
pnpm dev                 # Web 应用 (Next.js)
pnpm dev-worker          # Worker (BullMQ)
pnpm --filter @salesagent/web dev-socket  # 实时聊天服务器 (端口 3001)
pnpm seed-demo           # Demo 数据
pnpm --filter @salesagent/web test        # 单元测试 (53 specs)
pnpm --filter @salesagent/rag-core eval:sales  # RAG 评测
```

### 部署

```bash
npx vercel --prod --cwd apps/web     # Web → Vercel
# Worker → Railway (git push main 自动部署)
```

---

## 种子脚本

| 命令 | 说明 |
|------|------|
| `pnpm seed` | 全量重置 + Demo 数据 |
| `pnpm seed-prod <slug>` | 幂等种子：3 脚本 + 5 线索 |
| `pnpm seed-members <slug>` | RBAC 测试账号 |
| `pnpm seed-demo` | Acme Corp Demo 组织 |
| `pnpm seed-chinese-demo` | 启云科技中文 Demo |
| `pnpm seed-kb-full` | 生成 11 份三层知识库文档 (磁盘) |
| `pnpm seed-kb-to-db <slug>` | 上传 KB 文档到指定组织 (解析→分块→embed→入库) |
| `pnpm clean-org <slug>` | FK-safe 组织清理 |

---

## 设计系统

**企业绿 (Corporate Green)** — 专业 SaaS 美学 (Notion / Linear / Stripe 风格)

| Token | Hex | 用途 |
|-------|-----|------|
| Primary | `#166534` | CTA, 激活状态 |
| Dark Accent | `#4ADE80` | 暗色模式 vibrant green |
| Dark BG | `#0a1108` | 近 OLED 黑色背景 |
| Light BG | `#F8F9FA` | 冷色调 Slate 背景 |
| Card Light | `#FFFFFF` | 纯白卡片 |
| Card Dark | `#111A0E` | 暗色表面 |
| Accent Secondary | `#849b70` | 分割线, 弱化强调 |

---

## 关键版本

### Phase 21 (2026-07-07) — RAG 性能 + 实时聊天
- Redis 两层语义缓存 (exact + cosine ≥0.95)
- SHA-256 内容寻址增量索引
- Socket.IO WebSocket 实时聊天 + REST polling 降级
- ChatWindow + Inbox Email/Chat 一键切换 + AI 草稿
- 知识库 12 份文档三层架构

### Phase 20 (2026-07-07) — RAG 检索质量工程化
- 统一检索管线 `hybrid-retriever.ts` (消除 120+ 行重复 SQL)
- 查询改写 (LLMQueryRewriter) + 问题路由 (6 分类) + 置信度门控
- RAG Eval 连接生产 PgVector + 30 条 SalesAgent Golden Dataset
- KB API CRUD (DELETE/PATCH/reindex)

### Phase 19 (2026-07-05) — 中国市场适配
- Customer Portal + 全界面中文化 + Email/Chat Feature Flag 渠道开关
- ReAct Agent executor + Cohere Reranker + AI Draft RAG 集成
- 翻译 API + Boss Dashboard + AI Health 中文化

---

## Author

**Gloria Han**

方向：AI Agent 平台 · RAG 基础设施 · 多租户 SaaS · 全栈产品工程
