/**
 * seed-kb-full.ts — Generate a layered knowledge base for SalesAgent AI
 *
 * 3 layers, 12 documents, ~120KB total:
 *   Layer 1 (Core):   product-overview, pricing-v3, technical-specs
 *   Layer 2 (Sales):  faq-v2, objection-handbook, case-studies, competitor-battlecards, sales-playbook
 *   Layer 3 (Ops):    onboarding-guide, api-reference, compliance-policy, internal-escalation
 *
 * Design principles:
 *   - Cross-document references (e.g. FAQ → pricing, case-studies → competitor-battlecards)
 *   - Deliberate overlap (same info in different wording across docs — RAG must handle dedup)
 *   - Numerical data (pricing tiers, API rate limits, SLA response times) — RAG must retrieve accurately
 *   - Edge cases (partial matches, multi-hop answers, contradictory-sounding info)
 */

import * as fs from "fs";
import * as path from "path";

const OUT_DIR = path.resolve(__dirname, "knowledge-base");
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Layer 1: Core (产品核心) ────────────────────────────────────────

const productOverview = `# 启云科技 QiCloud — 产品功能全景

> 版本：V3.3 | 更新日期：2026-07-01 | 文档层级：核心层 > 产品概述
> 关联文档：pricing-v3.md, technical-specs.md, faq-v2.md

## 产品定位

启云科技是一站式企业级 AI 客户服务平台，帮助 B2B 销售和服务团队用 AI 替代重复性工作，
让人专注于高价值的客户关系建立和复杂决策。

## 三大核心模块

### 1. AI 客服机器人（SmartChat）

- **全渠道接入**：网页聊天、微信、企业微信、邮件、API 嵌入，一个后台管理所有渠道
- **智能问答**：基于企业知识库的 RAG 问答，上传 PDF/Word/MD 文档即可自动学习，无需手动配置 FAQ
- **多轮对话**：支持上下文感知的连续对话，客户不用每次重复上下文
- **情感识别**：实时分析客户情绪（满意/困惑/愤怒），自动标记高风险会话并通知人工坐席
- **转人工**：AI 无法回答或客户明确要求时，无缝转接人工，附带完整对话历史和 AI 判断摘要

### 2. AI 销售助手（SmartSales）

- **线索智能评分**：基于 BANT 框架（预算/权限/需求/时间线）自动评分 0-100 分，支持 MEDDIC 扩展维度
- **自动跟进**：AI 根据客户阶段和画像自动生成个性化跟进消息，支持邮件和聊天双通道
- **外呼活动引擎**：多步骤序列编排（冷启动→跟进→提案→成交），每个步骤支持 AI 个性化改写
- **话术生成**：AI 学习 Top Sales 的历史对话，自动推荐最佳回复方案
- **客户洞察面板**：集成客户公司信息、购买信号检测、下一步行动建议

### 3. 统一工作台（UniDesk）

- **全渠道收件箱**：Email 和实时聊天统一在一个 Split-Pane 界面上，左侧对话列表，右侧消息详情
- **数据分析仪表盘**：Pipeline 价值、转化率、AI 回复率、客户满意度等关键指标实时展示
- **知识库管理**：文档上传/分类/检索/评测，支持增量索引和语义缓存
- **团队成员管理**：5 角色 × 13 权限的细粒度访问控制
- **客户门户**：客户独立登录界面，查看历史对话、发起新会话、上传文件

## 部署方式

| 方式 | 适用 | 部署周期 | 数据存储 |
|------|------|---------|---------|
| 公有云 SaaS | 标准版/专业版客户 | 当天开通 | 启云科技托管（阿里云/腾讯云） |
| 私有云部署 | 企业版客户 | 1-2 周 | 客户自有服务器 |
| 混合部署 | 对数据主权有要求的客户 | 2-3 周 | AI 引擎在客户本地，管理后台在云端 |

## 技术架构亮点

- **RAG 检索管线**：查询改写→问题路由→混合检索(pgvector+tsvector→RRF)→Cohere Reranker→置信度门控
- **降级设计**：Embedding API 不可用时自动回退到关键词搜索，Reranker 不可用时 Noop 透传，Redis 不可用时内存限流
- **评测体系**：30 条 Golden Dataset + 4 检索指标 + LLM-as-Judge 忠实度/相关性评分，连接生产数据库做真实评测
- **实时通信**：WebSocket (Socket.IO) 支持客户 ↔ 销售实时聊天，REST polling 自动降级兼容 Serverless 部署

## 数据安全

- 通过 ISO 27001 和等保三级认证
- 数据传输 TLS 1.3 加密，存储 AES-256 加密
- 私有化部署方案支持完全本地化数据存储，数据不出企业防火墙
- 审计日志记录所有操作，不可篡改

---

> 下一层文档：[pricing-v3.md](./pricing-v3.md) — 产品定价 | [technical-specs.md](./technical-specs.md) — 技术规格
`;

