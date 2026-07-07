# 启云科技 QiCloud — 技术规格书

> 版本: V3.4 | 更新: 2026-07-07 | 层级: 核心层
> 关联: product-overview.md, pricing-v3.md, api-reference.md, compliance-policy.md
> 读者: 技术决策者、IT 管理员、安全审核人员

## 系统性能

| 指标 | 标准版 | 专业版 | 企业版 |
|------|--------|--------|--------|
| 并发会话数 | 150 | 500 | 10,000+ (水平扩展) |
| AI 响应 P50 | <1.2s | <800ms | <500ms |
| AI 响应 P95 | <3.5s | <2.5s | <1.5s |
| 消息吞吐量 | 100/min | 500/min | 5,000+/min |
| API 速率限制 | N/A | 300 req/min | 3,000 req/min (可调) |
| 知识库检索延迟 | <800ms | <500ms | <300ms (含缓存) |
| 语义缓存命中 FAQ | N/A | 60%+ | 70%+ (更大缓存池) |
| 单文件上传 | 10MB | 50MB | 500MB |

## AI 引擎

大语言模型采用 DeepSeek-V3（默认），支持 OpenAI 兼容接口切换。Embedding 模型: text-embedding-3-small (OpenAI, 1536 维) 或 deepseek-chat (自动回退, 1024 维)。Reranker: Cohere rerank-multilingual-v3.0 (可选，无 Key 时 Noop 透传)。查询改写: LLM 驱动 3 变体扩展 (原始+关键词+同义改写)，失败降级 Noop。问题路由: 6 分类 (FAQ/产品/定价/竞品/案例/通用)，每类独立检索参数 (topK/minScore/vector-keyword 权重比)。ReAct Agent: 思考→行动→观察循环，max 6 steps，支持自定义 Tool 注入。Token 管理: AICallMetric 记录每次调用的 Token 消耗、延迟、成本。降级策略: Embedding 不可用→关键词搜索；Reranker 不可用→Noop；Redis 不可用→内存回退；LLM 超时→重试×3→标记失败。

## 数据存储

主数据库: PostgreSQL 16 + pgvector 扩展。缓存层: Redis 7 (Upstash 托管或客户自建)。文件存储: S3 兼容 (专业版) / 客户指定 (企业版)。向量维度: 1536 (OpenAI) 或 1024 (DeepSeek)。全文索引: PostgreSQL tsvector + GIN 索引，支持中英文。语义缓存: Redis 两层 (SHA-256 exact + cosine≥0.95 semantic)，FAQ 命中率 60%+，延迟 2s→50ms。

## 安全合规

认证: ISO 27001 (信息安全管理) + 等保三级。传输: TLS 1.3，HSTS (max-age=63072000, includeSubDomains, preload)。存储: AES-256，企业版密钥客户自管。访问控制: 5 角色×13 权限 RBAC，JWT+Redis 黑名单即时失效，双层限流 (API 100/min, Auth 10/min)。输入验证: 19 处 Zod Schema 校验，文件上传魔数校验+10MB 上限。AI 安全: PROMPT_ARMOR 防注入，输出引用溯源，HITL 审批门控。审计: 全部操作写入不可变 AuditLog，AICallMetric 记录每次 AI 调用。PII 保护: 日志 email/JWT 自动 SHA-256 哈希脱敏。

## 基础设施拓扑

| 组件 | 运行时 | 位置 | 协议 |
|------|--------|------|------|
| Web 前端 | Vercel (Serverless, Next.js 14) | US East (iad1) | HTTPS |
| AI Worker | Railway (长期容器, BullMQ+Node.js) | US | TCP→Redis |
| 数据库 | Supabase (PostgreSQL 16+pgvector) | US East | TLS 1.3 |
| 缓存/队列 | Upstash (Redis 7) | Global | REST (Web) + TCP (Worker) |
| 邮件 | Resend API | — | HTTPS |
| 实时消息 | Socket.IO 自建 (端口 3001) | — | WebSocket+HTTP polling |
| LLM | DeepSeek API | — | HTTPS |

同一 Redis 实例双协议使用——Web 端用 REST（Serverless 无长连接），Worker 端用 TCP（长期容器需高效等待新任务）。BullMQ prefix: "sales-agent" 防止多项目冲突。Prisma connection_limit=1 + PgBouncer 防止 Serverless 连接池爆炸。所有外部依赖均有降级路径，不会因单一服务挂掉而全系统不可用。

## 集成接口

RESTful API (JSON, /api/v1/ 版本化)，Bearer Token+Cookie 双认证。Webhook: 支持事件回调（消息到达/客户上线/评分变更）。SDK: JavaScript/TypeScript (@salesagent/api-client)，Python 计划中。CRM 对接: Salesforce/HubSpot/Zoho CRM 通过 API 同步。SSO: 企业版 SAML 2.0+OIDC (Okta/Azure AD/飞书)。
