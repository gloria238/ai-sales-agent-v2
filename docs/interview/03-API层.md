# 模块 3：API 层

## 结论

API 层有 50+ Route Handler，全部遵循统一的守卫链模式：middleware 做通用认证/限流 → Route Handler 做业务权限 + org-scoped 查询。sendMessageSchema 的 Zod 校验覆盖消息发送的完整路径。ai-draft 路由是最复杂的端点，集成了 RAG pipeline + LLM 调用 + AICallMetric。metrics/ai 路由用 raw SQL 做 percentile_cont 聚合。限流策略是两层防御：middleware 100/min + auth 10/min。

---

## 1. 完整的守卫链

### 每层做什么

```
请求进入
  ↓
[Layer 1: IP 提取] — middleware.ts:12-33
  getClientIp(): x-forwarded-for → trusted proxy 验证 → x-real-ip → 127.0.0.1
  TRUSTED_PROXY_RANGES 未配置时直接用 x-forwarded-for（假设 CDN 正确处理）

  ↓
[Layer 2: 限流] — middleware.ts:39-75
  API 路由 100 req/min, Auth 路由 10 req/min
  Upstash 滑动窗口 (Redis) → 内存 TTL fallback
  失败时: { error: "Too many requests" }, 429 + Retry-After header

  ↓
[Layer 3: Deprecation 头] — middleware.ts:65-68
  非 /api/v1/ 路径 → Deprecation: true, Sunset: 2028-01-01

  ↓
[Layer 4: Session cookie] — middleware.ts:125-133
  读 "session" cookie → 不存在? API=401 JSON, Page=redirect /login

  ↓
[Layer 5: JWT 验证] — middleware.ts:135-145
  verifyToken(token) → jose.jwtVerify (HS256)
  失败? API=401 JSON + clear cookie, Page=redirect /login + clear cookie

  ↓
[Layer 6: Token 黑名单] — middleware.ts:147-159
  isTokenRevoked(payload.jti) → Redis SET check
  已撤销? API=401 "Token revoked" + clear cookie

  ↓
[Layer 7: Membership + Permission] — Route Handler
  prisma.membership.findFirst({ userId, organization: { slug } })
  不存在? 404 "Not found"
  checkPermission(role, "view_agents"|"manage_agents")
  无权限? 403 "Forbidden"

  ↓
[Layer 8: Zod 校验] — Route Handler
  sendMessageSchema.safeParse(body)
  失败? 400 + details: ZodError.flatten()

  ↓
[Layer 9: Org-scoped 查询] — Route Handler
  所有 Prisma 查询带 organizationId 过滤
```

### 错误码地图

| 层级 | 错误 | HTTP | 响应格式 |
|------|------|------|---------|
| 限流 | 超阈值 | 429 | `{ error: "Too many requests" }` + Retry-After |
| Session | 无 cookie | 401 (API) / 302 (Page) | `{ error: "Unauthorized" }` / redirect |
| JWT | 无效/过期 | 401 (API) / 302 (Page) | `{ error: "Unauthorized" }` + clear cookie |
| 黑名单 | JTI 已撤销 | 401 (API) / 302 (Page) | `{ error: "Token revoked" }` + clear cookie |
| Membership | 不属于该 org | 404 | `{ error: "Not found" }` (防止 org 枚举) |
| RBAC | 角色无权限 | 403 | `{ error: "Forbidden" }` |
| Zod | 输入无效 | 400 | `{ error: "Invalid input", details: ZodError }` |

---

## 2. sendMessageSchema 的 Zod 校验

### 完整 schema

```typescript
// lib/validation.ts:60-65
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(), // ID 来自 URL path, 不在 body
  content: z.string().min(1, "Message is required")  // 非空
                   .max(10000, "Message too long"),   // 防 DoS
  channel: z.enum(["email", "chat"]).default("email"),// 通道隔离
  reviewAction: z.enum(["approved", "rejected"]).optional(), // HITL 审核
});
```

### 每个字段的约束理由

| 字段 | 约束 | 理由 |
|------|------|------|
| `conversationId` | uuid, optional | 来自 URL `/conversations/{id}/messages`，不在 body 里。Zod 标记 optional 让 schema 可复用（Worker 也用它） |
| `content` | 1-10000 字符 | min=1 防空消息；max=10000 防 10KB+ 的单条消息塞爆 DB TEXT 列和 LLM context |
| `channel` | enum email\|chat, default email | 通道隔离——email 和 chat 走不同的展示和发送逻辑。default email 兼容旧客户端 |
| `reviewAction` | enum approved\|rejected, optional | HITL 审核记录。两条写入路径：客户端 AI 草稿在 POST 时带；Worker 草稿通过 PATCH `[messageId]/route.ts` 单独写 |

### reviewAction 的两条写入路径

```
路径 A — 客户端 AI 草稿 (ai-draft API → 前端审核 → POST /messages):
  POST body: { content, channel: "email", reviewAction: "approved" }
  → prisma.message.create({ ..., reviewAction })  ← 一步到位

路径 B — Worker 草稿 (Worker 已写入 Message → 前端审核 → PATCH):
  PATCH /messages/{messageId}
  body: { reviewAction: "approved"|"rejected" }
  → prisma.message.update({ where: { id }, data: { reviewAction } })
```

---

## 3. ai-draft 路由的完整执行流程

### 时序分析