// ── Pricing V3 ─────────────────────────────────────────────────────

const pricing = `# 启云科技 QiCloud — 产品定价表 V3

> 更新日期：2026-07-01 | 文档层级：核心层 > 定价
> 关联文档：product-overview.md, faq-v2.md, competitor-battlecards.md
> 所有价格均为含税价（人民币），年付享 8 折

## 标准版

**¥9,800/月** | 适合 5-20 人销售团队

| 功能项 | 规格 |
|--------|------|
| AI 坐席数 | 3 个（可加购 ¥2,000/月/个） |
| 月消息量 | 5,000 条（超出 ¥0.5/条） |
| 知识库存储 | 1GB |
| 接入渠道 | 网页聊天 + 邮件 |
| RAG 检索 | 基础向量检索（pgvector） |
| 数据分析 | 基础仪表盘 |
| 技术支持 | 工作日 9:00-18:00，响应 <4h |
| API 接入 | 不包含（需升级） |

## 专业版

**¥29,800/月** | 适合 20-100 人销售团队

| 功能项 | 规格 |
|--------|------|
| AI 坐席数 | 10 个（可加购 ¥1,500/月/个） |
| 月消息量 | 无限制 |
| 知识库存储 | 10GB |
| 接入渠道 | 全渠道（网页+邮件+微信+企微+API） |
| RAG 检索 | **混合检索**（pgvector + 全文搜索 + RRF 融合 + Cohere Reranker） |
| 数据分析 | 高级仪表盘 + 导出 + AI Health 监控 |
| 技术支持 | 7×24 小时，响应 <1h |
| API 接入 | REST API + Webhook + SDK (JS/Python) |
| 客户门户 | ✅ 包含 |

## 企业版

**按需定制，起步价 ¥80,000/月** | 适合 100+ 人团队

| 功能项 | 规格 |
|--------|------|
| AI 坐席数 | 无限制 |
| 所有专业版功能 | ✅ |
| 部署方式 | 私有化部署（AWS/阿里云/腾讯云/自建机房） |
| RAG 检索 | 混合检索 + 语义缓存（Redis） + 知识图谱（Neo4j） |
| 定制开发 | SLA / 品牌 / UI / 工作流定制 |
| 专属服务 | 技术经理 + 7×24×30min SLA |
| 数据主权 | 完全本地化，数据不出企业防火墙 |
| SSO/OAuth | SAML + OIDC 集成 |

## 常见问题（定价相关）

**Q: 14 天免费试用包含什么？**
A: 标准版全部功能 + 3 个 AI 坐席 + 1GB 知识库。不需要绑定信用卡。试用结束可选择付费或导出数据。

**Q: 从标准版升级到专业版怎么操作？**
A: 在线升级，即时生效，费用按天折算。历史数据无缝迁移。

**Q: 年付折扣怎么算？**
A: 年付 = 月费 × 12 × 0.8。如标准版年付 = ¥9,800 × 12 × 0.8 = ¥94,080（比月付省 ¥23,520）。

**Q: 知识库存储超了怎么办？**
A: 标准版和专业版均可购买扩容包。标准版 ¥200/GB/月，专业版 ¥100/GB/月。

## 版本对比速查

| 对比维度 | 标准版 | 专业版 | 企业版 |
|---------|--------|--------|--------|
| 月费 | ¥9,800 | ¥29,800 | 定制 |
| AI 坐席 | 3 个 | 10 个 | 无限 |
| 检索方式 | 基础向量 | 混合检索+Reranker | 混合+缓存+知识图谱 |
| 渠道 | 网页+邮件 | 全渠道 | 全渠道 |
| 部署 | SaaS | SaaS | 私有化 |
| 客户门户 | ❌ | ✅ | ✅ |
| API | ❌ | ✅ | ✅ |
| SLA | 工作日 4h | 7×24 1h | 7×24 30min |
`;

// ── Technical Specs ────────────────────────────────────────────────

const technicalSpecs = `# 启云科技 QiCloud — 技术规格书

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
`;

// ── Layer 2: Sales Reference (销售参考) ─────────────────────────────

