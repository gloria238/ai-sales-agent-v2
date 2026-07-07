# SalesAgent AI — 功能说明

> 面向企业销售团队的内部 OS 平台 — 多租户 AI Agent + RAG 知识库 + 实时对话 + 外呼引擎 + 全链路可观测。
> 项目周期: 2025.05 — 2026.07 (21 个 Phase 持续迭代) | 技术栈: TypeScript, Next.js 14, PostgreSQL+pgvector, Socket.IO, BullMQ, DeepSeek, React Native (Expo)

---

## 项目简介

SalesAgent AI 是一个**企业内部销售运营 OS 平台**——它不是对外售卖的 SaaS 产品，而是销售团队日常工作的中枢系统。系统围绕「AI 辅助而非替代」的 Human-in-the-Loop 哲学构建：AI 完成线索评分、回复起草、知识检索、活动编排等重复性工作，人类销售专注于关系建立和最终决策。

当前承载三大业务场景：**AI SDR（销售开发代表）** 自动跟进海量线索并起草个性化回复；**Club Concierge（高端会员礼宾）** 基于知识库提供精准应答；**Customer Support（客户支持）** 通过客户门户实现自助查询与人工兜底。

### 核心能力矩阵

| 能力域 | 一句话 | 技术实现 |
|--------|--------|----------|
| **AI Agent 引擎** | 6 大 AI 能力 + ReAct 工具调用 + Prompt 版本管理 | DeepSeek API + 自研 agent-executor |
| **RAG 知识库** | 查询改写+问题路由+混合检索+Cohere Reranker+语义缓存+增量索引+30条Golden Dataset评测 | PostgreSQL + pgvector + OpenAI Embeddings + Redis |
| **多渠道收件箱** | Email/Chat 双通道一键切换 + AI 草稿(RAG增强) + HITL 审核 + WebSocket 实时聊天 | Next.js + Socket.IO + TanStack Query |
| **外呼活动引擎** | 多步骤序列编排 + AI 个性化 + 延迟/重试/回复检测 | BullMQ + Redis + Resend |
| **客户门户** | 客户独立登录 + 历史对话查看 + 消息发送 | JWT 双路径认证 + Portal 路由 |
| **AI 可观测性** | 全链路追踪 + P50/P95 延迟 + Token 成本 + 回退率 | AICallMetric + requestId 传播 |
| **多租户 RBAC** | 5 角色 × 13 权限 + org-scoped 数据隔离 | Prisma + Middleware JWT 验证 |
| **移动端** | Dashboard + Inbox + KB + AI Playground 可视化 | Expo 52 + React Native |

---

## 技术亮点

### 1. RAG 知识库系统 — 六阶段管线 + 语义缓存 + 增量索引

**全链路 RAG Pipeline (Phase 20-21):**

```
Query → [Rewriter] → [Router] → [Semantic Cache?] → [Hybrid Search] → [RRF] → [Reranker] → [Confidence Gate] → LLM
          3变体       6分类      Redis两层             Vector+Keyword   k=60     Cohere          二次检索         带引用
```

**离线索引管线 (7 步, Phase 21 升级):**

```
PDF/DOCX/TXT/MD/FAQ 文档
       ↓
parser.ts      — 类型检测 → 专用解析器
                  · PDF: pdf-parse v2 (PDFParse 类 API)
                  · DOCX: mammoth (Office Word)
                  · TXT/MD: 原生读取
                  · FAQ: 结构化 Q&A 拆分
       ↓
chunker.ts     — 递归字符分割 (段落 → 句子 → 固定 1000 字符)
                  200 字符重叠，保持语义边界完整性
       ↓
embeddings.ts  — 可插拔 Embedding Provider
                  · 主路径: OpenAI text-embedding-3-small (1536 维)
                  · 回退: DeepSeek Embedding (复用 DEEPSEEK_API_KEY)
                  · 批量 embedBatch() 减少 HTTP 往返
       ↓
indexer.ts     — 编排分块 → 嵌入 → 存储，org-scoped 标记
       ↓
content-hash.ts — SHA-256 内容寻址
                  · 重复文档 → 跳过 (幂等)
                  · 同名更新 → 删旧 chunk → 重建新 chunk
                  · 上传后自动 invalidate 语义缓存
       ↓
pgvector + tsvector — 双索引存储 (PostgreSQL 单库)
                  · embedding: vector(1536) — 稠密向量
                  · searchVector: tsvector — 全文搜索 + GIN 索引 + 自动更新触发器
```

