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
  <img src="https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions" />
  <img src="https://img.shields.io/badge/Phase-22-22C55E" />
</p>

<h1 align="center">SalesAgent AI</h1>

<p align="center">
  <strong>AI 驱动的企业销售操作系统 — AI Agent × RAG 知识库 × 实时聊天 × 多租户 SaaS</strong>
</p>

<p align="center">
  TypeScript 全栈 · ~34,000 行 · ~470 文件 · 22 个 Phase 持续迭代
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> ·
  <a href="#平台功能">平台功能</a> ·
  <a href="#技术栈">技术栈</a> ·
  <a href="docs/interview/README.md">面试深度分析</a>
</p>

---

## 这是什么

SalesAgent AI 是一个企业的 AI 销售中枢。不是 langchain demo, 不是 chatbot wrapper——是一个有自研 RAG pipeline、ReAct Agent 引擎、HITL 审核流程、WebSocket 实时聊天、以及从 API key 到 prompt injection 全链路安全防护的生产级系统。

**核心理念: AI 辅助而非替代人。** AI 负责评分、检索、起草、编排——人类做最终决策并维护客户关系。Human-in-the-Loop 贯穿全线。

### 一个数字说清楚规模

```
16 数据模型  ·  50+ API 路由  ·  54 单元测试  ·  4 BullMQ 队列  ·  3 应用 (web/worker/mobile)
7 共享包     ·  14 错误边界   ·  13 RBAC 权限  ·  5 角色          ·  CI/CD (GitHub Actions)
6 阶段 RAG   ·  30 条 Eval    ·  2 层语义缓存  ·  双通道 (email + real-time chat)
```

---

## 三层架构

```
表示层  →  Next.js 14 (App Router) + Socket.IO 实时聊天 + Expo Mobile
应用层  →  AI Core (DeepSeek client + 6 能力 + ReAct Agent) + RAG Core (六阶段检索管线 + 评测框架)
基础层  →  Domain 实体 + Shared Types + PostgreSQL + pgvector + tsvector + Redis
```

---

## 平台功能

### AI Agent
- 配置 Agent 的 personality、goals、knowledgeBase
- **6 种 AI 能力**: 回复组合 / 线索评分 / 对话总结 / 脚本生成 / 语言检测 / 翻译
- **ReAct Agent**: Thought → Action → Observation 多步推理, 4 个内置 Tool, 推理链路可视化
- **Prompt 版本管理**: 注册表 + Feature Flag 灰度切换

### RAG 知识库 (自研六阶段管线)
```
查询改写 → 问题路由 → 混合检索(pgvector+tsvector→RRF) → Cohere Reranker → 置信度门控 → 语义缓存
```
- 上传: PDF / DOCX / Markdown / FAQ (自动解析→分块→向量化→双索引)
- 检索: 向量语义搜索 + 全文关键词搜索并行 → RRF(k=60) 融合
- 缓存: Redis 两层 (SHA-256 exact + cosine ≥0.95)
- 索引: SHA-256 内容寻址—上传查重、同名更新自动重建
- 输出: AI 回答带引用溯源, 知识库没有则诚实说不知道

### 对话收件箱
- 统一分栏界面 — 左侧对话列表 (5 筛选) + 右侧消息线程 + AI 智能分析面板
- **Email / Chat 双通道**一键切换, 消息按 channel 字段隔离
- **AI 草稿 + HITL 审核**: AI 生成 → 虚线气泡预览 → 人审核 (发送/丢弃/重新生成)
- **reviewAction 审计**: 每条审核决策写入 approved/rejected, 可追踪
- **消息分页**: cursor-based 加载更早的消息, 滚动位置保持
- ReAct Agent 推理面板 + 翻译 (DeepSeek, 10 语言)
- Customer Portal: 客户独立登录, 只看自己的对话, 与 Agent 实时聊天

### 外呼活动引擎
- 多步骤序列编排, 支持 email / ai_email / delay / react (ReAct Agent) 四种步骤类型
- BullMQ 延迟执行, 回复检测自动暂停
- 幂等去重 (Redis SET NX) 防止重复发送

### 数据分析
三个 Tab:
- **Sales**: Pipeline 漏斗、活动效果、会议趋势
- **AI Health**: Token 消耗、P50/P95 延迟、成本归因、降级率告警
- **AI 指标 (四层)**: 系统层 → 能力质量层 → 业务结果层 → 风险指标层

### 移动端
Expo 52 + React Native。Dashboard + Inbox + KB + AI Playground (6 步 RAG 可视化)。Demo/Live 模式。

---

## 技术栈