const faq = `# 启云科技 QiCloud — 常见问题（FAQ V2）

> 最后更新：2026-07-07 | 文档层级：销售参考层 > FAQ
> 关联文档：pricing-v3.md, product-overview.md, technical-specs.md
> 使用方法：客户提问时，AI 销售坐席自动检索本文档中的最相关条目。

## 关于产品功能

**Q: AI 客服能处理多复杂的问题？**
A: 基于大语言模型和 RAG 知识库，能处理产品咨询、故障排查、订单查询、退换货政策等大多数常见问题。复杂问题会自动转接人工坐席，附带完整对话上下文。准确率在客户实际场景中通常达 85-92%（具体取决于知识库质量）。

**Q: 支持哪些文件格式上传到知识库？**
A: PDF、Word (DOCX)、Markdown、TXT、FAQ (JSON)。PDF 支持文本提取但不支持扫描件 OCR。单个文件最大 10MB（标准版）/ 50MB（专业版）/ 500MB（企业版）。

**Q: 怎么训练 AI 理解我们公司的业务？**
A: 通过知识库上传——上传核心产品文档、定价表、FAQ、客户案例后，系统自动解析→分块→向量化存储。通常上传后 1 小时内即可生效。不需要写任何规则或配置。详见 onboarding-guide.md 的完整操作流程。

**Q: 支持多语言吗？**
A: 支持中文（简/繁）、英文、日文、韩文等 10 种语言。AI 自动检测客户语言并以相同语言回复。知识库支持多语言文档上传。详见 technical-specs.md 的 AI 引擎部分。

**Q: 能不能和现有的 CRM 对接？**
A: 专业版和企业版支持——通过 REST API + Webhook 对接 Salesforce、HubSpot、Zoho CRM 等主流系统。标准版不支持 API 接入。详见 api-reference.md。

## 关于定价

**Q: 各版本的定价是多少？**
A: 标准版 ¥9,800/月（3 个 AI 坐席），专业版 ¥29,800/月（10 个 AI 坐席），企业版按需定制起步价 ¥80,000/月。年付享 8 折。详见 pricing-v3.md 完整定价表。

**Q: 一个 AI 坐席能同时处理多少客户？**
A: 一个 AI 坐席可同时处理约 50 个活跃客户会话（标准版并发 150，专业版 500）。业务增长可在线加购 AI 坐席（标准版 ¥2,000/月/个，专业版 ¥1,500/月/个）。

**Q: 免费试用有隐藏费用吗？**
A: 没有。14 天标准版全部功能，3 个 AI 坐席，1GB 知识库。不绑信用卡。试用结束可选择付费或导出数据。

**Q: 从标准版升级到专业版数据会丢吗？**
A: 不会。在线升级，即时生效，历史数据无缝迁移。费用按剩余天数折算。

## 关于部署与安全

**Q: 数据存在哪里？**
A: 标准版和专业版数据存储在启云科技托管的云服务器（阿里云/腾讯云，中国大陆）。企业版支持私有化部署，数据完全存储在客户自有服务器。详见 compliance-policy.md。

**Q: 支持私有化部署吗？**
A: 企业版支持。部署周期 1-4 周，具体取决于客户 IT 环境。支持 AWS/阿里云/腾讯云/自建机房。AI 引擎和数据可完全本地化。详见 onboarding-guide.md 的私有化部署流程。

**Q: 系统宕机了怎么办？**
A: 标准版和专业版由启云科技负责运维，SLA 保障——标准版工作日 4 小时内响应，专业版 7×24×1h 响应，企业版 7×24×30min 响应。各组件均有降级路径，不会因单个外部服务挂掉而完全不可用。

## 关于 AI 质量

**Q: AI 会不会胡编乱造？**
A: 不会。系统基于 RAG 技术——AI 严格基于你的知识库内容回答。知识库中没有的信息，AI 会明确告知"我确认一下再回复"。同时支持输出引用溯源（每个回答带 [Source N] 标注，可追溯到具体文档段落）。

**Q: AI 的回答准确率怎么样？**
A: 取决于知识库质量。客户实际场景中通常 85-92%。系统提供 Golden Dataset 评测框架，每次调参可量化评估。详见 product-overview.md 的 AI 评测机制。

**Q: 如果 AI 答错了怎么办？**
A: 两道防线：第一，Human-in-the-Loop——AI 起草回复后必须人工审核才能发送（销售场景）。第二，客户反馈机制——客户可在 Portal 中标记"回答不准确"，系统自动记录供后续优化。
`;

// ── Objection Handling ─────────────────────────────────────────────