**在线检索管线 (六阶段):**

```
用户查询 "产品支持哪些支付方式？"
       ↓
[阶段1] Query Rewriter — LLM 生成 3 变体
  原始: "产品支持哪些支付方式？"
  关键词: "支付 方式 支持"
  同义: "支持哪些付款渠道, 怎么付款"
  (LLM 超时/失败 → 降级 NoopRewriter, 仅原始查询)
       ↓
[阶段2] Query Router — 6 分类差异化
  → 判定为 "faq" 类 → topK=3, 阈值偏高
  (默认 KeywordRouter 零成本, DEEPSEEK_API_KEY 存在时自动启用 LLMRouter)
       ↓
[阶段3] Semantic Cache Check — Redis 两层
  Exact match (SHA-256) → hit? 返回缓存
  Semantic match (cosine ≥0.95) → hit? 返回缓存
  → miss? 进入全量检索
       ↓
┌──────────────────────────────────────┐
│ [阶段4] Hybrid Search (并行)           │
│                                      │
│  Vector Path: pgvector <=>           │
│  → top-10 (语义: "支付/付款/结算")    │
│                                      │
│  Keyword Path: tsvector FTS          │
│  → top-10 (精确: "支付方式")          │
└──────────────────────────────────────┘
       ↓
[阶段4续] RRF Fusion (k=60): Σ 1/(60+rank_i) → 融合
       ↓
[阶段5] Confidence Gate
  top-1 ≥ 0.7 → 高置信, 直接送 Reranker
  top-1 < 0.7 → 触发 expanded 二次检索 → 合并去重
  top-1 < 0.4 → 告知用户 "未找到"
       ↓
[阶段5续] Cohere Reranker
  有 KEY → requt-multilingual-v3.0 交叉编码器精排 Top 15 → Top 5
  无 KEY → NoopReranker 透传 → 混合检索结果就是最终结果
       ↓
[阶段6] LLM 生成 + 引用溯源
  DeepSeek 基于 Top 5 chunks 生成带 [Source N] 引用的回答

**AI 草稿 RAG 集成:**

区别于传统 KB Q&A 的独立使用场景，收件箱的「AI 草稿」按钮将 RAG 融入 SDR 日常工作流:

```
客户最新消息 → searchKnowledgeBase() → Hybrid Search → RRF → Top-5 chunks
             + 完整对话历史 + Agent 配置 (personality/goals/knowledgeBase)
             → DeepSeek → 基于 KB 事实的回复草稿
             → API response 标注 kbChunksUsed (使用了几个 KB 块)
```

**RAG 评估框架:**

```
pnpm --filter @salesagent/rag-core eval:sales

Golden Dataset: 30 条手工标注 Q&A (启云科技 KB 文档, 6 类 × 3 难度)
  ├── Retrieval 指标 (纯计算, 无需 LLM):
  │   Precision@5, Recall@5, MRR, NDCG@5
  ├── Generation 指标 (LLM-as-Judge, DeepSeek):
  │   Faithfulness (忠实度), Answer Relevancy (答案相关性)
  └── 支持 --real --org-id <id> 连接生产 PgVector 做真实评测

CLI 模式:
  eval:sales               Mock 快速验证 (30 条, 秒级)
  eval:sales:retrieval     仅检索指标 (零 API 调用)
  eval:real -- --org-id X  真实数据库评测 (需 DATABASE_URL)
```

**降级策略 (优雅降级，零硬依赖):**

| 条件 | 检索方式 | 质量 |
|------|---------|------|
| EMBEDDING_API_KEY 已配 | pgvector 余弦相似度 | 语义精准 |
| 只有 DEEPSEEK_API_KEY | DeepSeek Embedding 自动回退 | 语义精准 |
| 无任何 Embedding API | PostgreSQL `~*` 关键词正则搜索 | 精确匹配还行 |
| 连 DB 都没数据 | "No relevant documents found." | 明确告知 |

---

### 2. AI Agent 引擎 — 6 大能力 + ReAct 工具调用 + Prompt 灰度

**6 大 AI 能力 (统一在 packages/ai-core):**

| 能力 | 函数 | 用途 | Temperature |
|------|------|------|-------------|
| 回复组合 | `composeResponse()` | Inbox AI 草稿生成 (含 RAG 知识增强) | 0.7 |
| 线索评分 | `scoreLead()` | 5 维度 BANT/MEDDIC 评分 (0-100) | 0.3 |
| 对话总结 | `summarizeConversation()` | 长对话自动摘要 | 0.5 |
| 脚本生成 | `generateScript()` | AI 生成销售话术/外呼脚本 | 0.8 |
| 语言检测 | `detectLanguage()` | 自动检测客户消息语言 | 0.1 |
| 文本翻译 | `translateText()` | Inbox 翻译按钮 (10 语言) | 0.3 |

**ReAct Agent 执行器 (agent-executor.ts):**

```
Thought → Action → Input → Observation → Thought → ... → Final Answer
                                                    (max 6 steps)

