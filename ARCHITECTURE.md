# OpsFlow AI — Architecture Document

> Multi-tenant AI Workflow CRM for async automation, lead operations, and workflow orchestration.
> ~9,500 lines across ~200 files. 38 API routes + SSE + webhook trigger. 3 sellable templates + template marketplace.

---

## 目录

1. [系统总览](#1-系统总览)
2. [基础设施层](#2-基础设施层)
3. [认证与安全体系](#3-认证与安全体系)
4. [多租户与权限系统](#4-多租户与权限系统)
5. [数据模型](#5-数据模型)
6. [CRM 线索系统](#6-crm-线索系统)
7. [工作流引擎](#7-工作流引擎)
8. [AI 智能层](#8-ai-智能层)
9. [异步任务队列](#9-异步任务队列)
10. [邮件系统](#10-邮件系统)
11. [内部运维面板](#11-内部运维面板)
12. [前端架构](#12-前端架构)
13. [部署架构](#13-部署架构)
14. [安全态势](#14-安全态势)
15. [产品化功能](#15-产品化功能)

---

## 1. 系统总览

### 1.1 项目定位

OpsFlow AI 是一个面向中小型销售团队、SaaS 初创公司和代理机构的 AI 驱动工作流自动化平台。它将 CRM 线索管理、可视化工作流构建、AI 辅助决策和异步任务编排集成到一个统一的运营工作区中。

### 1.2 核心能力矩阵

| 能力域 | 功能 | 实现方式 |
|--------|------|---------|
| **CRM** | 线索管理、管道阶段、活动时间线、搜索过滤 | Next.js + Prisma + PostgreSQL |
| **工作流** | 可视化 DAG 构建器、条件分支、延迟节点 | React Flow + Kahn 拓扑排序 |
| **AI** | 线索评分、工作流生成、节点建议、异常分析 | DeepSeek API + 结构化提示词 |
| **队列** | 异步执行、重试指数退避、死信队列 | BullMQ + Upstash Redis |
| **邮件** | 模板渲染、变量替换、工作流触发发送 | Resend SDK + `{{variable}}` 引擎 |
| **多租户** | 组织隔离、4 级角色、10 项权限 | Prisma 查询级隔离 + JWT 会话 |
| **实时** | 运行状态流式推送 | Server-Sent Events (SSE) |

### 1.3 技术栈一览

```
┌─────────────────────────────────────────────────────────┐
│                     用户界面层                           │
│  Next.js 14 · React 18 · Tailwind CSS · shadcn/ui       │
│  TanStack Query · Zustand · React Flow · sonner          │
├─────────────────────────────────────────────────────────┤
│                     应用服务层                           │
│  Next.js Route Handlers · Custom JWT (jose)             │
│  Prisma 6 ORM · bcryptjs · jose                         │
├─────────────────────────────────────────────────────────┤
│                     异步处理层                           │
│  BullMQ · Upstash Redis · Railway Worker                │
│  Resend Email · DeepSeek AI                             │
├─────────────────────────────────────────────────────────┤
│                     数据存储层                           │
│  PostgreSQL (Supabase) · Upstash Redis                  │
│  Prisma Schema (opsflow) · 10 models                    │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 基础设施层

### 2.1 项目结构

```
opsflow-ai/
├── apps/
│   ├── web/                          # Next.js 14 Web 应用
│   │   ├── app/
│   │   │   ├── (auth)/               # 登录/注册页面
│   │   │   ├── (dashboard)/          # 仪表盘页面组
│   │   │   │   ├── home/             # 仪表盘首页 (/home, 中间件改写)
│   │   │   │   ├── leads/            # CRM 线索管理
│   │   │   │   ├── workflows/        # 工作流管理 + 构建器
│   │   │   │   ├── runs/             # 全局运行面板
│   │   │   │   ├── settings/         # 组织设置 + 成员管理
│   │   │   │   └── audit-log/        # 审计日志查看
    │   │   │   ├── page.tsx              # 公开落地页 (/)
    │   │   │   └── api/                  # 38 个 API 路由
│   │   │       ├── auth/             # login, register, logout, verify
│   │   │       └── orgs/[slug]/      # CRUD + AI + runs + members
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn 风格 UI 组件 (10个)
│   │   │   ├── nav/                  # 侧边栏、用户菜单
│   │   │   ├── workflow/             # 工作流构建器组件
│   │   │   └── leads/                # 线索相关组件
│   │   ├── lib/                      # 核心库
│   │   │   ├── auth.ts              # JWT 签发/验证
│   │   │   ├── session.ts           # 服务端会话提取
│   │   │   ├── permissions.ts       # RBAC 权限矩阵
│   │   │   ├── password.ts          # bcrypt 密码哈希
│   │   │   ├── ai.ts                # DeepSeek 客户端
│   │   │   ├── prompts.ts           # AI 系统提示词
│   │   │   ├── feature-flags.ts     # 功能开关
│   │   │   ├── rate-limit.ts        # Redis 限流
│   │   │   ├── logger.ts            # 结构化日志
│   │   │   └── audit.ts             # 审计日志写入
│   │   └── middleware.ts            # JWT 守卫 + 限流
│   │
│   └── worker/                       # BullMQ Worker
│       └── src/
│           ├── index.ts             # Worker 主程序 + DAG 引擎
│           ├── queue.ts             # Redis 连接 + 队列
│           └── email.ts             # Resend 邮件发送
│
├── packages/
│   ├── db/                           # Prisma 6 + PostgreSQL
│   │   ├── prisma/
│   │   │   └── schema.prisma        # 10 models in opsflow schema
│   │   ├── index.ts                 # PrismaClient 单例
│   │   ├── seed-production.ts       # 3 模板 + 5 线索 (幂等)
│   │   ├── seed-members.ts          # RBAC 测试账号
│   │   ├── seed-verify-alice.ts     # 预验证 alice 邮箱
│   │   └── clean-demo-org.ts        # FK 安全清理
│   ├── core/                         # (预留)
│   └── ui/                           # (预留)
│
├── CLAUDE.md                         # AI 助手开发指南
├── PROGRESS.md                       # 项目进度报告
├── ARCHITECTURE.md                   # 本文件
└── README.md                         # 产品展示
```

### 2.2 环境变量全景

```
                    ┌──────────────┐
                    │   Vercel     │ ← DATABASE_URL, JWT_SECRET, DEEPSEEK_API_KEY,
                    │   (Web)      │   REDIS_URL, UPSTASH_REDIS_REST_URL/TOKEN
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │   Railway    │ ← DATABASE_URL, REDIS_URL,
                    │   (Worker)   │   DEEPSEEK_API_KEY, RESEND_API_KEY, EMAIL_FROM
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │   Supabase   │ ← PostgreSQL, opsflow schema
                    │   (DB)       │
                    └──────────────┘
                    ┌──────────────┐
                    │   Upstash    │ ← Redis (BullMQ queue + rate limiting)
                    │   (Redis)    │
                    └──────────────┘
```

---

## 3. 认证与安全体系

### 3.1 登录流程

```
用户输入邮箱+密码
        │
        ▼
 POST /api/auth/login
        │
        ├── 查询用户 (by email)
        ├── bcrypt.compare(password, hash)
        ├── 查询 membership + organization
        ├── JWT 签发 (jose HS256, 7天)
        │     payload: { userId, email, name, orgId, orgSlug, role }
        └── 返回 { user, org } + Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Lax
```

### 3.2 注册流程

```
用户填写 name + email + password (≥8字符)
        │
        ▼
 POST /api/auth/register
        │
        ├── alice@example.com?
        │   ├── YES → 创建新 org "alice-workspace" + role=owner
        │   └── NO  → 查找 alice 的 org + role=viewer
        ├── 创建 user + membership
        ├── 生成 loginToken (UUID, 10分钟过期)
        ├── 返回 { verifyUrl: "/api/auth/verify?token=xxx" }
        │
        ▼
  用户点击验证链接
        │
        ▼
 GET /api/auth/verify?token=xxx
        ├── 验证 token + 过期时间
        ├── emailVerified = true, 清除 loginToken
        ├── JWT 签发 + Set-Cookie
        └── 重定向到 /dashboard
```

### 3.3 请求守卫链

```
Incoming Request
        │
        ▼
 middleware.ts
        ├── Rate Limiting: Upstash Redis sliding window (100 req/min per IP)
        ├── Public paths? → pass through (/login, /register, /api/auth/*)
        ├── JWT cookie? → verifyToken (jose)
        │   ├── Valid → next()
        │   └── Invalid/Expired → redirect /login
        │
        ▼
 API Route Handler
        ├── getSession() → 从 cookie 提取 session
        ├── membership 查询 (userId + orgSlug)
        ├── requirePermission(role, "permission_name")
        └── 业务逻辑 (org-scoped Prisma queries)
```

### 3.4 安全加固清单

| 层级 | 措施 | 文件 |
|------|------|------|
| 传输 | HTTPS only, HSTS preload, secure cookies | `next.config.js` |
| 注入防护 | React 自动 XSS 转义, Prisma 参数化查询 | 全项目 |
| 点击劫持 | X-Frame-Options: DENY | `next.config.js` |
| 内容注入 | CSP: default-src 'self' | `next.config.js` |
| 认证暴力 | Redis 滑动窗口 100 req/min | `lib/rate-limit.ts` |
| JWT 安全 | HS256 + 强制密钥 (无回退值) | `lib/auth.ts` |
| 密码存储 | bcrypt 10轮哈希, 最少8字符 | `lib/password.ts` |
| 信息泄露 | 通用错误消息, PII 日志哈希 | `auth/*/route.ts` |
| 枚举防护 | 统一 "Invalid email or password" | `login/route.ts` |

---

## 4. 多租户与权限系统

### 4.1 组织模型

```
Organization (组织/工作空间)
     │
     ├── 1:N → Membership (成员关系)
     │            ├── userId
     │            ├── role: owner | admin | operator | viewer
     │            └── organizationId
     │
     ├── 1:N → Workflow (工作流)
     ├── 1:N → Lead (线索)
     ├── 1:N → LeadActivity (线索活动)
     └── 1:N → AuditLog (审计日志)
```

### 4.2 角色定义

| 角色 | 典型用户 | 能力范围 |
|------|---------|---------|
| **Owner** | 创始人/付费账户 | 完全控制：管理组织、成员、计费、删除所有数据 |
| **Admin** | 团队主管 | 管理成员、工作流、线索，不能删除组织 |
| **Operator** | 销售人员 | 创建/编辑工作流和线索，不能删除任何数据 |
| **Viewer** | 只读观察者 | 查看所有数据，不能修改任何内容 |

### 4.3 权限矩阵 (10 项权限)

```
                    Owner   Admin   Operator   Viewer
─────────────────────────────────────────────────────
manage_org            ✅      —        —         —
manage_members        ✅      ✅       —         —
manage_workflows      ✅      ✅       ✅        —
delete_workflows      ✅      ✅       —         —
manage_leads          ✅      ✅       ✅        —
delete_leads          ✅      ✅       —         —
view_workflows        ✅      ✅       ✅        ✅
view_leads            ✅      ✅       ✅        ✅
view_members          ✅      ✅       ✅        ✅
view_audit_log        ✅      ✅       ✅        ✅
run_workflows         ✅      ✅       ✅        —
```

### 4.4 租户隔离实现

所有 API 路由都遵循统一的隔离模式：

```typescript
// 1. 验证会话
const session = await getSession();

// 2. 验证当前组织成员身份
const membership = await prisma.membership.findFirst({
  where: { userId: session.userId, organization: { slug: params.slug } },
});

// 3. 检查权限
requirePermission(membership.role, "required_permission");

// 4. 所有查询都限定在 organizationId 范围内
const data = await prisma.workflow.findMany({
  where: { organizationId: membership.organizationId },
});
```

---

## 5. 数据模型

### 5.1 实体关系图

```
User (用户)
  │
  ├──< Membership >── Organization
  │
  Organization
  │
  ├──< Lead ──< LeadActivity
  │
  ├──< Workflow ──< WorkflowVersion
  │                    │
  │                    ├──< WorkflowNode
  │                    ├──< WorkflowEdge
  │                    └──< WorkflowRun ──< WorkflowRunEvent
  │
  └──< AuditLog
```

### 5.2 模型详情

#### User
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| email | String (unique) | 登录标识 |
| name | String? | 显示名称 |
| passwordHash | String | bcrypt 10轮哈希 |
| emailVerified | Boolean | 邮箱验证状态，默认 false |
| loginToken | String? | 一次性验证令牌 |
| loginTokenExpires | DateTime? | 令牌过期时间 (10分钟) |

#### Organization
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | String | 组织名称 (可修改) |
| slug | String (unique) | URL 标识 (可修改，需重签 JWT) |

#### Membership
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| userId | String | 外键 → User |
| role | enum MembershipRole | owner / admin / operator / viewer |
| @@unique | [organizationId, userId] | 一个用户在一个组织中只有一种角色 |

#### Workflow
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| name | String | 工作流名称 |
| description | String? | 描述 |

#### WorkflowVersion
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workflowId | String | 外键 → Workflow |
| version | Int | 版本号 (每次保存递增) |

#### WorkflowNode
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 节点唯一标识 |
| versionId | String | 外键 → WorkflowVersion |
| type | String | trigger / action / condition / delay |
| label | String? | 自定义节点名称 |
| config | JSON | 类型特定配置 |
| positionX/Y | Float | 画布坐标 |

#### WorkflowEdge
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 边唯一标识 |
| versionId | String | 外键 → WorkflowVersion |
| sourceNodeId | String | 起始节点 |
| targetNodeId | String | 目标节点 |
| sourceHandle | String? | 条件分支标识 ("true"/"false") |

#### WorkflowRun
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 运行唯一标识 |
| versionId | String | 外键 → WorkflowVersion |
| status | String | queued → running → completed/failed/dead_letter |
| input/output | JSON? | 运行时数据 |

#### WorkflowRunEvent
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 事件唯一标识 |
| runId | String | 外键 → WorkflowRun |
| nodeId | String | 对应节点 ID |
| status | String | 节点执行状态 |

#### Lead
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| name | String | 线索名称 |
| email | String? | 联系邮箱 |
| stage | String? | 管道阶段 (new/qualified/proposal/negotiation/closed-won/closed-lost) |
| tags | JSON? | 自定义标签 |

#### LeadActivity
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| leadId | String | 外键 → Lead (Cascade Delete) |
| type | String | note / stage_change / assignment / created / updated |
| content | String? | 活动内容 |
| metadata | JSON? | 附加数据 (如 fromStage, toStage) |

#### AuditLog (不可变)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| action | String | workflow.created / lead.deleted / member.added 等 |
| targetType | String | Workflow / Lead / Membership |
| targetId | String? | 目标记录 ID |
| metadata | JSON? | 变更详情 |

---

## 6. CRM 线索系统

### 6.1 管道阶段

```
  new ──→ qualified ──→ proposal ──→ negotiation ──→ closed-won
                  │                                    │
                  └──────────→ closed-lost ←───────────┘
```

### 6.2 API 端点

| 方法 | 路径 | 权限 | 描述 |
|------|------|------|------|
| GET | /api/orgs/{slug}/leads | view_leads | 列表 (搜索/过滤/分页) |
| POST | /api/orgs/{slug}/leads | manage_leads | 创建 |
| GET | /api/orgs/{slug}/leads/{id} | view_leads | 详情 |
| PATCH | /api/orgs/{slug}/leads/{id} | manage_leads | 更新字段 |
| DELETE | /api/orgs/{slug}/leads/{id} | delete_leads | 删除 (级联) |
| GET | /api/orgs/{slug}/leads/{id}/activities | view_leads | 活动列表 |
| POST | /api/orgs/{slug}/leads/{id}/activities | manage_leads | 添加备注 |

### 6.3 前端组件

```
leads/
├── page.tsx                    # 服务端组件：加载线索列表
├── lead-table-client.tsx       # 客户端：搜索/过滤/分页/排序
├── create-button.tsx           # 创建线索对话框
└── [id]/
    ├── page.tsx                # 线索详情 (服务端)
    ├── stage-selector.tsx      # 阶段下拉选择器
    ├── note-form.tsx           # 备注提交
    ├── edit-dialog.tsx         # 编辑线索对话框
    └── delete-button.tsx       # 删除确认对话框
```

---

## 7. 工作流引擎

### 7.1 设计哲学

工作流引擎采用了**事件溯源 + DAG (有向无环图)** 的设计：

- **版本化**: 每次保存创建新版本，运行绑定到特定版本
- **DAG 执行**: 基于 Kahn 算法进行拓扑排序，保证节点按依赖顺序执行
- **状态持久化**: 每个节点的执行状态都持久化到 WorkflowRunEvent
- **幂等性**: 已成功的节点不会重复执行

### 7.2 节点类型

#### Trigger (触发器)
- 工作流的入口点，只能有一个
- 类型: manual, webhook (预留), cron (预留)
- 绿色标识，右侧输出句柄

#### Action (动作)
- 执行具体操作
- 类型: send_email, score_lead, update_lead, webhook (预留)
- 蓝色标识，单输入单输出

#### Condition (条件)
- 根据数据字段进行分支判断
- 配置: field (数据字段), operator (greater_than/equals), value (比较值)
- 菱形琥珀色，两个输出句柄: yes (true) / no (false)
- Worker 通过遍历 DAG 边并根据条件字段值判定激活哪些下游节点

#### Delay (延迟)
- 暂停执行指定时长
- 配置: duration (数值) + unit (minutes/hours/days)
- Worker 首次遇到 delay 节点时创建 "delayed" 事件，然后使用 BullMQ 内置 delay 机制重新入队
- 紫色标识

### 7.3 画布构建器

```
┌──────────────────────────────────────────────────────────┐
│  Toolbar: [Workflow Name] [Zoom In/Out/Fit] [Save]       │
├──────────┬──────────────────────────┬────────────────────┤
│ Node     │                          │ Node Config        │
│ Palette  │    React Flow Canvas     │ Panel              │
│          │                          │                    │
│ Trigger  │   [Trigger]──→[Action]   │ Type: action       │
│ Action   │                      │   │ Label: Send Email  │
│ Condition│                      ↓   │ Config:            │
│ Delay    │                 [Condition]│   to: {{email}}   │
│          │                  /        \│   subject: ...    │
│          │              yes/          \no                 │
│          │                /            \                  │
│          │          [Action]      [Action]               │
│──────────┴──────────────────────────┴───────────────────│
│  AI Suggestions Panel (collapsible, left)                │
│  AI Workflow Generator (collapsible, top)                │
└──────────────────────────────────────────────────────────┘
```

### 7.4 Worker 执行引擎

```
job received ──→ load WorkflowRun + events from DB
                      │
                      ▼
              Topological Sort (Kahn's Algorithm)
              - 构建邻接表
              - 计算入度
              - BFS 排序节点
                      │
                      ▼
              Determine Active Nodes
              - 遍历已排序节点
              - 已成功？→ 跳过
              - 条件节点？→ 检查上游输出，解析条件字段
                (支持点号路径如 lead.email)
              - 反向边？→ 检查源节点是否成功
                      │
                      ▼
              For each active node (DAG order):
                ├── trigger/action:
                │     ├── send_email → Resend.send()
                │     ├── score_lead → DeepSeek scoring
                │     └── update_lead → Prisma update
                │
                ├── condition: (processed in Determine Active)
                │
                ├── delay:
                │     首次 → queue.add("execute", {}, { delay: Nms })
                │     再次 → mark success, continue
                │
                └── failure handling:
                      重试次数 > 0? → retry in-process
                      重试次数 = 0? → dead_letter status
                      │
                      ▼
              All done → status: completed
```

### 7.5 API 端点

| 方法 | 路径 | 权限 | 描述 |
|------|------|------|------|
| GET | /api/orgs/{slug}/workflows | view_workflows | 列表 |
| POST | /api/orgs/{slug}/workflows | manage_workflows | 创建 |
| GET | /api/orgs/{slug}/workflows/{id} | view_workflows | 详情+最新版本图 |
| PUT | /api/orgs/{slug}/workflows/{id} | manage_workflows | 保存图 (新版本) |
| DELETE | /api/orgs/{slug}/workflows/{id} | delete_workflows | 删除+审计 |
| POST | /api/orgs/{slug}/workflows/{id}/trigger | run_workflows | 手动触发运行 |
| GET | /api/orgs/{slug}/workflows/{id}/runs | view_workflows | 运行历史 |
| GET | /api/orgs/{slug}/workflows/{id}/runs/stream | view_workflows | SSE 实时推送 |

---

## 8. AI 智能层

### 8.1 架构

```
Frontend Components                API Routes                AI Provider
─────────────────                ───────────                ───────────
AIWorkflowGenerator  ──POST──→  /ai/generate-workflow  ──→
AISuggestionsPanel    ──POST──→  /ai/suggest-nodes      ──→  DeepSeek API
AIInsightsCard        ──POST──→  /ai/score-lead         ──→  (deepseek-chat)
WorkflowRunView       ──POST──→  /ai/analyze-run        ──→
                                     │
                              lib/ai.ts (callDeepSeek)
                              lib/prompts.ts (builders)
                              lib/feature-flags.ts (gating)
```

### 8.2 AI 客户端 (`lib/ai.ts`)

```
callDeepSeekJSON<T>(prompt, system, options)
        │
        ├── 检查 DEEPSEEK_API_KEY
        ├── POST https://api.deepseek.com/v1/chat/completions
        │     { model: "deepseek-chat", messages, temperature, max_tokens }
        ├── 错误分类: AIClientError { statusCode, retryable }
        │     429 → retryable    5xx → retryable
        ├── 提取 choices[0].message.content
        ├── 去除 markdown 代码块 (```json ... ```)
        └── JSON.parse → T
```

### 8.3 四个 AI 功能

#### 8.3.1 AI 工作流生成 (AI Workflow Generation)
- **触发**: 画布顶部 "Generate with AI" 面板
- **输入**: 自然语言描述 (≤2000 字符)
- **输出**: 完整的 nodes[] + edges[] JSON → 加载到画布
- **提示词**: 描述 → 结构化工作流定义 (trigger/action/condition/delay + 坐标布局)
- **权限**: manage_workflows (owner/admin/operator)
- **功能开关**: FEATURE_AI_WORKFLOW_GEN

#### 8.3.2 AI 节点建议 (AI Node Suggestions)
- **触发**: 画布左侧 "AI Suggestions" 面板 → "Suggest Nodes"
- **输入**: 当前工作流 nodes + edges + 可能的选中节点类型
- **输出**: 3-5 个建议 (type, label, config, reason, priority)
- **过滤**: 仅允许 ["trigger", "action", "condition", "delay"] 类型
- **交互**: 点击 "+ Add to Canvas" 将建议节点添加到画布
- **权限**: manage_workflows
- **功能开关**: FEATURE_AI_SUGGESTIONS

#### 8.3.3 AI 线索评分 (AI Lead Scoring)
- **触发**: 线索详情页 "AI Insights" 卡片，自动加载
- **输入**: 线索 name, email, stage, tags, createdAt
- **输出**: score (0-100), label (hot/warm/cold), reason, nextAction
- **交互**: Refresh 按钮重新评分，Retry 按钮处理失败
- **权限**: view_leads (所有角色)
- **功能开关**: FEATURE_AI_LEAD_SCORING

#### 8.3.4 AI 异常检测 (Anomaly Detection)
- **触发**: 运行历史中失败/死信运行 → "Analyze with AI" 按钮
- **输入**: 运行事件列表 (nodeId, status, input, output)
- **输出**: rootCause, failedNode, suggestedFix, isTransient
- **交互**: 错误时显示 Retry 按钮
- **权限**: view_workflows (所有角色)
- **功能开关**: FEATURE_AI_ANOMALY_DETECTION

### 8.4 功能开关

每个 AI 功能都可以通过环境变量独立关闭：

| 功能 | 环境变量 | 默认值 |
|------|---------|--------|
| 工作流生成 | FEATURE_AI_WORKFLOW_GEN | "true" |
| 节点建议 | FEATURE_AI_SUGGESTIONS | "true" |
| 线索评分 | FEATURE_AI_LEAD_SCORING | "true" |
| 异常检测 | FEATURE_AI_ANOMALY_DETECTION | "true" |

关闭时 API 返回 503，前端的 AI 面板不渲染。

---

## 9. 异步任务队列

### 9.1 架构

```
Vercel (Web App)                    Upstash Redis               Railway (Worker)
────────────────                    ─────────────               ─────────────────
                                                                 
Trigger API ──POST──→               workflow-runs queue             
                                   ┌──────────────────┐        ┌──────────────────┐
                                   │  BullMQ Queue    │ ──→   │  Worker Process   │
                                   │  (workflow-runs) │        │  (concurrency: 5) │
                                   └──────────────────┘        └────────┬─────────┘
                                                                        │
                                   ┌──────────────────┐                 │
Worker Status API ←──DB query──── │  Prisma (DB)     │ ←─── execute ───┘
                                   └──────────────────┘
```

### 9.2 队列配置

- **连接**: ioredis → Upstash Redis (`REDIS_URL` 环境变量)
- **队列名**: `workflow-runs`
- **并发**: 5 个 job 同时处理
- **重试**: 指数退避 (2^attempt 秒)
- **延迟节点**: 利用 BullMQ 原生 `delay` 选项

### 9.3 Worker 健康检查

Worker 内嵌 HTTP 服务器作为 Railway 健康检查端点：

```
GET /health → 200 OK { status: "ok", uptime, queueSize }
```

---

## 10. 邮件系统

### 10.1 模板引擎

`apps/worker/src/email.ts` 实现了轻量级模板变量解析：

```
模板: "Hi {{lead.name}}, your score is {{score}}"
上下文: { lead: { name: "Alice" }, score: 85 }
结果:  "Hi Alice, your score is 85"
```

- 支持嵌套点号路径 (`lead.email`, `user.name`)
- 未匹配的变量保留原样 (`{{unknown}}`)
- null/undefined 值保留原样

### 10.2 发送流程

```
Worker executeNode("send_email")
        │
        ├── 读取节点 config: { to, subject, body, from? }
        ├── 构建上下文: { lead, user, score, sales_email, sender_name }
        ├── resolveTemplate() × 4 (to, subject, body, from)
        ├── Resend.emails.send({ from, to, subject, text: body })
        └── 返回 { messageId, to }
```

---

## 11. 内部运维面板

### 11.1 仪表盘概览

首页 Dashboard 显示：
- Worker 健康状态卡片（实时轮询 `/api/worker/health`）
- 关键指标：工作流数量、线索数量、运行成功率
- 最近运行记录

### 11.2 全局运行面板 (`/runs`)

| 功能 | 描述 |
|------|------|
| 状态筛选 | queued / running / completed / failed / dead_letter |
| 重试 | POST /api/runs/{runId}/retry → 重新入队 |
| 取消 | POST /api/runs/{runId}/cancel → 标记 dead_letter |

### 11.3 成员管理 (`/settings/members`)

| 功能 | 描述 | 权限 |
|------|------|------|
| 查看成员列表 | 所有成员的角色、邮箱 | view_members (所有角色) |
| 邀请成员 | 输入邮箱 + 角色 → 创建 membership | manage_members (owner/admin) |
| 修改角色 | 下拉切换角色 | manage_members |
| 移除成员 | 确认对话框 → 删除 membership | manage_members |
| 最后 owner 保护 | 不能移除/降级组织的最后一个 owner | API 层 |

### 11.4 审计日志 (`/audit-log`)

- 分页列表 (30 条/页)
- 筛选：按 action 类型、targetType 过滤
- 字段：时间、操作者、操作类型、目标类型、目标 ID、变更详情
- 权限：view_audit_log (所有角色)

### 11.5 组织设置 (`/settings`)

- 修改组织名称
- 修改组织 slug (会重签 JWT cookie)
- 权限：manage_org (仅 owner)

---

## 12. 前端架构

### 12.1 渲染策略

```
Server Components (RSC)         Client Components
─────────────────────           ─────────────────
数据获取 (Prisma)              交互 (onClick, onChange)
会话验证 (getSession)          状态管理 (useState, useQuery)
权限检查 (hasPermission)       API 调用 (fetch)
布局 + 骨架屏                  乐观更新 (TanStack Query)
                               实时更新 (SSE)
                               动画 (framer-motion)
```

### 12.2 状态管理

| 工具 | 用途 |
|------|------|
| **TanStack Query** | 线索列表、审计日志、运行列表的数据缓存和乐观更新 |
| **Zustand** | 画布节点/边状态、脏状态跟踪 |
| **React useState** | 组件本地状态 (对话框开关、表单输入) |
| **SSE** | 工作流运行的实时状态推送 (`useRealtimeRuns`) |

### 12.3 UI 组件库 (10 个)

| 组件 | 文件 | 用途 |
|------|------|------|
| Button | `components/ui/button.tsx` | 按钮 (支持 loading 状态) |
| Card | `components/ui/card.tsx` | 卡片容器 |
| Badge | `components/ui/badge.tsx` | 状态标签 (4 种变体) |
| Input | `components/ui/input.tsx` | 输入框 |
| Avatar | `components/ui/avatar.tsx` | 用户头像 |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | 下拉菜单 |
| Dialog | `components/ui/dialog.tsx` | 模态对话框 (Portal, Esc, 遮罩) |
| Select | `components/ui/select.tsx` | 选择下拉 |
| Textarea | `components/ui/textarea.tsx` | 多行输入 |
| Table | `components/ui/table.tsx` | 表格 |

### 12.4 UX 模式

- **Loading**: 所有页面有 `loading.tsx` 骨架屏
- **Empty**: 含引导文案 + 操作按钮
- **Error**: 红色背景 + 错误信息 + Retry 按钮
- **Success**: sonner toast 提示
- **Navigation**: 按钮保持 loading 状态直到导航完成 (组件卸载)

---

## 13. 部署架构

### 13.1 平台分布

```
                         ┌──────────────┐
      users ──────────→  │   Vercel     │ ← Next.js Web App
                         │   (US-East)  │   pnpm hoisted mode
                         └──────┬───────┘   Prisma engine: rhel-openssl-3.0.x
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              ┌─────┴─────┐ ┌──┴──────┐ ┌──┴──────────┐
              │  Supabase │ │ Upstash │ │  DeepSeek   │
              │ PostgreSQL│ │  Redis  │ │  API        │
              │ (Sydney)  │ │ (US)    │ │  (Global)   │
              └─────┬─────┘ └────────┘ └─────────────┘
                    │
              ┌─────┴─────┐
              │  Railway  │ ← BullMQ Worker
              │  (US)     │   DAG Engine + Email
              └───────────┘
```

### 13.2 Vercel 部署要点

```
1. .npmrc: node-linker=hoisted
2. schema.prisma: binaryTargets = ["native", "rhel-openssl-3.0.x"]
3. next.config.js: experimental.serverComponentsExternalPackages: ["@prisma/client"]
4. vercel.json: buildCommand = "prisma generate && next build"
5. 环境变量通过 Vercel Dashboard 设置 (不用 dotenv)
```

### 13.3 Railway 部署要点

```
1. railway.toml: builder=nixpacks, nixpacks.toml 指定 pnpm
2. Build: pnpm install && prisma generate
3. Start: npx tsx apps/worker/src/index.ts (从项目根目录)
4. HTTP 健康检查: Worker 内嵌 http.createServer (0.0.0.0:PORT)
5. 已知问题: BullMQ client[commandNameWithVersion] 错误, 根因未明
```

---

## 14. 安全态势

### 14.1 已实施

| 威胁模型 | 缓解措施 |
|----------|---------|
| 未授权访问 | JWT 守卫中间件 (所有非公开路由) |
| 权限提升 | RBAC 控制 (所有 API 端点检查权限) |
| 跨租户访问 | Prisma 查询级别 org 隔离 (每请求验证 membership) |
| 暴力破解 | Redis 滑动窗口 100 req/min |
| XSS | React 自动转义 + CSP 头 |
| Clickjacking | X-Frame-Options: DENY |
| MITM | HSTS + Secure cookies |
| JWT 伪造 | HS256 + 强制密钥 (无回退) |
| 信息泄露 | 通用错误消息 + PII 日志哈希 |
| SQL 注入 | Prisma 参数化查询 |
| CSRF | SameSite=Lax cookies |

### 14.2 安全加固 v2 (Phase 11)

| 项目 | 状态 |
|------|------|
| Webhook 时序安全 | ✅ `crypto.timingSafeEqual()` 替代 `!==` |
| Zod 输入验证 | ✅ 16 个 schema，覆盖所有变更端点 |
| JWT 撤销 | ✅ Redis 黑名单，登出时撤销，中间件检查 `jti` |
| 错误信息防泄露 | ✅ 导入/注册路由仅返回通用错误消息 |
| 邮件格式验证 | ✅ Zod email 格式检查 |
| 密码强度 | ✅ 8-128 字符 Zod 验证 |
| Stage 枚举验证 | ✅ Zod enum 限制为 6 个有效值 |
| 字符串长度限制 | ✅ 所有字段最大长度限制 |

### 14.3 UI/UX 升级 (Phase 12)

- **字体**: Inter → Plus Jakarta Sans (300-700 weight)
- **设计系统**: Liquid Glass + Dimensional Layering
- **色彩**: 精炼 slate 调色板，16 个 CSS 自定义属性，亮/暗双模式
- **效果**: `glass` / `glass-card` 组件，`backdrop-filter: blur(16px) saturate(180%)`
- **动画**: 200-300ms ease-out 过渡，`active:scale-[0.97]`，6 级阴影系统
- **组件**: Bento grid 仪表盘，glass sidebar，精炼输入框/按钮，骨架加载器

### 14.4 待改进 (更新)

| 项目 | 优先级 | 说明 |
|------|--------|------|
| PostgreSQL RLS | 低 | App-layer 隔离一致，作为纵深防御的第二层 |
| API Key Bearer 认证 | 中 | 中间件 Edge Runtime 限制 |
| CSRF Token | 低 | SameSite=Lax 作为主要防御 |
| 依赖扫描 | 中 | Dependabot/Snyk 自动化 |
| Stripe 计费 | 高 | 未实施 |
| 日志外发 | 中 | 当前仅 console |

---

## 15. 产品化功能

### 15.1 落地页

`/` 公开路由，无认证要求。包含：
- Hero 区域（AI 驱动工作流自动化）
- 6 大功能卡片（可视化构建器、AI 运营、企业安全、智能邮件、管道分析、开发者友好）
- 三步操作说明（连接线索 → 构建工作流 → 自动分析）
- CTA 区域和 Footer

### 15.2 深色模式

- Tailwind `darkMode: "class"` 策略
- `.dark` CSS 变量覆盖 14 个设计令牌
- `ThemeProvider` 带 `<script>` 标签的闪烁预防
- 系统偏好检测 `prefers-color-scheme: dark`
- 侧边栏和导航栏中的 `ThemeToggle`
- 所有 UI 表面的深色变体：仪表板布局、侧边栏、设置选项卡、表格

### 15.3 线索导入/导出

- **导出**: `GET /api/orgs/:slug/leads/export` → CSV 下载，包含姓名、邮箱、阶段、标签、创建时间
- **导入**: `POST /api/orgs/:slug/leads/import` → 接受 `{ rows: [...] }`，CSV 解析支持引号字段，最多 500 行，返回 `{ imported, skipped, errors }`
- **UI**: 线索页面上的导入按钮 → 文件上传对话框。导出链接 → 直接下载

### 15.4 工作流模板市场

- **页面**: `/templates` — 浏览 3 个预构建模板（线索资格认证、冷外联跟进、试用用户培育）
- **API**: `GET /api/orgs/:slug/templates` 列出模板；`POST` 通过一次操作安装模板 → 创建包含节点/边的工作流 + 版本
- 每个模板显示节点类型计数，一键安装，安装后重定向到工作流构建器

### 15.5 入职向导

- 新组织（0 个线索 + 0 个工作流）的仪表板欢迎卡片
- 3 步引导：添加线索 → 浏览模板 → 触发工作流
- 每个步骤都链接到相关页面。可关闭。仅当 `workflowCount === 0 && leadCount === 0` 时显示

### 15.6 API 密钥

- **模型**: `Organization.apiKeys` JSON 字段存储 `[{ id, name, prefix, hash, createdAt }]`
- **API**: `GET/POST /api/orgs/:slug/api-keys`，`DELETE /api/orgs/:slug/api-keys/:keyId`
- **UI**: 设置 → API 密钥选项卡。所有者可以创建/删除。创建时显示纯文本密钥（仅一次）
- **认证**: 持有者令牌认证就绪（Edge 运行时 Prisma 约束的中间件集成待定）

### 15.7 API 文档

- 公开页面 `/docs` 列出了按类别组织的所有 38 个端点
- 7 个类别：认证、组织、线索、工作流、模板、成员与设置、AI
- 每个端点显示：HTTP 方法（带颜色编码）、路径、认证类型、描述

### 15.8 移动端响应式

- 移动端汉堡菜单（`MobileNav` 组件），带滑出抽屉
- 侧边栏在 `lg:` 断点隐藏，由抽屉替代
- 覆盖层背景 + 点击外部关闭
- 响应式网格布局：`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### 15.9 邮件追踪

- 所有通过 Resend 发送的邮件启用 `trackOpens: true` 和 `trackClicks: true`
- Resend 仪表板中可查看打开率和点击率指标

---

## 附录 A: 命令速查

```bash
pnpm dev                    # 启动全部开发服务
pnpm build                  # 构建全部包
pnpm seed                   # 重置 + 灌入 demo 数据
pnpm seed-prod demo-org     # 幂等灌入 3 模板 + 5 线索
pnpm seed-verify-alice      # 预验证 alice@example.com
pnpm clean-org demo-org     # 清空组织数据
pnpm --filter @opsflow/db push     # 推送 schema 到数据库
npx vercel --prod --cwd apps/web   # 部署到 Vercel 生产环境
```

## 附录 B: 能力评估

### 项目复杂度指标

| 指标 | 数值 |
|------|------|
| 总代码行数 | ~9,000 |
| 文件数 | ~190 |
| API 端点 | 38 + SSE + Webhook |
| 数据库模型 | 10 + 1 enum |
| RBAC 权限 | 10 项 |
| AI 功能 | 7 个 (生成、建议、评分、分析、撰写、分类、管道洞察) |
| 部署平台 | 4 个 (Vercel, Railway, Supabase, Upstash) |
| 外部集成 | DeepSeek, Resend, BullMQ, jose, bcrypt |

### 技术广度覆盖

```
✅ Monorepo 管理 (pnpm + Turborepo)
✅ Next.js App Router (RSC + Client Components)
✅ TypeScript 全栈
✅ 自定义 JWT 认证 (jose)
✅ 多租户架构 (4 角色 10 权限)
✅ 可视化画布 (React Flow)
✅ DAG 执行引擎 (Kahn 拓扑排序)
✅ 异步队列 (BullMQ + Redis)
✅ AI 集成 (DeepSeek 7 个端点: 生成/建议/评分/分析/撰写/分类/管道洞察)
✅ 实时通信 (SSE)
✅ 邮件系统 (Resend + 模板引擎 + AI 撰写 + 打开/点击追踪)
✅ 审计日志 (不可变审计追踪)
✅ 安全加固 (CSP/HSTS/限流/PII保护/邮箱验证)
✅ DevOps (Vercel + Railway + Supabase)
✅ 落地页 + 深色模式 + 移动端响应式
✅ CSV 导入/导出 + 模板市场 + 入职向导
✅ API 密钥管理 + API 文档 (38 个端点)
✅ Webhook 触发器 (外部 cron/服务集成)
```

**工程水平评估: Senior Full-Stack Engineer**

该项目展示了一个专业级 SaaS 产品的完整生命周期——从数据库设计、API 架构、前端工程、异步处理到安全加固和 DevOps。架构决策合理（事件溯源、幂等性、版本化工作流），代码组织清晰，问题处理系统化（GOTCHA 文档记录、安全审计整改）。已建立完整的三层自动化测试体系（114 个测试：Vitest 单元 + 集成 + Playwright E2E）。

---

## 15. 自动化测试体系

### 三层测试金字塔

```
                    ┌──────────────┐
                    │  E2E (4 spec) │  ← Playwright, 真实浏览器
                    ├──────────────┤
                    │  集成 (82 个)  │  ← Vitest + fetch, 真实 HTTP, RBAC 矩阵
                    ├──────────────┤
                    │  单元 (32 个)  │  ← Vitest, 纯函数: auth/pwd/perm/rate
                    └──────────────┘
```

### 测试命令

```bash
pnpm --filter @opsflow/web test              # 单元测试 (2s, 无依赖)
pnpm --filter @opsflow/web test:integration  # 集成测试 (需 pnpm dev)
pnpm --filter @opsflow/web test:e2e          # E2E (需 npx playwright install chromium)
```

### 测试目录结构

```
apps/web/
├── lib/__tests__/
│   ├── setup.ts / helpers.ts       # 测试基础设施
│   ├── auth.test.ts                 # JWT sign/verify
│   ├── password.test.ts             # bcrypt hash/verify
│   ├── permissions.test.ts          # 10 权限 x 4 角色
│   ├── rate-limit.test.ts           # 内存限流 100 req/min
│   ├── api-auth.test.ts             # 登录/注册 (10)
│   ├── business-flow.test.ts        # 端到端业务流 (7)
│   ├── api-workflows.test.ts        # 工作流 CRUD x RBAC (27)
│   ├── api-leads.test.ts            # 线索 CRUD x RBAC (17)
│   ├── api-members.test.ts          # 成员管理 x RBAC (14)
│   ├── api-org-settings.test.ts     # 组织设置 x RBAC (5)
│   └── api-audit-log.test.ts        # 审计日志 x RBAC (2)
├── e2e/
│   ├── auth.spec.ts                 # 登录/注册/登出
│   ├── workflows.spec.ts            # 工作流创建/构建器
│   ├── leads.spec.ts                # 线索 CRUD
│   └── rbac.spec.ts                 # UI 权限守卫
├── vitest.config.ts
├── vitest.integration.config.ts
└── playwright.config.ts
```

### 集成测试依赖

- `pnpm seed-members <org-slug>` — 测试账号: admin/operator/viewer@opsflow.test (密码: test123456)
- `alice@example.com` — owner 角色 密码: [Aa7!GzwF7X_W)LB$OSkKkY3x]
- 测试用 `fileParallelism: false` 顺序执行 (共享同一 org)

---

## 16. 演示种子数据

### `pnpm seed-demo`

一键创建客户演示场景:

- **组织**: Acme Corp (acme-corp)
- **用户**: demo@acmecorp.com / demo123456
- **15 条线索**: 分布在 6 个阶段 (new → qualified → proposal → negotiation → won → lost)
- **3 个工作流**: Lead Qualification, Cold Outreach Follow-up, Trial User Nurture
- **10 条运行记录**: 6 completed, 1 failed, 1 running, 2 queued
- **5 条线索活动**: 带有阶段变更元数据
- **仪表盘**: 管道柱状图、运行指标、最近运行全部填充

### 仪表盘 UX 增强 (Phase 9)

- 运行健康指标: 4 张卡片展示 completed/failed/queued/running 计数
- 线索管道图: 6 阶段水平柱状图，彩色编码
- focus-visible 焦点环 + cursor-pointer + prefers-reduced-motion
- Resend 验证邮件 (注册时发送)

### 工作流引擎能力

| 节点类型 | 状态 | 说明 |
|---------|------|------|
| Trigger (manual) | ✅ | "Run Now" 按钮 |
| Action (update_lead) | ✅ | 更新线索阶段/标签 |
| Action (score_lead) | ✅ | AI 线索评分 (需 DeepSeek) |
| Action (send_email) | ✅ | Resend 邮件 (需 API key) |
| Condition | ✅ | 字段比较，true/false 分支 |
| Delay | ✅ | BullMQ 延迟，分钟/小时/天 |
| Trigger (webhook/cron) | ❌ | 未实现 |