const objectionHandbook = `# 启云科技 QiCloud — 销售异议处理话术手册

> 更新日期：2026-07-07 | 文档层级：销售参考层 > 话术手册
> 关联文档：competitor-battlecards.md, case-studies.md, pricing-v3.md
> 使用说明：AI 坐席在遇到客户异议时检索本文档获取参考话术。

## 规则总则

1. **先共情再解决**：永远先说"我理解您的顾虑"，再给解决方案。不要直接反驳。
2. **用数据说话**：引用具体的数字和案例，而不是空泛的"我们的产品很好"。
3. **转化而非对抗**：客户的异议往往隐藏着需求。比如"太贵了"的潜台词可能是"我还没看到足够的价值"。
4. **不编造**：知识库中没有的信息不要编造。说"我确认一下再回复"比说错好。

## 价格异议

**"太贵了，我们预算有限"**

- 共情："完全理解。对于任何一笔采购，确保每一分钱花在对的地方都是最重要的。"
- 数据支撑："以标准版 ¥9,800/月为例，如果 3 个 AI 坐席替代 1 个初级客服的工作量（约 ¥8,000/月），实际上 AI 坐席可以同时处理 150 个并发会话，远超一个人的产能。加上 7×24 小时在线，客户不需要排队等上班时间。"
- 降级策略："如果您目前预算紧张，可以先从标准版开始。一个月 ¥9,800 是一个 SDR 月薪的 1/3-1/2，但能覆盖 3 倍的工作量。等 ROI 验证后再升级专业版。升级是即时的、数据不丢。"
- 对标："网易七鱼的标准版也要 ¥12,000+/月，且 AI 主要是关键词匹配。我们的 RAG 检索是基于大语言模型的语义理解——这是两个代际的技术。"（详见 competitor-battlecards.md 的网易七鱼对比）

**"我们自己用 ChatGPT 不就行了"**

- 共情："ChatGPT 确实是一个非常强大的工具。"
- 差异化：详见 competitor-battlecards.md 的 "ChatGPT vs 启云科技" 对比表。
- 核心论点：ChatGPT 不知道您的产品细节，会编造信息。启云的 AI 严格基于您的知识库。ChatGPT 的 API 需要技术人员对接，启云开箱即用。ChatGPT 不提供 HITL 审批流——销售场景 AI 绝不能直接发邮件。

## 竞品异议

详见 competitor-battlecards.md 的完整对比分析。以下是指向关键卖点的快速索引：

- "和网易七鱼比" → competitor-battlecards.md §1
- "和 Intercom/Zendesk 比" → competitor-battlecards.md §2
- "和腾讯企点比" → competitor-battlecards.md §3
- "和自研比" → competitor-battlecards.md §4

## 数据安全异议

**"我们公司的数据不能放在外部服务器上"**

- 共情："数据安全是每家企业最核心的关切。"
- 解决方案：企业版支持完全私有化部署——所有数据存储在您的服务器上，AI 引擎也可以在您自己的机房运行。系统通过 ISO 27001 和等保三级认证。
- 参考案例："我们的一家金融客户就是采用私有化方案——所有客户数据和合规文档完全留存在他们的内网，外部零访问。详见 case-studies.md 的金融行业案例。"

## 效果疑虑

**"AI 真的能替代人工销售吗？"**

- 澄清定位："我们的产品不是替代人工销售——是替代他们做重复性工作。AI 负责线索评分、起草初稿、回复常见问题。人类销售负责关系建立、复杂谈判、最终决策。这是 Human-in-the-Loop 架构——AI 起草但绝不自动发送。"
- 数据支撑：见 case-studies.md 的电商客户案例——日处理 10 万+会话，AI 自动解决 85%，人工坐席从 200 人降至 30 人处理高价值复杂问题，年节省人力成本 ¥800 万。

**"你们的产品太新了，我不放心"**

- 共情："完全理解——选择一个新的技术方案需要勇气。"
- 信任建立："我们在过去 24 个月中迭代了 21 个大版本。目前有 50+ 个 API 端点、52 个自动化测试用例、通过了安全审计。您可以先试用 14 天，不需要绑卡。试用的数据和配置可以无缝升级到正式版。"
`;

// ── Case Studies ───────────────────────────────────────────────────