4 个内置工具 (Tool):
  ├── get_lead_history     — 查询线索历史活动和对话
  ├── search_knowledge_base — RAG 知识库检索 (Hybrid Search + RRF)
  ├── get_lead_info        — 获取线索详细信息 (公司/职位/阶段/评分)
  └── send_followup_message — 发送跟进消息

使用场景:
  · Campaign step type="react": Worker 执行外呼时，ReAct Agent 自主
    决定何时跟进、查什么信息、发什么内容
  · agentSteps 完整记录推理链路 → 前端 AgentThinkingPanel 可视化
```

**Prompt 版本管理 + A/B 灰度:**

```
PROMPT_REGISTRY.compose_response
  ├── v1 (2025-06-01) — 当前默认
  ├── v2 (待注册)     — A/B Test 候选
  └── current: "v1"   ← Feature Flag 可覆盖为 "v2"

FeatureFlag.rules.promptVersion + rollout%
  → hashBucket(userId) % 100 < rolloutPercent
  → 确定性分桶 (同一用户不会变来变去)
  → DB 运行时切换，无需重新部署
```

**安全装甲 (Prompt Armor):**

所有用户数据包裹在 `<user_data>...</user_data>` 标签中，PROMPT_ARMOR 前缀指示模型永不执行用户数据内的指令——防止 Prompt Injection 攻击。

---

### 3. 多渠道收件箱 + Human-in-the-Loop 审核

**统一单页面分栏 (Linear/Figma 风格):**

```
┌──────────────────┬──────────────────────────────────────┐
│ 左侧: 对话列表    │ 右侧: 消息详情 + 输入区                │
│ w-80 lg:w-96     │                                      │
│                  │ DetailHeader (头像 + 线索信息 + AI状态) │
│ 筛选标签页:       │                                      │
│  All | Active    │ 消息流 (inbound/outbound 气泡)        │
│  ⏳ Needs Review │   ├── AI 草稿 (橙色边框, 审核中)       │
│  Needs Reply     │   ├── AgentThinkingPanel              │
│  Closed          │   │   └── ReAct 推理链路 (可折叠)     │
│                  │   └── RAG 引用标注 (文档名 + 分数)     │
│ 计数徽章 (实时)   │                                      │
│                  │ 输入区:                                │
│ LeadPopover      │   [AI Draft] [Translate] [Send]       │
│ (悬停→线索卡片)   │   └── 翻译预览 → 替换/保留原文        │
└──────────────────┴──────────────────────────────────────┘
```

**HITL 状态机 (Human-in-the-Loop):**

```
active → inbound received → [AI 自动生成草稿] → awaiting_approval
                                                      ├── [Approve] → approved (邮件发出)
                                                      ├── [Reject]  → active (草稿丢弃, 可重写)
                                                      └── [24h 超时] → active (草稿过期)
```

这是最关键的商业决策之一：AI 撰写邮件但**绝不自动发送**。人类审批是所有外发邮件的必经环节。

---

### 4. 外呼活动引擎 — 多步骤序列 + AI 个性化 + 延迟送达

**三种活动模式:** Cold Outreach (冷启动) / Re-engagement (再激活) / Trigger-based (触发式)

**执行流程:**

```
Campaign "Start"
  → 受众解析 (Lead 列表 + 过滤条件)
  → BullMQ campaign-jobs 分派
  → for each lead:
      ├── Step 1: 发送 cold email (模板或 AI 生成)
      │   → enqueue Step 2 with delay: 3天
      ├── Step 2: 发送 follow-up email
      │   → enqueue Step 3 with delay: 2天
      ├── Step N-1: ReAct Agent 自主跟进 (type="react")
      │   → Agent 决定查什么信息、发什么内容
      └── Step N: 发送 breakup email → 序列结束

