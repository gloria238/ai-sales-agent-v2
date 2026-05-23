# SalesAgent AI — Architecture Document

> AI SDR / outbound sales operating system. AI agents that qualify leads, compose follow-ups, and book meetings.
> Multi-channel conversation inbox, campaign orchestration, and real-time monitoring.
> ~10,000 lines across ~220 files. 35 API routes + SSE + webhook trigger.

---

## 目录

1. [系统总览](#1-系统总览)
2. [基础设施层](#2-基础设施层)
3. [认证与安全体系](#3-认证与安全体系)
4. [多租户与权限系统](#4-多租户与权限系统)
5. [数据模型](#5-数据模型)
6. [AI SDR 代理引擎](#6-ai-sdr-代理引擎)
7. [对话收件箱](#7-对话收件箱)
8. [外呼活动引擎](#8-外呼活动引擎)
9. [脚本与话术系统](#9-脚本与话术系统)
10. [线索评分与资格认定](#10-线索评分与资格认定)
11. [异步任务队列](#11-异步任务队列)
12. [邮件系统](#12-邮件系统)
13. [仪表盘与运维面板](#13-仪表盘与运维面板)
14. [前端架构](#14-前端架构)
15. [部署架构](#15-部署架构)
16. [安全态势](#16-安全态势)

---

## 1. 系统总览

### 1.1 产品定位

SalesAgent AI 是一个 **AI SDR（销售开发代表）基础设施平台**。不是泛化的 "AI CRM"，也不是 "workflow automation"。它解决的是一个极度具体的问题：

> 用 AI agent 自动完成线索资格认定、跟进回复、会议预约和外呼序列执行。

目标用户：需要规模化外呼销售但没有大型 SDR 团队的 SaaS 公司、代理机构和销售团队。

### 1.2 核心能力矩阵

| 能力域 | 功能 | 实现方式 |
|--------|------|---------|
| **AI SDR Agent** | 自动回复、资格认定、会议预约 | DeepSeek API + Agent 配置（人格/知识库/目标） |
| **Conversation Inbox** | 多渠道统一收件箱、AI 辅助回复 | Next.js + SSE 实时推送 |
| **Outbound Campaigns** | 外呼序列编排、延迟、重试、个性化 | BullMQ + Upstash Redis |
| **Lead Qualification** | AI 评分、意图识别、情感分析 | DeepSeek + 结构化提示词 |
| **Script Playbooks** | 销售话术模板、序列生成 | AI 脚本生成 + 模板市场 |
| **Multi-tenant** | 组织隔离、4 级角色、10 项权限 | Prisma 查询级隔离 + JWT 会话 |
| **Real-time** | 新消息、活动状态流式推送 | Server-Sent Events (SSE) |

### 1.3 技术栈一览

```
┌─────────────────────────────────────────────────────────┐
│                     用户界面层                           │
│  Next.js 14 · React 18 · Tailwind CSS · shadcn/ui       │
│  TanStack Query · Zustand · sonner                       │
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
│  Prisma Schema (sales_agent) · 10 models                │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 基础设施层

### 2.1 项目结构

```
salesagent-ai/
├── apps/
│   ├── web/                          # Next.js 14 Web 应用
│   │   ├── app/
│   │   │   ├── (auth)/               # 登录/注册页面
│   │   │   ├── (dashboard)/          # 仪表盘页面组
│   │   │   │   ├── home/             # AI SDR 仪表盘 (/home, 中间件改写)
│   │   │   │   ├── inbox/            # 对话收件箱 (多渠道统一视图)
│   │   │   │   ├── leads/            # 线索管理 + AI 评分
│   │   │   │   ├── agents/           # AI Agent 配置 + 详情编辑
│   │   │   │   │   └── [id]/          # Agent 详情 (编辑+对话+活动)
│   │   │   │   ├── campaigns/        # 外呼活动管理 + 分析
│   │   │   │   │   ├── new/          # 活动创建向导
│   │   │   │   │   └── [id]/         # 活动详情 + 分析
│   │   │   │   ├── scripts/          # 话术脚本市场 + AI 生成
│   │   │   │   │   ├── new/          # AI 脚本生成
│   │   │   │   │   └── [id]/         # 脚本详情
│   │   │   │   ├── settings/         # 组织设置 + 成员管理 + API 密钥
│   │   │   │   └── audit-log/        # 审计日志查看
│   │   │   ├── page.tsx              # 公开落地页 (/)
│   │   │   └── api/                  # 35 个 API 路由
│   │   │       ├── auth/             # login, register, logout, verify
│   │   │       └── orgs/[slug]/      # CRUD + AI + conversations + campaigns
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn 风格 UI 组件 (11个)
│   │   │   ├── nav/                  # 侧边栏、用户菜单
│   │   │   ├── inbox/                # 对话收件箱组件
│   │   │   ├── agents/               # Agent 配置组件
│   │   │   └── leads/                # 线索相关组件
│   │   ├── lib/                      # 核心库
│   │   │   ├── auth.ts              # JWT 签发/验证
│   │   │   ├── session.ts           # 服务端会话提取
│   │   │   ├── permissions.ts       # RBAC 权限矩阵
│   │   │   ├── password.ts          # bcrypt 密码哈希
│   │   │   ├── ai.ts                # DeepSeek 客户端
│   │   │   ├── prompts.ts           # AI 系统提示词 (compose/score/summarize/generate-script)
│   │   │   ├── feature-flags.ts     # 功能开关
│   │   │   ├── rate-limit.ts        # Redis 限流
│   │   │   ├── logger.ts            # 结构化日志
│   │   │   └── audit.ts             # 审计日志写入
│   │   └── middleware.ts            # JWT 守卫 + 限流
│   │
│   └── worker/                       # BullMQ Worker
│       └── src/
│           ├── index.ts             # Worker 主程序: AI 回复 + 评分 + 活动投递
│           ├── queue.ts             # Redis 连接 + 4 队列 (prefix: "sales-agent")
│           └── email.ts             # Resend 邮件发送 + 模板引擎
│
├── packages/
│   ├── db/                           # Prisma 6 + PostgreSQL
│   │   ├── prisma/
│   │   │   └── schema.prisma        # 10 models in sales_agent schema
│   │   ├── index.ts                 # PrismaClient 单例
│   │   ├── seed-production.ts       # 3 脚本 + 5 线索 (幂等)
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
                    │   Supabase   │ ← PostgreSQL, sales_agent schema
                    │   (DB)        │
                    └──────────────┘
                    ┌──────────────┐
                    │   Upstash    │ ← Redis (BullMQ queues + rate limiting)
                    │   (Redis)    │   prefix: "sales-agent"
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
        └── 重定向到 /home
```

### 3.3 请求守卫链

```
Incoming Request
        │
        ▼
 middleware.ts
        ├── Rate Limiting: Upstash Redis sliding window (100 req/min per IP)
        ├── Public paths? → pass through (/, /login, /register, /api/auth/*)
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
| JWT 撤销 | Redis 黑名单, 登出时撤销, 中间件检查 | `lib/token-blacklist.ts` |
| 输入验证 | Zod 16 schemas, 所有变更端点 | `lib/validation.ts` |
| Webhook 安全 | `crypto.timingSafeEqual()` 时序安全比较 | `webhook/route.ts` |

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
     ├── 1:N → Agent (AI SDR 代理配置)
     ├── 1:N → Lead (线索)
     ├── 1:N → Conversation (对话)
     ├── 1:N → Campaign (外呼活动)
     ├── 1:N → Script (话术脚本)
     └── 1:N → AuditLog (审计日志)
```

### 4.2 角色定义

| 角色 | 典型用户 | 能力范围 |
|------|---------|---------|
| **Owner** | 创始人/付费账户 | 完全控制：管理组织、成员、计费、删除所有数据 |
| **Admin** | 销售主管 | 管理成员、Agent、线索、活动，不能删除组织 |
| **Operator** | SDR / 销售人员 | 管理 Agent 配置、线索、活动，不能删除数据 |
| **Viewer** | 只读观察者 | 查看所有数据，不能修改任何内容 |

### 4.3 权限矩阵 (10 项权限)

```
                    Owner   Admin   Operator   Viewer
─────────────────────────────────────────────────────
manage_org            ✅      —        —         —
manage_members        ✅      ✅       —         —
manage_agents         ✅      ✅       ✅        —
manage_leads          ✅      ✅       ✅        —
delete_leads          ✅      ✅       —         —
manage_campaigns      ✅      ✅       ✅        —
view_agents           ✅      ✅       ✅        ✅
view_leads            ✅      ✅       ✅        ✅
view_members          ✅      ✅       ✅        ✅
view_audit_log        ✅      ✅       ✅        ✅
run_campaigns         ✅      ✅       ✅        —
```

### 4.4 租户隔离实现

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
const data = await prisma.conversation.findMany({
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
  ├──< Agent ──< Conversation ──< Message
  │
  ├──< Lead ──< LeadActivity
  │
  ├──< Script ──< Campaign ──< CampaignRun
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
| apiKeys | JSON? | API 密钥列表 |

#### Membership
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| userId | String | 外键 → User |
| role | enum MembershipRole | owner / admin / operator / viewer |
| @@unique | [organizationId, userId] | |

#### Agent (AI SDR 代理)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| name | String | Agent 名称 (e.g. "Inbound SDR", "Outbound Closer") |
| personality | String | 人格描述 (tone, voice, style) |
| goals | JSON | 目标定义 (qualify_lead, book_meeting, handle_objection) |
| knowledgeBase | JSON | 产品知识、FAQ、定价、竞品对比 |
| isActive | Boolean | 启用/停用 |

#### Lead
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| name | String | 线索名称 |
| email | String? | 联系邮箱 |
| company | String? | 公司名称 |
| phone | String? | 联系电话 |
| stage | String? | 管道阶段 (new/contacted/qualified/proposal/negotiation/closed_won/closed_lost) |
| score | Int? | AI 评分 (0-100) |
| source | String? | 来源 (website, referral, outbound, linkedin) |
| assignedTo | String? | 分配给 (userId) |
| tags | JSON? | 自定义标签 |

#### LeadActivity
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| leadId | String | 外键 → Lead (Cascade Delete) |
| type | String | note / stage_change / email_sent / email_received / meeting_booked |
| content | String? | 活动内容 |
| metadata | JSON? | 附加数据 (fromStage, toStage, emailId) |

#### Conversation
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| leadId | String | 外键 → Lead |
| agentId | String? | 外键 → Agent (处理该对话的 AI agent) |
| channel | String | email / chat / sms |
| subject | String? | 对话主题 |
| status | String | active / closed / archived |

#### Message
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| conversationId | String | 外键 → Conversation |
| direction | String | inbound / outbound |
| content | String | 消息正文 |
| channel | String | email / chat |
| aiMetadata | JSON? | AI 分析结果 (sentiment, intent, confidence, suggested_action) |

#### Script (话术脚本)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| name | String | 脚本名称 |
| description | String? | 描述 |
| category | String | cold_outreach / follow_up / re_engagement / demo_request / objection_handling |
| steps | JSON | 步骤数组 [{order, type, template, delay, condition}] |

#### Campaign (外呼活动)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| name | String | 活动名称 |
| scriptId | String? | 外键 → Script |
| agentId | String? | 外键 → Agent |
| status | String | draft / active / paused / completed |
| targetAudience | JSON | 目标筛选 (stage, score range, tags, source) |
| schedule | JSON | 发送时间窗口、频率限制 |
| stats | JSON | 实时统计 (sent, delivered, opened, replied, booked, unsubscribed) |

#### CampaignRun
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| campaignId | String | 外键 → Campaign |
| status | String | queued → running → completed / failed |
| recipientCount | Int | 目标收件人数 |
| stats | JSON | 执行统计 |

#### AuditLog (不可变)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| organizationId | String | 外键 → Organization |
| action | String | agent.created / campaign.started / lead.qualified / conversation.closed |
| targetType | String | Agent / Lead / Campaign / Script / Conversation |
| targetId | String? | 目标记录 ID |
| metadata | JSON? | 变更详情 |

---

## 6. AI SDR 代理引擎

### 6.1 设计哲学

AI SDR Agent 不是 chatbot wrapper。它是一个有状态的、目标驱动的销售代理系统：

- **目标导向**: 每个 Agent 有明确目标 (qualify_lead, book_meeting, handle_objection)
- **知识驱动**: 内嵌产品知识库、FAQ、定价信息、竞品对比
- **人格一致**: 可配置的语调、风格、销售方法论 (SPIN, BANT, MEDDIC, Challenger)
- **上下文记忆**: 全对话历史作为 AI 上下文，不是无状态单轮回复
- **人工兜底**: 低置信度或高价值线索自动标记为人工介入

### 6.2 Agent 配置模型

```typescript
interface AgentConfig {
  name: string;                    // "Inbound SDR", "Enterprise Closer"
  personality: {
    tone: "professional" | "friendly" | "direct" | "consultative";
    style: string;                 // "You are a senior SDR with 10 years of SaaS sales experience"
    methodology: "SPIN" | "BANT" | "MEDDIC" | "Challenger" | "custom";
  };
  goals: Array<{
    type: "qualify_lead" | "book_meeting" | "handle_objection" | "nurture" | "follow_up";
    priority: number;              // 1 = highest
    successCriteria: string;       // "Lead score > 70" or "Meeting booked on calendar"
  }>;
  knowledgeBase: {
    productDescription: string;
    pricing: string;
    faq: Array<{ question: string; answer: string }>;
    competitors: Array<{ name: string; strengths: string; weaknesses: string }>;
    caseStudies: Array<{ title: string; content: string }>;
  };
  constraints: {
    maxMessagesPerDay: number;     // 速率限制
    requireHumanApprovalAbove: number; // 线索评分 > N 时需人工审核
    doNotContactTags: string[];    // 不联系标签
    workingHours: { start: string; end: string; timezone: string };
  };
}
```

### 6.3 AI 回复管道

```
Inbound message received
        │
        ▼
 1. Intent Classification
    ├── classify_email → intent, sentiment, urgency
    │    (DeepSeek: classify-email endpoint)
        │
        ▼
 2. Lead Lookup + Enrichment
    ├── 查找或创建 Lead
    ├── 加载对话历史 (最近 20 条消息)
    ├── 加载 Agent 配置 (人格 + 知识库 + 目标)
        │
        ▼
 3. Response Composition
    ├── compose-response → subject, body, suggested_action
    │    (DeepSeek: compose-response endpoint)
    ├── 包含: 人格注入 + 知识库检索 + 目标对齐
        │
        ▼
 4. Review & Send
    ├── 高置信度? → 自动发送 (Resend)
    ├── 低置信度? → 草稿存入 inbox，人工审核
    ├── 高价值线索? → 标记 + 通知销售人员
        │
        ▼
 5. Post-Send
    ├── 创建 Message (outbound)
    ├── 更新 LeadActivity
    ├── 触发 follow-up 定时器 (BullMQ delay)
    └── SSE 推送 → 前端 inbox 实时更新
```

---

## 7. 对话收件箱

### 7.1 Inbox 布局

```
┌──────────────────────────────────────────────────────────────┐
│  Inbox  [All] [Active] [Needs Reply] [Closed]   [🔍 Search] │
├────────────────────┬─────────────────────────────────────────┤
│  Conversations     │  Conversation Thread                    │
│                    │                                         │
│  ┌──────────────┐  │  ┌─────────────────────────────────────┐│
│  │ Alice Chen   │  │  │ Alice Chen · acme@example.com       ││
│  │ Hot · Score 85│  │  │ Stage: Qualified · Score: 85       ││
│  │ "Interested.."│  │  ├─────────────────────────────────────┤│
│  │ 2m ago    ●   │  │  │                                    ││
│  ├──────────────┤  │  │  [Inbound]  "I'd like to learn      ││
│  │ Bob's Startup│  │  │   more about your pricing..."        ││
│  │ Warm · Sc 62 │  │  │                         2 min ago   ││
│  │ "Pricing?"   │  │  │                                    ││
│  │ 15m ago       │  │  │  [AI Draft]  "Hi Alice, thanks     ││
│  ├──────────────┤  │  │   for reaching out! Our Pro plan     ││
│  │ Carol Davis  │  │  │   starts at $49/mo and includes..." ││
│  │ Cold · Sc 35 │  │  │                         ✏️ Edit    ││
│  │ "Not inter..."│  │  │                         ✅ Send    ││
│  │ 1h ago        │  │  │                                    ││
│  └──────────────┘  │  └─────────────────────────────────────┘│
│                    │                                         │
│  Sidebar:          │  Right Panel:                           │
│  - Conversation    │  - Lead Summary (company, stage, score) │
│    list with       │  - AI Insights (sentiment, intent)      │
│    status badges   │  - Qualification Score                  │
│  - Filter by       │  - Suggested Actions                    │
│    channel/score   │  - Quick Actions (book meeting, assign) │
└────────────────────┴─────────────────────────────────────────┘
```

### 7.2 API 端点

| 方法 | 路径 | 权限 | 描述 |
|------|------|------|------|
| GET | /api/orgs/{slug}/conversations | view_agents | 对话列表 (筛选/搜索/分页) |
| GET | /api/orgs/{slug}/conversations/{id} | view_agents | 对话详情 + 消息列表 |
| POST | /api/orgs/{slug}/conversations/{id}/reply | manage_agents | 发送回复 (人工或 AI 辅助) |
| POST | /api/orgs/{slug}/conversations/{id}/ai-draft | manage_agents | 生成 AI 回复草稿 |
| PATCH | /api/orgs/{slug}/conversations/{id} | manage_agents | 更新状态 (close/archive/reassign) |
| GET | /api/orgs/{slug}/inbox/stats | view_agents | 收件箱统计 (active/needs-reply/today) |

---

## 8. 外呼活动引擎

### 8.1 活动类型

SalesAgent AI 支持三种外呼活动模式：

**A. 冷外呼序列 (Cold Outreach)**
```
Day 1:  Initial email (AI personalized)
Day 3:  Follow-up #1 (no reply detected)
Day 7:  Follow-up #2 (value prop + case study)
Day 14: Breakup email (last attempt)
```

**B. 再激活序列 (Re-engagement)**
```
Day 1:  "Still interested?" email
Day 5:  New feature/case study
Day 10: Final check-in
```

**C. 事件触发序列 (Trigger-based)**
```
Webhook: lead.stage = qualified
  → Wait 1 hour
  → Send "Thanks for your interest" email
  → Wait 2 days
  → Send demo booking link
```

### 8.2 活动执行引擎

```
Campaign "Start"
        │
        ▼
1. Audience Resolution
   ├── Prisma query: leads matching targetAudience filters
   ├── Deduplication: skip leads with active conversations
   ├── DNC check: skip leads with do-not-contact tags
   └── Rate limit: max N leads per batch
        │
        ▼
2. Job Dispatching (BullMQ)
   ├── For each lead: campaignQueue.add("send-email", { campaignId, leadId, stepIndex: 0 })
   ├── delay: calculated from schedule config (timezone-aware)
   └── prefix: "sales-agent"
        │
        ▼
3. Worker: Execute Step
   ├── Load campaign + script + lead
   ├── AI compose personalized email (DeepSeek)
   ├── Resend.emails.send({ from, to, subject, html })
   ├── Record: CampaignRun stats update + LeadActivity
   ├── Track: trackOpens: true, trackClicks: true
   └── Schedule next step: queue.add("send-email", { ...stepIndex + 1 }, { delay: stepDelay })
        │
        ▼
4. Reply Detection
   ├── Inbound webhook → check if replying to campaign email
   ├── Match via Resend messageId / in-reply-to headers
   ├── If reply detected → stop sequence, create Conversation
   └── Update campaign stats: replied++
```

### 8.3 API 端点

| 方法 | 路径 | 权限 | 描述 |
|------|------|------|------|
| GET | /api/orgs/{slug}/campaigns | view_agents | 活动列表 |
| POST | /api/orgs/{slug}/campaigns | manage_campaigns | 创建活动 |
| GET | /api/orgs/{slug}/campaigns/{id} | view_agents | 活动详情 + 实时统计 |
| PATCH | /api/orgs/{slug}/campaigns/{id} | manage_campaigns | 更新 (pause/resume/edit) |
| POST | /api/orgs/{slug}/campaigns/{id}/start | run_campaigns | 启动活动 |
| GET | /api/orgs/{slug}/campaigns/{id}/runs | view_agents | 执行历史 |
| GET | /api/orgs/{slug}/campaigns/{id}/analytics | view_agents | 详细分析 |

---

## 9. 脚本与话术系统

### 9.1 脚本结构

每个脚本是一个可复用的销售话术模板：

```json
{
  "name": "SaaS Cold Outreach — SPIN Method",
  "category": "cold_outreach",
  "steps": [
    {
      "order": 1,
      "type": "email",
      "template": "Hi {{lead.name}},\n\nI noticed {{lead.company}} is in the {{industry}} space...\n\n[Situation question based on SPIN]\n\nBest,\n{{sender_name}}",
      "delay": 0,
      "condition": null
    },
    {
      "order": 2,
      "type": "email",
      "template": "Hi {{lead.name}},\n\nFollowing up on my previous email...\n\n[Problem question based on SPIN]\n\n{{sender_name}}",
      "delay": "3d",
      "condition": "no_reply"
    },
    {
      "order": 3,
      "type": "ai_email",
      "template": "Generate a value-prop email referencing:\n- Lead: {{lead.name}}, {{lead.company}}\n- Previous emails: [no reply]\n- Goal: book a 15-min discovery call\n- Include: relevant case study",
      "delay": "4d",
      "condition": "no_reply"
    }
  ]
}
```

### 9.2 AI 脚本生成

```
POST /api/orgs/{slug}/ai/generate-script
  Body: {
    prompt: "Generate a cold outbound campaign for SaaS founders who just raised Series A",
    industry: "SaaS",
    targetPersona: "Founder/CEO",
    goal: "Book demo"
  }

  Response: {
    script: {
      name: "Series A SaaS Founder Outreach",
      steps: [...],  // Complete sequence with AI-composed templates
      bestPractices: ["Personalize with funding amount", "Reference portfolio companies"],
      subjectLines: ["congrats on the raise, {{lead.name}}", "quick question about {{lead.company}}"]
    }
  }
```

### 9.3 脚本市场

- 3 个预构建话术模板 (冷外呼、跟进、再激活)
- 一键安装到组织
- 安装后立即在 Campaign 创建中使用

---

## 10. 线索评分与资格认定

### 10.1 AI 评分模型

```
POST /api/orgs/{slug}/ai/score-lead
  Input: lead profile + conversation history + email engagement data

  AI Analysis (DeepSeek):
    ├── Intent strength (0-100): buying signals in language
    ├── Budget fit (0-100): pricing compatibility
    ├── Authority (0-100): decision-maker signals
    ├── Need clarity (0-100): problem-awareness in responses
    └── Timeline (0-100): urgency signals

  Output: {
    score: 85,                // Weighted composite
    label: "Hot",            // Hot (70+) / Warm (40-69) / Cold (<40)
    breakdown: { intent: 90, budget: 75, authority: 80, need: 85, timeline: 90 },
    signals: ["Asked about pricing", "Mentioned 'urgent'", "CEO title detected"],
    recommendedAction: "Route to enterprise closer + book demo this week",
    objections: ["Budget concern — offer annual discount"],
    nextSteps: ["Send enterprise case study", "Offer custom pricing call"]
  }
```

### 10.2 自动资格认定规则

```
When lead.score >= 70:
  → label = "Hot"
  → auto-assign to human SDR
  → trigger Slack/email notification
  → create task: "Book meeting within 48h"

When lead.score >= 40 AND lead.score < 70:
  → label = "Warm"
  → AI agent continues nurturing
  → add to "warm leads" campaign

When lead.score < 40:
  → label = "Cold"
  → add to long-term nurture sequence
  → re-score in 30 days
```

---

## 11. 异步任务队列

### 11.1 架构

```
Vercel (Web App)                    Upstash Redis               Railway (Worker)
────────────────                    ─────────────               ─────────────────

API Routes ──POST──→                BullMQ Queues (prefix: "sales-agent")
                                   ┌──────────────────────┐   ┌──────────────────┐
                                   │ conversation-jobs    │──→│ AI Response       │
                                   │ email-jobs           │──→│ Email Sender      │
                                   │ campaign-jobs        │──→│ Campaign Engine   │
                                   │ scoring-jobs         │──→│ Lead Scorer       │
                                   └──────────────────────┘   └────────┬─────────┘
                                                                        │
Worker Status API ←──DB query────  Prisma (DB)         ←── execute ────┘
```

### 11.2 队列隔离 (关键)

所有 BullMQ 队列必须使用 `prefix: "sales-agent"` 以避免与其他项目冲突：

```typescript
const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

// 4 个队列，统一 prefix
const conversationQueue = new Queue("conversation-jobs", { connection, prefix: "sales-agent" });
const emailQueue = new Queue("email-jobs", { connection, prefix: "sales-agent" });
const campaignQueue = new Queue("campaign-jobs", { connection, prefix: "sales-agent" });
const scoringQueue = new Queue("scoring-jobs", { connection, prefix: "sales-agent" });

// Worker 也必须使用相同 prefix
const worker = new Worker("conversation-jobs", processor, { connection, prefix: "sales-agent" });
```

不设置 prefix 的后果：
- BullMQ queue 会与同一 Redis 实例上的其他项目冲突
- Worker 会消费其他项目的 job
- Job name 会重复
- Retry 状态会互相污染

### 11.3 并发与重试

- **并发**: 5 个 job 同时处理
- **重试**: 指数退避 (2^attempt 秒)
- **延迟步骤**: 利用 BullMQ 原生 `delay` 选项 (活动序列间隔)
- **死信**: 重试耗尽后标记 dead_letter，通知运维

### 11.4 Worker 健康检查

```
GET /health → 200 OK { status: "ok", uptime, queues: { conversation, email, campaign, scoring } }
```

---

## 12. 邮件系统

### 12.1 模板引擎

`apps/worker/src/email.ts` 实现了轻量级模板变量解析：

```
模板: "Hi {{lead.name}}, thanks for your interest in {{product.name}}"
上下文: { lead: { name: "Alice" }, product: { name: "SalesAgent AI" } }
结果:  "Hi Alice, thanks for your interest in SalesAgent AI"
```

- 支持嵌套点号路径 (`lead.email`, `lead.company`)
- 未匹配变量保留原样
- null/undefined 值保留原样

### 12.2 AI 邮件组合

```
Worker: composeAndSend(conversationId, agentId)
        │
        ├── 加载 conversation + lead + agent 配置
        ├── 构建 AI 上下文: 人格 + 知识库 + 对话历史 + 目标
        ├── callDeepSeek(COMPOSE_RESPONSE_PROMPT)
        ├── 提取 subject + body
        ├── resolveTemplate(body, context)
        ├── Resend.emails.send({ from, to, subject, html: body, trackOpens, trackClicks })
        └── 返回 { messageId, to, subject }
```

### 12.3 邮件追踪

- `trackOpens: true` — 追踪打开率
- `trackClicks: true` — 追踪链接点击
- Reply detection — 通过 Resend webhook 捕获回复
- 统计数据回写到 Campaign.stats 和 LeadActivity

---

## 13. 仪表盘与运维面板

### 13.1 AI SDR 仪表盘

首页显示关键的 SDR 运营指标：

| 指标卡片 | 内容 |
|---------|------|
| **Active Conversations** | 正在进行的 AI/人工对话数 |
| **Qualified Leads** | 本周 AI 资格认定通过数 |
| **Response Rate** | AI 自动回复覆盖率 % |
| **Booked Meetings** | AI 预约的会议数 |
| **Campaign Performance** | 活跃活动的 sent/opened/replied |

### 13.2 收件箱统计

- 待回复 (Needs Reply) — 红色徽标
- 活跃对话 (Active) — 蓝色徽标
- 今日新增 — 数字卡片
- AI 处理率 — 百分比进度条

### 13.3 活动分析面板

- 每个活动的: sent, delivered, opened, clicked, replied, booked, unsubscribed
- 漏斗可视化
- A/B 测试主题行效果对比
- 最佳发送时间分析

---

## 14. 前端架构

### 14.1 渲染策略

```
Server Components (RSC)         Client Components
─────────────────────           ─────────────────
数据获取 (Prisma)              交互 (onClick, onChange)
会话验证 (getSession)          状态管理 (useState, useQuery)
权限检查 (hasPermission)       API 调用 (fetch)
布局 + 骨架屏                  乐观更新 (TanStack Query)
                               实时更新 (SSE — inbox 新消息)
                               动画 (framer-motion)
```

### 14.2 状态管理

| 工具 | 用途 |
|------|------|
| **TanStack Query** | 对话列表、线索列表、活动统计的数据缓存和乐观更新 |
| **Zustand** | Inbox 状态 (选中对话、筛选器)、Agent 配置草稿 |
| **React useState** | 组件本地状态 (对话框、回复输入) |
| **SSE** | 新消息实时推送 → inbox 更新 |

### 14.3 UI 组件库 (11 个基础组件)

| 组件 | 文件 | 用途 |
|------|------|------|
| Button | `components/ui/button.tsx` | 按钮 (支持 loading 状态) |
| Card | `components/ui/card.tsx` | 卡片容器 |
| Badge | `components/ui/badge.tsx` | 状态标签 (hot/warm/cold, active/closed) |
| Input | `components/ui/input.tsx` | 输入框 |
| Avatar | `components/ui/avatar.tsx` | 用户/联系人头像 |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | 下拉菜单 |
| Dialog | `components/ui/dialog.tsx` | 模态对话框 (Portal, Esc, 遮罩) |
| Select | `components/ui/select.tsx` | 选择下拉 |
| Textarea | `components/ui/textarea.tsx` | 多行输入 |
| Table | `components/ui/table.tsx` | 表格 |
| Tabs | `components/ui/tabs.tsx` | 标签页切换 |

### 14.4 Identity Stack（运营客户身份层）

Operational Customer Identity Layer — 全系统统一的客户身份展示模式。

**设计原则**: AI-native SaaS 的核心不是 AI，而是"谁在控制这个流程"。Identity Stack 通过 avatars + presence + ownership + AI state + activity timestamps 让系统产生"真实运营感（operational realism）"。

**架构**:
```
IdentityCard
├── Avatar (DiceBear notionists + gradient-initials 回退)
├── PresenceDot (online/idle/ai-processing/handoff-required/syncing)
├── CustomerMeta (name, company, email)
├── AIState ("AI handling · 92% confidence" | "Assigned to Emma")
├── LeadIntent (score bar + hot/warm/cold label)
└── ActivityTimestamp (relative time: "2m ago", "Active now")
```

**Presence 状态机** — 从时间戳推导，无需 WebSocket:
| 状态 | 条件 | 视觉 |
|------|------|------|
| `online` | <5min | 绿点 |
| `idle` | <1h | 灰点 |
| `away` | <24h | 浅灰点 |
| `offline` | >24h | 无点 |
| `ai-processing` | 显式设置 | 紫点 + pulse |
| `handoff-required` | 显式设置 | 橙点 + pulse |
| `syncing` | 显式设置 | 蓝点 + pulse |

**组件文件**:
| 组件 | 文件 |
|------|------|
| Avatar | `components/identity/avatar.tsx` |
| PreseneDot | `components/identity/presence.tsx` |
| IdentityCard | `components/identity/identity-card.tsx` (compact + expanded 变体) |
| ActivityFeed | `app/(dashboard)/home/activity-feed.tsx` |
| 工具函数 | `lib/time.ts` (relativeTime, presenceFromDate, presenceLabel, presenceColor) |

**应用范围**:
- Inbox 列表: IdentityCard compact 变体 (avatar + name + company + score + message preview + relative time)
- Conversation Detail: IdentityCard expanded 变体 (大 avatar + 全量 meta + AI ownership badge)
- Leads 页面: Avatar 组件 (DiceBear + gradient fallback)
- Dashboard: ActivityFeed 实时活动流 (LeadActivity + AuditLog 合并, 30s 轮询)

**设计决策**:
- 头像: DiceBear `notionists` 风格 (免费、无需上传、seed 驱动唯一性)，email 作为 seed
- Presence: 纯数据推导 `Date.now() - updatedAt` → 状态，零额外存储
- AI ownership: 复用 `conversation.agentId` 关系和 Lead.score，无需新 DB 列

### 14.5 UX 模式

- **Loading**: 所有页面有 `loading.tsx` 骨架屏
- **Empty**: 含引导文案 + 操作按钮
- **Error**: 红色背景 + 错误信息 + Retry 按钮
- **Success**: sonner toast 提示
- **Navigation**: 按钮保持 loading 状态直到导航完成 (组件卸载)
- **Glass UI**: `.glass-card` 毛玻璃卡片，`backdrop-filter: blur(16px) saturate(180%)`

---

## 15. 部署架构

### 15.1 平台分布

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
              │ (sales_   │ │ prefix: │ │  (Global)   │
              │  agent)   │ │ sales-  │ └─────────────┘
              └─────┬─────┘ │ agent   │
                    │       └────────┘
              ┌─────┴─────┐
              │  Railway  │ ← BullMQ Worker
              │  (US)     │   AI Response + Campaign Engine + Email
              └───────────┘
```

### 15.2 Vercel 部署要点

```
1. .npmrc: node-linker=hoisted
2. schema.prisma: binaryTargets = ["native", "rhel-openssl-3.0.x"]
3. next.config.js: experimental.serverComponentsExternalPackages: ["@prisma/client"]
4. vercel.json: buildCommand = "prisma generate && next build"
5. 环境变量通过 Vercel Dashboard 设置 (不用 dotenv)
```

### 15.3 Railway 部署要点

```
1. railway.toml: builder=nixpacks
2. Build: pnpm install && pnpm --filter @salesagent/db generate
3. Start: npx tsx apps/worker/src/index.ts (从项目根目录)
4. HTTP 健康检查: Worker 内嵌 http.createServer (0.0.0.0:PORT)
5. 注意: 所有 BullMQ 连接使用 prefix: "sales-agent"
```

---

## 16. 安全态势

### 16.1 已实施

| 威胁模型 | 缓解措施 |
|----------|---------|
| 未授权访问 | JWT 守卫中间件 (所有非公开路由) |
| 权限提升 | RBAC 控制 (所有 API 端点检查权限) |
| 跨租户访问 | Prisma 查询级别 org 隔离 |
| 暴力破解 | Redis 滑动窗口 100 req/min |
| XSS | React 自动转义 + CSP 头 |
| Clickjacking | X-Frame-Options: DENY |
| MITM | HSTS + Secure cookies |
| JWT 伪造 | HS256 + 强制密钥 (无回退) |
| JWT 撤销 | Redis 黑名单 + 登出撤销 |
| 信息泄露 | 通用错误消息 + PII 日志哈希 |
| SQL 注入 | Prisma 参数化查询 |
| CSRF | SameSite=Lax cookies |
| Input 验证 | 16 个 Zod schema |
| Webhook 时序 | `crypto.timingSafeEqual()` |

### 16.2 待改进

| 项目 | 优先级 | 说明 |
|------|--------|------|
| PostgreSQL RLS | 低 | App-layer 隔离已一致，作为纵深防御补充 |
| API Key Bearer 认证 | 中 | Edge Runtime Prisma 限制 |
| Stripe 计费 | 高 | 未实施 |
| 邮件域名验证 (Resend) | 中 | 需验证自定义域名 |
| 依赖扫描 | 中 | Dependabot/Snyk 自动化 |
| AI 回复安全审查 | 中 | 输出过滤防 prompt injection |

---

## 附录 A: 命令速查

```bash
pnpm dev                    # 启动全部开发服务
pnpm build                  # 构建全部包
pnpm seed                   # 重置 + 灌入 demo 数据
pnpm seed-prod demo-org     # 幂等灌入 3 脚本 + 5 线索
pnpm seed-verify-alice      # 预验证 alice@example.com
pnpm clean-org demo-org     # 清空组织数据
pnpm --filter @salesagent/db push     # 推送 schema 到数据库
npx vercel --prod --cwd apps/web      # 部署到 Vercel 生产环境
```

## 附录 B: 能力评估

### 项目复杂度指标

| 指标 | 数值 |
|------|------|
| 总代码行数 | ~10,000 |
| 文件数 | ~220 |
| API 端点 | 35 + SSE + Webhook |
| 数据库模型 | 10 + 2 enums |
| RBAC 权限 | 10 项 |
| AI 功能 | 4 个 (compose, score, summarize, generate-script) |
| 部署平台 | 4 个 (Vercel, Railway, Supabase, Upstash) |
| 外部集成 | DeepSeek, Resend, BullMQ, jose, bcrypt |

### 技术广度覆盖

```
✅ Monorepo 管理 (pnpm + Turborepo)
✅ Next.js App Router (RSC + Client Components)
✅ TypeScript 全栈
✅ 自定义 JWT 认证 (jose)
✅ 多租户架构 (4 角色 10 权限)
✅ AI SDR 代理引擎 (人格/知识库/目标驱动)
✅ 对话收件箱 (SSE 实时推送)
✅ 外呼活动编排 (BullMQ 序列/延迟/重试)
✅ 异步队列 (BullMQ + Redis, prefix isolation)
✅ AI 集成 (DeepSeek: 回复/评分/总结/脚本生成)
✅ 实时通信 (SSE)
✅ 邮件系统 (Resend + AI 组合 + 打开/点击追踪)
✅ 审计日志 (不可变审计追踪)
✅ 安全加固 (CSP/HSTS/限流/JWT撤销/Zod验证/PII保护)
✅ DevOps (Vercel + Railway + Supabase)
✅ 落地页 + 深色模式 + 移动端响应式
✅ CSV 导入/导出 + 脚本市场 + 入职向导
✅ API 密钥管理 + API 文档
```

**工程水平评估: Senior Full-Stack Engineer**

该项目展示了一个专业的 AI SDR SaaS 产品 — 从 AI Agent 引擎设计、多模型数据架构、异步活动编排、前端收件箱到安全加固和 DevOps。架构决策合理（目标驱动 Agent、队列隔离、人工兜底），代码组织清晰。