const caseStudies = `# 启云科技 QiCloud — 客户成功案例

> 更新日期：2026-07-07 | 文档层级：销售参考层 > 案例
> 关联文档：product-overview.md, pricing-v3.md, competitor-battlecards.md
> 注意：为保护客户隐私，公司名称经过匿名处理。数据来自客户授权使用的真实统计。

## 案例 1：头部电商平台 — 客服智能化

**背景**：某头部电商平台，日均客服会话量 3,000+。200 个在线客服轮班制，高峰期客户排队 5-15 分钟。团队把大量时间花在"我的订单到哪了""怎么退货"等重复性问题上。

**方案**：部署启云科技专业版（全渠道 + 混合检索 RAG）。上传产品手册、退货政策、物流指南等 60+ 份文档到知识库（~15MB）。配置 3 个 AI 坐席处理售前咨询和售后常见问题。

**效果**（6 个月数据）：
- 日处理客服会话 3,000 → 100,000+（30 倍扩容，AI 并行处理）
- AI 自动解决率 85%（用户问题在 AI 环节即完成，无需转人工）
- 人工坐席从 200 人降至 30 人（只处理高价值复杂问题）
- 客户等待时间从平均 8 分钟降至 <30 秒（AI 即时响应）
- NPS 从 42 提升至 68（快速响应提升了客户满意度）
- 年节省人力成本约 ¥800 万

## 案例 2：中型 SaaS 企业 — 销售团队效率提升

**背景**：某 50 人 SaaS 企业，销售团队 8 个 SDR，每人每天跟进 20-30 个线索。瓶颈在于——大量线索评分靠直觉、跟进消息雷同、忘记跟进导致商机流失。

**方案**：部署启云科技专业版。AI 销售助手对全部 500+ 条历史线索自动评分（BANT 维度），建立 3 阶段外呼序列（冷启动→产品介绍→提案），AI 根据客户阶段自动起草个性化跟进消息。

**效果**（3 个月数据）：
- 线索评分从手动 Excel → 自动 0-100 分 / 5 维度
- 每个 SDR 日均跟进线索 25 → 80（3 倍提升，AI 自动起草初稿）
- 线索到成交的转化率提升 60%（更及时的跟进 + 更精准的评分）
- 忘记跟进率从约 15% → 接近 0（AI 自动到期待办提醒）
- 销售 VP："以前我凭感觉判断谁的 pipeline 健康，现在仪表盘上数字一目了然。"

## 案例 3：中型券商 — 合规知识库管理

**背景**：某中型券商，合规团队 5 人。需管理 3,000+ 份合规文档（法律法规、监管指引、内部制度）。业务人员频繁咨询合规问题，合规团队响应不及时。所有数据必须留存在企业内网。

**方案**：部署启云科技企业版（私有化部署）。上传全部合规文档到知识库，配置 AI 客服面向内部业务人员提供合规咨询。所有 AI 回答严格基于已审核的文档，带完整引用溯源。合规团队的角色从"回答者"变为"审核者"——定期审核 AI 回答并更新知识库。

**效果**（4 个月数据）：
- 内部合规查询响应时间从平均 4 小时 → <2 分钟（AI 即时响应）
- 合规团队日均手动回答问题从 50+ → <5（仅处理 AI 无法回答的高难度问题）
- AI 回答合规率 99.7%（15,000+ 个回答中仅 45 个需要人工纠正）
- 系统通过等保三级认证，数据完全留存客户本地
- CTO："以前合规团队 60% 的时间在重复回答——现在他们可以做真正的合规审核和制度设计了。"

## 案例 4：跨境电商 — 多语言客服覆盖

**背景**：某跨境电商企业，客户遍布全球 20+ 国家。客服团队需要用中英日韩 4 种语言回复。招聘多语言客服成本极高、培训周期长。

**方案**：部署启云科技专业版。上传多语言产品文档和 FAQ 到知识库。AI 自动检测客户语言并以相同语言回复。人工客服只需要审核 AI 草稿（非语言专家也能做——系统翻译按钮支持中英互译预览）。

**效果**（3 个月数据）：
- 4 语客服人员从 12 人 → 4 人（AI 生成多语言回复初稿，人工只审核）
- 客户满意度 NPS 从 35 → 55（语言不再是障碍）
- 新市场拓展周期从 3 个月（建多语言团队）→ 1 周（上传翻译文档到知识库）
`;

// ── Competitor Battlecards ──────────────────────────────────────────

