# SalesAgent AI — 架构设计深度解析

> 不是"用了什么"，而是"为什么这么设计"。
> 每个决策都有它的约束条件、权衡取舍、和演进路径。

---

## 目录

1. [Redis — 为什么是 Upstash + 双协议？](#1-redis)
2. [BullMQ — 为什么是 4 队列 + prefix 隔离？](#2-bullmq)
3. [SSE — 为什么不是 WebSocket？](#3-sse)
4. [JWT — 为什么自定义而非 NextAuth/Auth0？](#4-jwt)
5. [RBAC — 为什么是 4 角色 + 10 权限矩阵？](#5-rbac)
6. [RAG — 为什么是 pgvector 而非 Pinecone/Weaviate？](#6-rag)
7. [Embedding — 为什么可插拔 + 关键词回退？](#7-embedding)
8. [pgvector — 为什么嵌入列用 Raw SQL 而非 Prisma？](#8-pgvector)
9. [Feature Flag — 为什么 DB-backed + 5 层求值？](#9-feature-flag)
10. [Docker — 为什么目前没有容器化？](#10-docker)
11. [GitHub Actions — 为什么没有 CI Pipeline？](#11-github-actions)





 11 个系统的设计决策一览

  ┌────────────────┬─────────────────────────────────┬───────────────────────────────────────────────────────────────────────────┐
  │      系统      │            核心决策             │                                一句话理由                                 │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Redis          │ Upstash 双协议（REST + TCP）    │ Serverless 用 REST，Worker 用 TCP 长连接——一个 Redis 满足两种运行时       │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ BullMQ         │ 4 独立队列 + sales-agent prefix │ 按工作负载分离（AI/邮件/活动/评分），prefix 防止多项目冲突                │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ SSE            │ 浏览器原生 EventSource          │ 单向推送足够用，Serverless 友好，零依赖。WebSocket 过度工程               │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ JWT            │ 自实现 jose + httpOnly cookie   │ Edge-compatible，无状态验证省 DB 查询，cookie 防 XSS                      │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ RBAC           │ 4 角色 × 13 权限矩阵            │ 覆盖 SDR 团队真实分工，delete/mange 分离，权限在 Route Handler 校验       │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ RAG            │ 接口抽象 + 多解析器             │ StorageAdapter/EmbeddingProvider 可插拔，pgvector→Pinecone 切换零接口变更 │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Embedding      │ 关键词搜索回退                  │ 无 API key 也能跑完整 RAG 管线——降低入门门槛                              │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ pgvector       │ Raw SQL 管理向量列              │ Prisma 不支持 vector 类型，等官方支持后只改 Adapter 内部实现              │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Feature Flag   │ DB-backed + 5 层求值链          │ 运行时动态切换，per-org 控制，hash 确定性 rollout，60s 缓存防 DB 压力     │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Docker         │ 目前零容器化                    │ Vercel + Railway 原生部署已覆盖，无自维护基础设施需求                     │
  ├────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ GitHub Actions │ 目前零 CI workflow              │ Vercel/Railway Git 集成覆盖部署，但缺少 PR 自动测试（已知质量债务）       │
  └────────────────┴─────────────────────────────────┴───────────────────────────────────────────────────────────────────────────┘

  6 条贯穿架构哲学

  1. Serverless First，保留逃生舱 — 优先 Serverless 兼容，但预留切换空间
  2. 接口隔离，可插拔 — Storage/Embedding/Reranker 都用 interface 定义
  3. 优雅降级 — Embedding 回退关键词搜索、Redis 回退内存限流、Sentry 可选
  4. 多层纵深防御 — JWT → 黑名单 → 限流 → role → org-scoped → PII 哈希
  5. Human-in-the-loop — AI 写邮件但不发送，评分数但不自动分配
  6. Pragmatism over Elegance — pgvector Raw SQL、字符数而非 token 计数、一半 Prisma 一半 SQL



---

## 1. Redis

### 用了什么

- **Upstash Redis**（Serverless Redis，免费 500K/天）
- **双协议**：REST API（`@upstash/redis`）用于 Web 限流 + BullMQ 的 **ioredis** 直连用于 Worker 队列
- **prefix 隔离**：`sales-agent:rl:100`（限流）、`sales-agent`（BullMQ 队列前缀）

### 为什么这么设计

**为什么选 Upstash 而不是自建 Redis？**

项目部署在 Vercel（Web）+ Railway（Worker），都是无服务器 / 短暂容器。传统 Redis 需要持久 TCP 连接，而 Vercel 的 Serverless Functions 无法维持长连接——每个请求都是独立实例，冷启动后需要重新建连。Upstash 提供 **REST API** 接口，无需持久连接，每个请求独立发起 HTTP 调用。

**为什么 Worker 又用 ioredis 直连？**

BullMQ 是 Worker 的灵魂。Worker 需要 **长连接 + 阻塞读取（BRPOPLPUSH）** 来高效等待新任务。REST API 只能做轮询——每 1-2 秒一次 HTTP 请求检查新任务，延迟高且浪费配额。而 Worker 运行在 Railway 的长期容器中，可以维持 TCP 连接，所以这里用 ioredis 直连是最优解。

一句话：**Web 端（短生命周期）用 REST，Worker 端（长生命周期）用 TCP**。这正是 Upstash 提供的双协议价值。

**为什么限流器加前缀 `sales-agent:rl:100`？**

限流窗口大小（100 req/min vs 10 req/min auth）编码在 key 前缀中。同一 IP 对 API 路由和 Auth 路由使用不同的计数器，互不干扰。且 `sales-agent` 前缀确保与其他共享 Upstash 实例的项目隔离——万一两个项目用了同一个 Redis URL，限流计数器不会冲突。

**为什么要有 fail-closed / fail-open 选项？**

这是一个经典的安全 vs 可用性权衡。默认 **fail-open**：Redis 挂了，请求放行（高可用，但可以被攻击者利用——先 DDoS Redis 再攻击 API）。设置 `RATE_LIMIT_FAIL_CLOSED=true` 后，Redis 挂了拒绝所有请求（安全，但可能误伤正常用户）。

同样的设计在 JWT 黑名单（`token-blacklist.ts`）中复用：`TOKEN_REVOCATION_FAIL_CLOSED=true` 控制 Redis 不可用时是否允许已登出的 token 继续使用。

**为什么还要内存回退？**

在第 34-57 行的 `getRatelimit()` 中，如果 UPSTASH_REDIS_REST_URL 未配置，直接回退到内存 Map + TTL 的简易限流器。这使得：
- 本地开发不需要 Redis
- 单实例部署（如 Railway worker）也能有基本限流
- 生产环境打印 warning 提示

---

## 2. BullMQ

### 用了什么

- **4 个独立队列**：`conversation-jobs`、`email-jobs`、`campaign-jobs`、`scoring-jobs`
- **prefix 隔离**：所有队列共享 `sales-agent` 前缀
- **并发控制**：conversation/email 并发 5，campaign/scoring 并发 3
- **指数退避重试**：3 次重试，`2^n 秒` 指数增长，最多 60 秒
- **优雅关闭**：SIGINT/SIGTERM → close workers → close queues → quit Redis → disconnect Prisma

### 为什么这么设计

**为什么是 4 个队列而不是 1 个大队列？**

不同类型的工作有不同的特征：
- **conversation-jobs**（AI 回复组合）：CPU 密集型 + 外部 API 调用，高延迟（15s 超时），需要限并发防止打爆 DeepSeek API
- **email-jobs**（邮件投递）：IO 密集型，独立限并发避免 Resend 限流
- **campaign-jobs**（活动序列）：长时间运行（含 delay 步骤可能跨天），需要与即时任务分离
- **scoring-jobs**（线索评分）：低优先级，可以独立扩缩

一个队列混在一起会怎样？一个卡住的 campaign 步骤会阻塞所有 email 发送。分离后各自独立，一个队列堵塞不影响其他。

**为什么 campaign/scoring 并发更低（3 而非 5）？**

Campaign 步骤包含 delay 逻辑（重新 enqueue 自己），实际并不长期占用 CPU。Scoring 是纯计算但没那么高吞吐需求。降低并发减少 DeepSeek API 的并发压力——DeepSeek 免费/低价 tier 有并发限制。

**为什么 AI 组合的结果是保存为草稿而非直接发送？**

这是最关键的商业决策之一（见 `index.ts:237-238` 注释）：
```typescript
// AI draft is saved as a message but NEVER auto-sent.
// Human approval is required before any outbound email goes out.
```
AI SDR 的价值主张是"辅助"而非"替代"人类 SDR。全自动发送的风险太高——一个 prompt injection 或幻觉就可能给客户发一封灾难性邮件。这是"human-in-the-loop"的架构实现。

**为什么 prefix 如此重要？**

BullMQ 默认无前缀。如果两个项目共享同一个 Upstash Redis 实例（这在免费 tier 非常常见），队列名 `conversation-jobs` 会冲突。加前缀 `sales-agent` 后内部 key 变为 `sales-agent:conversation-jobs:wait`，完全隔离。`ARCHITECTURE.md` 第 19 条特别强调这是 "critical"。

**为什么重试策略是指数退避而非固定间隔？**

固定间隔（如每次重试等 2 秒）在 DeepSeek API 临时限流时没用——你需要越来越长的等待。指数退避 2s → 4s → 8s 给上游恢复时间。同时 `removeOnComplete: { age: 86400 }` 和 `removeOnFail: { age: 604800 }` 保持 Redis 内存可控——已完成任务 1 天后清理，失败任务保留 7 天供排查。

---

## 3. SSE

### 用了什么

- 浏览器原生 `EventSource` API（`useRealtimeRuns` hook）
- `/api/orgs/{slug}/workflows/{workflowId}/runs/stream` 端点
- 自动重连（EventSource 内置）

### 为什么这么设计

**为什么不是 WebSocket？**

这个项目的实时需求非常有限：Workflow Run 的状态更新（queued → running → completed）。WebSocket 是全双工协议，需要：
- 服务端维持连接（Next.js Serverless 不友善）
- 自定义心跳/重连逻辑
- 额外的基础设施（如 WebSocket 网关）

而 SSE（Server-Sent Events）：
- **单向推送**（server → client），恰好匹配"推送状态更新"的场景
- **原生自动重连**——EventSource 断开后自动重试，无需手写重连逻辑
- **HTTP 协议**，穿透所有代理/CDN/防火墙零配置
- **Serverless 友好**——虽然 Next.js Route Handler 不是理想的 SSE host（函数执行完就销毁连接），但对于低频更新场景完全够用
- **零依赖**——不需要 `socket.io`、`ws` 等额外包

**为什么不是 Polling？**

轮询（每 2 秒 `fetch` 一次）的问题是：
- 浪费带宽和 API 配额（大多数请求返回"没变化"）
- 延迟最多等于轮询间隔
- 增加数据库负载（高频查询）

SSE 只在有状态变化时推送，其余时间连接空闲（仅心跳）。

**为什么只用于 Workflow Runs 而不是 Conversation Inbox？**

架构文档提到 Inbox 用 SSE，但实际代码中 SSE 只在 `use-realtime-runs.ts` 中实现。Conversation 的实时更新可能是通过 TanStack Query 的 `refetchInterval`（轮询）或用 SSE 但尚未完全实现。这个设计选择可能是 pragmatically 的：Workflow Runs 状态变化是低频事件（分钟级），Conversation 消息是高频事件（秒级），但项目规模尚小，精细化的实时推送不是瓶颈。

**SSE 在 Serverless 的局限**

Next.js Route Handler 在 Vercel 上有 **10 秒（Hobby）/ 60 秒（Pro）** 的函数执行时间限制。这意味着 SSE 连接最长只能维持 60 秒。好在 EventSource 自动重连，对用户体验影响可控。未来如果实时需求增长，可以考虑：
- Edge Functions（更长运行时）
- 专用 WebSocket 服务（如 Pusher/Ably）
- Vercel Fluid Compute

---

## 4. JWT

### 用了什么

- **jose**（Edge-compatible JWT 库）而非 `jsonwebtoken`
- HS256 对称加密
- httpOnly + Secure + SameSite=Lax cookie
- JTI（JWT ID）+ Redis 黑名单实现登出
- 7 天过期
- 自实现 sign/verify/extractJti，无外部认证服务

### 为什么这么设计

**为什么是 JWT 而非 Session Token + DB？**

传统 Session Token 需要每次请求查数据库：`SELECT user_id FROM sessions WHERE token = $1`。对于 Serverless 环境，每个请求的 DB 查询累积延迟高。

JWT 是 **无状态验证**——一旦签发，服务端只需验证签名就能还原用户身份（userId, orgSlug, role），无需任何数据库查询。在 40+ API 路由的系统中，每次请求省 3-5ms DB 延迟是显著的。

**为什么是 jose 而非 jsonwebtoken？**

Next.js Middleware 运行在 **Edge Runtime**（`middleware.ts`），不支持 Node.js `crypto` 模块。`jose` 使用 Web Crypto API，同时兼容 Node.js 和 Edge Runtime。这是 Vercel 部署的硬性要求——jsonwebtoken 在 Edge 直接抛错。

`extractJti()` 函数甚至用 `atob` 代替 `Buffer.from().toString()`，就是因为 Edge 没有 Buffer。

但 `password.ts` 的 bcryptjs 必须在 Node.js runtime——Edge 没有 bcrypt 所需的原生模块。所以 middleware 只做 JWT 验证（Edge 兼容），密码哈希放在 API Route Handler（Node.js runtime）。

**为什么 JWT 存在 Cookie 而非 localStorage？**

- `httpOnly` cookie 对 JavaScript 不可见——XSS 攻击无法窃取 token
- `Secure` flag 确保只在 HTTPS 下传输
- `SameSite=Lax` 防止 CSRF 攻击
- localStorage 没有这些安全属性

代价是：不能用 `Authorization: Bearer` header，因为 cookie 由浏览器自动附加。但对于 B2B SaaS（同源请求），cookie 就够了。外部 API 访问用 ApiKey 模型（SHA-256 哈希存储）而非 JWT。

**为什么 token 到期是 7 天而非 24 小时或 30 天？**

- 24 小时太短：用户每天早上要重新登录，体验差
- 30 天太长：如果 token 被窃取，攻击窗口太长
- 7 天是一个**行业标准平衡点**——足够方便（一周内不需登录），足够安全（即使被窃，攻击窗口可控）

配合 Redis 黑名单，登出可以立即作废 token（JTI 存 Redis 7 天，与 token 同生命周期）。

**为什么不接入 Google OAuth / GitHub OAuth / SSO？**

OAuth 是这个项目的已知 TODO（见 PROGRESS.md）。不做的原因：
1. **B2B 内部工具**：SalesAgent 是销售团队内部工具，不是面向 C 端的社交应用，Email + Password 是标准企业登录方式
2. **复杂度成本**：OAuth 需要管理多 provider 的回调、token 刷新、账号合并——当前阶段 ROI 不高
3. **自有 JWT 更灵活**：payload 中包含 orgSlug、role 等业务字段，OAuth token 不包含这些

**为什么注册流程是 `alice@example.com` 特殊处理？**

见 CLAUDE.md 的注册流程说明。这是一个巧妙的产品设计：第一个用户自动成为 Owner + 创建 Organization，后续用户默认为 viewer。这消除了"创建组织"这个额外的步骤，降低了首次使用门槛。

---

## 5. RBAC

### 用了什么

- **4 角色**：owner / admin / operator / viewer
- **13 权限**：从 `manage_org` 到 `run_campaigns`
- **角色-权限矩阵**（`permissions.ts` 的 `PERMISSION_MAP`）
- 中间件层 JWT 提取 role → Route Handler 层 `checkPermission()` 校验

### 为什么这么设计

**为什么是 4 角色而非更细粒度？**

4 角色覆盖了 B2B 销售团队的典型需求：

| 角色 | 实际映射 | 为什么需要 |
|------|----------|-----------|
| **Owner** | 公司负责人 / 付费人 | 唯一能删除组织、管理计费 |
| **Admin** | 销售 VP / 总监 | 管人 + 管策略，但不能删组织 |
| **Operator** | SDR / AE | 日常工作：管理线索、发活动、配 Agent |
| **Viewer** | 市场/产品/外部顾问 | 只看不操作，安全观察者模式 |

更多角色（如 "billing_admin"、"report_viewer"）目前用不到——过早抽象只会增加维护负担。

**为什么是 13 个权限而非 CRUD 模式？**

CRUD 粒度太粗。以 Lead 为例：
- `manage_leads`（创建/编辑）→ operator 可做
- `delete_leads`（删除）→ 只有 owner/admin 可做

如果只有 `leads:read` / `leads:write`，无法区分"编辑"和"删除"。operator 可以管理线索但不能删除——这防止了恶意或误操作的数据丢失。

同样，`manage_api_keys` 和 `view_api_keys` 分离——不是所有管理员都应该能创建/撤销 API 密钥。

**为什么权限检查在 Route Handler 而非 Middleware 层？**

Middleware 运行在 Edge Runtime，无法访问数据库。但权限检查需要知道当前用户对当前 org 的角色——这需要查 `Membership` 表。所以 Middleware 只做：
1. JWT 验证（token 是否有效，payload 中已含 role）
2. 黑名单检查（是否已登出）
3. 限流

进入 Route Handler 后，`getSession()` → `checkPermission()` 完成真正的权限验证。这是 Edge/Node.js 能力边界的自然划分。

**为什么不存 role 在 DB 中查而非 JWT 中？**

JWT 中包含 role 是因为 role 变更频率极低（可能永不变更）。如果 role 变了，老 JWT 过期（7 天）后就自然刷新。对于需要即时生效的场景（owner 降级一个 rogue admin），可以用 Redis 黑名单立即作废旧 token。

如果每次请求都查 DB 验证 role，就失去了 JWT 无状态的优势。

---

## 6. RAG

### 用了什么

- **6 步管线**：parse → chunk → embed → store → retrieve → cite
- **接口抽象**：StorageAdapter、EmbeddingProvider、Reranker 都是接口
- **多解析器**：PDF（pdf-parse v2）、TXT、MD、FAQ
- **递归分块**：段落 → 句子 → 固定大小，1000 字符 / 200 重叠
- **可插拔存储**：InMemoryStorage（开发）+ PgVectorStorage（生产）

### 为什么这么设计

**为什么是接口抽象而非硬编码？**

`StorageAdapter` 接口（`storage.ts`）定义了 `saveChunks/getChunks/search/deleteDocument/clearOrg` 5 个方法。`InMemoryStorage` 是 Map 实现，`PgVectorStorage` 是 PostgreSQL 实现。这意味着：
- 单元测试不需要 PostgreSQL——用 InMemory 即可
- 未来切换到 Pinecone/Weaviate/Qdrant 只需实现同一个接口
- 新开发者在本地开发不需要配 pgvector

`EmbeddingProvider` 同理——支持 OpenAI、DeepSeek、或任何兼容 `/v1/embeddings` 端点的服务。

`Reranker` 目前是 `NoopReranker`（直接透传），但接口预留了 `rerank()` 方法，未来可以接入 Cohere Rerank 或 Cross-Encoder。

**为什么递归分块优先按段落和句子边界？**

固定大小分块（如每 500 字符一刀切）会切断句子中间，导致：
- embedding 质量下降（半个句子语义不完整）
- 检索结果难以阅读（用户看到断句）

递归策略先尝试段落边界（`\n\n`），再尝试句子边界（`[.!?]`），最后才回退到固定大小。这保持了语义完整性。

**1000 字符 + 200 重叠的数值选择：**

- 1000 字符 ≈ 200-250 个英文 token，对于 B2B 销售文档（产品介绍、FAQ、案例）是合适的粒度
- 200 重叠 ≈ 20% 重叠率，确保跨 chunk 边界的信息不丢失（一个答案可能横跨两个 chunk）
- 没有用 token 计数：当前阶段不需要，字符数是够用的近似的近似

**为什么多租户隔离在 RAG 层实现？**

`organizationId` 贯穿整个管线：
- 分块时标记 `organizationId`
- 存储时按 org 范围查询
- 检索时只搜索当前 org 的分块

不这样做，org A 上传的文档可能被 org B 的查询检索到——这是多租户 SaaS 的严重数据泄露。

---

## 7. Embedding

### 用了什么

- OpenAI-compatible API（`/v1/embeddings`）
- 自动降级：有 `DEEPSEEK_API_KEY` 但无 `EMBEDDING_API_KEY` → 用 DeepSeek 的 embedding
- **关键词回退**：无任何 API key → PostgreSQL `~*`（不区分大小写正则）搜索

### 为什么这么设计

**为什么要做成可插拔？**

Embedding 市场变化极快。2024 年初 OpenAI 的 `text-embedding-3-small` 是最优，2024 年中 DeepSeek 的 embedding 性价比更高，2025 年可能又有新的。`EmbeddingProvider` 接口让切换成本为零。

**为什么 DeepSeek API key 被复用为 embedding key？**

这是 pragmatism 的体现（`embeddings.ts:28-30`）。项目已经配置了 `DEEPSEEK_API_KEY`，如果用户没有额外设置 `EMBEDDING_API_KEY`，就用 DeepSeek 自己的 embedding 端点。减少了一个环境变量，降低了部署复杂度。

**为什么有关键词回退？（最关键的决策之一）**

向量搜索需要 embedding。embedding 需要外部 API。外部 API 需要花钱配置。关键词搜索是 **零依赖回退**：

```sql
-- embeddings.ts 未配置时的回退（在 retriever 层实现）
WHERE content ~* $1  -- PostgreSQL 不区分大小写正则搜索
```

这意味着：
- 刚 fork 项目的开发者可以立即体验完整 RAG 管线，不需要任何 API key
- Vercel Preview Deployments 不需要配 embedding key 也能工作
- 服务宕机时（OpenAI 挂掉），系统自动降级到关键词搜索，不完全不可用

代价是：关键词搜索不如向量搜索精准——`"how to reset password"` 匹配不到 `"credential recovery procedure"`。但作为回退完全够用，且用户可以明确知道何时需要升级。

**为什么 `embedBatch` 单独实现而非循环调用 `embed`？**

OpenAI embedding API 支持批量输入（一次请求多个文本），价格相同但延迟更低（一次 HTTP 往返而非 N 次）。批量 embedding 是索引阶段的性能关键——一个 50 页 PDF 可能产生 80 个 chunk，80 次 HTTP 调用 vs 1 次，差异巨大。

---

## 8. pgvector

### 用了什么

- Supabase PostgreSQL 的 `pgvector` 扩展
- **Prisma 管理元数据 + Raw SQL 管理向量**
- 余弦距离（`<=>` 操作符）做相似度搜索
- `setup-vector.mjs` 脚本启用扩展

### 为什么这么设计

**为什么是 pgvector 而非 Pinecone/Weaviate/Qdrant？**

这是一个战略性架构决策，基于几个约束：

1. **数据已在这里**：leads、conversations、agents 都在 PostgreSQL。向量也在同一个数据库意味着：
   - 向量搜索 + 元数据过滤（如 "只搜已发布文档"）在同一个查询完成
   - 不需要维护第二个数据库
   - 事务一致性：删除文档 → 分块和向量一起删除

2. **Supabase 原生支持**：Supabase（项目的 PostgreSQL 托管商）内置 pgvector，零额外配置。在 Supabase Dashboard 点一下就能启用。

3. **成本**：Pinecone 免费 tier 只有 1 个 index，收费版 $70/月起。专用向量数据库在这个规模是过度工程。

4. **多租户天然支持**：`WHERE organization_id = $1` 可以和向量搜索在同一个查询完成。Pinecone 需要用 metadata filtering 实现，更复杂且性能更差。

**为什么向量列用 Raw SQL 而不用 Prisma？**

Prisma 不支持 `vector` 类型（截至 Prisma 6）。`DocumentChunk` 的嵌入列是在 Prisma schema 之外通过 `setup-vector.mjs` 手动添加的：

```sql
ALTER TABLE sales_agent."DocumentChunk" ADD COLUMN embedding vector;
```

`PgVectorStorage` 因此需要混杂 Prisma 和 Raw SQL：
- **Prisma** 管理元数据：`documentChunk.create({ id, documentId, content, ... })`
- **Raw SQL** 管理向量：`UPDATE ... SET embedding = $1::vector` 和 `ORDER BY embedding <=> $1::vector`

这种"一半 Prisma 一半 SQL"的设计不是优雅的，但是务实的——当 Prisma 未来支持 pgvector 时，只需改 `PgVectorStorage` 内部实现，接口不变。

**为什么用余弦距离 (`<=>`) 而非欧氏距离 (`<->`) 或内积 (`<#>`)?**

余弦距离衡量的是方向的相似度，不受向量长度影响。在文本 embedding 中，文档长度差异大（短 FAQ vs 长产品文档），embedding 向量的模长可能不同。余弦相似度对长度不敏感——这是 NLP 领域的标准选择。

实际上，OpenAI 的 embedding 向量已经做了 L2 归一化，所以余弦相似度和内积等价。但代码中显式用余弦距离是一种防御性设计——如果换了不做归一化的 embedding 模型（如 BGE），结果仍然正确。

---

## 9. Feature Flag

### 用了什么

- **DB-backed**：`FeatureFlag` 模型（per-org + key unique）
- **5 层求值**：Memory Cache → DB Per-Org → DB Global → Env Var → Default
- **渐进推出**：hash-based rollout%（`hashBucket(userId) % 100 < rolloutPercent`）
- **规则引擎**：role 过滤 + userId 白名单
- **60s 缓存 TTL** + **Sync 变体**（Edge/middleware 兼容）

### 为什么这么设计

**为什么是 DB-backed 而非配置文件？**

配置文件（`.env` 或 JSON）的问题是：
- 改 flag 需要重新部署
- 无法 per-org 定制（"给 Acme Corp 先开新功能，其他人关着"）
- 无法渐进推出（"先给 10% 用户开"）

DB-backed 支持运行时动态切换——不需要任何部署，在数据库改一行就行。

**为什么有 5 层求值？**

这是一个精心设计的优先级链：

```
Memory Cache (60s TTL)
    ↓ miss
DB Per-Org Override (FeatureFlag where orgId = currentOrg)
    ↓ no record found
DB Global Override (FeatureFlag where orgId = "__global__")
    ↓ no record found
Environment Variable (FEATURE_AI_COMPOSE=true)
    ↓ not set
Hardcoded Default (来自 FLAGS 注册表)
```

每一层解决一个问题：
1. **Memory Cache**：避免每次请求都查 DB。60s TTL 足够快（flag 变更最多等 1 分钟生效），且对 DB 零压力
2. **DB Per-Org**：核心价值——客户专属的 flag 控制
3. **DB Global**：对所有 org 生效的平台级开关
4. **Env Var**：向后兼容旧系统（Phase 16 之前用 env var 控制 flag）
5. **Default**：代码注册表中定义的 fallback

**为什么有 `isEnabledSync()`？**

Middleware（Edge Runtime）不能用 Prisma 查 DB。但 middleware 可能需要知道某个 flag 的状态来做路由决策。`isEnabledSync()` 不查 DB、不查缓存——纯 env var + default，在 Edge 环境中安全运行。

**为什么 rollout 用 hash 而非随机？**

```typescript
function hashBucket(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100;
}
```

- **确定性**：同一个 user 每次都落在同一个 bucket。如果 rollout 50%，用户不会这次看到新功能、刷新后又没了
- **零存储**：不需要存 "哪些用户开了 flag" 的表
- **均匀分布**：Java 风格的 `hashCode()` 能在足够大的用户群体上产生 0-99 的均匀分布

**为什么只有 4 个 flag 而非 14 个？**

4 个 flag 全部是 AI 功能开关：`ai_compose_response`、`ai_lead_scoring`、`ai_summarize_conversation`、`ai_generate_script`。它们控制的是**是否调用 DeepSeek API**——这是成本边界。

如果 AI 调用量超出预算，关闭这些 flag 就能立即停止所有 API 费用，而系统的非 AI 功能（lead CRUD、campaign 管理、inbox 查看）完全不受影响。这种设计让 cost-control 和 feature-toggle 合而为一。

---

## 10. Docker

### 用了什么

**目前：零 Docker。** 项目中搜索不到任何 `Dockerfile` 或 `docker-compose.yml`。

### 为什么这么设计

**为什么不需要 Docker？**

项目的两个运行时都有原生部署方案：

| 组件 | 部署 | 为什么不用 Docker |
|------|------|------------------|
| **Web** | Vercel | Vercel 自动检测 Next.js，零配置部署。用 Docker 反而需要额外配置且失去 Vercel 的自动扩缩 |
| **Worker** | Railway (nixpacks) | Railway nixpacks 自动检测 Node.js + `pnpm`，读 `package.json` 的 `start` 脚本 |
| **DB** | Supabase (托管) | 不需要本地运行 PostgreSQL |
| **Redis** | Upstash (托管) | 不需要本地运行 Redis |

这是一个**"Serverless First"** 的部署哲学。所有基础设施都是托管服务，没有需要自己维护的容器。

**那本地开发怎么办？**

本地开发需要：
- PostgreSQL → Supabase 的远程开发数据库（或本地 `psql`）
- Redis → Upstash 免费 tier 可同时用于开发/生产

这种设计的好处是：新开发者 clone 代码后不需要 `docker-compose up` 启动 4 个容器（DB + Redis + pgvector + app），只需要配几个环境变量就能跑起来。

**什么时候应该引入 Docker？**

以下场景 Docker 变得有价值：
1. **CI/CD 中的集成测试**：需要隔离的 PostgreSQL + Redis 环境
2. **员工入职**：一键启动完整开发环境（`docker compose up`）
3. **自托管客户**：部分企业客户可能要求私有化部署
4. **Worker 容器化**：如果 Railway 不够灵活，迁移到 GCP Cloud Run / AWS ECS 需要 Docker 镜像

目前阶段，这些需求都不迫切。

---

## 11. GitHub Actions

### 用了什么

**目前：零 GitHub Actions workflow。** `.github/workflows/` 目录不存在。

CI/CD 由部署平台原生处理：
- **Vercel**：git push → 自动构建 + 部署（包括 Preview Deployments on PR）
- **Railway**：git push to main → 自动构建 + 部署 Worker

### 为什么这么设计

**为什么不需要 GitHub Actions？**

Vercel + Railway 的 Git 集成已经覆盖了核心 CI/CD 需求：

```
git push to main
    ├── Vercel (web)     → pnpm install → prisma generate → next build → deploy
    └── Railway (worker)  → pnpm install → prisma generate → tsx index.ts
```

GitHub Actions 能做的（lint、test、build、deploy），这两个平台原生都做了。添加 GitHub Actions 只会增加维护负担而没有实际收益。

**那测试在哪里跑？**

目前测试是**本地运行**的：
```bash
pnpm --filter @salesagent/web test        # 52 unit tests, ~2s
pnpm --filter @salesagent/web test:e2e    # 5 E2E specs
```

没有 pre-commit hook 也没有 CI 测试。这是一个已知的**质量债务**——PR merge 之前没有自动测试保障。

**未来 CI 应该做什么？**

一个务实的 GitHub Actions workflow 应该包括：

```yaml
# 建议的 .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16  # 带 pgvector 的 PostgreSQL
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @salesagent/db generate
      - run: pnpm --filter @salesagent/db push
      - run: pnpm --filter @salesagent/web test
      - run: pnpm --filter @salesagent/web test:e2e
```

但这需要：
1. 在 CI 中起一个带 pgvector 的 PostgreSQL 容器
2. 运行 Prisma migration
3. 配置 JWT_SECRET 等环境变量
4. E2E 测试需要安装 Playwright 浏览器

这些是合理的投入，但目前被更高优先级的任务（核心功能、安全、UX）挤占了。

---

## 总结：架构哲学

通览 11 个系统，可以归纳出几条贯穿全项目的设计原则：

### 1. Serverless First，但保持逃生舱

Redis REST API + BullMQ TCP 双协议、SSE 而非 WebSocket、Vercel + Railway 托管部署——所有决策优先考虑 Serverless 兼容性。但如果 Serverless 限制成为瓶颈（Worker 的长连接、未来的大规模实时推送），代码中已预留了逃生舱。

### 2. 接口隔离，可插拔

`StorageAdapter`、`EmbeddingProvider`、`Reranker`——核心模块都用接口定义。生产实现和 mock 实现可以互换。这是经历过 Phase 15 安全审计后的成熟——外部依赖（DeepSeek、OpenAI、pgvector）随时可能变，接口让变化的影响限于一处。

### 3. 优雅降级，不做硬依赖

嵌入 API 不可用？回退到关键词搜索。Redis 不可用？有内存回退和 fail-open/closed 配置。Sentry DSN 未设置？不报错，只是不追踪错误。系统在任何条件下都能降级运行，不会单点崩溃。

### 4. 安全是多层纵深，而非单点防御

JWT 验证 → 黑名单检查 → 限流（两层：auth 10/min + API 100/min）→ role 检查 → org-scoped 查询 → PII 日志哈希。攻击者需要同时突破多层防御才能造成伤害。

### 5. Human-in-the-loop 是 AI 产品的边界

AI 撰写邮件但不发送。Lead scoring 产生分数但不自动分配。Campaign 有开始按钮但不自动启动。这些"人类审批"的环节不是技术限制，而是产品原则——AI 辅助而非替代 SDR。

### 6. Pragmatism over Elegance

pgvector 用 Raw SQL 而非等 Prisma 支持。Feature flag 同时支持 DB 和 env var。Chunker 用字符数而非 token 计数。这些不是最优雅的方案，但在当前阶段是最有效的。工程的艺术在于知道"够好"的时机——phase 17 的项目已经 27,000 行代码，但如果每个决策都追求完美，可能还在 phase 3。

---

## 附录：关键文件索引

| 系统 | 核心实现文件 |
|------|------------|
| Redis | `apps/web/lib/rate-limit.ts`, `apps/web/lib/token-blacklist.ts` |
| BullMQ | `apps/worker/src/queue.ts`, `apps/worker/src/index.ts` |
| SSE | `apps/web/lib/use-realtime-runs.ts` |
| JWT | `apps/web/lib/auth.ts`, `apps/web/lib/session.ts`, `apps/web/middleware.ts` |
| RBAC | `apps/web/lib/permissions.ts` |
| RAG | `packages/rag-core/src/` (parser, chunker, embeddings, indexer, pgvector-storage, retriever, sources) |
| Embedding | `packages/rag-core/src/embeddings.ts` |
| pgvector | `packages/rag-core/src/pgvector-storage.ts`, `packages/db/setup-vector.mjs` |
| Feature Flag | `apps/web/lib/feature-flags-v2.ts` |
| Docker | (不存在 — 见第 10 节) |
| GitHub Actions | (不存在 — 见第 11 节) |











1. Outbound Campaigns — 外呼序列编排

  一句话：这是一个自动化邮件序列引擎——定义一连串的步骤（发邮件→等3天→AI写个性化邮件→等2天→发最后一封），然后按时间线自动执行。

  实际代码流程（apps/worker/src/index.ts:133-203）：

  Campaign "Start"
    → 获取 script 的 steps（JSON 数组）
    → for each lead:
        step 1: 发一封 cold email（模板或 AI 生成）
        → enqueue step 2 with delay: 3天
        step 2: 发 follow-up email
        → enqueue step 3 with delay: 2天
        ...
        step N: 发 breakup email → 序列结束

  三种步骤类型：
  - email：固定模板，{{lead.name}} 变量替换
  - ai_email：调用 DeepSeek 对模板做个性化改写（同一封邮件发给不同人，内容不同）
  - delay：纯等待，重新 enqueue 到 BullMQ 设置 { delay: 3天 }

  延迟、重试、AI 个性化：
  - 延迟：executeCampaignStep() 处理后，不立即执行下一步，而是 campaignQueue.add(nextStep, { delay: 3 * 86400_000 })——BullMQ 的延迟队列机制
  - 重试：BullMQ attempts: 3 + 指数退避，DeepSeek 超时或 Resend 失败都会自动重试
  - AI 个性化：step.type === "ai_email" 时，把原始模板 + lead 信息发给 DeepSeek，生成针对该 lead 的个性化版本

---
  2. Expo 52 是什么

  Expo 是 React Native 的"脚手架+生态"——让你不用碰 Xcode/Android Studio 就能开发和发布 iOS/Android App。

  - Expo SDK 52 是 Expo 的版本号（2024年底发布，支持 React Native 0.76）
  - 对应关系：Expo SDK 52 ≈ React Native 0.76 ≈ 2024年Q4
  - apps/mobile/ 就是用 Expo 52 构建的

  它提供了什么：
  - expo-router：文件路由系统（app/(tabs)/index.tsx → 对应 / 路由）
  - 热更新（修改代码 → 扫码立即看到变化）
  - 统一构建（expo build:android / expo build:ios）
  - 自动管理原生权限（相机、通知等）

---
  3. Glass Morphism 是什么

  一种 UI 设计风格，核心特征是半透明 + 背景模糊 + 边框光晕。

  /* 实际的 glass-card 效果 */
  .glass-card {
    background: rgba(255, 255, 255, 0.08);  /* 半透明 */
    backdrop-filter: blur(12px);             /* 背景模糊 */
    border: 1px solid rgba(255, 255, 255, 0.12); /* 微光边框 */
    border-radius: 12px;
  }

  视觉上就像一块磨砂玻璃放在背景上面。这个项目在 Phase 16 把透明度从 60% 调到了 82%——太透明会看不清文字，太不透明就失去了"玻璃"质感。

  为什么用这个风格：B2B SaaS 的趋势从"扁平 Material Design"转向"有深度的玻璃质感"（Notion、Linear、Vercel 都在用），传达"高级、现代、专业"的品牌感。

---
  4. 提示词构建器 + Agent 执行函数

  这两个东西在 packages/ai-core/src/ 中，分开是为了职责分离：

  提示词构建器（prompts.ts）：
  - 负责组装 prompt 字符串
  - 把业务数据（lead name、company、messages）填进模板
  - 统一注入 PROMPT_ARMOR（防止 prompt injection）
  - 统一用 <user_data> 包裹所有用户输入

  // prompts.ts — 只负责"拼字符串"
  export function buildComposeResponsePrompt(params) {
    return `Compose a reply...LEAD: Name: <user_data>${safe(params.leadName)}</user_data>...`;
  }

  Agent 执行函数（agents.ts）：
  - 负责调用 AI + 处理响应
  - 接收已组装好的业务数据，调 buildComposeResponsePrompt() 得到 prompt
  - 调用 callDeepSeekJSON() 发送请求
  - 对结果做后处理（如 score 的 clamp 到 0-100）

  // agents.ts — 只负责"调 AI + 处理返回值"
  export async function composeResponse(conversation: ConversationData) {
    const prompt = buildComposeResponsePrompt({...});  // 用 builder
    return callDeepSeekJSON<ComposeResult>(prompt, COMPOSE_RESPONSE_SYSTEM, { temperature: 0.7 });
  }

  为什么分开？
  - 如果你换了 LLM（DeepSeek → Claude），只改 client.ts，prompt 和 agents 都不用动
  - 如果你想调 prompt 文案，只改 prompts.ts，执行逻辑不受影响
  - Worker 和 Web 都直接调用 agents.ts 的同一个函数——AI 逻辑只有一份

---
  5. RAG Core — 是 Demo 还是真实可用？

  是真实的，但分两层：

  文档解析 + 分块 + 存储：真实可用。上传 PDF → pdf-parse 提取文本 → chunker 递归分块 → 存入 PostgreSQL + pgvector。这部分是完整实现，生产可用。

  检索 + 回答：真实可用，但有降级路径：
  - 最佳路径（EMBEDDING_API_KEY 已配置）：query → OpenAI embedding → pgvector 余弦搜索 → DeepSeek 生成回答 + 引用
  - 降级路径（无 API key）：query → PostgreSQL ~* 关键词搜索 → DeepSeek 生成回答
  - 零配置路径（关键词也搜不到）：返回 "No relevant documents found"

  当前的状态：
  - packages/rag-core/ 有 14 个文件，接口抽象完整
  - KB Playground（/kb/playground）和 Mobile Playground（/playground）都是可视化的 6 步管线展示
  - 但 DOCX 解析器未安装（mammoth 缺依赖），Reranker 是 Noop（不过滤结果）

  所以不是 demo——是一个有完整降级能力的 RAG 系统。但它的质量取决于是否配置了 embedding API key。配置了就接近生产质量，没配置就是关键词搜索的增强版。

---
  6. API Client — Fetch 客户端

  packages/api-client/src/client.ts 是一个类型安全的 HTTP 请求封装：

  // 不用它的话：
  const res = await fetch("/api/orgs/acme/leads", { headers: { "Content-Type": "application/json" } });
  const data = await res.json(); // data 是 any，不知道类型

  // 用它：
  const client = createClient({ baseUrl: "/api", orgSlug: "acme" });
  const data = await client.leads.list(); // data 是 LeadResponse[]，IDE 自动补全

  两种认证模式：
  - cookie（默认）：credentials: "include"，浏览器自动带 cookie，用于 Web App 内部调用
  - bearer：Authorization: Bearer <token>，用于 API Key 外部调用或 Mobile App

  为什么用 fetch 而不是 axios？
  1. fetch 是浏览器原生 API，零依赖、零包体积
  2. Next.js 的 Server Components 原生支持 fetch()（带自动缓存和去重）
  3. Edge Runtime 不支持 axios（axios 用了 Node.js 的 http 模块）
  4. Mobile（React Native）原生支持 fetch

  为什么用 axios 更好？ axios 有拦截器、自动 JSON 解析、超时控制、取消请求等——但这些功能在这个项目中不需要或已有替代（AbortController 做超时，credentials 做认证）。

---
  7. Auth 技术栈解释

  JWT（jose）：
  - JWT = JSON Web Token。一串加密的 JSON：eyJxxx.yyy.zzz（三段 base64）
  - 包含用户信息（userId, orgSlug, role），用密钥签名
  - jose 是用于加密/验证 JWT 的 JavaScript 库
  - 选择 jose 而非 jsonwebtoken 的原因是：jose 在 Edge Runtime（Vercel Middleware）可用，jsonwebtoken 不行

  bcryptjs：
  - 密码哈希算法。"mypassword" → "$2a$12$...60字符哈希..."
  - 12 轮 hash 意味着攻击者即使拿到数据库，破解一个密码需要极大的计算力
  - bcryptjs 是纯 JS 实现，不需要原生编译（vs bcrypt 需要 node-gyp）

  httpOnly cookie：
  - 存在浏览器中的一小段数据，httpOnly=true 意味着 JavaScript 代码（包括攻击者注入的 XSS 脚本）无法读取这个 cookie
  - 浏览器会在每次请求时自动附加它，但 JS 看不到
  - Secure=true 只在 HTTPS 连接时发送
  - SameSite=Lax 防止跨站请求伪造（CSRF）

  三者协作：
  注册: 密码 → bcryptjs 哈希 → 存 DB
  登录: 密码 + bcryptjs 验证 → jose 签发 JWT → 存入 httpOnly cookie
  请求: 浏览器自动带 cookie → 服务端 jose 验证 JWT → 得到 userId/role
  登出: 清除 cookie + JWT ID 加入 Redis 黑名单

---
  8. Avatar, Presence, IdentityCard

  这三个组件构成了 Operational Customer Identity Layer（运营客户身份层）——就是让 SDR 一眼看出"这个客户是谁、现在什么状态、AI 怎么处理的"。

  Avatar（components/identity/avatar.tsx）：
  - 真人头像：https://i.pravatar.cc/150?u=alice@example.com（根据邮箱 seed 确定性地返回一张真实人像）
  - 头像加载失败 → 渐变背景 + 首字母（如 "Alice" → "A"）
  - 右下角有一个 PresenceDot（小圆点）

  Presence（components/identity/presence.tsx + lib/time.ts）：
  - 不是 WebSocket 实时状态——是从 lastSeenAt 时间戳推导出来的
  - 算法（纯数据函数）：
    - 最后活跃 < 5 分钟 → 🟢 Online（绿色圆点）
    - 5-60 分钟 → 🟡 Idle（黄绿）
    - 1-24 小时 → ⚪ Away（灰色）
    ▎ 24 小时 → ⚫ Offline（深灰）
  - 还有 AI 专属状态：ai-processing（脉动动画）、handoff-required（警告色脉动）、syncing

  IdentityCard（components/identity/identity-card.tsx）：
  - 聚合组件：头像 + 姓名 + 公司 + 邮箱 + 线索阶段 + AI 评分 + 最后活动时间
  - 两个变体：
    - compact：列表中的一行（Inbox 左侧列表、Leads 表格）
    - expanded：详情页头部（Inbox 右侧面板、Lead 详情页）
  - 自动显示 AI 状态："AI handling · 92% confidence" 或 "Needs human review"

  设计亮点：这一切基于已有的 updatedAt 时间戳——没有新增数据库字段，没有 WebSocket 连接，纯数据推导。

---
  9. Zustand 是什么，为什么用它

  Zustand 是一个极简的 React 状态管理库。对比：

  ┌──────────┬─────────────────────┬────────────────────────────────┬────────────────┬───────┐
  │          │       Zustand       │             Redux              │  Context API   │ Jotai │
  ├──────────┼─────────────────────┼────────────────────────────────┼────────────────┼───────┤
  │ 代码量   │ ~5 行定义一个 store │ ~30 行（action+reducer+slice） │ ~10 行         │ ~5 行 │
  ├──────────┼─────────────────────┼────────────────────────────────┼────────────────┼───────┤
  │ 性能     │ 精准重渲染          │ 需要 selector 优化             │ 整个子树重渲染 │ 精准  │
  ├──────────┼─────────────────────┼────────────────────────────────┼────────────────┼───────┤
  │ 学习曲线 │ 低                  │ 高                             │ 低             │ 低    │
  ├──────────┼─────────────────────┼────────────────────────────────┼────────────────┼───────┤
  │ 包大小   │ ~1KB                │ ~12KB                          │ 0              │ ~2KB  │
  └──────────┴─────────────────────┴────────────────────────────────┴────────────────┴───────┘

  这个项目里用在哪：Inbox 状态（选中哪个对话、筛选条件、展开/折叠）、Agent 配置草稿（编辑中但未保存的状态）。

  为什么不用 Redux：Redux 在这个规模是过度工程。项目没有复杂的状态依赖图——Inbox 选中对话不需要和 Agent 配置联动。

  为什么不用 Context API：Context 的值一变，整个 <Provider> 子树全部重渲染。Inbox 列表有 50 个对话时，选中一个会导致 50 个 IdentityCard 全部 re-render。Zustand
  只重渲染真正用了那个 state 的组件。

---
  10. Uni-app / Taro + 中国跨端方案

  当前的 Mobile App：
  - Expo 52 + React Native
  - 7 个页面，Club Concierge 叙事
  - Demo/Live 模式切换（Demo 用本地 mock 数据，Live 接真实 API）

  Uni-app 和 Taro 是什么：

  ┌─────────────┬──────────────┬────────────────────────────────────────┬────────────────────────────────┐
  │    框架     │    技术栈    │                 目标端                 │              生态              │
  ├─────────────┼──────────────┼────────────────────────────────────────┼────────────────────────────────┤
  │ Uni-app     │ Vue.js       │ 微信/支付宝/百度/字节小程序 + H5 + App │ DCloud 生态，中国市场份额最大  │
  ├─────────────┼──────────────┼────────────────────────────────────────┼────────────────────────────────┤
  │ Taro        │ React/Vue    │ 微信/支付宝/百度/字节小程序 + H5 + RN  │ 京东开源，React 技术栈友好     │
  ├─────────────┼──────────────┼────────────────────────────────────────┼────────────────────────────────┤
  │ Expo (当前) │ React Native │ iOS + Android + Web                    │ 全球 RN 生态，不支持中国小程序 │
  └─────────────┴──────────────┴────────────────────────────────────────┴────────────────────────────────┘

  关键问题：你现在的 Expo 代码能直接迁移到 Uni-app/Taro 吗？

  不能直接迁移。 原因：
  1. 渲染层不同：Expo 用 React Native 组件（<View>、<Text>），Uni-app 用 Vue 模板（<view>、<text>）或小程序组件
  2. 路由系统不同：expo-router 基于文件路由，Uni-app 用 pages.json 配置路由
  3. 原生能力不同：Expo 可以调用任意原生模块，小程序沙箱限制严格

  但你的架构做了正确的事情：
  - packages/shared-types、packages/domain、packages/api-client 这些纯逻辑包可以在任何 JS 环境复用
  - packages/ui-tokens 的颜色/间距/字体 token 可以在 Uni-app/Taro 中重新实现
  - API 调用的类型定义和业务逻辑可以直接 import

  如果要支持中国小程序，推荐路径：
  1. 用 Taro（React 语法，你当前的 React 技能可以复用）
  2. UI 组件重写（<View> → <View> 但 Taro 编译到小程序原生组件）
  3. packages/ 下的共享包直接 import 复用——这是 monorepo 架构的最大价值
  4. Expo 继续维护（iOS/Android），Taro 补充微信小程序——多端并行

---
  11. SSR 和 ISR 是什么

  SSR（Server-Side Rendering，服务端渲染）：
  - 每次请求在服务器上渲染 HTML，返回完整页面
  - 用户看到内容的速度快（不需要等 JS 下载执行）
  - SEO 友好（搜索引擎能爬到完整内容）
  - 你的项目：Next.js Server Components 默认就是 SSR

  ISR（Incremental Static Regeneration，增量静态再生成）：
  - 编译时生成静态 HTML，但可以在运行时按需重新生成
  - 比如：/docs 页面 1 小时重新生成一次，期间所有用户看到的是缓存版本
  - 适合：变化不频繁但需要最新内容的页面（博客、文档、产品列表）

  你的项目里：
  - Dashboard 页面 → SSR（数据随时变，每个用户不同）
  - Landing page（/） → 可能是 SSG（Static Site Generation，纯静态）
  - /docs → 适合 ISR（API 文档偶尔更新）
  - API routes → 不是 SSR/ISR 的范畴，它们是动态 API

  实际配置：Next.js App Router 中，默认是 SSR。要启用 ISR 需要 export const revalidate = 3600。你的项目目前没有显式使用 ISR。

---
  12. 数据库协调 + Auth 加密流程

  数据库架构是如何协调的

  ┌──────────────────────────────────────────────────┐
  │                    Supabase                       │
  │  ┌─────────────────────────────────────────────┐ │
  │  │         PostgreSQL (单实例)                  │ │
  │  │  ┌──────────────────┐  ┌──────────────────┐ │ │
  │  │  │ sales_agent      │  │ pgvector 扩展     │ │ │
  │  │  │ schema            │  │ (向量存储+搜索)   │ │ │
  │  │  │                   │  │                  │ │ │
  │  │  │ 14 张表           │  │ DocumentChunk    │ │ │
  │  │  │ User/Org/Lead/    │  │ .embedding       │ │ │
  │  │  │ Conversation/...  │  │ (vector 列)      │ │ │
  │  │  └──────────────────┘  └──────────────────┘ │ │
  │  └─────────────────────────────────────────────┘ │
  │                                                    │
  │  连接方式：                                         │
  │  • DATABASE_URL:   连接池 (pgBouncer, IPv4)       │
  │    → Vercel Serverless 用这个，connection_limit=1  │
  │  • DIRECT_URL:     直连 (IPv6)                     │
  │    → Prisma migrate/push 用这个                    │
  └──────────────────────────────────────────────────┘

  关键设计：
  - 单数据库多 Schema：sales_agent schema 隔离业务表，未来可以加 sales_agent_v2 做蓝绿部署
  - pgBouncer 连接池：Vercel 的每个 Serverless Function 实例需要一个 DB 连接。30 个并发请求需要 30 个连接——会打爆 Supabase 免费 tier。pgBouncer 复用连接，connection_limit=1
    限制每个实例只用 1 个连接
  - Prisma 管理业务数据 + Raw SQL 管理向量：见第 8 节

  Auth 加密的实际流程

  【注册】
  1. 用户输入 email + password
  2. bcryptjs.hash(password, 12) → "$2a$12$..."（12轮盐哈希）
  3. 存入 DB: User { email, passwordHash: "$2a$12$...", emailVerified: false }
  4. 生成 verification token（随机 UUID）
  5. 发送验证邮件（Resend）
  6. 用户点击链接 → emailVerified: true

  【登录】
  1. 用户输入 email + password
  2. DB 查询: SELECT * FROM User WHERE email = $1
  3. bcryptjs.compare(password, user.passwordHash) → true/false
  4. 如果密码正确：
     a. 检查是否需要 re-hash（旧 hash 是 10 轮 → 重新哈希到 12 轮）
     b. jose SignJWT({ userId, email, orgId, orgSlug, role, jti })
        → HS256 签名 → "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOi..."
     c. Set-Cookie: session=<JWT>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/
  5. 返回给浏览器

  【每次请求】
  1. 浏览器自动带 Cookie: session=eyJ...
  2. Middleware: jose.jwtVerify(token, JWT_SECRET) → payload { userId, role, ... }
  3. Middleware: isTokenRevoked(payload.jti) → 查 Redis 黑名单
  4. Route Handler: getSession() → 得到 Session 对象
  5. Route Handler: checkPermission(role, "manage_leads") → 403 或继续

---
  13. Embedding 到底起作用了吗

  起了作用，但有条件。完整的逻辑链（kb/ask/route.ts:24-61）：

  用户问："What is the guest policy?"

  Step 1: 尝试向量搜索
    ├── 有 EMBEDDING_API_KEY？
    │   ├── YES → 调 OpenAI/DeepSeek API embed(question) → 1536维向量
    │   │        → pgvector 余弦搜索 → 返回最相关的5个chunk（分数0.7-0.95）
    │   └── NO → 抛异常
    └── 异常被 catch → 进入 Step 2

  Step 2: 关键词回退
    └── PostgreSQL ~* (question keywords) → 返回包含关键词的5个chunk（分数固定0.5）

  Step 3: 如果两个都没有结果
    └── 返回 "No relevant documents found."

  Step 4: 用检索到的 chunks 构建 context
    └── DeepSeek 基于 context 生成回答 + 引用

  当前状态取决于你配了什么环境变量：
  - EMBEDDING_API_KEY 已配 → 向量搜索在工作，语义匹配精准
  - 只有 DEEPSEEK_API_KEY → embedding 也用 DeepSeek（embeddings.ts:29 自动回退）
  - 两个都没配 → 关键词回退在工作，精确匹配还行，语义匹配较弱
  - 连 DB 都没数据 → "No relevant documents found."

---
  14. CodeGraph — GitHub Skill

  CodeGraph 不是你当前项目的一部分，也不是我内置的 skill。

  你说的 "codegraph" 可能指：
  - GitHub 的 Code Graph 功能：仓库的依赖关系图（Insights → Dependency graph），用于安全漏洞告警（Dependabot alerts）
  - VS Code 扩展：如 "CodeGraph" 可视化代码依赖关系
  - 某个第三方 skill：MCP Server 或社区工具

  关于是否要用：
  - 如果是 GitHub Dependency Graph：建议开启。它自动扫描 package.json，发现已知漏洞（CVE）会发 Dependabot alert。对安全性有帮助，零成本

  当前状态取决于你配了什么环境变量：
  - EMBEDDING_API_KEY 已配 → 向量搜索在工作，语义匹配精准
  - 只有 DEEPSEEK_API_KEY → embedding 也用 DeepSeek（embeddings.ts:29 自动回退）
  - 两个都没配 → 关键词回退在工作，精确匹配还行，语义匹配较弱
  - 连 DB 都没数据 → "No relevant documents found."

---
  14. CodeGraph — GitHub Skill

  CodeGraph 不是你当前项目的一部分，也不是我内置的 skill。

  你说的 "codegraph" 可能指：
  - GitHub 的 Code Graph 功能：仓库的依赖关系图（Insights → Dependency graph），用于安全漏洞告警（Dependabot alerts）
  - VS Code 扩展：如 "CodeGraph" 可视化代码依赖关系
  - 某个第三方 skill：MCP Server 或社区工具

  关于是否要用：
  - 如果是 GitHub Dependency Graph：建议开启。它自动扫描 package.json，发现已知漏洞（CVE）会发 Dependabot alert。对安全性有帮助，零成本
  - 如果是 VS Code CodeGraph 扩展：看你需要。这种工具能帮你可视化模块之间的 import 依赖关系——对于理解 ~390 文件的大型 project 有价值，但不是必须
  - 如果是 某个 AI coding skill/tool：需要更多信息判断

  如果你指的是某个特定的工具或 skill，告诉我具体名字或链接，我帮你评估。

---
  总结：这 14 个问题覆盖了从底层加密到前端 UI 的全栈知识。如果还有不清楚的，直接问。






  你的系统现状：三个缺失
     
  1. 没有客户角色，没有客户界面

  你是对的。系统的 4 个角色全是内部团队角色：

  Owner   → 公司老板
  Admin   → 销售VP
  Operator → SDR/AE（销售开发代表）
  Viewer  → 外部顾问/市场人员

  没有任何角色是属于你的客户的。 Lead 表里的人（你联系的那些销售线索）没有账号、不会登录、看不到任何界面。

  他们的存在形式是：一条数据库记录。他们接收邮件、回复邮件——仅此而已。

  当前客户的"界面"：
  ┌──────────────────────────────────────┐
  │ 客户的 Gmail/Outlook 收件箱           │
  │                                      │
  │ From: alice@acmecorp.com             │
  │ Subject: Following up on our demo... │
  │                                      │
  │ Hi Sarah,                            │
  │ Just wanted to check if you had...   │
  │                                      │
  │ [Reply] [Forward]                    │
  └──────────────────────────────────────┘

  这不是产品缺陷——这是产品定位。 SalesAgent 对标的是 Salesforce Sales Cloud / HubSpot Sales Hub，不是 Intercom / Zendesk。它的用户是卖家（SDR）而非买家（Lead）。

  但如果你的客户需要一个 portal（比如：查看他们和你的所有历史沟通、查看提案、预约会议、上传文件），那么你的系统完全没有这个能力。需要新增。

---
  2. 消息流：只有 Email，没有聊天

  当前的消息流完全基于邮件：

  SDR 在 Inbox 写回复 / AI 生成草稿
    → SDR 点 "Send"
    → Worker 通过 Resend 发邮件
    → Lead 在 Gmail 里收到邮件
    → Lead 在 Gmail 里回复
    → Resend webhook 收到回复
    → 存为 Message (direction: "inbound")
    → 显示在 SDR 的 Inbox 里

  Inbox 的交互（从代码中看到的）：
  - 左侧：对话列表（按状态过滤：all/active/needs_reply/closed）
  - 右侧：消息流 + AI 草稿 + 手动输入框 + Send 按钮
  - AI 草稿功能：点 "AI Draft" → 调 /api/.../ai-draft → DeepSeek 生成回复 → 显示带边框的草稿 → SDR 审核 → 点 Send 才发出

  没有的东西：
  - 没有实时聊天气泡（WebSocket/SSE）
  - 没有客户端的聊天 widget（可以嵌入网站的那种）
  - 没有短信/微信/WhatsApp 渠道
  - 唯一的渠道是 channel: "email"（虽然 Schema 里有 "chat" | "sms" 的定义，但代码里没用过）

---
  3. 产品指标和埋点：基本为零

  Dashboard 和 Analytics 页面有的指标，全部是直接从数据库查出来的聚合数据：

  ┌──────────────────┬────────────────────────────────────────────────────────────┬─────────────┐
  │       指标       │                          怎么算的                          │  是否可用   │
  ├──────────────────┼────────────────────────────────────────────────────────────┼─────────────┤
  │ Pipeline Value   │ (qualified + proposal + negotiation) × $5000（硬编码常量） │ ⚠️  虚构的   │
  ├──────────────────┼────────────────────────────────────────────────────────────┼─────────────┤
  │ Meetings Booked  │ COUNT(*) WHERE type = "meeting_booked"                     │ ✅          │
  ├──────────────────┼────────────────────────────────────────────────────────────┼─────────────┤
  │ Reply Rate       │ replied / sent from campaign stats JSON                    │ ✅          │
  ├──────────────────┼────────────────────────────────────────────────────────────┼─────────────┤
  │ AI Response Rate │ aiMessages / totalMessages                                 │ ✅          │
  ├──────────────────┼────────────────────────────────────────────────────────────┼─────────────┤
  │ Conversion Rate  │ wonThisMonth / totalLeads                                  │ ⚠️  分母不对 │
  ├──────────────────┼────────────────────────────────────────────────────────────┼─────────────┤
  │ Open Rate        │ opened / sent from campaign stats                          │ ✅          │
  └──────────────────┴────────────────────────────────────────────────────────────┴─────────────┘

  完全缺失的东西：
  - 用户行为埋点：谁在什么时候做了什么操作（创建 agent、导入 lead、发送邮件）
  - 漏斗分析：Lead 从 new → contacted → qualified → closed_won 的转化率，每个阶段的流失率
  - 留存指标：用户登录频率、功能使用深度
  - 归因分析：哪个 campaign 带来了多少 pipeline
  - AI 效果评估：AI 生成的回复 vs 人工回复的 reply rate 对比
  - 任何第三方分析工具：代码里搜不到 mixpanel、amplitude、posthog、ga、gtag、segment

  Dashboard 的数字看起来漂亮，但Pipeline Value 是虚构的——AVG_DEAL_SIZE = 5000 是硬编码的，每个 deal 都按 $5000 算。这不是真实的数据驱动决策，而是看起来像产品的 demo 数据。

---
  核心问题：客户为什么用这个，微信不就够了吗？

  这是你问的最好的问题。答案是：在这个产品的当前形态（Email-based B2B 外呼），微信确实不够——但反过来也一样，你的系统在中国市场也不够。

  中美 B2B 销售的根本差异

  ┌────────────┬─────────────────────────────────┬──────────────────────────────────┐
  │            │    美国市场（系统为此设计）     │     中国市场（你的实际场景）     │
  ├────────────┼─────────────────────────────────┼──────────────────────────────────┤
  │ 主要渠道   │ Email                           │ 微信                             │
  ├────────────┼─────────────────────────────────┼──────────────────────────────────┤
  │ 决策链     │ 多轮邮件往来 + Zoom demo + 合同 │ 加微信 → 拉群 → 语音/面谈 → 关系 │
  ├────────────┼─────────────────────────────────┼──────────────────────────────────┤
  │ 销售周期   │ 2-6 周，结构化 pipeline         │ 1-3 月，关系驱动的非结构化流程   │
  ├────────────┼─────────────────────────────────┼──────────────────────────────────┤
  │ 内容形式   │ PDF 案例、定价表、ROI 计算      │ 朋友圈、公众号文章、群内分享     │
  ├────────────┼─────────────────────────────────┼──────────────────────────────────┤
  │ 自动化期望 │ Email 序列、自动跟进、AI 辅助   │ 朋友圈维护、群运营、适时私聊     │
  ├────────────┼─────────────────────────────────┼──────────────────────────────────┤
  │ 客户预期   │ 接受邮件自动化，期望专业跟进    │ 期望"人情味"，反感自动群发       │
  └────────────┴─────────────────────────────────┴──────────────────────────────────┘

  微信确实"够了"——对于个体户

  一个人做销售：
  加微信 → 发朋友圈 → 私聊 → 拉群 → 成交
  微信完全够用。不需要 CRM，不需要 AI，不需要 pipeline。

  微信不够——对于团队

  三个 SDR + 一个销售 VP：
  - 谁跟进了哪个客户？→ 翻聊天记录
  - 客户 A 到什么阶段了？→ 问同事
  - 上周发了多少消息？→ 不知道
  - 谁的转化率最高？→ 凭感觉
  - 客户 B 之前提过什么问题？→ 翻三个月前的聊天记录（如果没换手机）
  - 客户 C 该跟进了吗？→ 忘了就忘了

  这时候，一个系统能：
  1. 统一视图：所有团队成员看到同一个客户的历史
  2. Pipeline 可视化：30 个 lead，哪些是新加的、哪些快成交了
  3. AI 辅助：自动做线索评分、生成话术建议
  4. 不会遗忘：自动提醒"这个客户 7 天没联系了"

  你的系统要做的是：把微信变成 CRM 的一个渠道，而不是替代微信。

  中国市场该怎么做

  ┌──────────────────────────────────────────────────────┐
  │ SalesAgent AI (中国市场版)                            │
  │                                                      │
  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
  │  │ 微信个人号 │  │ 企业微信  │  │ Email（已有）     │   │
  │  │ (渠道)    │  │ (渠道)    │  │ (渠道)           │   │
  │  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
  │       │             │                 │              │
  │       └─────────────┼─────────────────┘              │
  │                     ▼                                │
  │           ┌─────────────────┐                        │
  │           │  统一 Inbox      │  ← 你的系统已经有这个   │
  │           │  (所有渠道聚合)   │                        │
  │           └────────┬────────┘                        │
  │                    ▼                                 │
  │     ┌──────────────────────────┐                     │
  │     │ Lead / Conversation /    │                     │
  │     │ Campaign / AI Agent      │  ← 核心已有         │
  │     └──────────────────────────┘                     │
  │                                                      │
  │  新增：                                              │
  │  ┌────────────────────────────┐                      │
  │  │ 客户 Portal (小程序/H5)     │  ← 客户角色+界面      │
  │  │ - 查看历史沟通              │                      │
  │  │ - 预约会议/演示             │                      │
  │  │ - 查看提案/合同             │                      │
  │  │ - 上传文件                  │                      │
  │  └────────────────────────────┘                      │
  │                                                      │
  │  ┌────────────────────────────┐                      │
  │  │ 产品指标埋点                │  ← 数据驱动决策       │
  │  │ - 用户行为事件流            │                      │
  │  │ - Pipeline 漏斗            │                      │
  │  │ - AI 效果 A/B 对比          │                      │
  │  └────────────────────────────┘                      │
  └──────────────────────────────────────────────────────┘

---
  总结：你现在有什么，缺什么

  ┌───────────────┬──────────────────────────┬─────────────────────────────────────────┐
  │     维度      │           已有           │                  缺失                   │
  ├───────────────┼──────────────────────────┼─────────────────────────────────────────┤
  │ 客户角色      │ Lead 表（无账号）        │ 客户 portal、客户登录、客户界面         │
  ├───────────────┼──────────────────────────┼─────────────────────────────────────────┤
  └──────────────────────────────────────────────────────┘

---
  总结：你现在有什么，缺什么

  ┌───────────────┬──────────────────────────┬─────────────────────────────────────────┐
  │     维度      │           已有           │                  缺失                   │
  ├───────────────┼──────────────────────────┼─────────────────────────────────────────┤
  │ 客户角色      │ Lead 表（无账号）        │ 客户 portal、客户登录、客户界面         │
  ├───────────────┼──────────────────────────┼─────────────────────────────────────────┤
  │ 消息渠道      │ Email（Resend）          │ 微信、企微、短信、网站聊天 widget       │
  ├───────────────┼──────────────────────────┼─────────────────────────────────────────┤
  │ 消息流        │ Email 收发 + Inbox       │ 实时聊天、多渠道聚合                    │
  ├───────────────┼──────────────────────────┼─────────────────────────────────────────┤
  │ 产品指标      │ 基础聚合统计（SQL 直查） │ 事件埋点、漏斗、留存、归因、AI 效果评估 │
  ├───────────────┼──────────────────────────┼─────────────────────────────────────────┤
  │ Pipeline 估值 │ 硬编码 $5K × deal 数     │ 真实 deal amount 字段                   │
  ├───────────────┼──────────────────────────┼─────────────────────────────────────────┤
  │ 市场适配      │ 美国 B2B Email 外呼      │ 中国微信生态                            │
  └───────────────┴──────────────────────────┴─────────────────────────────────────────┘

  你的困惑是对的。当前的系统是一个美国市场的 Email-based AI SDR 工具。如果你要在中国市场用，需要做三件事：

  1. 加渠道：对接企业微信（这是最可行的，企微有 API）或微信个人号（合规风险高）
  2. 加客户界面：至少一个 H5 页面/小程序，让客户能看历史消息、约会议
  3. 加埋点：哪怕只用 PostHog（开源、可自托管），也比零埋点好 100 倍