```
Step 1: Auth guard (5-15ms)
  getSession → Membership → checkPermission("manage_agents")

Step 2: DB load (10-30ms)
  prisma.conversation.findUnique({ include: lead, agent, messages })

Step 3: KB search (50-500ms, 最易超时)
  searchKnowledgeBase(latestInbound, orgId)
  → createEmbeddingProvider()
  → hybridRetrieve(sqlExecutor, embedder, query, orgId, { topK: 5 })
    ├── Query Rewriter (LLM, ~200ms)
    ├── Query Router
    ├── Vector search (pgvector, ~30ms)
    ├── Keyword search (tsvector, ~20ms)
    ├── RRF Fusion (~1ms)
    └── Cohere Reranker (~200ms)
  失败 → 静默降级: kbResults = [], 不阻塞草稿生成

Step 4: Prompt construction (~1ms)
  kbContext + history + lead info → 拼接 system + user prompt
  PROMPT_ARMOR + <user_data> 标签包裹所有用户输入

Step 5: DeepSeek call (2000-8000ms, 主要耗时)
  callDeepSeekJSON({ temperature: 0.7, timeoutMs: 25_000 })
  调用 DeepSeek /v1/chat/completions, expect JSON response

Step 6: AICallMetric write (5-10ms, non-blocking)
  prisma.aICallMetric.create({ jobType: "compose_response", ... })
  try/catch — 失败不影响返回

总耗时估算: P50 ~3s, P95 ~8s. 瓶颈在 DeepSeek API 响应时间。
```

### 哪步最容易超时

1. **DeepSeek API (P95 8s)** — 已有 25s timeout。如果 DeepSeek 挂了，整个草稿返回 500。
2. **Cohere Rerank (~200ms)** — 如果 COHERE_API_KEY 没配，auto-fallback 到 NoopReranker（不超时但不排序）
3. **Embedding API (~100ms)** — 如果 EMBEDDING_API_KEY 没配，降级到纯 keyword search

---

## 4. percentile_cont 原始 SQL

### 为什么不用 Prisma aggregate

```typescript
// metrics/ai/route.ts
const [percentileRows] = (await prisma.$queryRawUnsafe(...)) as unknown as [Record<string, number | null>];
const p50 = percentileRows?.["p50"] ?? null;
```

Prisma 的 `aggregate` 只支持 `_avg`, `_sum`, `_min`, `_max`, `_count`——没有百分位数。`percentile_cont` 是 PostgreSQL 特有的窗口聚合函数，必须 raw SQL。

### P50/P95 的实际意义

- **P50 (中位数)**：一半的 AI 调用响应时间 ≤ 这个值。比平均值更鲁棒——不受一两个超慢请求的影响。
- **P95**：95% 的请求在这个时间内完成。比 P99 更有可操作性——P95 过高说明大部分用户体感慢，P99 过高可能只是偶发。
- **为什么只查 compose_response**：这是用户直接感知的延迟（AI 草稿响应时间）。score_lead 和 campaign_ai 是后台任务，延迟数据没有用户感知价值。

### 类型推断问题

`$queryRawUnsafe` 返回类型推断不足。Prisma 6 对 raw SQL 不提供列名级别的类型推断。用了 `as unknown as [Record<string, number | null>]` 双重转换。

---

## 5. 限流策略

### 100/min 是怎么算出来的

```
100 req/min ≈ 1.67 req/s per IP

实际场景：
- Inbox 页面：Server Component 1 次 + 点击对话 fetch 1 次 = ~2 次/页
- 正常操作：发送消息 (1 POST) + AI 草稿 (1 POST) + 翻译 (1 POST) ≈ 5 次/分钟
- 峰值：快速切换对话、连续翻译 = 可能达到 30-50/分钟

100 是 2x 峰值 buffer。不是严格推导——是 one-person project 的快速决策。
```

### fail-open vs fail-closed

| 模式 | 行为 | 场景 |
|------|------|------|
| **fail-open** (默认) | Redis 挂了 → 放行所有请求 | 本地开发、低风险部署、避免误伤 |
| **fail-closed** | Redis 挂了 → 拒绝所有请求 (429) | 生产环境高风险、DDoS 攻击时 |

配置：`RATE_LIMIT_FAIL_CLOSED=true` env var。同一模式在 `token-blacklist.ts` 中复用。

### 内存回退

```typescript
// rate-limit.ts — 当 UPSTASH_REDIS_REST_URL 未配置时
// 使用内存 Map + TTL 的简易限流器（本地开发/单实例）
```

**局限**：内存回退是单进程的——Vercel 多个 Serverless 实例各自有独立的 Map，不能共享计数。只适合本地开发或单实例部署。

---

## 6. DeepSeek API 降级行为

### 整条链路的降级

```
DeepSeek API 挂了 (timeout/5xx):

ai-draft/route.ts:
  → callDeepSeekJSON timeout 25s → 抛出异常
  → catch 块: console.error → 返回 500 { error: "AI 草稿生成失败" }
  → 前端: toast.error("AI 草稿生成失败")

Worker composeAiResponse:
  → callDeepSeekJSON timeout 15s → 抛出异常
  → BullMQ 自动重试 (3 次, 指数退避 2s→4s→8s)
  → 3 次都失败 → job failed, 保留在 Redis 7 天
  → 前端: 对话状态保持在 "active" (Worker 没更新 awaiting_approval)

score-lead (Web 端, 已改造):
  → 入队 scoringQueue → Worker 消费
  → Worker scoreLead() 调 DeepSeek → 失败 → BullMQ 重试
  → 前端: toast("已提交评分任务") → 500ms 后 refresh
  → Lead.score 保持旧值（Worker 没更新）
```

### 降级后用户看到什么

- **AI 草稿**：报错弹窗 "AI 草稿生成失败"，可以手动写回复
- **自动评分**：静默失败，旧分数保留。用户点"重新评分"会重新入队
- **Worker 回复**：对话无 AI 草稿产出，status 不变。SDR 需要手动跟进