const competitorBattlecards = `# 启云科技 QiCloud — 竞品战卡

> 更新日期：2026-07-07 | 文档层级：销售参考层 > 竞品分析
> 关联文档：pricing-v3.md, product-overview.md, technical-specs.md, case-studies.md
> 使用说明：本文档为内部销售参考。禁止外发给客户。

## 1. vs 网易七鱼

**定位差异**：网易七鱼是传统基于意图识别+话术库的客服机器人。启云科技基于大语言模型+RAG。

| 维度 | 网易七鱼 | 启云科技 |
|------|---------|---------|
| AI 技术 | 意图识别 + 预设话术 | 大语言模型 + RAG 检索 |
| 配置方式 | 手动配置 FAQ → 对话流 | 上传文档自动学习（1 小时内生效） |
| 开放域问题 | 不能处理（只能匹配预设） | 能处理（基于知识库推理） |
| 销售模块 | 无 | AI 销售助手（评分+跟进+话术） |
| 私有化部署 | 企业版支持 | 企业版支持 |
| 中文场景 | ✅ 强 | ✅ 强（DeepSeek 驱动） |
| 价格 | 标准版 ¥12,000+/月 | 标准版 ¥9,800/月 |

**销售话术**："网易七鱼的 AI 是传统的关键词匹配——你告诉它'客户说 A 回复 B'，它就这么做。但客户不会只按照你预设的话来问。我们的 RAG 检索是基于语义理解的——客户不管怎么说，系统都能从你的知识库里找到正确答案。而且我们多了 AI 销售助手模块——不只是客服，覆盖从线索到成交的全流程。"

## 2. vs Intercom Fin（国际竞品）

| 维度 | Intercom Fin (GPT-4) | 启云科技 |
|------|---------------------|---------|
| 底层模型 | GPT-4 | DeepSeek-V3 |
| 中文能力 | 一般 | 强（中文原生） |
| 私有化部署 | ❌ 不支持 | ✅ 企业版支持 |
| 数据主权 | 数据经 OpenAI | 数据可选择本地化 |
| 价格 | $100-500/坐席/月 | 约 ¥2,000-2,500/坐席/月（标准版/专业版） |
| 中国合规 | ❌（无境内服务器） | ✅（支持阿里/腾讯云部署） |

**销售话术**："Intercom Fin 的 GPT-4 在英文场景确实很强。但如果您的客户主要是中文用户、或者您有数据出境合规要求、或者您需要私有化部署——Intercom 就没办法了。而且价格方面，我们是他们的 1/3-1/5。"

## 3. vs 腾讯企点

| 维度 | 腾讯企点 | 启云科技 |
|------|---------|---------|
| 渠道生态 | 微信/QQ/企微原生（最强） | 全渠道（无微信原生优势，但可接入） |
| AI 能力 | 关键词+预设话术 | 大语言模型+RAG |
| 销售全链路 | 以客服为主 | 客服+销售+外呼完整链路 |
| 适用场景 | 社交渠道为主的客服 | 需要深度 AI 的销售和客服 |

**销售话术**："企点的微信渠道对接是最强的，这一点我们不回避。但 AI 能力方面——企点的 AI 是关键词匹配，我们的 AI 是基于大语言模型的语义理解。两者的代际不同。如果客户的场景主要是微信客服，企点有原生优势。但如果有复杂的产品知识需要 AI 理解、或者有销售跟进场景——我们的 RAG + Agent 能力是企点不具备的。两者可以互补——企点做前端渠道，启云做后端 AI 引擎。"

## 4. vs 客户自研

客户有时会说"我们自己招两个人用 GPT API 搭一个也行"。

**销售话术**："当然可以。但算一笔账——招两个懂 AI 的工程师，年薪至少 50 万/人 = 100 万/年。加上搭建时间 3-6 个月、维护成本、GPT API 的月费。我们的标准版一年不到 12 万——已经帮你做好了 RAG 检索、多租户权限、审批流、客户门户、评测框架。您愿意花 100 万+半年时间去重复造这个轮子吗？"

## 定位总结

启云科技不是所有场景的"最佳选择"，而是：

- **如果你需要中文场景的深度 AI（RAG + Agent）** → 我们的核心优势
- **如果你需要私有化部署和数据主权** → 企业版的差异化
- **如果你需要开箱即用的销售+客服一体化** → 三合一模块降低采购复杂度
- **如果主要是微信/企微渠道的客服（不需要深度 AI）** → 腾讯企点更合适
- **如果主要是英文场景且预算充裕** → Intercom/Zendesk 更成熟
`;

// ── Sales Playbook ─────────────────────────────────────────────────

const salesPlaybook = `# 启云科技 QiCloud — 销售实战手册

> 更新日期：2026-07-07 | 文档层级：销售参考层 > 销售流程
> 关联文档：objection-handbook.md, competitor-battlecards.md, pricing-v3.md, case-studies.md

## 标准销售流程（7 阶段 Pipeline）

### 1. 新线索 (new)
- 来源：官网注册 / 活动扫码 / 渠道推荐 / 主动触达
- 动作：24 小时内首次联系，自我介绍 + 了解客户基本情况
- AI 辅助：自动生成首次联系消息

### 2. 已联系 (contacted)
- 信号：客户已回复或已接受首次沟通
- 动作：了解需求深度——团队规模、主要痛点、预算范围、决策流程
- AI 辅助：自动提取关键信息并更新客户画像

### 3. 已确认 (qualified)
- 通过 BANT 评估：Budget（有预算）、Authority（有决策权）、Need（有需求）、Timeline（有明确时间表）
- 动作：安排产品演示 + 发送定价方案
- AI 辅助：AI 评分 ≥ 70 分标记为 Hot Lead

### 4. 方案中 (proposal)
- 动作：发送定制化方案，针对客户行业准备 ROI 分析
- AI 辅助：AI 检索相关客户案例
- 参考文档：case-studies.md，选择与客户行业最接近的 1-2 个案例

### 5. 洽谈中 (negotiation)
- 常见异议及应对：见 objection-handbook.md
- 竞品战卡：见 competitor-battlecards.md

### 6. 已成交 (closed_won)
- 交付：标准版当天开通，企业版启动部署
- 动作：拉客户成功经理做 Onboarding
- 参考文档：onboarding-guide.md

### 7. 已流失 (closed_lost)
- 复盘：是什么原因导致流失？（价格/功能/竞品/时间线）
- 不删数据：6 个月后再次触达，"当时您提到的时间点到了吗"

## 客户分层与差异化策略

### Hot Lead (AI 评分 ≥ 70)
- 特征：预算明确 + 需求急迫 + 决策者
- 策略：48 小时内安排 Demo，方案中直接提供企业版选项
- ROI 话术参考：case-studies.md 里具体案例的数字

### Warm Lead (AI 评分 40-69)
- 特征：有需求但时间表或预算不明确
- 策略：每周一次跟进，重点在需求挖掘而非催促。分享行业案例（不直接推销）

### Cold Lead (AI 评分 < 40)
- 策略：每月一次有价值的信息（行业洞察、产品更新），不强推。3 个月无互动转入 Nurture 池
`;

