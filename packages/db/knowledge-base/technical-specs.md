# 启云科技 QiCloud — 技术规格书

> 版本：V3.3 | 更新日期：2026-07-01 | 文档层级：核心层 > 技术规格
> 关联文档：product-overview.md, pricing-v3.md, api-reference.md, compliance-policy.md
> 目标读者：技术决策者、IT 管理员、安全审核人员

## 系统性能

| 指标 | 标准版 | 专业版 | 企业版 |
|------|--------|--------|--------|
| 并发会话数 | 150 | 500 | 10,000+ (水平扩展) |
| AI 响应延迟 (P50) | < 1.2s | < 800ms | < 500ms |
| AI 响应延迟 (P95) | < 3.5s | < 2.5s | < 1.5s |
| 消息吞吐量 | 100/分钟 | 500/分钟 | 5,000+/分钟 |
| API 速率限制 | N/A | 300 req/min | 3,000 req/min (可调) |
| 知识库检索延迟 | < 800ms | < 500ms | < 300ms (含缓存) |
| 文档上传限制 | 10MB/文件 | 50MB/文件 | 500MB/文件 (可调) |

## 数据存储

- **主数据库**：PostgreSQL 16 + pgvector 扩展
- **缓存层**：Redis 7（Upstash 托管或客户自建）
- **文件存储**：S3 兼容（专业版）/ 客户指定（企业版）
- **向量维度**：1536（OpenAI text-embedding-3-small）或 1024（DeepSeek embedding）
- **全文索引**：PostgreSQL tsvector + GIN 索引，支持中英文
- **语义缓存**：Redis 两层缓存（SHA-256 exact match + cosine ≥0.95 semantic match），FAQ 命中率 60%+

## AI 引擎

- **大语言模型**：DeepSeek-V3（默认），支持 OpenAI 兼容接口切换
- **Embedding 模型**：text-embedding-3-small（OpenAI）或 deepseek-chat（自动回退）
- **Reranker**：Cohere rerank-multilingual-v3.0（可选，无 Key 时自动 Noop 透传）
- **查询改写**：LLM 驱动的 3 变体扩展（原始+关键词+同义改写），失败降级 Noop
- **问题路由**：6 分类（FAQ/产品/定价/竞品/案例/通用），每类独立检索参数
- **ReAct Agent**：思考→行动→观察循环，max 6 steps，支持自定义 Tool 注入
- **Token 管理**：AICallMetric 记录每次调用的 Token 消耗和延迟，AI Health Dashboard 实时监控
- **降级策略**：Embedding 不可用→关键词搜索；Reranker 不可用→Noop；Redis 不可用→内存回退；LLM 超时→重试×3→标记失败

## 安全合规

- **认证**：ISO 27001（信息安全管理），等保三级（网络安全等级保护）
- **传输加密**：TLS 1.3，HSTS (max-age=63072000)
- **存储加密**：AES-256，密钥由客户管理（企业版）
- **访问控制**：5 角色 × 13 权限 RBAC，JWT + Redis 黑名单即时失效
- **限流**：API 100 req/min（Upstash 滑动窗口），Auth 10 req/min（防暴力破解）
- **输入验证**：Zod Schema（19 个验证点），文件上传魔数校验 + 10MB 上限
- **AI 安全**：PROMPT_ARMOR 防注入，输出引用溯源
- **审计**：所有操作写入 AuditLog（不可变），AICallMetric 记录每次 AI 调用
- **PII 保护**：日志中 email/JWT 自动 SHA-256 哈希脱敏

## 集成与扩展

- **API**：RESTful API（JSON），版本化（/api/v1/），Bearer Token + Cookie 双认证
- **Webhook**：支持事件回调（消息到达/客户上线/评分变更）
- **SDK**：JavaScript/TypeScript（npm @salesagent/api-client），Python（计划中）
- **CRM 对接**：Salesforce / HubSpot / Zoho CRM（通过 API 同步客户数据）
- **SSO**：企业版支持 SAML 2.0 和 OIDC（Okta/Azure AD/飞书）

## 基础设施

| 组件 | 运行时 | 位置 |
|------|--------|------|
| Web 前端 | Vercel (Serverless, Next.js 14) | US East |
| AI Worker | Railway (长期容器, BullMQ + Node.js) | US |
| 数据库 | Supabase (PostgreSQL 16 + pgvector) | US East |
| 缓存/队列 | Upstash (Redis 7, REST+TCP 双协议) | Global |
| 邮件 | Resend API | — |
| 实时消息 | Socket.IO (自建, 端口 3001) | — |

> 所有外部依赖均有降级路径。系统设计哲学：每个组件可独立故障，不可雪崩。
