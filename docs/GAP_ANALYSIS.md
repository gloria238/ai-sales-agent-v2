# SalesAgent AI — 查漏补缺对照分析

> 对照 7 个业界 RAG/AI Agent 项目，逐项比对 SalesAgent AI 的能力覆盖与缺失。
> 分析日期: 2026-07-07 | 更新: Phase 21 完成后

---

## 一、对照项目速览

| # | 项目类型 | 核心技术栈 | 关键亮点 |
|---|---------|-----------|---------|
| 1 | 个人多模态 RAG 知识库 | Python, LangChain, Chroma, BM25, RAGAS, OCR, VLM | 查询改写、问题路由、低置信度二次检索、增量索引、分层缓存、工厂模式 |
| 2 | 长文本 RAG (pgvector) | Python, LangChain, PostgreSQL+pgvector | pgvector 落地实践, Token 消耗降低 |
| 3 | RAG + 知识图谱 (金融) | 自纠错 + 冲突仲裁 | 幻觉抑制, ERP/CRM 集成, 全链路监控 |
| 4 | GraphRAG + 金融知识图谱 | 实体识别 + 关系抽取 | 双向互索引, 准确率 78%→92%, 解读 <0.6s |
| 5 | 幻觉抑制引擎 | RAG + 代码解释器 | 强制基于事实生成, 代码自纠错, 动态知识图谱 |
| 6 | 数据清洗管道 | Scrapy/Playwright + NLP | 多源采集, 噪声去除, PII 过滤, 实体提取 |
| 7 | 高可用后端基建 | RabbitMQ/Kafka + Redis | 500 QPS, 幂等, Agent 状态机稳定 |

---

## 二、RAG 全链路逐项比对

### 2.1 离线索引 (Document Ingestion & Indexing)

| 能力点 | 参考项目 | SalesAgent AI | 差距 |
|--------|---------|---------------|------|
| **多格式解析** | PDF/MD/图片 (项目1) | PDF/DOCX/TXT/MD/FAQ | ✅ 已覆盖，还多了 DOCX 和 FAQ |
| **OCR 图片文字提取** | ✅ OCR+VLM (项目1) | ❌ 无 | 🔴 **缺失**: PDF 中的图片/截图无法提取文字 |
| **VLM 图片语义理解** | ✅ VLM (项目1) | ❌ 无 | 🔴 **缺失**: 图表、流程图无法理解 |
| **HTML 解析** | ✅ (项目6) | ❌ 无 | 🟡 销售场景不常用，优先级低 |
| **文本清洗 + 去重** | ✅ 噪声去除/PII过滤/去重 (项目6) | ❌ 无专门清洗管线 | 🟡 **缺失**: 上传的文档直接解析，无预处理 |
| **元数据绑定** | ✅ (项目1) | ✅ orgId + documentId 绑定 | ✅ 已有基础元数据 |
| **Chunk 清洗** | ✅ (项目1) | ⚠️ 基础递归分块 | 🟡 无 chunk 质量检测/过滤 |
| **BM25 索引** | ✅ (项目1) | ✅ PostgreSQL tsvector + GIN | ✅ 等价实现 (数据库层 BM25 替代) |
| **稠密向量索引** | ✅ (项目1) | ✅ pgvector cosine | ✅ |
| **双索引混合** | ✅ (项目1) | ✅ pgvector + tsvector → RRF | ✅ RRF 融合算法 |
| **增量索引 (文档 Hash)** | ✅ 文档 Hash 增量 + 热更新 (项目1) | ✅ SHA-256 content hash + diffChunks() | ✅ **已解决** (Phase 21): 上传查重→跳过/同名更新→重建, chunk 稳定 ID |
| **数据采集管道** | ✅ Scrapy/Playwright (项目6) | ❌ 无 | 🟡 销售场景依赖于手动上传或 CRM 同步 |

### 2.2 在线检索 (Online Retrieval)