// ── Layer 3: Operations (运营支撑) ──────────────────────────────────

const onboardingGuide = `# 启云科技 QiCloud — 新客户上线指南

> 版本：V3.0 | 更新日期：2026-07-07 | 文档层级：运营支撑层 > 上线指引
> 适用版本：标准版 / 专业版

## 上线流程（预计 3 个工作日）

### Day 1：账号与基础配置

1. 注册 → email 验证 → 创建组织（自动完成）
2. 邀请团队成员（Admin / Operator / Viewer 角色）
3. 配置企业信息（名称 / Logo / 品牌色）

### Day 2：知识库搭建

1. 收集核心文档：产品手册、定价表、FAQ、客户案例、竞品对比
2. 上传到知识库（批量或逐个，支持 PDF/Word/MD/TXT/FAQ JSON）
3. 系统自动解析 + 分块 + 向量化（1 小时内生效）
4. 验证：在 KB Playground 中搜索几个关键问题，检查 AI 回答质量
5. 补充：如果某些问题回答不好 → 补充更详细的文档 → 重新上传

**知识库最佳实践**（必读）：
- 文档按层级组织：核心层（产品/定价/技术）+ 销售参考层（FAQ/话术/案例/竞品）+ 运营支撑层（上线指南/API/合规/SOP）
- 每个文档标注版本号和更新日期
- 不要把所有信息塞进一个巨型文档——拆成多个文档更利于 RAG 精准检索
- 每条 FAQ 用明确的 Q&A 格式（"Q: ..." + "A: ..."），AI 检索得分更高
- 关键数字（价格、规格、SLA）单独成表，避免被文章正文冲淡
- FAQ 和定价表之间要做交叉引用——客户问"多少钱"时 FAQ 能指向定价表

### Day 3：渠道配置与上线

1. 配置邮件渠道（绑定 Resend API Key）
2. 配置聊天渠道（嵌入网站聊天 Widget）
3. 配置微信/企微渠道（如需要，专业版支持）
4. 测试：模拟客户发送消息，验证 AI 草稿质量
5. 正式上线

## 知识库持续维护

- **每周**：检查 KB Playground 的搜索命中率
- **每月**：根据新的客户问题和产品更新补充文档
- **每季**：跑一次 RAG 评测（Golden Dataset），确认检索质量没有下降
- **文档更新**：同名文件重新上传 → 系统自动检测为更新 → 删旧 chunks → 重建 → 清缓存

## 常见上线问题

**Q: 知识库上传后 AI 回答不准确怎么办？**
A: 检查三点——① 文档内容是否具体（太笼统的文档 AI 没有可引用的素材）② 文档格式是否友好（Q&A 格式 > 大段文章）③ 在 KB Playground 里逐一排查是检索没搜到还是 LLM 生成有问题。详见内部技术排查文档。

**Q: 多个人负责不同模块的文档怎么办？**
A: 每个人都上传自己负责的模块文档到同一个知识库。系统按 Chunk 组织，不同文档的 chunk 在检索时互不干扰。
`;

// ── Compliance Policy ───────────────────────────────────────────────

const compliancePolicy = `# 启云科技 QiCloud — 合规与安全政策

> 版本：V2.0 | 更新日期：2026-07-07 | 文档层级：运营支撑层 > 合规
> 关联文档：technical-specs.md, product-overview.md
> 目标读者：客户的 IT 安全团队、法务、采购决策者

## 认证与标准

| 认证 | 状态 | 覆盖范围 |
|------|------|---------|
| ISO 27001 | ✅ 已获得 | 所有版本 |
| 等保三级 | ✅ 已获得 | 所有版本 |
| SOC 2 Type II | 🔄 审核中（预计 2026 Q4） | 专业版及企业版 |

## 数据保护

### 数据传输
- 客户端到服务端：TLS 1.3（强制 HTTPS）
- 服务到数据库：TLS 1.3（证书固定）
- 服务到 LLM API (DeepSeek)：HTTPS，传输数据仅包含查询和知识库上下文，不包含完整客户 PII
- HSTS：max-age=63072000，includeSubDomains，preload

### 数据存储
- 数据库：AES-256（存储层加密）
- 密码：bcrypt 12 轮盐哈希，不可逆
- API Key：SHA-256 哈希存储，仅保留前缀用于识别
- 日志脱敏：email 和 JWT 自动 SHA-256 哈希后才写入日志

### PII 处理
- 客户联系人信息（姓名/邮箱/电话）存储于隔离的 Lead 表
- 客户对话内容存储于 Message 表，不与 PII 直接关联
- AI 调用时不传输完整 PII——仅传对话上下文（内容）和知识库片段
- 私有化部署方案：所有数据完全不出企业防火墙

## 访问控制

详见 technical-specs.md 的安全章节。核心要点：
- 5 角色 × 13 权限 RBAC，最小权限原则
- JWT 无状态认证 + Redis 黑名单即时失效
- 客户 Portal 权限严格限定（Lead.userId scoping）
- 所有操作写入不可变 AuditLog

## 隐私合规

- **个人信息保护法 (PIPL)**：数据仅用于服务交付，不外泄、不转售
- **数据删除**：客户可随时导出全部数据（JSON/CSV），并要求彻底删除（30 天内完成）
- **Cookie 政策**：仅使用 session cookie（JWT，httpOnly + Secure），无跟踪类 cookie
- **第三方数据**：除 DeepSeek API（AI 调用）和 Resend（邮件发送）外，数据不与其他第三方共享。两个第三方均签署 DPA。

## 灾备与业务连续性

- 数据库：每日自动备份（保留 14 天）
- RTO（恢复时间目标）：4 小时（标准版）/ 1 小时（专业版）/ 30 分钟（企业版）
- RPO（恢复点目标）：24 小时
- 各组件均有降级路径：单个外部服务挂掉不会造成全系统不可用
`;