三种步骤类型:
  email     — 固定模板, {{lead.name}} 变量替换 (防原型污染)
  ai_email  — DeepSeek 对模板做个性化改写 (同一封邮件,不同人,内容不同)
  react     — ReAct Agent 自主决策 (查KB/查历史/发消息)
  delay     — 纯等待, BullMQ { delay: N天 }

AI 个性化: step.type === "ai_email" 时,原始模板 + lead 信息发给 DeepSeek,生成个性化版本
```

**可靠性保障:**
- 重试: 3 attempts, 指数退避 (2s → 4s → 8s, max 60s)
- 幂等: Redis SET NX (24h TTL), 相同 requestId 不会重复执行
- 回复检测: 收到客户回复 → 自动停止序列 → 创建 Conversation
- 渠道开关: Feature Flag 控制 email/wechat 启用 (中国市场默认关 email)

---

### 5. 多租户 + 细粒度 RBAC

**5 角色 × 13 权限矩阵:**

| 权限 | owner | admin | operator | viewer | customer |
|------|-------|-------|----------|--------|----------|
| manage_org (删组织) | ✅ | - | - | - | - |
| manage_members | ✅ | ✅ | - | - | - |
| manage_agents | ✅ | ✅ | ✅ | - | - |
| manage_leads | ✅ | ✅ | ✅ | - | - |
| delete_leads | ✅ | ✅ | - | - | - |
| manage_campaigns | ✅ | ✅ | ✅ | - | - |
| run_campaigns | ✅ | ✅ | ✅ | - | - |
| manage_api_keys | ✅ | ✅ | - | - | - |
| view_* (4项) | ✅ | ✅ | ✅ | ✅ | - |
| read:own_conversations | - | - | - | - | ✅ |
| write:own_messages | - | - | - | - | ✅ |

**租户隔离:** 所有查询 `WHERE organizationId = membership.organizationId`，RAG 分块标记 `organizationId` 防止跨组织数据泄露。

**认证安全 (纵深防御):**
```
请求 → Middleware (Edge Runtime)
  ├── JWT 验证 (jose, Edge-compatible)
  ├── 黑名单检查 (Redis, fail-closed 选项)
  ├── Auth 限流: 登录 10/min, 注册 5/min, 验证 20/min
  ├── API 限流: 100 req/min (Upstash 滑动窗口)
  ├── IP 验证 (TRUSTED_PROXY_RANGES)
  └── Route Handler → getSession() → checkPermission() → org-scoped 查询
```

---

### 6. AI 可观测性 — 全链路追踪 + AI Health Dashboard

**AICallMetric 模型 (每次 LLM 调用记录):**

| 字段 | 内容 | 用途 |
|------|------|------|
| `jobType` | compose_response / score_lead / kb_ask / ... | 按任务类型分组 |
| `promptTokens` / `completionTokens` | DeepSeek API usage | 成本核算 |
| `llmLatencyMs` / `totalLatencyMs` | 纯 LLM 延迟 / 端到端延迟 | 性能监控 |
| `success` / `fallbackUsed` / `errorType` | 成功/降级/失败 | 质量监控 |
| `estimatedCostUSD` | (prompt×$0.14 + completion×$0.28) / 1M | DeepSeek 定价 |
| `requestId` | HTTP → Queue → LLM → DB 全链路 | 分布式追踪 |

**分布式追踪链路:**

```
HTTP Request (x-request-id or UUID)
  → BullMQ Job (context.requestId)
  → Worker log (JSON: requestId + spanId)
  → DeepSeek API (requestId in error)
  → AICallMetric (requestId column)
  → DB write (conversation/message)

同一个 requestId 可在 Vercel logs + Worker logs + AICallMetric 表中串联全链路
```

**AI Health Dashboard (中文):**
- P50/P95 延迟趋势 (毫秒/秒)
- 总 Token 消耗 + 预估费用 (人民币)
- 成功率 + 回退率 (按 jobType 分组)
- 30 天 Token 消耗趋势图
- 智能告警: 延迟 >10s, 回退率 >10%

---

### 7. 客户门户 (Customer Portal)

**双路径认证:**

```
POST /api/auth/login
  ├── email 匹配 Membership → JWT(role=owner/admin/operator/viewer) → Dashboard
  └── email 匹配 Lead.userId  → JWT(role=customer) → Portal (/portal/conversations)

Customer Portal 路由 (无仪表盘侧边栏):
  /portal/login           → 客户登录页
  /portal/conversations   → 客户查看自己的历史对话列表
  /portal/conversations/[id] → 对话详情 + 消息发送