| 层 | 技术 |
|----|------|
| **Web** | Next.js 14 App Router · React 18 · Tailwind CSS · Socket.IO |
| **Mobile** | Expo SDK 52 · React Native |
| **语言** | TypeScript (strict) |
| **设计** | 企业级扁平风格 (Linear/Stripe), CSS 自定义属性, Inter 字体 |
| **数据库** | PostgreSQL 16 (Supabase) + pgvector + tsvector 全文搜索 |
| **ORM** | Prisma 6 |
| **缓存** | Upstash Redis (REST + TCP 双协议) |
| **队列** | BullMQ 4 队列 (conversation/email/campaign/scoring), prefix: `sales-agent` |
| **实时通信** | Socket.IO (WebSocket → HTTP long-polling 降级) |
| **邮件** | Resend (AI 组合 + 模板变量引擎 + 防原型污染) |
| **AI** | DeepSeek API · 6 大能力 · ReAct Agent · Prompt 版本化 |
| **RAG** | 自研 6 阶段管线: pgvector cosine + tsvector FTS → RRF k=60 + Cohere Reranker |
| **嵌入** | OpenAI/DeepSeek/SiliconFlow Qwen3-4B (可插拔 EmbeddingProvider) |
| **可观测性** | AICallMetric + 四层指标看板 + Sentry + 结构化日志 + requestId 分布式追踪 |
| **认证** | 自定义 JWT (jose) · bcrypt 12 轮 · httpOnly cookie · Redis 黑名单 |
| **CI/Cd** | GitHub Actions (3 并行 Jobs: unit tests + type check + RAG eval) |
| **Monorepo** | pnpm workspaces + Turborepo |
| **部署** | Vercel (Web, Serverless) + Railway (Worker, 长期容器) |

---

## 项目结构

```
apps/
  web/       — Next.js 14 (App Router · 50+ API Routes · Socket.IO Chat Server)
  worker/    — BullMQ Worker (AI compose + Email + Campaign + Scoring, 幂等)
  mobile/    — Expo 52 (Dashboard · Inbox · KB · AI Playground · System Overview)

packages/
  shared-types/  — API 合约类型
  domain/       — 业务实体 (LeadStage, CampaignStatus 等)
  ui-tokens/    — 企业绿调色板 + Tailwind preset + JS tokens (RN 共享)
  ai-core/      — 统一 AI 客户端 + Prompt 版本化 + Agents + ReAct + Metrics
  rag-core/     — 完整 RAG 管线 (parse→chunk→embed→hybrid retrieve→cite) + 评测
  api-client/   — 类型安全 fetch 客户端 (web + mobile 共享)
  db/           — Prisma 6 schema + pgvector (16 数据模型)
```

### 数据模型 (16 个)

```
Organization ──< Memberships >── User
      │
      ├──< Agent ──< Conversation ──< Message (reviewAction)
      ├──< Lead ──< LeadActivity
      ├──< Script ──< Campaign ──< CampaignRun
      ├──< Document ──< DocumentChunk (pgvector + tsvector)
      ├──< AICallMetric (token, latency, cost, fallback, errorType)
      ├──< AuditLog (immutable)
      ├──< ApiKey (SHA-256 hashed)
      └──< FeatureFlag (DB-backed, per-org rollout%)
```

---

## 快速开始

### 前置条件
- Node.js 20+ · pnpm 9+
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

# 可选: 嵌入 (无 Key 时降级到关键词搜索)
EMBEDDING_API_KEY="sk-..."
EMBEDDING_MODEL="text-embedding-3-small"

# 可选: Cohere Reranker (无 Key 时 Noop 透传)
COHERE_API_KEY="..."