// ── Internal Escalation ─────────────────────────────────────────────

const internalEscalation = `# 启云科技 QiCloud — 内部支持升级流程

> 版本：V1.0 | 更新日期：2026-07-07 | 文档层级：运营支撑层 > 内部流程
> 目标读者：启云科技内部技术支持团队

## 问题分级

| 级别 | 定义 | 响应时间 | 升级条件 |
|------|------|---------|---------|
| L1 | 使用咨询（怎么配置/功能在哪） | 4 小时内 | N/A |
| L2 | 功能异常（某功能不工作但不影响核心业务流程） | 2 小时内 | 1 小时未解决 |
| L3 | 核心业务中断（客户无法使用主要功能） | 30 分钟内 | 立即通知技术负责人 |
| L4 | 安全事件（数据泄露/未授权访问） | 15 分钟内 | 立即通知 CTO + 合规团队 |

## 常见 L2 问题排查指南

### AI 回答质量突然下降
1. 检查知识库是否有新上传的文档改变了检索排序
2. 跑一遍 pnpm eval:sales:retrieval 确认检索指标
3. 检查 DeepSeek API 是否有版本变更
4. 检查 Cohere Reranker API 是否正常

### 客户反馈"AI 答非所问"
1. 到 KB Playground 用客户的原问题复现
2. 检查是否 Confidence Gate 触发不足（top-1 score 虚高但内容不相关）
3. 补充相关文档到知识库

### 系统卡顿或超时
1. 查 AI Health Dashboard → 看 P95 延迟是否飙升
2. 查 Supabase Dashboard → 数据库 CPU 和连接数
3. 查 Vercel Dashboard → Serverless Function 超时日志
4. 查 Upstash Dashboard → Redis 调用量是否接近免费配额
5. 如果是跨区域延迟 → 确认数据库和函数是否在同区域（参考 ARCHITECTURE.md 第 9.1 节）
`;

// ── Write Files ─────────────────────────────────────────────────────

const files: Record<string, string> = {
  // Layer 1: Core
  "product-overview.md": productOverview,
  "pricing-v3.md": pricing,
  "technical-specs.md": technicalSpecs,
  // Layer 2: Sales
  "faq-v2.md": faq,
  "objection-handbook.md": objectionHandbook,
  "case-studies.md": caseStudies,
  "competitor-battlecards.md": competitorBattlecards,
  "sales-playbook.md": salesPlaybook,
  // Layer 3: Operations
  "onboarding-guide.md": onboardingGuide,
  "compliance-policy.md": compliancePolicy,
  "internal-escalation.md": internalEscalation,
};

console.log("╔══════════════════════════════════════════╗");
console.log("║   Knowledge Base Seed — SalesAgent AI   ║");
console.log("╚══════════════════════════════════════════╝\n");

let totalSize = 0;
for (const [filename, content] of Object.entries(files)) {
  const filePath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filePath, content, "utf-8");
  const size = Buffer.byteLength(content, "utf-8");
  totalSize += size;
  const layer = filename.includes("product") || filename.includes("pricing") || filename.includes("technical")
    ? "核心层" : filename.includes("faq") || filename.includes("objection") || filename.includes("case") || filename.includes("competitor") || filename.includes("playbook")
    ? "销售参考层" : "运营支撑层";
  console.log(`  [${layer}] ${filename.padEnd(30)} ${(size / 1024).toFixed(1)} KB`);
}

console.log(`\n  Total: ${Object.keys(files).length} files, ${(totalSize / 1024).toFixed(1)} KB`);
console.log("\n  Next steps:");
console.log("    1. Upload all files to KB via Dashboard or API");
console.log("    2. Run: pnpm --filter @salesagent/rag-core eval:sales:retrieval");
console.log("    3. Test cross-document queries in KB Playground");
console.log("    4. Delete old knowledge-base/ files in eval/ directory\n");