权限隔离:
  customer 角色只能看自己的 Conversation (Lead.userId scoping)
  不能访问任何 Dashboard 页面或 API
```

---

### 8. 身份感知层 (Operational Customer Identity)

纯数据推导（零新增数据库字段，零 WebSocket 连接）:

```
IdentityCard (聚合组件)
  ├── Avatar       — Pravatar.cc 真实人像 (email 确定性种子) + 渐变首字母回退
  ├── PresenceDot  — 从 updatedAt 时间戳推导:
  │   · <5min → 🟢 Online (绿色圆点)
  │   · 5-60min → 🟡 Idle (黄绿)
  │   · 1-24h → ⚪ Away (灰色)
  │   · >24h → ⚫ Offline (深灰)
  │   · AI 专属: ai-processing (脉动动画), handoff-required (警告脉动), syncing
  ├── CustomerMeta — 姓名, 公司, 邮箱
  ├── AIState      — "AI handling · 92% confidence"
  ├── LeadIntent   — 评分条 + hot/warm/cold 标签
  └── ActivityTimestamp — 相对时间 (3分钟前/昨天/上周)
```

---

### 9. 移动端 — Club Concierge 展示层

Expo 52 + React Native, 7 个页面, Demo/Live 双模式:

| 页面 | 叙事 | 亮点 |
|------|------|------|
| **Login** | 品牌 + "Enter Demo →" | 真实 API 登录 + loading/error 状态 |
| **Dashboard** | Members · Bookings · AI Resolve | KPI 卡片 + Demo/Live Toggle |
| **Inbox** | AI 对话 + Confidence % | 会话列表 + 导航 |
| **Inbox Detail** | AI 回复 + Source Citation | AI 消息气泡 + RAG 来源 |
| **Knowledge Base** | Stats · 文档列表 · Upload | 文档卡片 + 上传管线 |
| **AI Playground** | ⭐ 6 步 RAG 可视化 | embed→search→rank→sources→generate→answer |
| **System Overview** | 多租户 · 架构层 · 技术栈 | 3 Clubs · 24 Docs · 42 Convos |

---

### 10. 工程化基础设施

**异步任务队列 (BullMQ + Upstash Redis):**

| 队列 | 用途 | 并发 |
|------|------|------|
| `conversation-jobs` | AI 回复组合 | 5 |
| `email-jobs` | 邮件投递 | 5 |
| `campaign-jobs` | 活动序列执行 | 3 |
| `scoring-jobs` | 线索评分 | 3 |

所有队列 prefix: `"sales-agent"` — 防止多项目 Redis 共享冲突
重试: 3 attempts, 指数退避 (2^n s, max 60s)
幂等: Redis SET NX (24h TTL, fail-open 降级)

**Feature Flag 系统 (DB-backed, 5 层求值):**

```
Memory Cache (60s TTL)
    ↓ miss
DB Per-Org Override (FeatureFlag where orgId = currentOrg)
    ↓ no record
DB Global Override (FeatureFlag where orgId = "__global__")
    ↓ no record
Environment Variable (FEATURE_AI_COMPOSE=true)
    ↓ not set
Hardcoded Default (FLAGS 注册表)
```

**设计系统:**

- Corporate Green 调色板 (企业绿: #166534 / #4ADE80 / #0a1108)
- Inter 字体 (next/font, variable)
- Glass Morphism (半透明 + backdrop-blur + 微光边框)
- 14 个 Error Boundary (11 路由 + Dashboard 组 + 根 + Global)
- 暗色模式 (自动切换 + 主题提供者)
- 设计令牌跨 Web + Mobile 共享 (packages/ui-tokens)

**部署架构:**

```
Vercel (Web App)
  ├── Next.js 14 (App Router, RSC)
  ├── 45+ API Routes + SSE
  └── JWT + RBAC + 限流

Railway (Worker)
  ├── BullMQ 4 Workers (idempotent)
  ├── AI + Campaign + Email
  └── Channel Feature Flags

Supabase (PostgreSQL)
  ├── 16 Prisma Models (sales_agent schema)
  ├── pgvector + tsvector (双索引)
  └── pgBouncer 连接池

Upstash (Redis)
  ├── BullMQ 队列 (TCP 直连)
  └── 限流 + JWT 黑名单 (REST API)