# 可选: Sentry
SENTRY_DSN="https://..."
```

### 开发

```bash
pnpm dev                 # Web 应用 (Next.js dev server)
pnpm dev-worker          # Worker (BullMQ consumers)
pnpm --filter @salesagent/web dev-socket  # 实时聊天服务器 (端口 3001)
pnpm seed-chinese-demo   # 启云科技中文 Demo
pnpm seed-demo           # Acme Corp Demo
pnpm --filter @salesagent/web test        # 单元测试 (54 specs)
pnpm --filter @salesagent/rag-core eval:sales  # RAG 检索评测
```

### 部署

```bash
# Web → Vercel (git push main 自动构建)
# Worker → Railway (git push main 自动构建)
```

---

## 种子脚本

| 命令 | 说明 | 可重复? |
|------|------|---------|
| `pnpm seed` | 全量重置 + Demo 数据 | 破坏性 |
| `pnpm seed-prod <slug>` | 3 脚本 + 5 线索, 幂等 | ✅ |
| `pnpm seed-members <slug>` | owner/admin/operator/viewer 测试账号 | ✅ |
| `pnpm seed-demo` | Acme Corp (15 leads, 3 agents, 10 conversations) | 先清后写 |
| `pnpm seed-chinese-demo` | 启云科技 (5 members, 3 AI, 15 leads, 10 convos, 4 KB docs) | 先清后写 |
| `pnpm seed-kb-full` | 生成 11 份三层知识库文档到磁盘 | ✅ |
| `pnpm clean-org <slug>` | FK-safe 删除指定组织下所有数据 | 破坏性 |

---

## 设计系统

**企业级扁平风格** — Linear / Stripe / Ramp 参考, 信息密集, 克制的颜色使用。

| Token | Light | Dark | 用途 |
|-------|-------|------|------|
| Primary | `#166534` | `#4ADE80` | CTA, 激活态 |
| Bg | `#F8F9FA` | `#0A1108` | 页面背景 |
| Card | `#FFFFFF` | `#111A0E` | 卡片表面 |
| Border | `#E5E7EB` | `#1F2F1B` | 标准边框 |
| Text | `#111827` | `#F9FAFB` | 主文本 |
| Text Muted | `#6B7280` | `#9CA3AF` | 辅助文本 |
| Accent Secondary | `#849b70` | `#849b70` | 图表色、分隔线 |

卡片统一 `rounded-md border border-border bg-bg-card`，数字统一 `tabular-nums`。无玻璃拟态、无发光、无彩色阴影。

---

## 架构文档

- **[CLAUDE.md](./CLAUDE.md)** — AI 辅助开发系统提示 (state, commands, patterns, gotchas)
- **[docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)** — 系统架构 (V2.2)
- **[docs/architecture/ARCHITECTURE_DEEP_DIVE.md](./docs/architecture/ARCHITECTURE_DEEP_DIVE.md)** — 12 系统设计决策深挖
- **[docs/architecture/PROGRESS.md](./docs/architecture/PROGRESS.md)** — Phase 进度与改动记录
- **[docs/interview/README.md](./docs/interview/README.md)** — 面试技术深度分析 (9 模块, ~25,000 字)

---

## 关键版本

### Phase 22 (2026-07-08) — Inbox 全面加固 + 企业 UI 重构 + 可观测性闭环
- **安全**: WebSocket 内容校验对齐 REST, `safe()` 误用清理, ai-draft prompt injection 防护补全 (`<user_data>` 标签)
- **诚实性**: 删除所有 AI 草稿假延迟 + `Math.random()` BANT 伪造数据, 孤儿文件处置
- **性能**: 消息 cursor 分页 + 滚动位置保持, Server Component `Promise.all` 并行查询
- **HITL 审计**: `Message.reviewAction` 字段 (approved/rejected), PATCH endpoint, 前端双路径写入
- **可观测性**: 四层 AI 指标看板 (系统/质量/业务/风险), draftAdoptionRate 数据积累中
- **UI**: 消灭全部玻璃拟态/渐变/发光/大圆角/彩色阴影 — 统一为 Linear/Stripe 企业扁平风格
- **CI/CD**: GitHub Actions 三 Job 并行 (unit tests + type check + RAG eval)
- **Documentation**: 面试技术深度分析 9 模块 ~25,000 字 + 面试坦白指南

### Phase 21 (2026-07-07) — RAG 性能 + 实时消息
- Redis 两层语义缓存 (exact + cosine ≥0.95)
- SHA-256 内容寻址增量索引
- Socket.IO WebSocket 实时聊天 + REST polling 降级
- ChatWindow + Inbox Email/Chat 一键切换 + AI 草稿
- 知识库 12 文档三层架构 (核心/销售参考/运营支撑)

### Phase 20 (2026-07-07) — RAG 检索质量工程化
- `hybrid-retriever.ts` 统一检索管线 (消除 120+ 行重复 SQL)
- 查询改写 (LLMQueryRewriter, 3 变体) + 问题路由 (6 分类, CATEGORY_PARAMS) + 置信度门控
- RAG Eval 连接生产 PgVector + 30 条 SalesAgent Golden Dataset + bigram 中文匹配
- KB API CRUD 完善 (GET/PATCH/DELETE + reindex)

### Phase 19 (2026-07-05) — 中国市场适配
- Customer Portal + 全界面中文化 + Email/Chat Feature Flag 渠道开关
- ReAct Agent executor (agent-executor.ts) + Cohere Reranker + RAG 增强 AI Draft
- 翻译 API (DeepSeek 10 语言) + Boss Dashboard + AI Health 中文化

---

## Author

**Gloria Han**

面向企业 AI Agent 平台 · 自研 RAG 基础设施 · 多租户 SaaS · 全栈产品工程