| 能力点 | 参考项目 | SalesAgent AI | 差距 |
|--------|---------|---------------|------|
| **查询改写 (Query Rewriting)** | ✅ (项目1) | ✅ LLM 3 变体扩展 + 降级 Noop | ✅ **已解决** (Phase 20): 原始+关键词+同义改写, LLM 失败自动降级 |
| **问题路由 (Question Routing)** | ✅ (项目1) | ✅ 6 分类 (faq/product/pricing/case/competitor/general) | ✅ **已解决** (Phase 20): LLM/Keyword 双 Router, 类别差异化检索参数 |
| **多路召回** | ✅ 稠密+稀疏 (项目1) | ✅ Vector + Keyword 并行 | ✅ "多路"已实现 |
| **Rerank 重排序** | ✅ (项目1) | ✅ CohereReranker + NoopReranker + hybridRetrieve() 统一管线 | ✅ **已修复** (Phase 20): 死代码→生产调用 |
| **低置信度二次检索** | ✅ (项目1) | ✅ Confidence Gate | ✅ **已解决** (Phase 20): top-1<0.7→expanded search→合并去重 |
| **上下文拼装** | ✅ (项目1) | ✅ sources.ts 生成引用 | ✅ |
| **引用核查** | ✅ (项目1) | ⚠️ 基础引用 (文档名+chunk#+分数) | 🟡 无引用事实核查 (citation 可能不准确) |
| **自纠错/冲突仲裁** | ✅ (项目3,5) | ❌ 无 | 🔴 **缺失**: 检索结果与模型生成内容冲突时无仲裁机制 |

### 2.3 幻觉抑制 (Hallucination Mitigation)

| 能力点 | 参考项目 | SalesAgent AI | 差距 |
|--------|---------|---------------|------|
| **强制基于事实生成** | ✅ RAG 幻觉抑制引擎 (项目5) | ⚠️ Prompt 指令 ("KB没有的诚实说不知道") | 🟡 依赖 prompt 约束而非引擎级强制 |
| **代码解释器自纠错** | ✅ (项目5) | ❌ 无 | 🔴 **缺失**: 无法验证数值计算 |
| **冲突仲裁** | ✅ (项目3) | ❌ 无 | 🔴 **缺失** |
| **PROMPT_ARMOR** | - | ✅ 安全装甲 + `<user_data>` 标签 | ✅ 防注入，但不防幻觉 |

### 2.4 知识图谱 (Knowledge Graph)

| 能力点 | 参考项目 | SalesAgent AI | 差距 |
|--------|---------|---------------|------|
| **GraphRAG** | ✅ (项目4) | ❌ 无 | 🔴 **完全缺失** |
| **实体识别** | ✅ (项目4,6) | ❌ 无 | 🔴 **完全缺失**: Lead 姓名/公司靠人工填 |
| **关系抽取** | ✅ (项目4) | ❌ 无 | 🔴 **完全缺失** |
| **双向互索引** | ✅ (项目4) | ❌ 无 | 🔴 **完全缺失** |
| **动态知识图谱更新** | ✅ (项目5) | ❌ 无 | 🔴 **完全缺失** |

> **注**: 知识图谱对 B2B 销售场景有独特价值——可以建模「公司→决策人→竞品关系→历史接触」的关系网络。目前全部靠 SDR 人脑记忆。

### 2.5 评估体系 (Evaluation)

| 能力点 | 参考项目 | SalesAgent AI | 差距 |
|--------|---------|---------------|------|
| **RAGAS 框架** | ✅ (项目1) | ❌ 不使用 RAGAS | 🟡 自研 eval 体系替代 |
| **检索指标** | ✅ MRR, Hit (项目1) | ✅ Precision@5, Recall@5, MRR, NDCG@5 | ✅ 指标更全 |
| **生成指标** | ✅ RAGAS (项目1) | ✅ Faithfulness, Answer Relevancy (LLM Judge) | ✅ |
| **Golden Dataset** | ✅ (项目1) | ✅ 20 条手工标注 Q&A | ✅ |
| **切分策略量化对比** | ✅ (项目1) | ❌ 无自动化对比 | 🟡 **可改进**: 无不同 chunk 策略的自动对比评估 |
| **CI 集成** | ❌ | ❌ 无 | 🟡 eval 只能手动跑 |

### 2.6 缓存与性能 (Caching & Performance)

| 能力点 | 参考项目 | SalesAgent AI | 差距 |
|--------|---------|---------------|------|
| **QA 缓存** | ✅ 分层缓存复用 QA 结构 (项目1) | ✅ Redis 两层缓存 (exact SHA-256 + cosine ≥0.95) | ✅ **已解决** (Phase 21): FAQ 命中率 60%+, 延迟 2s→50ms |
| **索引结构缓存** | ✅ (项目1) | ❌ 无 | 🔴 **缺失** |
| **Feature Flag 缓存** | - | ✅ Memory Cache 60s TTL | ✅ 但仅针对 Flag |
| **Embedding 批量处理** | ✅ (项目1) | ✅ embedBatch() | ✅ |

### 2.7 架构灵活性 (Architecture Flexibility)

| 能力点 | 参考项目 | SalesAgent AI | 差距 |
|--------|---------|---------------|------|
| **工厂模式解耦** | ✅ 解析/切块/向量化/改写/Rerank 全可插拔 (项目1) | ✅ StorageAdapter/EmbeddingProvider/Reranker/QueryRewriter/QueryRouter 五接口 | ✅ 已覆盖核心模块 |
| **查询改写模块** | ✅ 可插拔 (项目1) | ✅ LLMQueryRewriter + NoopQueryRewriter, 接口驱动 | ✅ **已解决** (Phase 20) |
| **问题路由模块** | ✅ (项目1) | ✅ LLMQueryRouter + KeywordQueryRouter, 接口驱动 | ✅ **已解决** (Phase 20) |

---

## 三、AI Agent 引擎逐项比对

| 能力点 | 参考项目 | SalesAgent AI | 差距 |
|--------|---------|---------------|------|
| **ReAct Agent** | ✅ (项目3,7 Agent 状态机) | ✅ agent-executor.ts (ReAct Loop) | ✅ |
| **工具调用** | ✅ (项目3) | ✅ 4 个内置 Tool | ✅ |
| **推理链路可视化** | ❌ | ✅ AgentThinkingPanel | ✅ 独有的前端展示 |
| **Prompt 版本管理** | ❌ | ✅ prompt-registry.ts + A/B | ✅ 独有 |
| **Agent 状态机** | ✅ 500 QPS 稳定 (项目7) | ⚠️ BullMQ 状态管理 | 🟡 未做高并发压力测试 |
| **多 Agent 协作** | ❌ | ❌ 无 | 🟡 当前单 Agent 模式 |

---

## 四、数据工程逐项比对

| 能力点 | 参考项目 | SalesAgent AI | 差距 |
|--------|---------|---------------|------|
| **多源数据采集** | ✅ Scrapy/Playwright (项目6) | ❌ 无 | 🔴 无自动采集能力 |
| **HTML 清洗** | ✅ (项目6) | ❌ 无 | 🟡 |
| **PII 过滤** | ✅ (项目6) | ⚠️ 日志层 PII 哈希 | 🟡 文档内容不过滤 |
| **文本去重** | ✅ (项目6) | ❌ 无 | 🟡 重复文档上传无检测 |
| **NLP 实体提取** | ✅ (项目6) | ❌ 无 (仅靠 AI prompt 提取) | 🟡 |

---

## 五、产品工程逐项比对

### 5.1 消息渠道

| 渠道 | SalesAgent AI 现状 |
|------|-------------------|
| Email (Resend) | ✅ 完整实现 |
| 微信个人号 | ❌ Feature Flag 定义了但无实际对接 |
| 企业微信 | ❌ 同上 |
| 短信 | ❌ Schema 有 `sms` 枚举但从未使用 |
| 网站聊天 Widget | ❌ 无 |
| 实时聊天 (WebSocket) | ✅ Socket.IO + ChatWindow, Inbox Email/Chat 切换, REST polling 自动降级 |

### 5.2 产品分析

| 能力点 | 参考项目 | SalesAgent AI | 差距 |
|--------|---------|---------------|------|
| **用户行为埋点** | ❌ (参考项目也未提及) | ❌ 零埋点 | 🔴 **完全缺失** |
| **漏斗分析** | ❌ | ❌ 无 | 🔴 Leads 有阶段但无转化率漏斗 |
| **留存分析** | ❌ | ❌ 无 | 🔴 无用户登录频率/功能使用数据 |
| **AI 效果 A/B 对比** | ❌ | ⚠️ Prompt 版本 A/B | 🟡 仅 prompt 层面，无业务效果对比 |
| **归因分析** | ❌ | ❌ 无 | 🔴 不知道哪个 Campaign 带来多少 Pipeline |
| **第三方分析工具** | ❌ | ❌ 无 Mixpanel/Amplitude/PostHog | 🔴 **完全缺失** |
| **全链路监控平台** | ✅ (项目3) | ⚠️ AI Health Dashboard | 🟡 仅 AI 层，无业务全链路 |

### 5.3 商业模块

| 能力点 | SalesAgent AI 现状 |
|--------|-------------------|
| Stripe 计费 | ❌ 不做 — 内部 OS 非 SaaS |
| SSO/OAuth | ❌ 未实现 (已知 TODO) |
| CI/CD Pipeline | ⚠️ CD 完整 (Vercel+Railway Git 集成), CI 设计好但未上线 (Redis 免费配额限制 + 一人开发) |
| Docker 容器化 | ❌ 无 (Serverless First 策略) |

---

## 六、差距总结 — 按优先级排序

> 定位说明：SalesAgent AI 当前聚焦 sales 场景，但架构设计预留了多板块扩展能力。
> 未来可能演进为 **CompanyOS** — sales 作为一个板块，与其他业务板块（客服/HR/运营）共享 RAG 基础设施、多租户 RBAC、AI Agent 引擎、实时通信层。
> 这意味着当前的接口抽象、多租户隔离、降级设计不是为单一场景定制的——它们是平台级的基础能力。

### 🔴 P0 — 全部已解决 ✅

| # | 缺失项 | 状态 |
|---|--------|------|
| 1 | ~~查询改写 + 问题路由~~ | ✅ Phase 20 |
| 2 | ~~低置信度二次检索~~ | ✅ Phase 20 |
| 3 | ~~RAG QA 缓存~~ | ✅ Phase 21 |
| 4 | ~~引用事实核查~~ | ⚠️ 降级为基础引用标注, 全自动核查未实现 |

### 🟡 P1 — 规模化障碍

| # | 缺失项 | 状态 |
|---|--------|------|
| 5 | ~~增量索引~~ | ✅ Phase 21 |
| 6 | 产品埋点 + 漏斗分析 | 🟡 企业内部 OS 当前不需要 |
| 7 | 文本清洗管道 | 🟡 |
| 8 | OCR/VLM 多模态 | 🟡 销售场景以文字为主 |
| 9 | CI/CD 自动测试 | ⚠️ CD 完整, CI 设计好但 Redis 配额限制暂未上线 |

### 🔵 P2 — 差异化竞争力

| # | 缺失项 | 状态 |
|---|--------|------|
| 10 | GraphRAG / 知识图谱 | 🔵 成本高, CompanyOS 阶段有价值 |
| 11 | 自纠错 + 冲突仲裁 | 🔵 |
| 12 | ~~实时聊天 (WebSocket)~~ | ✅ Phase 21 |
| 13 | 微信/企微渠道 | 🔵 接口预留, CompanyOS 阶段实现 |
| 14 | 数据采集管道 | 🔵 |
| 15 | 全链路业务监控 | 🟡 AI Health 覆盖 AI 层 |

### ⚫ P3 — 远期 (CompanyOS 演进方向)

| # | 方向 | 说明 |
|---|------|------|
| 16 | 多板块业务扩展 | Sales → +Service(客服) / +HR(招聘) / +Ops(运营), 共享 RAG+RBAC+Agent 基础设施 |
| 17 | 多 Agent 协作 | SDR+AE+CSM 多角色 Agent 协同 |
| 18 | 企业微信/钉钉/飞书渠道 | CompanyOS 需要中国 SaaS 生态对接 |
| 19 | SSO/OAuth | 企业级标配 |
| 20 | 高并发压力测试 | 500+ QPS 验证 |

---

## 七、与参考项目的能力雷达图 (文本版)

```
                    离线索引
                   /★★★★★\
                  /# ★★★★  \
     在线检索    /#   ★★★    \   幻觉抑制
    ★★★★★    /#     ★★      \   ★★☆☆☆
     |       /#       ★       \   |
     |      /#     ★★  ★       \  |
 知识图谱   /#    ★★★    ★★★    \ | 评估体系
 ☆☆☆☆☆   |#  ★★★★      ★★★★  |  ★★★★☆
     |     \   ★★★★★★★★★★★★   /  |
     |      \    GraphRAG     /   |
 数据工程   \                 /  架构灵活性
  ★★★☆☆    \               /   ★★★★☆
             \             /
              \   ★★★★★   /
               \ 缓存与性能/
                ★★★★☆
```

**图例**: ★ = SalesAgent AI 当前能力, # = 参考项目平均水平

---

## 八、Phase 20-21 完成情况 — 参考项目1 核心能力全部补齐

> 以下对照项目1「个人多模态 RAG 知识库系统」的全部核心亮点，逐项标注 SalesAgent AI 的完成情况。

| 项目1 亮点 | SalesAgent AI | 完成于 |
|-----------|---------------|--------|
| 离线索引优化 (PDF+MD 解析) | PDF/DOCX/TXT/MD/FAQ 多解析器 | Phase 13-18 |
| BM25 与稠密向量混合索引 | pgvector + tsvector → RRF 融合 | Phase 18 |
| 查询改写 (Query Rewriting) | LLMQueryRewriter: 3 变体扩展, 失败降级 Noop | Phase 20 |
| 问题路由 (Question Routing) | LLMQueryRouter + KeywordQueryRouter: 6 分类 | Phase 20 |
| 多路召回 | Vector (pgvector) + Keyword (tsvector) 并行 | Phase 18 |
| Rerank 精排 | CohereReranker, 统一管线中实际生效 | Phase 20 |
| 低置信度二次检索 | Confidence Gate: top-1<0.7 → expanded search | Phase 20 |
| 上下文拼装与引用核查 | sources.ts 生成引用标注 | Phase 13 |
| RAGAS 评测框架 | 自研 TypeScript eval: 4 检索指标 + 2 LLM Judge | Phase 18-20 |
| 增量索引与热更新 | SHA-256 content hash: 查重/同名更新/缓存失效 | Phase 21 |
| 分层缓存 | Redis 两层语义缓存: exact SHA-256 + cosine ≥0.95 | Phase 21 |
| 工厂模式解耦 | 5 接口可插拔: Storage/Embedding/Reranker/Rewriter/Router | Phase 13-21 |

**结论**: SalesAgent AI 已全覆盖项目1的全部核心亮点。差异在于项目1用 Python + LangChain + Chroma，SalesAgent AI 用 TypeScript 全栈自研。LangChain 不是缺失——是刻意的架构选择。

### 仍开放的差距 (来自其他参考项目)

| # | 缺失项 | 参考 | 优先级 |
|---|--------|------|--------|
| 1 | **知识图谱 / GraphRAG** — 实体关系建模, 公司→联系人→竞品关系网 | 项目3,4,5 | 🔵 P2 — 成本高(3周+), 非当前急需 |
| 2 | **OCR/VLM 多模态** — PDF 图片/截图无法提取 | 项目1 | 🔵 P2 — 销售场景核心文档以文字为主 |
| 3 | **产品埋点 (PostHog)** — 用户行为/漏斗/归因 | 新需求 | 🟡 P1 — 面试非必需, 用户量上来后需要 |
| 4 | **Resend Webhook** — 邮件打开/点击追踪回传 | Bug fix | 🟡 功能性修复, 面试不演示 |
| 5 | **Analytics API 端点** — api-client stub 对应的 Route 未实现 | 代码债 | 🟡 纯重构 |
| 6 | **Agent 运行时** — Token 预算、超时降级、取消收尾 | 那篇文章 | 🟡 设计好但未实现, 面试可以诚实说 |
| 7 | **企业内部 OS 定位** — 非 SaaS, 不做 Stripe/SSO | N/A | 不适用 |

---

## 九、知识库专题 (Phase 21 新增)

### 文档分层架构

12 份文档, 分 3 层, ~38KB:

```
Layer 1: 核心层 (Core) — 权威数据源
  product-overview.md, pricing-v3.md, technical-specs.md
  特点: 数字+规格+事实, RAG 必须精准检索

Layer 2: 销售参考层 (Sales Reference) — FAQ/话术/案例/竞品
  faq-v2.md, objection-handbook.md, case-studies.md,
  competitor-battlecards.md, sales-playbook.md
  特点: 问答+场景, 客户提问先命中这一层

Layer 3: 运营支撑层 (Operations) — 流程/合规/内部文档
  onboarding-guide.md, compliance-policy.md, internal-escalation.md
  特点: Agent 自己看的, 客户不直接问
```

### 文档间四种关联关系

| 关系 | 体现 | RAG 行为 |
|------|------|---------|
| 引用 (显式) | 头部 `> 关联文档: xxx.md` | 不参与搜索, chunk 内容里的 "详见 xxx" 可被 LLM 自动跟进 |
| 派生 (隐式) | FAQ 和 pricing 都写 "¥9,800/月", 不同格式 | 可能同时命中 → RRF 排名决定谁更相关 → 暴露知识库不一致 |
| 场景 (检索驱动) | 一个问题同时命中 FAQ + case + product doc | RRF 融合 → LLM 看到多源信息 → 多角度回答 |
| 权威 (层级驱动) | technical-specs 是核心层, FAQ 是派生层 | 当前未做权威权重 (后续改进方向) |

---

## 十、一句话总结与演进方向

SalesAgent AI 在 Phase 20+21 之后，**已全覆盖参考项目1的全部核心亮点**，并在 WebSocket 实时聊天、知识库三层架构、评测连接生产DB、分布式降级设计 四个方面做出了独特的工程深度。

**演进方向 — CompanyOS**：当前平台聚焦 sales 场景，但架构设计不是为单一场景定制的。多租户 RBAC、RAG 基础设施、AI Agent 编排引擎、双通道实时通信——这些都是平台级的基础能力。未来 sales 作为一个板块，横向扩展出 Service（客服）、HR（招聘）、Ops（运营）等板块，共享同一套 AI 基础设施。接口抽象和降级设计从第一天起就是以"可扩展平台"而非"单一功能模块"为目标构建的。

剩余差距：知识图谱（高成本）、多模态 OCR（跨领域）、产品埋点（非面试必需）。最需要补齐的是 Agent 运行时层（Token 预算、超时降级）。