```

**代码规模:** ~32,000 行, ~440 文件, 50+ API 路由, 52 单元测试, 5 E2E 测试

---

### 11. 知识库架构 — 三层 12 文档

**文档分层 (Phase 21 升级):**

```
Layer 1: 核心层 (3 份) — product-overview / pricing-v3 / technical-specs
  权威数据源。数字、规格、事实。RAG 精准检索的核心。

Layer 2: 销售参考层 (5 份) — FAQ / 异议处理话术 / 客户案例 / 竞品战卡 / 销售手册
  场景化的 Q&A 和话术。客户提问先命中这一层。

Layer 3: 运营支撑层 (3 份) — 上线指南 / 合规政策 / 内部升级流程
  Agent 和运维自己看的。客户不直接问。
```

**文档间四种关联关系:**

| 关系 | 体现 | RAG 行为 |
|------|------|---------|
| 引用 (显式) | 头部 `> 关联文档: xxx.md` | chunk 内容里的 "详见 xxx" 可被 LLM 自动跟进 |
| 派生 (隐式) | FAQ 和 pricing 都写 "¥9,800", 不同格式 | 可能同时命中 → RRF 排名决定 → 暴露不一致 |
| 场景 (检索驱动) | 一个问题命中 FAQ + case + product doc | RRF 融合 → LLM 多角度回答 |
| 权威 (层级) | technical-specs 是核心层, FAQ 是派生层 | 当前未做权威权重 (改进方向) |

生成命令: `pnpm seed-kb-full` → 输出到 `packages/db/knowledge-base/`

---

## 与行业方案的差异化

| 维度 | 传统 AI SDR 工具 | SalesAgent AI |
|------|-----------------|---------------|
| AI 角色 | 全自动发送 (高风险) | Human-in-the-Loop (AI 起草, 人审批) |
| 知识库 | 独立 FAQ chatbot | RAG 融入 SDR 工作流 (AI 草稿实时检索) |
| 多租户 | 简单的 workspace 隔离 | 5 角色 × 13 权限 × org-scoped RAG |
| 中国市场 | 仅英文 + 邮件 | 全中文 UI + 微信/邮件双渠道开关 + Portal |
| 可观测性 | 黑盒 AI | 全链路 requestId + Token 成本 + P95 延迟 |
| 部署 | 单一服务 | Web (Serverless) + Worker (长期容器) + Mobile |
| 架构灵活性 | 硬编码 | 可插拔: Embedding / Reranker / Storage / Prompt 版本 |

---

## 已知限制 (Phase 21 完成后, 2026-07-07)

### Phase 20 已解决 (当前正在补齐 → 已完成)
1. ~~Reranker 接入生产 API~~ ✅ 统一管线 `hybrid-retriever.ts`, CohereReranker 实际生效
2. ~~查询改写 + 问题路由~~ ✅ LLMQueryRewriter + LLMQueryRouter, 6 分类, 3 变体
3. ~~低置信度二次检索~~ ✅ Confidence Gate: top-1<0.7 → expanded search → 合并去重
4. ~~KB API DELETE/PATCH 路由~~ ✅ GET/PATCH/DELETE + reindex 端点
5. ~~RAG Eval 连接真实 Retriever~~ ✅ `--real --org-id` 模式, 30 条 SalesAgent 数据集

### Phase 21 已解决
6. ~~RAG QA 缓存~~ ✅ Redis 两层: exact SHA-256 + cosine ≥0.95, FAQ 命中率 60%+
7. ~~增量索引 (文档 Hash)~~ ✅ SHA-256 内容寻址: 查重/同名更新/缓存失效
8. ~~实时消息 (WebSocket)~~ ✅ Socket.IO + ChatWindow, Inbox Email/Chat 一键切换

### 当前待解决
9. **Agent 运行时** — Token 预算、step-level 超时降级、取消收尾。已设计好，未实现
10. **Resend Webhook** — 邮件打开/点击事件无法回传, Campaign stats 中的 open/click 指标永远为 0
11. **Analytics API 端点** — api-client stub 已定义但 Route 文件不存在
12. **知识库一致性** — 核心层数据更新后, 派生层(如 FAQ)可能不一致。无自动检测机制

### 远期 (不做, 除非场景需要)
13. **GraphRAG / 知识图谱** — 成本高 (3 周+), 非当前核心链路
14. **OCR/VLM 多模态** — 销售场景文档以文字为主
15. **企业微信渠道** — Feature Flag 已定义, 接口预留
16. **CI/CD Pipeline** — CD 完整 (Vercel+Railway), CI 设计好但 Redis 配额限制暂未上线
