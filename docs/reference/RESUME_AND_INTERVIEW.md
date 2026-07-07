# SalesAgent AI — Resume & Interview Prep

---

## 零、简历作品集 — 直接可贴的项目描述

### 项目 1：AI SalesAgent OS — 企业销售 AI 运营平台

> TypeScript, Next.js 14, PostgreSQL+pgvector, DeepSeek, Socket.IO, BullMQ, Cohere Rerank | 2025.05 — 2026.07
> ~32,000 行 | 3 Application + 7 Shared Package | 独立开发

**一句话**：一个把 RAG 检索管线、WebSocket 实时聊天、ReAct Agent 引擎、多租户权限做了完整工程化落地的企业销售 AI 平台。不是 demo——有评测框架、有降级策略、有性能优化、有跨四云服务的分布式部署。

**技术亮点**：
- **自研 RAG 检索管线**（非 LangChain）：查询改写（LLM 多变量扩展）→ 问题路由（6 分类差异化检索）→ 混合检索（pgvector + tsvector → RRF k=60 融合）→ Cohere Reranker 重排序 → 置信度门控（低分二次检索）。每阶段接口驱动、可插拔
- **RAG 可量化评估**：自建 30 条 Golden Dataset + 4 检索指标 + LLM-as-Judge 生成评测，直接连接生产 PgVector 数据库做真实检索评测，每次调参有量化反馈
- **双通道实时沟通**：Email（Resend + HITL 审批流）+ WebSocket 实时聊天（Socket.IO，Inbox 一键切换，REST polling 自动降级），Chat 模式内置 AI 草稿
- **性能工程**：Redis 两层语义缓存（exact + cosine ≥0.95，FAQ 命中 60%+）、SHA-256 增量索引（上传查重/同名更新/缓存自动失效）
- **分布式系统实战**：跨 Vercel + Railway + Supabase + Upstash 四云服务部署。踩过跨地域延迟 500ms→5ms 的坑。Serverless + 容器混合架构中的双协议 Redis 设计

**踩坑与应对**（面试官最看这段）：
① 部署后 Dashboard 8 秒加载——代码/索引/Plan 全排查无果，最终在 Vercel 和 Supabase Dashboard 发现函数在美国、数据库在日本。② RAG 质量靠感觉调了十几个版本——自建 eval 框架后每次调参可量化。③ Redis 免费 tier 限制 CI 不能上线——设计好分层 pipeline 等团队扩张即开。

---

### 项目 2：[你的多 Agent 项目名称]

> [技术栈] | [时间]

**一句话**：[一句话说清楚这个项目做什么、解决什么场景]

**技术亮点**：（4-5 bullets，参照上面项目 1 的格式）

---

### 两个项目的关系 — 面试叙述策略

这两个项目不是随机组合——它们正好覆盖了 **AI Native 全栈的两个核心维度**：

| 维度 | SalesAgent AI | 多 Agent 项目 |
|------|-------------|-------------|
| 侧重 | **AI 基础设施 + 工程化深度** | **Agent 编排 + 多智能体协作** |
| 展示什么 | RAG 管线从检索到评测的完整闭环、分布式部署、性能优化 | Agent 间通信、任务分解、工具调用、状态管理 |
| 面试官看到的是 | "这个人能把 AI 系统工程化落地" | "这个人理解 Agent 架构的复杂性" |
| Claude Code 做不了的 | 物理拓扑感知、架构 trade-off、评测设计 | 多 Agent 协调策略、边界判断、异常恢复 |

如果面试官问"你做了什么 AI 项目"，你的叙述线是：
1. "我做了两个互补的项目。第一个侧重 AI 基础设施的工程化深度——自研 RAG 管线、评测框架、分布式部署。第二个侧重 Agent 编排——多智能体协作、任务分解与调度。两者合在一起基本覆盖了 AI Native 全栈的核心能力。"

---

## 〇、AI Native 全栈 — 面试定位与策略

### "AI Native 全栈"到底是什么意思

2026 年的招聘市场里，"AI 全栈"这个词已经被用烂了。但真正理解它的人很少。它不是你简历上写了 LangChain/RAG/Agent 就等于 AI Native。核心区别是：

| 传统全栈 | AI Native 全栈 |
|---------|---------------|
| 系统产出是**确定的**（同一个请求总是同一个响应） | 系统产出是**概率分布**（同一个 query 的检索结果可能不同） |
| 测试用 assert | 测试用 eval（Golden Dataset + 指标） |
| 性能瓶颈是 DB query 或网络 IO | 性能瓶颈是 LLM 延迟和 token 消耗 |
| 外部依赖挂了 → 系统挂（或 503） | 外部依赖挂了 → 降级路径（embedding 挂了走关键词，reranker 挂了走 noop） |
| 部署复杂度在容器化和负载均衡 | 部署复杂度在跨区域延迟、Serverless vs 长连接的混合架构、第三方 API 配额管理 |
| "代码质量" = lint + unit test | "代码质量" = lint + unit test + **eval regression gate** |

面试官面 AI Native 岗位时，问的不是"你会不会调 DeepSeek API"。他问的是"你把不确定的东西怎么管住"——这是传统全栈工程师不会碰到的问题。

### 你的定位

以你现在的项目积累，你的面试定位应该是：

> **"独立把 AI 系统从 0 到 1 工程化落地的全栈开发者——不是 demo 级，是有评测、有降级、有性能优化、有分布式部署实战经验的生产级思维。"**

这不是夸大。你确实做了大多数 AI demo 项目没做的事：
- eval 框架连接生产 DB（不是 mock 数据）
- 降级路径（embedding→keyword，Cohere→Noop，Redis→内存）
- 分布式部署的坑（跨地域延迟，双协议 Redis）
- HITL 安全决策（AI 绝不自动发邮件）
- 运行时意识（知道 Agent 缺什么：token 预算、超时降级、取消收尾）

### 面试叙述的核心框架：不是"我用了什么"，而是"我做了什么决策"

大多数候选人讲项目是功能清单式的："我做了 RAG，用了 pgvector，加了 Reranker"。

你应该讲的是决策链：
- "我选择 pgvector 而不是 Pinecone 是因为……"
- "我的 eval 框架不用 RAGAS 是因为我是 TypeScript 全栈，但我吸收了 LLM-as-Judge 思想，而且我比 RAGAS 多做了一件事——连接生产数据库"
- "我的 Chat 模式不做全自动回复，是因为销售场景的容错成本太高——错一句话可能丢一个客户。但我已经设计好了简单/复杂分流架构"
- "我的 CI 没上线不是忘了——是 Redis 免费配额限制 + 一人开发 ROI 不高。但设计已经完成了"
- "Claude Code 帮我写了大部分代码，但是架构决策、物理拓扑感知、trade-off 判断是我做的——它不知道我的数据库在哪个大陆"

**这种叙述方式本身就是 AI Native 的证明**——你不是在背技术名词，你在展示你理解每个决策背后的约束和取舍。

### 面试中最容易被问到的五个"区分度问题"

这些问题是你现有项目积累能回答、但大多数候选人接不住的：

1. **"你怎么验证 AI 输出的质量？"** → Golden Dataset + eval 框架 + 连接生产 DB。这比"我看了看感觉还行"强 100 倍。

2. **"外部 API 挂了你的系统怎么办？"** → 三层降级：embedding→keyword，Cohere→Noop，Redis→内存。这是你系统设计的核心哲学。

3. **"你写过的最难的系统问题是什么？"** → 跨地域延迟——代码没问题，问题在基础设施层。展示了从代码到物理拓扑的排查能力。

4. **"你怎么用 AI 帮助你开发？它的盲区是什么？"** → Claude Code 写了大部分代码，但它看不到物理世界（数据库在哪个大陆）、不能替你判断 trade-off（免费 Redis 做不做 CI）、不能确保系统一致性（改了一个接口要同步三个地方）。

5. **"你觉得自己现在最大的短板是什么？"** → 诚实说：Agent 运行时层——token 预算、超时降级、取消收尾。然后说你打算怎么做。这展示了你不仅知道自己的系统哪里弱，而且有一个改进计划。

### 你不需要假装的东西

- 不需要假装有几十万用户。你的项目是内部 OS 而非 SaaS 产品，这是诚实的定位
- 不需要假装 CI/CD 全配好了。有设计、有 trade-off 认知，比硬塞一个跑不通的 workflow 强
- 不需要假装 Agent 运行时完美。诚实说弱在哪、打算怎么做，比假装完美更有说服力
- 不需要假装你懂 Kubernetes 或者 Kafka。你没用就没用——解释为什么你的场景不需要

### 建议的面试前准备清单

1. **把 `RESUME_AND_INTERVIEW.md` 里的 24 个 QA + 8 个逐题答案 + 18 题面经拆解 + CI/CD 四个问题，自己从头到尾讲一遍。** 不是读，是讲。录音听自己哪里卡壳。

2. **确保系统能跑起来演示。** 至少能：打开 Dashboard → 上传一个 PDF → 在 Portal 发一条消息 → Inbox 收到 → 点 AI 草稿 → 看到 RAG 生成的带引用回复。这条链路能跑通，比 100 页文档有说服力。

3. **准备你的多 Agent 项目描述。** 参照上面项目 1 的格式写。两个项目合在一起才有完整叙事。

4. **把 Claude Code 的使用如实讲。** 2026 年面试官都知道你在用 AI 辅助编程。亮点不是你用了 Claude Code——是你知道它帮不了你什么。这个认知本身就是 AI Native 的证明。

---

## 一、简历项目描述（3 种长度）

### 短版 — 1 行（适合 skills summary 旁注）

> 从零构建企业级 AI 销售运营平台：自研 RAG 管线（查询改写+混合检索+Reranker+语义缓存）、WebSocket 实时聊天、ReAct Agent 引擎、多租户 RBAC、全链路可观测。TypeScript 全栈 ~32,000 行。

---

### 中版 — 5 bullets（适合项目经历）

**AI SalesAgent OS — 企业销售 AI 运营平台** | TypeScript, Next.js 14, PostgreSQL+pgvector, DeepSeek, Socket.IO, BullMQ | 2025.05 — 2026.07

- 设计并实现**完整 RAG 检索增强生成管线**：查询改写（DeepSeek 多变量扩展）→ 问题路由（FAQ/产品/定价 6 分类）→ 混合检索（pgvector 余弦 + tsvector 全文 → RRF 融合）→ Cohere Reranker 重排序 → 置信度门控（低分自动二次检索）→ 带引用生成。Redis 两层语义缓存（exact SHA-256 + cosine ≥0.95），FAQ 命中率 60%+，延迟 2s→50ms
- 建立 **30 条 Golden Dataset + 4 指标自动化评测框架**（Precision@5, Recall@5, MRR, NDCG@5），连接生产 PgVector 做真实检索评测，每次调参有量化反馈
- 搭建**双通道客户沟通系统**：Email 通道（Resend，HITL 审批流） + **WebSocket 实时聊天**（Socket.IO，Inbox 一键切换）。Chat 模式内置 AI 草稿（RAG 知识增强），Agent 端可在收件箱里实时与客户对话
- 工程性能优化：**SHA-256 内容寻址增量索引**（重复文档跳过，同名更新自动重建）、Redis 语义缓存（FAQ 命中率 60%+，2s→50ms）。ReAct Agent 引擎 + 5 角色 RBAC + 4 队列幂等异步任务 + 全链路分布式追踪
- **踩坑与应对**：① 跨地域延迟（Vercel US + Supabase JP → 跨太平洋 500ms/query，排查两天后在 Dashboard 定位，迁移同区域降至 5ms）。② RAG 质量不可量化（自建 30 条 Golden Dataset + 评测框架连接生产 DB）。③ Serverless+容器混合架构中的 Redis 双协议隔离与连接池管理

---

### 长版 — 8~10 bullets（适合简历重点位置或 Portfolio）

**AI SalesAgent OS — 企业销售 AI 内部运营平台**

> 一个承载 AI SDR / 会员礼宾 / 客户支持三场景的多租户 AI Agent 平台。AI 辅助而非替代——Human-in-the-Loop 审批 + RAG 知识增强确保回复可靠。

| 维度 | 具体内容 |
|------|---------|
| **技术栈** | TypeScript, Next.js 14 (App Router), PostgreSQL+pgvector+tsvector, DeepSeek API, Socket.IO, BullMQ+Redis, Cohere Rerank, Prisma 6, Tailwind CSS, React Native (Expo 52) |
| **规模** | ~32,000 行 | 440+ 文件 | 50+ API Routes | 16 数据模型 | 3 App + 7 共享 Package | 2 通信通道 (Email+Chat) |
| **部署** | Vercel (Web, Serverless) + Railway (Worker, 长期容器) + Supabase (PostgreSQL+pgvector) + Upstash (Redis) |

**核心技术亮点：**

1. **RAG 检索管线自研（非 LangChain/LlamaIndex）** — 完整六阶段管线：Query Rewriting（3 变体扩展）→ Query Routing（6 分类差异化检索参数）→ Hybrid Retrieval（pgvector 向量 + tsvector 关键词并行 → RRF k=60 融合）→ Cohere Reranker 重排序 → Confidence Gate（分数 <0.7 自动触发 expanded 二次检索）→ Citation Generation。每阶段可独立插拔，接口驱动。

2. **RAG 质量评估体系** — 自建 30 条 Golden Dataset（FAQ/产品/定价/竞品/案例/通用 6 类 × 3 难度），4 检索指标（Precision@5, Recall@5, MRR, NDCG@5）+ 2 生成指标（LLM-as-Judge 忠实度 + 相关性）。支持 `--real` 模式连接生产 PgVector 做真实检索评测，`--retrieval-only` 模式跳过 LLM Judge 降低评测成本。每次调 chunk 参数 / embedding 模型 / RRF k 值 → 跑一遍 eval → 看指标变化。

3. **分布式部署与性能排查** — 系统跨 Vercel (US) + Railway (US) + Supabase + Upstash 四服务部署。曾遇到跨太平洋延迟导致 Dashboard 8 秒才加载的问题——从 SQL 调优、索引优化到升级 Plan 逐层排查了两天，最终通过 `nslookup` 发现数据库在日本、函数在美国，迁移同区域后延迟从 500ms 降至 5ms。教训：**分布式系统先确认物理拓扑再优化代码**。后续设计了双协议 Redis（REST for Serverless + TCP for Worker）、`connection_limit=1` 防连接池爆炸、BullMQ 4 队列分离与幂等去重。

4. **ReAct Agent 引擎** — 自研 Agent 循环（Thought→Action→Input→Observation, max 6 steps），4 内置 Tool（search_knowledge_base / get_lead_history / get_lead_info / send_followup_message）。Agent 推理链路通过 AgentThinkingPanel 前端组件可视化（可折叠步骤展示）。

5. **Human-in-the-Loop + 多租户安全** — AI 撰写邮件但**绝不自动发送**（状态机: active → AI draft → awaiting_approval → approved → sent）。5 角色 × 13 权限矩阵，JWT + Redis 黑名单 + 滑动窗口限流（100/min）+ org-scoped 全链路数据隔离。Customer 角色通过 Lead.userId 而非 Membership 关联，客户 Portal 权限严格限定只能看自己的对话。

6. **全栈 + 工程化** — BullMQ 4 队列异步任务（幂等去重 24h Redis SET NX）、AICallMetric 全链路追踪（HTTP → Queue → LLM → DB, requestId 串联）、DB-backed Feature Flag 灰度系统、可插拔 Embedding/Reranker/Storage/QueryRewriter/QueryRouter 五层接口抽象。

7. **实时聊天 + 性能工程** — Socket.IO WebSocket 实时通信（Room-based per conversationId, JWT 鉴权），REST polling 自动降级（Vercel serverless 兼容）。Inbox 内 Email/Chat 一键切换，Chat 模式内置 AI 草稿（RAG 知识增强）。Redis QA 语义缓存（两层: exact match + cosine ≥0.95），FAQ 命中率 60%+。SHA-256 内容寻址增量索引（重复跳过、同名更新自动重建、缓存自动 invalidate）。

---

## 二、面试 QA — 按提问意图分类

### A 类：架构决策（面试官想看你会不会做 trade-off）

#### Q1: 为什么不用 LangChain / LlamaIndex？

> **答：** 我评估过，但不适合这个项目。三个原因：
> 1. **Serverless 环境** — Next.js Route Handler 在 Vercel 上最多 60 秒执行时间。LangChain 的 Chain/Agent 抽象引入了大量中间对象序列化和回调，在 Serverless 冷启动场景下有显著的性能开销。我们的 `callDeepSeekJSON` 是一个简单的 fetch wrapper，零额外开销。
> 2. **可控性** — 销售场景需要精确控制 prompt 结构（PROMPT_ARMOR 防注入、`<user_data>` 标签包裹、RAG 上下文拼装顺序）。LangChain 的 "magic" prompt 拼接让这些变得不透明。我要的是"每行 prompt 我都知道它从哪来的"。
> 3. **打包体积** — LangChain 的依赖树很重，对 monorepo 的 `@salesagent/rag-core` 这个核心包来说不划算。我的 RAG 管线核心代码不到 500 行，所有需求都覆盖到了。
>
> 但我不是反 LangChain。如果我做的是 Python 服务端 RAG（长生命周期进程、需要快速实验不同 chain 组合），我会用。工程选型是 trade-off，不是信仰。

#### Q2: 为什么用 pgvector 而不是 Pinecone / Weaviate？

> **答：** 三个约束条件：
> 1. **数据已经在 PostgreSQL 里** — leads、conversations、agents 全部在 Supabase PostgreSQL。向量也在同一个数据库意味着向量搜索 + 元数据过滤（如 "只查已发布文档"）在同一个 SQL 查询完成，不需要跨服务调用来做 JOIN。多租户的 `WHERE organization_id = $1` 天然支持。
> 2. **成本** — Pinecone 起步 $70/月，当前规模是过度工程。pgvector 零额外成本（Supabase 内置）。
> 3. **事务一致性** — 删除文档 → Document 行删除 → Prisma cascade 删 DocumentChunk → embedding 一起删除。如果用 Pinecone，删除需要在两个系统间协调，总有不一致的风险。
>
> 什么场景会换？当向量数量超过 ~1M 级别，或者需要 GPU 加速的 ANN 索引（HNSW/IVF）时。pgvector 的 IVFFlat 索引在高维大数据量下不如专用向量数据库。但目前 16 个模型、几千个 chunk，没必要。

#### Q3: RAG 管线为什么自己写，不用现成框架？

> **答：** 因为我发现现成框架有"胶水代码膨胀"问题。对比一下：
> - 我的 `kb/ask/route.ts` 从 162 行缩减到 60 行（调用 `hybridRetrieve()`）
> - 同样的功能用 LangChain 需要 VectorStore + Retriever + Chain + 一堆 callback handler，至少 200 行配置代码
>
> 而且我对这条管线的每一段都有精确的控制需求：
> - 查询改写需要控制 temperature 和 timeout
> - RRF 的 k 值需要可调（标准 60，但 FAQ 场景可以更高）
> - Reranker 需要 try/catch 降级到 Noop
> - 置信度阈值需要按 query category 不同
>
> 这些在自研代码里就是改个参数，在框架里需要翻文档找 callback 钩子。**当你对管线每一段都有精确控制需求时，自己写反而更简单。**

#### Q4: 为什么 Embedding 做成可插拔的？

> **答：** Embedding 市场变化极快。2024 年初 OpenAI text-embedding-3-small 是最优，年中 DeepSeek 性价比更高，2025 年可能又有新模型。如果代码硬编码 OpenAI，每次切换要改 N 个文件。
>
> `EmbeddingProvider` 接口只有两个方法（`embed`, `embedBatch`），切换一行代码。而且我还做了优雅降级：有 `EMBEDDING_API_KEY` → OpenAI；没有但 `DEEPSEEK_API_KEY` → 自动走 DeepSeek embedding；都没有 → PostgreSQL `~*` 正则关键词搜索。**新开发者 clone 代码后零配置就能体验完整 RAG 管线**——这个 onboarding 体验对开源/团队项目很重要。

---

### B 类：深度技术（面试官想确认你"真的做过"，不是 copy-paste）

#### Q5: PostgreSQL tsvector 是怎么和 pgvector 做混合检索的？具体 SQL 是什么？

> **答：** 两条路径并行执行，然后 RRF 融合。
>
> **向量路径：**
> ```sql
> SELECT id, "documentId", content, "chunkIndex", metadata,
>        1 - (embedding <=> $1::vector) AS similarity
> FROM sales_agent."DocumentChunk"
> WHERE "organizationId" = $2 AND embedding IS NOT NULL
> ORDER BY embedding <=> $1::vector
> LIMIT 10
> ```
> 用 `<=>` 余弦距离操作符，`1 - 距离 = 相似度`。
>
> **关键词路径（两层 fallback）：**
> ```sql
> -- 优先 tsvector GIN 索引
> SELECT ... ts_rank(search_vector, to_tsquery('english', $1)) AS similarity
> FROM sales_agent."DocumentChunk"
> WHERE ... AND search_vector @@ to_tsquery('english', $1) ...
>
> -- 降级: PostgreSQL ~* 不区分大小写正则
> SELECT ... 0.5 AS similarity
> FROM sales_agent."DocumentChunk"
> WHERE ... AND content ~* $2 ...
> ```
>
> **RRF 融合：**
> ```typescript
> reciprocalRankFusion([vectorResults, keywordResults], k=60, topK=5)
> // score = Σ 1/(60 + rank_position), 然后排序取前 5
> ```
>
> tsvector 的 GIN 索引靠 `setup-vector.mjs` 脚本统一管理，`search_vector` 列为 `Unsupported("tsvector")` 类型标记，防止 `prisma db push` 误删。

#### Q6: 混合检索的 Embedding 维度是多少？怎么存的？

> **答：** OpenAI `text-embedding-3-small` 产出的向量是 1536 维。存在 PostgreSQL 的 `vector` 类型列中，这是 pgvector 扩展提供的原生类型。
>
> 存的时候有一个技巧：Prisma 不支持 `vector` 类型（截至 Prisma 6），所以元数据用 Prisma（`documentChunk.create({ id, content, ... })`），向量用 Raw SQL（`UPDATE ... SET embedding = $1::vector WHERE id = $2`）。`::vector` 是 PostgreSQL 的显式类型转换——不加这个 pg 会报 `column is of type vector but expression is of type text`。
>
> 这种"一半 Prisma 一半 SQL"不优雅，但是务实的。接口层 (`StorageAdapter`) 把脏活封装了，未来 Prisma 支持 pgvector 后只改 Adapter 内部。

#### Q7: 你提到了 Confidence Gate（置信度门控），具体逻辑是什么？怎么决定要不要二次检索的？

> **答：** 三步判断：
>
> ```
> 首次检索 (向量+关键词 → RRF → Reranker)
>   ├─ top-1 score ≥ 0.7 → 高置信，直接返回
>   ├─ top-1 score 0.4~0.7 → 触发二次检索 (expanded topK, 放宽阈值)
>   └─ top-1 score < 0.4 → 二次检索 + 明确告知用户"未找到"
> ```
>
> 二次检索具体操作：同一 query，topK 从 5 扩到 20，minScore 从 0.3 降到 0，向量和关键词各搜一次。新结果与首次结果去重合并（`Set` by chunk ID），重新 RRF 排序。
>
> 阈值 0.7 不是拍脑袋——是我跑 Golden Dataset 时观察到的：当 RRF 分数 ≥ 0.7 时，Precision@5 通常 > 80%。低于 0.4 时基本都答不对。这个阈值可以在后续的 AB 测试中调优，但目前是基于评测数据的有据可循。

#### Q8: Chunker 为什么用递归字符分割而不是 Semantic Chunking？1000/200 怎么选出来的？

> **答：** 递归 > 语义的原因很简单：**成本**。Semantic chunking 需要对每个句子做 embedding → 计算相邻句子相似度 → 在"语义断层"处切分。一个 50 页 PDF 可能有 2000+ 个句子，就要 2000+ 次 embedding 调用——只是分块而已。递归的段落→句子→固定大小策略零 API 调用，毫秒级完成。
>
> 1000 字符 ≈ 250 tokens，200 重叠 ≈ 20% 重叠率。这个选择来自：
> 1. B2B 销售文档的知识密度——一个 FAQ answer 通常在 200-500 字符，1000 能覆盖完整答案 + 部分上下文
> 2. 200 重叠确保跨 chunk 边界的信息不丢失
> 3. 实际上这是默认值，`chunkSize` 和 `chunkOverlap` 都是可配置参数——不同文档类型可以不同。我只是没做 auto-tuning（这也是后续改进方向）。

---

### C 类：问题排查（面试官想看你 debug 的思路和系统理解深度）

#### Q9: 你在这个项目中修过最难的 bug 是什么？

> **答：** 部署之后系统非常卡——Dashboard 页面打开要 8 到 10 秒，几乎不可用。
>
> 这种问题最让人头疼的地方是：**代码逻辑全对。**本地跑没问题，API 返回正常，Prisma 查询也没有报错。所以我开始逐层排查可能的原因——
>
> 先怀疑是 Server Component 的 SQL 查询太多，加了 AICallMetric 追踪数据库查询耗时，发现单条 SELECT 就要 3-5 秒。又怀疑是 Supabase 免费 tier 的 CPU 限制，升级到 Pro plan，改善有限。再怀疑 pgvector 向量搜索没加索引，补了 GIN 索引，还是慢。
>
> 代码层面的可能性排查完了，就开始查基础设施。我去 Supabase Dashboard 看了一眼实例配置，发现数据库在 `ap-northeast-1`（东京）。又去 Vercel Dashboard 看了部署区域——Serverless Functions 默认在 `iad1`（美国弗吉尼亚）。**前端在美国，数据库在日本，每个 SQL 查询都是跨太平洋往返。**一个 Dashboard 页面 6-8 个查询，每个 500ms 网络延迟，就是 4-5 秒。加上 Server Component 的串行等待，8-10 秒就是这么来的。
>
> **怎么修的**：在 Supabase Dashboard 把项目迁移到 US East，和 Vercel 同区域。延迟 500ms → 5ms，页面 8 秒 → 1 秒以内。同时补了 `connection_limit=1` 防止 Serverless 并发连接数爆炸，以及确认了 PgBouncer 连接池配置正确。
>
> **教训**：代码没问题的时候，问题一定在基础设施。Claude Code 能帮你写代码、修 bug、甚至分析性能——但它不知道自己连的数据库在哪个大陆。**先确认物理拓扑再优化代码**这个原则，是 AI 工具替代不了的工程直觉。

#### Q10: 你的 RAG 评测框架为什么自己写，不用 RAGAS？

> **答：** 先说明 RAGAS 是什么——它是一个 Python 库，用 LLM 来评估 RAG 系统的输出质量，提供 context precision、context recall、faithfulness、answer relevancy 等指标。核心思路是"用一个 LLM 来当裁判，评判另一个 LLM 的 RAG 回答"。
>
> 我没用 RAGAS 的原因很简单——**我是 TypeScript 全栈，不想为了评估引入一个 Python 依赖**。RAGAS 需要跑在 Python 环境里，而我整个项目的 AI core、RAG core、API 全部是 TypeScript。为了评测单独维护一个 Python 环境纯粹是给自己加复杂度。
>
> 但我吸收了 RAGAS 的核心思想——LLM-as-Judge（用 DeepSeek 替代 GPT-4 做 faithfulness 和 relevancy 评分）。然后在自己的技术栈里实现了同样的事情：
>
> | 对比 | RAGAS (Python) | 我的 eval (TypeScript) |
> |------|---------------|----------------------|
> | 检索指标 | context_precision, context_recall, context_entity_recall | Precision@5, Recall@5, MRR, NDCG@5 |
> | 生成指标 | faithfulness, answer_relevancy (LLM Judge) | faithfulness + answer_relevancy (DeepSeek Judge, 同逻辑) |
> | 评测数据 | 调用生产 retriever | **直接连接生产 PgVector 数据库** |
> | CI 集成 | 需要 Python 环境 | `pnpm eval:sales:retrieval` 一条命令 |
> | 语言 | Python only | TypeScript，零额外环境 |

> 我比 RAGAS 多了一个关键能力——**评测直接连真实数据库**。RAGAS 评测的是"retriever 从向量库里搜出来的结果"，但如果你的 retriever 接的是 mock 数据或者 sample 数据集，测出来的指标不能反映生产真实情况。我在 `cli.ts` 里加了 `--real --org-id <id>` 模式，评测框架直接通过 Prisma 连 PostgreSQL，用真实上传的文档做检索。**每次改 chunker 参数，我可以看到生产环境里的 Recall 是涨了还是跌了。**
>
> 另外，RAGAS 的 LLM Judge 用的是 OpenAI。我的 Judge 用的是 DeepSeek——同一个 LLM provider，不需要额外 API key。而且我在 CLI 层面做了边界注入，**评测代码不依赖任何 LLM 库**——如果 DeepSeek 挂了，`--retrieval-only` 模式跳过 Judge 仍然能跑完整检索指标。
>
> 一句话总结：**RAGAS 是给你一个答案的框架，我的 eval 是验证你自己的答案是否正确的工具。两者目标不同——前者教你"怎么做 RAG 评估"，后者帮我"确保我的 RAG 质量可量化"。**

> **答：** 我不会猜——我会用 eval 框架逐段定位：

1. **先跑 Retrieval-only eval** → 看 Precision@5 / Recall@5 / MRR。如果这些指标差，问题在检索端。
2. **检索端逐段排查**：
   - 关闭 Reranker（用 Noop）→ 指标变差很多？Reranker 有问题。没变？Reranker 没起作用。
   - 关闭 Keyword 路径（只用 vector）→ 降了多少？降得多说明 keyword 贡献大。
   - 改 RRF k 值（60→30→90）→ 哪个类别改善？
   - 看 per-category 指标 → 是不是某个类别（如 FAQ）特别差？
3. **查具体 bad case**：哪些 question 的 MRR=0？用 `LIKE` 搜索 chunk 内容确认知识库里到底有没有这段信息。有但没搜到 → embedding 问题。没有 → chunking 把相关内容切碎了。
4. **如果检索指标好但生成质量差** → 跑 LLM Judge（Faithfulness + Relevancy）。

这个排查链路有一个前提：**eval 必须连接真实系统**。这就是为什么我把 mock retriever 替换成真实 PgVector 适配器。

---

### D 类：系统设计与分布式架构（面试官想看你的全局视野和实际落地经验）

#### Q11: 你这个项目跨了 4 个云服务（Vercel、Railway、Supabase、Upstash），怎么管理分布式部署的？

> **答：** 四层部署分别对应四个不同的运行时需求：
>
> | 服务 | 跑什么 | 为什么选它 | 关键约束 |
> |------|-------|-----------|---------|
> | **Vercel** (US East) | Next.js Web App | 原生支持 Next.js SSR/SSG/RSC，零配置 | Serverless 函数最长 60s 执行，不支持 WebSocket |
> | **Railway** (US) | BullMQ Worker (AI+Email+Campaign) | 长期运行的容器，维持 TCP 长连接到 Redis | 需要并发控制避免打爆 DeepSeek API |
> | **Supabase** (US East) | PostgreSQL + pgvector | 数据已在 PG 里，pgvector 零额外成本 | connection_limit=1 防 Serverless 连接爆炸 |
> | **Upstash** (Global) | Redis (BullMQ + 限流 + 缓存) | Serverless Redis，REST + TCP 双协议 | 免费 tier 500K/天限制 |

> 部署中最关键的决策是**双协议 Redis 的使用方式**。Web 端是 Serverless Functions，每次请求都是独立实例，无法维持 TCP 长连接——所以用 Upstash 的 REST API 做限流和缓存。Worker 端是 Railway 上的长期容器，可以用 ioredis 直连 TCP 做 BullMQ 的阻塞读取（BRPOPLPUSH）来高效等待新任务。**同一个 Redis 实例，REST 和 TCP 各司其职**——这是 Serverless 和长期容器混合架构的典型模式。
>
> 区域选择上踩过坑——初期 Supabase 在日本、Vercel 在美国，跨太平洋查询延迟 500ms，Dashboard 页面 8 秒才加载。迁移到同一区域后降到 1 秒以内。教训是：**先确认物理拓扑再优化代码**。

#### Q12: 如果明天系统要支撑 100 倍流量，你会改什么？

> **答：** 按优先级：
> 1. **RAG QA 语义缓存**（已完成，最大 ROI）— FAQ 命中率 60%+，延迟 2s→50ms，直接减少 60% embedding+LLM 调用。Redis 集群模式。
> 2. **Worker 水平扩展** — Railway 上把 Worker 实例从 1 → N。BullMQ 天然支持多 worker 消费同一队列。注意 concurrency 配置避免打爆 DeepSeek API rate limit。
> 3. **Read Replica** — Analytics 查询走 Supabase 读副本，不和 OLTP 抢连接。PgBouncer 连接池需要从默认的 transaction mode 调到 session mode 以支持 pgvector。
> 4. **API Gateway 层引入** — 当前 Middleware 承载了 JWT 验证 + 限流 + 黑名单检查。高并发下 Edge Runtime 的 CPU 可能成为瓶颈。将限流逻辑前置到真正的 Gateway（如 Cloudflare Workers 或 Kong），Middleware 只做 JWT。
> 5. **Connection Pool 分级** — 当前 Prisma `connection_limit=1`（Serverless 安全），但高并发下会成为瓶颈。分离 OLTP 连接池和 OLAP 连接池。
>
> 不做的事：换 Pinecone、换 Kafka、拆微服务。过早引入更多基础设施只会让分布式复杂度失控。

#### Q13: 这个项目最大的难点和遗憾是什么？

> **答：** 最大的难点不是某个技术点，而是**把 4 个独立云服务和 7 个内部 package 协调成一个稳定的整体**。
>
> 具体来说有三个层面的耦合让我花了大量时间：
> 1. **部署拓扑耦合**：Vercel 的函数跑在美国，但最初 Supabase 在日本。一个 SQL 查询跨太平洋 500ms，一个页面 6-8 个查询就是 4-5 秒。这种延迟问题很容易被误判为"代码写太慢"或"数据库配置不够"——实际上只是物理距离。
> 2. **运行时耦合**：同一个 Redis 实例，Vercel 端用 REST（短连接），Railway Worker 端用 TCP（长连接）。关键是 BullMQ 的 `prefix: "sales-agent"` 隔离——没有这个前缀，两个项目的队列名会冲突，Worker 会消费到别人的 job。这是 monorepo 多项目共享 Redis 的隐患。
> 3. **模块化耦合**：7 个 package（ai-core、rag-core、shared-types、domain、api-client、ui-tokens、db）的依赖方向必须是单向的——`web → ai-core → shared-types`，永远不能反向。如果不控制，3 个月后就会变成大泥球。我通过 Turborepo 的 `dependsOn` 和接口抽象来强制边界。
>
> 遗憾是**测试不够**——52 个单元测试全是 web 端的，RAG 管线没有集成测试。原因是前期一直在快速迭代核心功能，测试被搁置。如果有集成测试，部署延迟问题会更早暴露。但另一方面，前期如果花太多时间写测试，可能连 RAG 管线都搭不完。这是一个真实的速度 vs 质量的权衡。

---

### E 类：行为面试（面试官想看你的工作方式和技术决策能力）

#### Q14: 32,000 行代码，11 个 package，你怎么保证代码质量？

> **答：** 四个层面的约束：
> 1. **Monorepo 依赖方向单向化** — 7 个内部 package 的依赖链是严格单向的：`web/mobile → ai-core/rag-core → domain/shared-types → db`。`rag-core` 永远不会 import `web`。Turborepo 的 `dependsOn` 配置强制了这一点。这防止了"每个 package 都能 import 任何东西"的大泥球。
> 2. **接口隔离，实现可插拔** — RAG 系统用了 5 个接口（StorageAdapter、EmbeddingProvider、Reranker、QueryRewriter、QueryRouter），每个都有至少两个实现（生产版 + Noop/回退版）。好处是：改 pgvector 的实现不会影响调用方；测试可以用 InMemory 实现；新开发者不需要配 pgvector 就能跑完整管线。
> 3. **三层降级设计** — 每个外部依赖都有降级路径。Embedding API 不可用 → 关键词搜索回退。Redis 不可用 → 内存限流回退。Cohere Rerank API 不可用 → NoopReranker 回退。Sentry DSN 不存在 → 静默不报错。系统不会因为任何一个外部服务挂掉而完全不可用。
> 4. **CLAUDE.md + ARCHITECTURE.md + PROGRESS.md** — 三个文档分工明确。新加入的人看 ARCHITECTURE 理解系统，看 CLAUDE 写代码，看 PROGRESS 了解进度。这 3 个文件加起来 ~2,000 行，但避免了口头传知识。

#### Q15: 你怎么做技术决策？举个例子？

> **答：** 每个设计决策我都要求自己写清楚"为什么"，不是"我觉得"。写成 `ARCHITECTURE_DEEP_DIVE.md`。举两个例子：
>
> **决策 1：pgvector 而不是 Pinecone** — 很多人会习惯性选 Pinecone"。我分析了：数据已经在 PostgreSQL（不需要第二个数据库）、Supabase 内置 pgvector（零额外成本 $0 vs $70/月）、多租户 WHERE 条件可以和向量搜索在同一 SQL 完成（不需要跨服务 JOIN）、删除文档的事务一致性（Prisma cascade + pgvector 一起删）。如果将来向量量超过 ~1M 级别需要 GPU 加速的 ANN 索引再换——但现在过早引入 Pinecone 只是在增加运维复杂度。
>
> **决策 2：SSE 而不是 WebSocket（最初版本）** — 早期只需要推送 Workflow Run 的状态更新（queued → running → completed），是低频单向事件。SSE 浏览器原生支持 + 自动重连 + HTTP 穿透所有代理。WebSocket 需要维持长连接，在 Vercel Serverless（函数 60 秒超时）上不友好。但后来做实时聊天时必须上 WebSocket——所以 Phase 21 加了 Socket.IO，同时保留了 SSE 用于 Workflow。**不同场景用不同方案，不是为了"统一"而统一。**

#### Q16: 这个项目有考虑过高并发吗？怎么设计的？

> **答：** 考虑到它是一个企业内部系统而非 C 端产品，设计目标不是"500 QPS 每实例"而是"正确处理异步负载，不丢失任务，不乱序"。具体的并发考量：
>
> 1. **BullMQ 4 队列分离**：AI 回复（CPU 密集 + 外部 API）、邮件（IO 密集）、活动序列（含 delay 跨多天）、线索评分（低优先级）。分开后一个队列堵塞不影响其他的。
> 2. **Worker 幂等去重**：`requestId` 贯穿全链路（HTTP → Queue → LLM → DB）。相同的 requestId 重复入队 → Redis SET NX 检测 → skip。防止邮件重复发送、AI 调用重复计费。
> 3. **Prisma connection_limit=1**：Serverless 环境下每个函数实例开一个 DB 连接，30+ 并发请求可能瞬间打爆 Supabase 免费 tier 连接池。`connection_limit=1` + PgBouncer 保证了每个实例只用 1 个连接。
> 4. **Gateway 架构**：Middleware 层承载了 JWT 验证 + 限流（100 req/min）+ 黑名单检查。所有请求经过这一层统一处理，不需要每个 Route Handler 重复写。未来如果上量，限流可以从 Edge Runtime 前置到 Cloudflare Workers。

#### Q17: 你怎么看 AI 时代的系统设计？跟传统系统有什么不同？

> **答：** AI 系统设计最大的不同是**不确定性管理**。传统 API 系统——输入确定、输出确定、延迟可预测。AI 管线每一段都有不确定性：
> - LLM 延迟不可预测（DeepSeek 有时 200ms 回，有时 15 秒超时）
> - Embedding 质量不可预测（换一个模型，整个检索结果就变了）
> - Prompt 的效果不可预测（改一个词可能大幅影响准确性）

> 核心思路是**把不确定性封装在可测量的边界内**：
> - 所有 LLM 调用都有 timeout + retry + 降级
> - Embedding 有可插拔接口 → 换模型不影响调用方
> - Prompt 有版本注册表 → 灰度推出而不是全量替换
> - RAG 有 Golden Dataset + 自动化评测 → 每次调参有量化反馈

> 传统系统设计的"正确性"是二值的（对/错）。AI 系统的"正确性"是连续的概率分布——你永远不能说"这个回答 100% 正确"，但你可以说"Recall@5 从 0.72 提升到了 0.85"。**评测框架是 AI 系统的 unit test**。

#### Q18: 32,000 行代码你一个人写的？Claude Code 帮了多少？

> **答：** 这个项目全程用了 Claude Code 做 AI 辅助开发。但关键是**分清什么事让 AI 做、什么事必须人做**。
>
> Claude Code 擅长的事情——我让它做——重复性代码、TypeScript 类型定义、API route 的模板搭建、SQL 查询的拼接。比如 `query-router.ts` 里的六种分类逻辑，我定义好接口和分类体系，Claude 写具体的实现代码。还有 40 多个 API route 的 session 校验 + RBAC 权限检查的样板代码，全是它帮我铺的。
>
> 但 Claude Code 有几个**明显盲区**，这些必须我自己来：
> 1. **架构决策**：选 pgvector 还是 Pinecone、JWT 还是 Session、SSE 还是 WebSocket——Claude 能列出优缺点表，但它不知道这个项目的约束条件（预算、团队规模、部署环境）。决策是人的。
> 2. **物理世界感知**：前面说的数据库在日本、函数在美国的问题——Claude 看不到你的 Supabase Dashboard，不知道 Vercel 的部署区域。**代码层面它能帮你做到极致，但基础设施层的问题它完全盲。**
> 3. **系统一致性**：改了 rag-core 的 retriever 接口，要同步更新 kb/ask、ai-draft 两个 route、还有 eval 框架的适配器——Claude 改一个文件的时候不会主动告诉你还有三个文件需要跟着改。这需要人对系统全局有 mental model。
> 4. **未知的未知**：RAG 评测到底该测什么指标、缓存命中率 60% 够不够——这些问题没有标准答案，需要自己跑数据、观察用户行为、做判断。AI 不能替你做 trade-off。
>
> 所以我的工作方式大概是：概念设计 + 架构决策自己做 → 让 Claude 铺第一版代码实现 → 自己 review 调用链路 → 发现不一致 → 让 Claude 修复 → 自己做集成验证。**人定义"要什么"，AI 负责"怎么写"——但架构的一致性、基础设施的感知、trade-off 的判断，这三个是人的事。**

---

### F 类：追问利器（面试官如果对你的 RAG 很感兴趣，可能会深挖）

#### Q19: 你提到了 RRF k=60，为什么是 60？试过其他值吗？

> **答：** 60 来自 Cormack et al. 2009 的原始论文，是经过大量 IR 实验验证的"默认值"。k 越大，排名差异的影响越小（融合更"公平"），k 越小，排名靠前的优势越大。
>
> 我在有限的手动测试中对比了 k=30 和 k=60，在当前数据集上差异不大（±0.02 MRR）。但论文显示 k=60 在各种数据分布下更稳健，所以保持了这个默认值。
>
> 说实话，在 eval 连到真实系统之前我没法做系统的 k 值调优。这才是 Phase 20 把 eval 真实化的意义——之后我可以用 Golden Dataset 扫一遍 k ∈ [10, 100]，看在哪个值上 MRR 最高。

#### Q20: tsvector 用的是 'english' 配置，中文怎么办？

> **答：** 这是一个已知限制。PostgreSQL 的 `to_tsquery('english', ...)` 对中文分词很差——中文没有空格，英文的 stemming 规则也不适用。
>
> 当前的处理是 fallback 机制：tsvector 失败 → 自动降级到 `~*` 正则搜索。正则搜索对中文更友好，因为它做的是子串匹配而非基于空格的分词。
>
> 正确的解决方案有两个方向：
> 1. 安装 `zhparser`（PostgreSQL 中文分词扩展）→ 用 `to_tsquery('chinese', ...)` 代替 `english`。但这需要在 Supabase 上安装扩展（Supabase 默认不含 zhparser）。
> 2. 在应用层做中文分词（用 `@node-rs/jieba` 或调用 DeepSeek 做分词），手动拼 tsquery。
>
> 目前 Phase 22 计划中要做这件事。但在 keyword search 降级到 `~*` 的情况下，中文检索功能是可用的，只是不如英文的 ts_rank 精准。

#### Q21: 你的 Chunk metadata 里有什么？怎么用的？

> **答：** Chunk metadata 包含 `{ title, fileName, section? }`。当前 `section` 字段存在但从未被填充——这是一行代码就能修的事，但需要解析 Markdown 标题或 PDF 书签。
>
> metadata 的用途体现在：
> 1. **引用生成** — citation 里的文档名和文件名来源
> 2. **检索过滤** — 未来可以根据 section 做过滤（"只查定价相关章节"）
> 3. **问题路由增强** — 如果 chunk 的 section 已知（如"定价"、"功能介绍"），路由可以更精准
>
> Phase 20 的问题路由目前是基于 query 文本分类，还不是基于 metadata 过滤。结合 metadata 的混合路由是下一步。

---

### G 类：Phase 21 新增 — 实时聊天 + 性能工程

#### Q22: 你怎么做 Email 和 Chat 双通道的？架构上怎么统一？

> **答：** 两种通道在同一个 Inbox 里展示，但后端走的是完全不同的路径。
>
> **Email 通道**（已有）：客户发邮件 → Resend webhook 写入 Message → Inbox 展示 → Agent 点「AI 草稿」→ DeepSeek + RAG 检索生成草稿 → Agent 审核 → 点「发送」→ Worker 通过 Resend API 发出邮件。这是 **异步 + HITL（Human-in-the-Loop）** 模式。
>
> **Chat 通道**（Phase 21 新增）：客户在 Portal 发起消息 → Socket.IO WebSocket → 服务端写入 DB → 实时推送到 Agent 的 Inbox → Agent 看到消息 + 可选点「AI 草稿」→ Enter 发送 → WebSocket 推送回客户。这是 **实时 + 可选 AI 辅助** 模式。
>
> 两个通道在 Inbox 用 **切换按钮** 统一：Email 模式显示原有的撰写区+AI 草稿+发送按钮；Chat 模式显示 ChatWindow（消息气泡 + WebSocket 实时收发 + AI 草稿按钮）。同一个 conversationId，同一个 Message 表，只靠 `channel` 字段（"email" / "chat"）区分。
>
> 关键设计决策 — Chat 模式目前也走 HITL（AI 生成草稿 → 人工点发送）。接下来 Phase 22 计划实现智能分流：简单问题（RAG 高置信度 + KB 有明确答案 → 自动回复），复杂问题（含谈判信号 / RAG 低置信度 → AI 草稿 + 人工审核）。

#### Q23: 语义缓存是怎么做的？两层缓存的命中率是怎么分开算的？

> **答：** 两层互补：
> - **Exact match**：对 normalized query（小写去空格）做 SHA-256，用 hash 作为 Redis key 精确查。这是纯文本匹配，零假阳性。适用场景："价格多少" → "价格多少"（完全一样）。
> - **Semantic match**：对 query 做 embedding，与 Redis 中存的以往 query embedding 算余弦相似度。≥ 0.95 视为同一问题。适用场景："价格多少" → "你们的收费标准是什么"（问法不同）。
>
> Redis 结构：
> ```
> rag:cache:exact:{orgId}:{queryHash}      → { entry JSON }
> rag:cache:embeddings:{orgId}:{queryHash} → { entry JSON }
> ```
> 两条 key 同时写（为了 exact match 是 O(1) 查询、semantic match 需要 scan 所有 embedding keys）。
>
> 估算的逻辑：FAQ 场景，同一个"价格多少"一天被问几十次 → exact match 命中 → 0 API 调用。相似但不完全一样的问题 → semantic match 命中 → 也是 0 API 调用。两者加起来预估 60%+。但这需要实际跑一段时间才能给出确切数字——我在 `CacheCheckResult.matchType` 里做了标记，未来可以在 AICallMetric 里追踪 exact/semantic/miss 的比例。
>
> 失效策略：文档上传/更新/删除时调用 `invalidateOrg()` 清除该 org 的所有缓存。也可以按 documentId 精确失效——但当前粒度是 org-level，因为一个文档改了可能影响多个不同 query 的答案。

#### Q24: 为什么 RAG 管线还要做实时聊天？和 LangChain 生态里的 Chatbot 有什么不同？

> **答：** LangChain 的 ConversationalRetrievalChain 做的是"检索+对话记忆"——每次用户发言都检索一次 KB + 带上历史消息。这是问答 bot，不是销售聊天。
>
> 我的场景不同：
> 1. **双端不同角色** — 客户在 Portal 端发消息（可能只是"你好"），Agent 端收到后决定要不要用 AI 草稿。AI 不是自动回复的，是辅助 Agent 的。
> 2. **Email/Chat 双通道统一** — 同一个 conversation thread 既可以通过 Email 继续（异步），也可以通过 Chat 继续（实时）。数据层是同一条 Message 表。
> 3. **AI 草稿继承 RAG 管线** — Agent 在 Chat 模式点「AI 草稿」，后端走的是同样的 `ai-draft` API（Hybrid Retrieve + Reranker + DeepSeek compose），不是另起炉灶。
>
> LangChain 适合快速搭一个"上传 PDF → Q&A bot"的 demo。我这个场景需要精确控制用户身份（customer vs agent）、消息通道（email vs chat）、审批流（HITL vs auto-send）。这种复杂度下自己写更可控。

---

## 三、Agent 系统六层架构对照 — 查漏补缺

> 以下对照来自一篇 2026 年 AI 全栈面试官的文章。他把 Agent 系统分为六层，说多数人只做了"编排层的一半"。
> 逐层对照 SalesAgent AI，诚实标出覆盖和缺失。

### 总览

| 层 | 你的覆盖度 | 关键缺失 |
|----|----------|---------|
| 交互层 | ✅✅✅ 强 | 用户无法中断正在跑的 Agent |
| 编排层 | ✅✅ 中上 | Memory 靠 prompt 硬拼，无长期记忆 |
| **运行时** | **⚠️ 弱** | **无 Token 预算、无超时降级、无取消收尾** |
| 安全检测层 | ✅✅ 中上 | 无 I/O 内容安全检测 |
| 观测层 | ✅✅✅ 强 | 缺 Agent 级别的 step-by-step metrics |
| 评测层 | ✅✅ 中 | 缺 CI 回归闸门、缺 Agent 行为评测 |

---

### 第一层：交互层 — ✅✅✅

**文章说的**：步骤展示、审批确认、中断重试。

**你已经有的**：
- `AgentThinkingPanel` — ReAct 推理链路可视化，每一步 Thought/Action/Observation 可折叠展开
- HITL 审批工作流 — AI 草稿 → `awaiting_approval` → Agent 审核 → 发送
- Inbox 内 Email/Chat 一键切换，ChatWindow 实时连接状态+对方在线状态+正在输入动画

**还缺的**：
- 用户无法中断正在执行的 Agent。如果 Agent 卡在第 4 步调 DeepSeek 超时了，用户只能等

---

### 第二层：编排层 — ✅✅

**文章说的**：Prompt、模型、工具、记忆组织成流程。

**你已经有的**：
- `agent-executor.ts` — 完整 ReAct 循环（Thought→Action→Input→Observation），max 6 steps
- 4 个内置 Tool：search_knowledge_base / get_lead_history / get_lead_info / send_followup_message
- Campaign step `type="react"` — Worker 执行外呼时走 ReAct Agent
- Prompt Registry 版本管理 + Feature Flag 灰度

**还缺的**：
- Memory 管理比较原始 — 对话历史直接拼进 prompt，没有专门的记忆层（摘要压缩、长期记忆、跨 session 上下文）。但对于当前场景（单次销售对话），这可能够用

---

### 第三层：运行时 — ⚠️ 这是最大短板

**文章说的**：步数上限、单步超时、token 预算、取消收尾。

**你已经有的**：
- `maxSteps=6` — 步数上限
- DeepSeek client `timeout=15s` — 单次 API 调用超时
- BullMQ `attempts=3, exponential backoff` — 队列层面重试

**关键缺失——这也是文章里那个问题**：
- **没有 Agent 整体 timeout**：单步 15s，但 6 步可能跑 90s+。用户等了 90 秒 Agent 还在转圈
- **没有 Token 预算**：没有 `maxTokens: 5000` 的概念。Agent 可能烧了 20000 token 做一个简单的事
- **没有超时降级**：Agent step 超时了 → 直接 fail → 没有"用 simpler model 再试一次"或"跳过这个 tool 继续"的策略
- **没有取消收尾**：用户无法打断正在跑的 Agent。WebSocket 可以做 cancel 事件，但没实现

**如果被问到"连续十轮有一轮超时了怎么办"，我现在会这样回答**：

> 说实话，当前版本对 Agent 超时的处理只在 queue 重试层——BullMQ 会重试 3 次，指数退避。Agent 层面没有 step-level recovery。如果我在 Phase 22 做这件事，会加三个东西：
>
> 1. **Step-level timeout + 降级**：每个 tool execution 有独立的 timeout（比如 10s），超时不直接失败——先 retry 一次（可能是瞬时网络问题），再失败就跳过这个 tool 继续。Agent 被设计成"尽最大努力"——少一个 tool 的结果可能不够好，但总比整个 Agent 卡死强。
> 2. **Token 预算**：设置 `maxTokens: 8000`，每步消耗累积。接近预算时 Agent 被要求"尽快给出最终答案"。超出预算时强制 terminate——返回已有的 best-effort 结果，而不是烧更多 token 继续。
> 3. **WebSocket cancel 事件**：用户在前端点"停止"，Socket.IO emit → 服务端 cancel Agent 的 AbortController → 清理 → 返回"已取消"状态。用于用户等了 30 秒不想再等的情况。

---

### 第四层：安全检测层 — ✅✅

**文章说的**：工具调用白名单、高危操作审批、输入输出检测。

**你已经有的**：
- `PROMPT_ARMOR` + `<user_data>` 标签 — 防 prompt injection
- HITL — **邮件绝不自动发送**，这是最核心的安全决策。`send_followup_message` tool 也只写 DB，不真发
- 工具只有 4 个 — 没有"任意 function calling"，工具集是固定且有限的

**还缺的**：
- 没有显式的工具调用白名单（但因为只有 4 个工具，等价于隐式白名单）
- 没有 I/O 内容安全检测 — 没有做客户消息的情感分析、敏感词过滤等

---

### 第五层：观测层 — ✅✅✅ 你这块做得相当好

**文章说的**：trace、日志、metrics，线上出问题了能不能查。

**你已经有的**：
- `AICallMetric` 模型 — 每次 LLM 调用记录 token/延迟/成本/成功/fallback
- `requestId` 全链路追踪 — HTTP → BullMQ Job → Worker → DeepSeek API → DB，同一 ID 串联
- AI Health Dashboard（中文）— P50/P95 延迟、成功率、回退率、按 jobType 分组、30 天趋势、智能告警
- `AgentThinkingPanel` — 前端可视化每一步推理过程
- Structured JSON logging with `TraceContext` (spanId, parentSpanId)

**还缺的**：
- Agent 级别的 step-by-step metrics — 当前 AICallMetric 只有最终结果，看不到"Agent 用了 4 步，第 3 步调了 search_knowledge_base 用了 2.3 秒烧了 1200 token"
- 没有 OpenTelemetry 标准格式

---

### 第六层：评测层 — ✅✅

**文章说的**：离线评测集、回归闸门，改了 Prompt 效果变好还是变差要有数据说话。

**你已经有的**：
- 30 条 Golden Dataset（6 类 × 3 难度）
- 4 检索指标 + 2 生成指标（LLM-as-Judge）
- `--real` 模式连接生产 PgVector
- `--retrieval-only` 快速模式

**还缺的**：
- 没有 CI 回归闸门 — 不能自动在 PR merge 时跑 eval，不能"指标下降就 block"
- 没有 Agent 行为评测 — 只评了 RAG 检索质量，没有评 Agent 整体（选了正确的工具吗？步数合理吗？最终回答正确吗？）

---

### 对标结论

> 按照那个面试官的六层标准：你的交互层、观测层都做得很好——对方的重点恰好是你有的。编排层中规中矩——该有的都有但没超出预期。**运行时是你的最大短板**——Token 预算、超时降级、取消收尾基本没有。安全检测层靠 HITL 兜底了核心风险。评测层有但缺 CI 集成。
>
> **你的策略**：面试时不要回避运行时的不足——主动提出来，然后讲你打算怎么做。这展示了你不仅知道自己的系统哪里弱，而且有一个清晰的改进思路。这比假装完美更有说服力。

---

## 四、针对那篇文章的"踩坑与应对" — 直接写进简历/面试

> 面试官说的核心逻辑：一个只有功能清单的项目，和一个有决策过程、有踩坑记录的项目，哪个更让人相信是你做的？

### 建议加在简历项目描述里的一段（3 行，放在技术亮点之后）

**踩坑与应对**：
- **跨地域延迟**：部署后发现 Dashboard 页面加载 8 秒——代码、索引、Plan 全查过无果，最终在 Vercel 和 Supabase Dashboard 发现函数在美国、数据库在日本（跨太平洋延迟 500ms/query）。迁移同区域后降至 1s。教训：分布式系统先确认物理拓扑再优化代码。
- **RAG 质量无法量化**：早期调 chunk 参数、embedding 模型全凭感觉。自建 30 条 Golden Dataset + 4 指标评测框架，连接生产 PgVector 做真实评测，每次调参有量化反馈。教训：AI 系统的 unit test 是 eval，不是 assert。
- **Serverless + 容器混合架构**：Next.js 在 Vercel（短生命周期，REST 连 Redis），Worker 在 Railway（长期容器，TCP 长连接连 Redis）。同一 Redis 双协议隔离，BullMQ prefix 防多项目冲突。教训：Serverless 不是无运维——风险只是从"管服务器"变成了"管区域/管协议/管连接池"。

---

## 五、如果你面试碰到那篇文章的作者 — 逐题答案

> 下面 8 个问题是那篇文章里实际出现或暗示会问的。每个都有针对你系统的具体回答。

#### "假如 Agent 连续十轮问题，中间有一轮调外部 API 超时了，后面几轮怎么处理？"

> 说实话，当前版本的 Agent 运行时是最薄弱的一层。目前的处理是 BullMQ 队列层面的——3 次重试、指数退避。Agent 内部没有 step-level recovery。如果 DeepSeek API 在某一步超时了，这整个 Agent run 就失败了——队列重试会从第一步重新跑。
>
> 但这个问题的核心是对的——生产级 Agent 必须做**步骤级容错**。我打算做三层：
> 1. **Step-level retry**：每个 tool execution 独立 timeout（10s），超时先 retry 一次（瞬时网络问题经常一次就恢复），再失败 mark 为 degraded 但继续跑——少一个 tool 的结果总比整个 Agent 卡死好
> 2. **整体 Token 预算**：`maxTokens: 8000`，每步累积，接近预算时系统 prompt 会追加"尽快给出最终答案"，超出时强制终止返回 best-effort
> 3. **WebSocket cancel**：用户在前端点"停止"→ Socket.IO emit → 服务端 AbortController → 返回当前部分结果
>
> 如果你问我现在好了没有——我会说没全好。但我知道缺什么、怎么做、每层的 trade-off 是什么。

#### "chunk size 怎么选的？overlap 设多少？"

> 1000 字符、200 overlap。1000 ≈ 250 tokens，对 B2B 销售文档（FAQ answer 通常在 200-500 字符）是合适的——一个 chunk 能覆盖一个完整答案 + 部分上下文。200 ≈ 20% 重叠率，确保跨 chunk 边界的信息不丢失。
>
> 选递归字符分割而不是 semantic chunking 的原因很简单——semantic chunking 需要对每个句子做 embedding 再算相邻相似度，一个 50 页 PDF 可能有 2000+ 个句子，光分块就要 2000+ 次 API 调用。递归段落→句子→固定大小是零成本毫秒级完成。
>
> 这两个值都是可配置参数，不同文档类型可以不同。目前没做 auto-tuning——这个得靠 eval 框架跑 Golden Dataset 扫参数网格来定。

#### "rerank 做了没有？"

> 做了。Cohere Reranker（`rerank-multilingual-v3.0`），在 RRF 融合后对 Top 15 做交叉编码器精排。`createReranker()` 工厂函数自动检测 `COHERE_API_KEY`——有 key 就用 Cohere，没有就 Noop 透传。这是优雅降级的一部分：有 reranker 当然更好，但没有的话混合检索本身已经比纯向量或纯关键词好不少。

#### "评估指标是什么？"

> 检索指标 4 个：Precision@5、Recall@5、MRR、NDCG@5。生成指标 2 个：Faithfulness（LLM-as-Judge，检查生成内容是否都有 context 支撑）和 Answer Relevancy（LLM-as-Judge，检查答案是否真正回答了问题）。
>
> 最关键的不是指标本身，是指标怎么跑——我让评测直接连生产 PgVector 数据库（`--real --org-id <id>`），不是跑 mock 数据。每次改 chunker 参数或换 embedding 模型，跑一遍就知道 Recall 是涨了还是跌了。

#### "检索到的内容和问题没关系，导致 LLM 胡说八道，你怎么处理？"

> 三层防御：
> 1. **检索端**——Confidence Gate。如果 RRF 后 top-1 score < 0.7，自动触发 expanded 二次检索（放宽 topK+降阈值）。如果两次都搜不到好东西，top-1 < 0.4 → 直接告诉用户"知识库中未找到相关信息"，而不是硬塞一个不相关的 chunk 给 LLM。
> 2. **生成端**——Prompt 指令。系统 prompt 明确要求"如果 context 没有相关信息，诚实说不知道，不要编造"。这不是 100% 有效但降低了概率。
> 3. **评测端**——Faithfulness 指标专门检测这一点：LLM Judge 逐句比对 answer 和 context，"答案里有但 context 里没有的 claim"就是幻觉。每次改 prompt 或调 RAG 参数后跑一遍这个指标。

#### "Agent 跑偏了怎么拉回来？"

> 当前版本靠两个机制：`maxSteps=6`（硬上限，6 步之后自动终止）和 ReAct 格式的 self-correction（模型被提示在 Observation 后重新思考）。但说实话这不够。
>
> 更强的方案是我后续想做的：给 Agent 的 system prompt 里加一个"如果连续两步没有进展（tool 返回相同信息或无关信息），直接给出当前已知的最佳答案"。还有 token 预算——接近预算时 Agent 被强制收敛。但目前这两个都没做。

#### "预算超了怎么办？Token 用超了？"

> Token 预算目前没做。当前只有 BullMQ 层面的重试预算（3 次），没有 Agent 层面的 token cap。这是 Phase 22 的事情——我计划用 `maxTokens` 限制，每步消耗累积追踪（AICallMetric 记录），接近预算时追加"尽快给出最终答案"到 system prompt，达到预算时 AbortController 强制终止。
>
> 成本控制方面，DeepSeek $0.14/$0.28 per 1M tokens，已经很便宜。但如果不设上限，一个跑偏的 Agent 六步下来可能用掉 20000 token。这不是钱的问题——是行为失控的问题。

#### "这个项目部署上线了吗？有真实用户用过吗？"

> 部署了——Vercel（Web）、Railway（Worker）、Supabase（DB）、Upstash（Redis），四服务全通。但没有公网真实用户——这是我的身份决定的，这本质上是一个内部 OS 而非 SaaS 产品。但正因为部署了，我踩到了那篇文章里说的"只有上线才会碰到的问题"——跨地域延迟 500ms、Prisma connection_limit=1 防止连接池爆炸、BullMQ prefix 隔离、Email/Chat 双通道的 WebSocket 降级。这些问题在本地跑永远不会出现。

---

## 六、面试叙述（重新编排）

### 开口 30 秒 — 一句话说清楚你是做什么的

> "我独立开发了一个企业销售 AI 运营平台。它不是一个 CRUD 系统——它跨了 4 个云服务协同工作，有自研的 RAG 知识检索管线、WebSocket 实时聊天、异步任务队列——总共 3 个应用、7 个共享包、50 多个 API。"

### 如果面试官说"讲一个你印象最深的难点"（3 分钟）⭐ 强烈推荐

**讲跨地域分布式部署延迟排查——真实、有画面感、展示系统理解深度：**

> "这个项目部署在四个云服务上——Next.js 在 Vercel，AI Worker 在 Railway，PostgreSQL 在 Supabase，Redis 在 Upstash。有一次部署完之后，整个系统非常慢——Dashboard 打开要 8 到 10 秒，几乎不可用。
>
> 这种问题最让人头疼的是，**Claude Code 帮不了你**。它能看到你的代码，能分析 Prisma 查询，但它不知道你的数据库在哪个大陆。所以我得自己一层层排查。
>
> 代码层排查了一圈——Server Component 的查询逻辑没问题，Prisma 没有 N+1，索引也加了。代码没问题。那就往上走，查基础设施。我打开 Supabase Dashboard 看数据库实例——在 `ap-northeast-1`，东京。再看 Vercel Dashboard——Serverless Functions 默认在 `iad1`，美国弗吉尼亚。**前端在美国，数据库在日本，每个 SQL 查询都是跨太平洋往返。**一个 Dashboard 页面 6-8 个查询，每个 500ms 网络延迟，就是 4-5 秒。
>
> 解决方案其实很简单——在 Supabase Dashboard 把项目迁到 US East，和 Vercel 同区域。延迟从 500ms 降到 5ms，页面从 8 秒降到 1 秒以内。
>
> 这个经历教会我：**代码写对了不等于系统就能跑——数据库在哪、函数跑在哪、它们的物理距离是多少，这些才是决定性能的最终变量。**Claude Code 能帮你写 100 行 SQL，但它不会提醒你'这个数据库实例离你的 Serverless 函数有 10,000 公里'。真正的架构直觉——代码没问题的时候，去查基础设施——这是经验，AI 替代不了。"

### 如果面试官说"介绍一下你的系统是怎么组织的"（3 分钟）

**讲 Monorepo 模块化 + 多服务耦合管理：**

> "这个系统有 3 个应用和 7 个内部包。关键是如何让它们协同工作而不变成一坨大泥球。
>
> 我用了三层架构。最底层是 Foundation Layer——domain 实体、shared-types API 合约、db Prisma schema。中间是 Application Layer——ai-core 统一了 6 种 AI 能力的调用，rag-core 封装了完整的检索管线。最上面是 Presentation Layer——web、worker、mobile 三个应用。
>
> 依赖方向是严格单向的——web 可以用 ai-core，但 ai-core 永远不会 import web。这个边界一旦打破，系统就会开始腐化。我通过 Turborepo 的依赖配置和接口抽象来强制这一点。
>
> 举个例子，rag-core 的 EmbeddingProvider 是一个接口——只有两个方法，embed 和 embedBatch。生产环境用 OpenAI 的 text-embedding-3-small，没有 API key 时自动降级到关键词搜索。如果将来要换模型，只需要实现这个接口——不会影响调用方的任何代码。
>
> 各服务之间也有严格的职责划分。Web 应用负责用户交互和 API，Worker 负责 AI 调用和邮件发送——它们通过 BullMQ 队列通信，不直接互相调用。Redis 被两边使用，但通过不同的协议——Web 用 REST（Serverless 无长连接），Worker 用 TCP 直连（长期容器需要高效等待新任务）。同一个 Redis，两种用法。"

### 如果面试官问"你对系统设计有什么理解"（2 分钟）

**讲分布式部署拓扑 + Gateway 架构：**

> "这个项目让我深刻理解了分布式系统的几个关键设计原则。
>
> 第一个是物理拓扑影响性能——我踩过这个坑。四个服务分别在日本和美国时，系统根本跑不动。全迁到同一区域后就好了。将来如果要做高可用，我会考虑多区域部署——但不是简单的复制，要考虑数据库的主从同步延迟和一致性权衡。
>
> 第二个是分层防护。系统的 Middleware 层像一个 Gateway——JWT 验证、限流、黑名单检查都在这一层统一处理。每个 Route Handler 不需要重复写这些逻辑。限流是两层——Auth 端点 10 次/分钟防止暴力破解，普通 API 端点 100 次/分钟。JWT 过期后通过 Redis 黑名单实现即时失效——不是给无状态 JWT 加状态，而是把状态控制在基础设施层。
>
> 第三个是降级设计。系统的每个外部依赖都有回退路径——Embedding API 不可用就走关键词搜索，Redis 不可用就走内存限流，Cohere Rerank 不可用就走 Noop。每个环节可以独立故障，不会雪崩。这不是一开始就想好的，是不断踩坑后加上去的——但正因为如此，这些设计决策有真实的经验支撑。"

### 如果面试官问"你怎么保证 AI 的质量"（2 分钟）

**讲 RAG 评测 + 从感觉到量化：**

> "AI 系统最大的陷阱是'凭感觉调参'。我经历过——前十几个版本我改了无数次 chunk 大小、embedding 模型、RRF 的 k 值，全凭感觉。后来我建了一套评测框架——手工标注了 30 个问答对作为 Golden Dataset，每次调参数自动跑一遍，看 Precision@5、Recall@5、MRR、NDCG@5 四个指标的变化。
>
> 但评测写完发现一个更根本的问题——我的评测用的是 mock 数据，测的是假系统。所以我花了一天写了一个适配器，让评测直接连接生产环境的 pgvector 数据库。现在改一个参数就可以直观看到 Recall 是涨了还是跌了。
>
> 这套评测也让我发现了一些隐藏问题——比如某些类别的检索准确率明显差，追根溯源是因为这些 chunk 在切割时语义被切断了。这靠肉眼是看不出来的，必须靠量化的 per-category 指标才能定位。"

---

## 七、简历关键词（确保通过 ATS）

**语言/框架**: TypeScript, Next.js 14, React 18, Node.js, Socket.IO, React Native (Expo), Prisma 6, Tailwind CSS, Turborepo

**AI/ML**: RAG, DeepSeek API, OpenAI Embeddings, Cohere Rerank, LLM Prompt Engineering, ReAct Agent, Vector Search, Hybrid Search, Reciprocal Rank Fusion, Query Rewriting/Routing, Semantic Caching, Golden Dataset Evaluation, LLM-as-Judge

**数据/存储**: PostgreSQL, pgvector, tsvector Full-Text Search, Redis, Upstash, Supabase

**基础设施**: Vercel (Serverless), Railway, BullMQ (Job Queue), JWT (jose), RBAC, Multi-tenant Architecture, Feature Flags, Distributed Tracing, CI/CD-adjacent

**工程实践**: Monorepo (pnpm workspace), Interface-driven Design, Graceful Degradation, Human-in-the-Loop, Rate Limiting, Security Hardening (CSP/HSTS/Input Validation), CI/CD (GitHub Actions, pgvector service container)

---

## 知识库专题：文档分层与关联关系

> 面试官如果追问"你这个知识库怎么组织的"，以下是完整答案。

### 三层架构 — 不是所有文档都在同一个平面上

```
┌──────────────────────────────────────────────┐
│ Layer 1: 核心层 (Core)                       │
│  product-overview.md                         │
│  pricing-v3.md        ← 权威数据源            │
│  technical-specs.md                          │
│                                              │
│  特点：数字+规格+事实                          │
│  面试时 RAG 必须精准检索这一层                  │
├──────────────────────────────────────────────┤
│ Layer 2: 销售参考层 (Sales Reference)         │
│  faq-v2.md                                   │
│  objection-handbook.md   ← 派生自核心层        │
│  case-studies.md                             │
│  competitor-battlecards.md                   │
│  sales-playbook.md                           │
│                                              │
│  特点：问答+话术+场景                          │
│  面试时客户提问通常先命中这一层                  │
├──────────────────────────────────────────────┤
│ Layer 3: 运营支撑层 (Operations)              │
│  onboarding-guide.md                         │
│  api-reference.md        ← 面向技术人员        │
│  compliance-policy.md                        │
│  internal-escalation.md                      │
│                                              │
│  特点：流程+合规+内部文档                       │
│  面试时很少被问到，但存在证明系统是"活的"        │
└──────────────────────────────────────────────┘
```

**为什么分三层**：不是为了让文档"看起来有组织"。是因为 RAG 检索对不同层的文档有不同的精度需求。

- **核心层**：客户问"多少钱" → RAG 必须精确命中 pricing-v3.md 的表格行。这是数值数据，错了就是错了。所以核心层的 chunk 在路由时走 `pricing` 分类，阈值更严格（minScore 0.5）。
- **销售参考层**：客户问"你们和网易七鱼比怎么样" → RAG 从 competitor-battlecards.md 召回。这类问题没有标准答案，检索可以宽松一点。
- **运营支撑层**：客户不会直接问这一层的文档。它是给 Agent 自己看的——比如客户问"怎么配置邮箱"，Agent 可以查 onboarding-guide.md 然后用自己的话告诉客户。

### 文档之间的四种关联关系

 ┌──────────┬───────────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┐
  │ 关系类型 │                               怎么体现                                │                            RAG 怎么处理                             │
  ├──────────┼───────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ 引用关系 │ 每个文档头部有 > 关联文档：xxx.md, yyy.md                             │ 不参与向量搜索。chunk 内容里的"详见 xxx"被 LLM 看到时会自动引导     │
  ├──────────┼───────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ 派生关系 │ FAQ 和 pricing 都写"标准版 ¥9,800"，但 FAQ 是从定价表派生来的         │ 检索时可能同时命中两个不同格式的同一信息 → RRF 排名决定"谁更相关"   │
  ├──────────┼───────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ 场景关系 │ 客户问"AI 会不会胡说"→ 同时命中 FAQ + product-overview + case-studies │ 三个不同文档的 chunk 被 RRF 融合后一起喂给 LLM → 答案从三个角度回应 │
  ├──────────┼───────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ 权威关系 │ 如果 FAQ 说"并发 100"、technical-specs 说"并发 150"——谁说了算         │ 当前没做权威权重。面试时可以主动提"这是后续改进方向"                │
  └──────────┴───────────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────┘

不是数据库表 join。知识库文档之间是四种不同的关系：

**1. 引用关系（显式）**

每个文档头部声明了 `关联文档`。FAQ 的头部写：
```
> 关联文档：pricing-v3.md, product-overview.md, technical-specs.md
```
这告诉 Agent："如果你在 FAQ 里找不到答案，去看看 pricing-v3.md"。

在 RAG 检索时，这个关联关系**不参与向量搜索**——它不是外键。它的作用是：当 FAQ 被检索到时，检索到的 chunk 里包含"详见 pricing-v3.md 完整定价表"这句话 → LLM 看到 → 如果有必要，会在回复里建议客户"完整定价可以查看定价页面"。

**2. 派生关系（隐式）**

FAQ 和 pricing-v3.md 都说了标准版 ¥9,800/月。但如果 pricing-v3.md 更新为 ¥10,800/月，FAQ 没更新——就会出现不一致。

在我的知识库里故意留了一个这样的设计：pricing-v3.md 用表格写价格（"标准版 ¥9,800/月"），FAQ 里同一信息是 Q&A 格式（"Q: 价格多少？A: 标准版 ¥9,800/月"）。**如果只改了一个文档，RAG 可能检索到两个不同的价格。** RRF 融合的排名机制会产生一个"谁排得更高"的判断——通常 FAQ 的 Q&A 格式因为关键词匹配度更高而排名更靠前。

面试时你可以主动提这个：**"我故意在两个文档里用不同格式写了同一信息——如果更新一个忘了更新另一个，RAG 会暴露这个不一致。这本身就是知识库治理的信号。"**

**3. 场景关系（检索驱动）**

客户问"你们的 AI 会不会胡编乱造" → RAG 可能同时从 FAQ、product-overview、case-studies 三个文档检索到相关 chunk。这三个 chunk 的关系是：FAQ 给了机制解释、product-overview 给了技术原理、case-studies 给了数据证明。

**面试 demo 重点**：当客户问一个问题、LLM 的引用列表里有 [Source 1] [Source 3] [Source 7] 三个来自不同文档的引用时——这就是 RAG 在做跨文档信息整合。比"从一个文档里找到答案"更能证明你的检索系统在工作。

**4. 权威关系（层级驱动的优先级）**

如果 FAQ 说"AI 坐席可处理 100 个并发"而 technical-specs 说"标准版并发 150"，谁说了算？technical-specs 是核心层、FAQ 是派生层——技术规格表是权威来源。

当前 RAG 没有显式的"权威权重"机制——这是后续改进方向。但面试时提这个"目前没做但知道怎么做"就是加分项。

### 面试 Demo 路径 — 用这 5 个问题证明 RAG 可靠

| 序号 | 问题 | 预期命中文档 | 证明什么 |
|------|------|------------|---------|
| 1 | "标准版和专业版有什么区别？" | pricing-v3.md (表格) | **精确数值检索** — chunk 里的表格数据被准确匹配 |
| 2 | "你们和网易七鱼比怎么样？" | competitor-battlecards.md §1 + pricing-v3.md | **跨文档多源引用** — 答案引用两个文档 |
| 3 | "怎么训练 AI 理解我们公司的业务？" | faq-v2.md + onboarding-guide.md | **FAQ + 操作指南跨层检索** |
| 4 | "有个做电商的客户用了你们的产品，效果怎么样？" | case-studies.md §案例1 | **长文档精准定位** — 4 个案例中找到电商案例 |
| 5 | "服务宕机了怎么办？" | faq-v2.md + compliance-policy.md (灾备) + internal-escalation.md | **三层跨文档多跳检索** — 从 FAQ→合规→内部流程 |

**面试时你可以说**："我的知识库不是随便从网上扒的——是按三层架构设计的。核心层的数字是权威来源、销售参考层是 FAQ 和话术、运营层是内部流程。文档之间有交叉引用、有派生关系、有故意的重叠。你可以随便挑一个问题，我展示系统怎么从 11 份文档里找到相关的内容。"

### 对话术参考

> "知识库文档不是随便堆上去的——它们的组织方式直接影响 RAG 检索质量。我做了三层分层——核心层放权威事实、销售参考层放场景化的 FAQ 和话术、运营层放操作指南。文档之间有四种关联：显式引用、派生关系、场景驱动的跨文档检索、层级权威优先。面试官如果问'你怎么证明 RAG 可靠'——不用看代码，直接用不同问题测试，看引用列表是否精准、是否有跨文档整合。"

---

## 八、CI/CD — 设计 + 面试回答

### 当前状态：CI 没上线，CD 在平台层

Git push to main → Vercel 和 Railway 各自触发自动构建部署。**没有 GitHub Actions——这是刻意的。**

### 为什么没做 CI

两个实际约束，两者都是 trade-off，不是遗漏：

1. **Upstash Redis 免费 tier 500K/天**。BullMQ worker 的集成测试每跑一次就消费 Redis 配额。本地跑一两次没问题，CI 每 push 一次跑一轮，一天就能打爆免费配额。要么升级付费 plan，要么不跑集成测试——前者不划算，后者让 CI 形同虚设。

2. **pgvector 容器在 CI 里跑是额外复杂度**。普通 `postgres:16` 镜像没 pgvector 扩展，必须用 `pgvector/pgvector:pg16`。RAG eval 要在 CI 里 `CREATE EXTENSION vector` → `prisma db push` → 跑 `eval:sales:retrieval`。这条链路能跑通，但开发阶段收益不值得维护成本——我一个人开发，PR 也是自己的 branch 合并，CI 门禁挡的都是自己。

### CD 做了什么

CD 反而完整——因为**平台原生集成本身就是 CD**：
- Vercel Git 集成：push main → `pnpm install → prisma generate → next build → deploy`。PR 自动生成 Preview URL
- Railway Git 集成：push main → `pnpm install → prisma generate → tsx index.ts`

没有手写任何部署 Action，因为 Vercel 的 Preview Deployment 和 Rollback 比手写脚本好用。

### 面试会被问到的问题

#### Q: "CI/CD 做了吗？"

> CD 做了——Vercel 和 Railway 的 Git 集成就是 CD。CI 目前没有上线，但设计好了。
>
> 不做 CI 的原因不是不懂——是因为我的 Redis 是免费 tier（500K/天），集成测试每跑一次消费配额。一天 push 几次 CI 配额就没了。加上我一个人开发、PR 也是自己的分支合并——CI 门禁挡的都是自己。
>
> 但我已经把 CI 设计好了：4 个 Job 分层跑——类型检查和单元测试不要数据库（2 分钟），集成测试和 RAG eval 用 pgvector 容器（5 分钟），E2E 只跑 main 分支（8 分钟）。等团队有第二个人加入或者 Redis 升级付费 plan 了，这个配置文件直接开就行。

#### Q: "那你现在怎么保证代码质量？"

> 三个替代方案：
> 1. **本地全量测试**——每次改完跑 `pnpm --filter @salesagent/web test`（53 specs, 2s）+ `pnpm --filter @salesagent/rag-core eval:sales:retrieval`（30 条, 5s）。因为我一个人开发，这个成本可控。
> 2. **Vercel Preview Deployments**——PR 合并前，Preview URL 可以手动点一遍关键链路（登录→上传文档→AI 草稿→发送）。
> 3. **TypeScript strict mode**——编译器在本地就拦住了类型错误，不需要 CI 来告诉我 `undefined is not a function`。
>
> 这些是开发阶段的务实方案。CI 的价值在于多人协作——当第二个人 join 的时候就是必须的了。

#### Q: "如果让你设计一个 CI pipeline，你会怎么做？"

> 按速度分层，最快的先跑、最慢的在必要时候跑：
> 1. Type Check + Lint（2 min，无 DB 依赖）→ 最快的反馈
> 2. Unit Tests（3 min，无 DB 依赖）→ web + worker 的 53 个 spec
> 3. Integration + RAG Eval（5 min，pgvector 容器）→ 需要真实 PostgreSQL 的集成测试
> 4. E2E（8 min，仅 main 分支）→ Playwright 最慢，PR 上跑不划算
>
> 关键设计点：CI 环境需要 `pgvector/pgvector:pg16` 镜像而不是普通 postgres。RAG eval 用 `--retrieval-only` 模式，不需要 LLM Judge、不需要 API key，CI 零外部依赖。`concurrency.cancel-in-progress: true` 避免同一 PR 多次 push 浪费配额。

#### Q: "CD 为什么不在 GitHub Actions 里做？"

> 因为 Vercel 和 Railway 的原生 Git 集成已经做得很好。Vercel 的 Preview Deployment（PR 上自动生成可访问的预览链接）和 Rollback（一键回滚）体验比手写 GitHub Action 好得多。我的原则是：**CI 门禁在 Actions 做（代码质量），CD 部署在平台原生做（运维体验）。不要把 CI 和 CD 绑死在同一个工具里。**

---

## 九、实战面经 — 网易 AI 应用开发一面 70min 逐题拆解

> 面经来源：一位做"业务数据智能查询平台"（Text-to-SQL + 三层 RAG）的候选人。
> 核心场景：用户自然语言提问 → 系统查库表结构 → 生成 SQL → 返回查询结果。
> 你的项目场景：销售对话 + RAG 知识库检索 + AI 草稿生成。
>
> **关键前提：两个项目不是同一类系统。** 他做的是 NL2SQL，你做的是 Conversational AI + RAG。
> 但面试官问这些问题的**本质意图**是跨项目通用的。下面逐题拆解。

---

### 题目分类速览

| 题号 | 领域 | 你的项目有没有直接对应 | 策略 |
|------|------|---------------------|------|
| Q1 | 系统设计 | ✅ 有 | 直接讲你的三层架构 |
| Q2-Q8 | RAG + 数据建模 | ⚠️ 领域不同但原理相通 | 引到你的 RAG 检索架构 |
| Q9-Q11 | 规则引擎 | ❌ 你没有规则层 | 诚实说，但引到你的优势 |
| Q12-Q13 | Query Rewrite | ✅ 有 | 直接讲你的改写模块 |
| Q14 | 防幻觉/防编造 | ✅ 有 | 直接讲你的多层防御 |
| Q15 | 向量检索去噪 | ✅ 有 | 直接讲 RRF + Reranker |
| Q16 | pgvector | ✅ 有 | 直接讲你的使用方式 |
| Q17 | 自学习闭环 | ⚠️ 你没有 | 诚实说，讲改进思路 |
| Q18 | 效果验证 | ✅ 有 | 直接讲你的 Golden Dataset |

---

### Q1: 请介绍一下系统的整体设计思路

**面试官在问什么**：不是让你列功能。是让你用 2-3 句话把系统的最核心架构讲清楚——用什么分层、每层解决什么、层之间怎么协作。

**你的答案**：

> 整个系统是一个三层架构。最底层是 Foundation Layer——Prisma 管理 16 个数据模型的元数据，PostgreSQL+pgvector+tsvector 做双索引存储。中间是 Application Layer——ai-core 封装了 6 种 AI 能力的统一调用，rag-core 是一条完整的检索管线：查询改写 → 问题路由 → 混合检索（向量+关键词→RRF融合）→ Reranker 重排序 → 置信度门控。最上层是 Presentation Layer——Next.js Web 应用 + Socket.IO 实时聊天 + BullMQ Worker 异步处理 AI 回复和邮件发送。
>
> 核心设计原则是**每一层的外部依赖都有降级路径**。Embedding API 挂了走关键词搜索，Redis 挂了走内存限流，Cohere Rerank 挂了走 Noop 透传。系统不会因为任何一个外部服务挂掉而完全不可用。

---

### Q2: 核心业务数据（在你的系统里是文档/知识）之间的关联关系怎么处理？

**面试官在问什么**：他的系统里是"几十张数据库表之间的关联关系怎么建模"。你的系统里，对应的是**文档之间、chunk 之间的关联关系怎么处理**。

**你的答案**：

> 我的系统不是一个 Text-to-SQL 系统——我不处理数据库表关联。我的"核心数据"是上传到知识库的文档（PDF/Word/Markdown/FAQ）。它们之间的关系不是表 join，而是**语义关联**。
>
> 具体来说：每个文档被解析后递归分块（段落→句子→固定大小），每个 chunk 被双重索引——pgvector 存 1536 维向量（语义相似），tsvector 存全文搜索向量（关键词匹配）。一个查询会同时走两条路径，RRF 融合后挑出语义最相关的 chunk。
>
> 如果有两个文档之间存在引用关系（比如产品文档引用了定价文档的章节），在 chunk 层面靠 embedding 余弦相似度来发现——不需要手动定义外键。这是向量检索相比结构化查询的优势：**关联是计算出来的，不是定义出来的。**

---

### Q3: 知识之间的关系是人工构建的还是系统动态推断的？

**你的答案**：

> 动态推断的。你上传一份 PDF，系统自动解析、分块、embedding——不需要你告诉它"这段内容和那段有关"。检索时 query embedding 和所有 chunk 的向量做余弦相似度，自动找到最相关的。
>
> 但人工可以在 metadata 层面干预——比如上传时标注文档类型（产品/定价/FAQ/竞品），问题路由会利用这个分类信息来调整检索参数（定价类用更严格的阈值、竞品类用更宽松的召回）。

---

### Q4-Q7: 检索命中一个 chunk 后，怎么判断还需要其他 chunk？怎么保证准确？

**面试官在问什么**：在他的系统里，这个问题是"查到了用户表，怎么知道还需要关联订单表"。在你的系统里，这个问题等价于"检索到 FAQ 的一段内容后，怎么知道还需要产品文档里的相关信息来补充回答"。

**你的答案**：

> 我面对的是类似的问题——但不是通过规则或表依赖来解决的，而是通过**多路检索 + RRF 融合 + 置信度门控**三层机制：
>
> 1. **多路检索**：不是只跑一次向量搜索。Query Rewriter 生成 3 个变体（原始/关键词/同义改写），每个变体都独立检索，结果合并去重。这意味着"怎么退款"和"退款政策"两个不同角度的相关 chunk 都会进入候选集。
> 2. **RRF 融合**：向量路径找到语义相似的候选（可能是 FAQ），关键词路径找到精确匹配的候选（可能是定价文档里的具体条款），RRF 把两边按排名融合——不需要显式定义"FAQ 引用了定价表"，融合算法自然把两边的相关结果都提上来。
> 3. **置信度门控**：如果第一轮检索后 top-1 score < 0.7，自动触发 expanded 二次检索——放宽 topK、降低阈值——把可能遗漏的相关 chunk 补回来。
>
> 我没有规则引擎来显式定义"这个 chunk 依赖那个 chunk"。规则引擎在 Text-to-SQL 场景里很管用，因为表结构是确定的。但知识库里的文档内容是半结构化的——两段文本有没有关系，**embedding 算出来的比人定义的规则更准确**。

---

### Q8: 如果核心数据量动态增加，构建流程怎么扩展？

**他的系统**：业务表数量增加 → RAG 数据构建流程扩展。
**你的系统**：知识库文档数量增加 → 索引管道扩展。

**你的答案**：

> 我的增量索引在 Phase 21 做完了。核心机制是 SHA-256 内容寻址：
> - 上传时先算 content hash → 查是否有相同 hash 的文档存在 → 有则跳过（幂等），无则正常索引
> - 同名但不同 hash → 自动检测为更新 → 删旧 chunks → 重建新 chunks → 同时 invalidate 语义缓存
> - Chunk ID 基于 `docId + index + timestamp`，稳定可追踪
>
> 如果文档量从 10 个增长到 10000 个，瓶颈在 pgvector 的余弦搜索上——目前还在几千 chunk 量级，用 pgvector 的 IVFFlat 索引没问题。超过 1M 级别会考虑换 Qdrant 或 Pinecone 做专用向量存储，但接口层 `StorageAdapter` 已预留——换了只改实现，不影响调用方。

---

### Q9-Q11: 规则层、LLM 和 Few-shot 的边界怎么划分？

**面试官在问什么**：他的系统有大量的 SQL 生成规则。他在问**什么场景用硬规则、什么场景用 LLM、什么场景用示例——三者的边界怎么定**。

**你的答案**：

> 我的系统没有他那种 SQL 规则引擎，但同样面临"确定性逻辑 vs LLM 推理"的边界划分问题。我的原则是：
>
> **确定性逻辑（类比他的规则层）** 处理复杂度低、结果明确、错了代价大的事情。比如：RAG 检索的 RRF 融合算法（纯数学，不需要 LLM），JWT 验证（不能说"我觉得这个 token 应该有效"），HITL 审批流中的邮件发送门控（绝不自动发邮件——这是硬规则，不允许 LLM 绕过）。
>
> **LLM 推理** 处理需要理解语义、需要灵活判断的事情。比如：客户消息的意图理解、回复的语言策略（"客户说中文就回中文"）、复杂谈判场景的草稿生成。这些规则写不完、也写不准。
>
> **Few-shot 示例** 用在 LLM 的 prompt 里——给模型看几个好的回复示例，比用规则描述"专业友好的语气是什么样的"有效得多。
>
> 边界判断标准：**这个决策错了，后果多大？** 后果大（发了不该发的邮件）→ 硬规则锁死。后果小（措辞不够完美但信息正确）→ LLM 自由发挥。

---

### Q12-Q13: Query Rewrite 会不会对每个问题都补默认条件？怎么避免过度补全？

**面试官在问什么**：他的系统里有上下文重写——比如用户问"按币种分组"，系统自动补全成"按币种分组，最近 30 天"——但有时候不该补。他在问怎么控制改写范围。

**你的答案**：

> 这个问题很尖锐——是 Query Rewriter 的经典陷阱。我的处理方式是**只做扩展，不做推断**。
>
> 他的 Rewriter 补充"默认最近 30 天"——这是**向上推断**，替用户做了他们没有要求的假设。我的 Rewriter 做的是**向下扩展**——原始查询 "怎么退钱" → 三个变体 "退款流程" / "退费政策" / "取消订单"——全部是同义改写，没有引入新信息。
>
> 这个设计选择是刻意的：**宁可不召回，也不要召回不相关的**。用户问"怎么退钱"时我绝对不会擅自加上"7 天内"的时间限定——因为这隐含了一个假设"退钱 = 7 天无理由退货"，这个假设如果错了，检索到的 chunk 会产生方向性错误。
>
> 更多时候我的 Rewriter 不做任何改写——如果 LLM 改写失败（超时/报错），直接降级到 `NoopQueryRewriter`，原始查询原样进检索管线。**宁可少变体，也比乱加变体强。**

---

### Q14: 如何避免 LLM 编字段或乱拼 Join？

**面试官在问什么**：Text-to-SQL 场景里 LLM 最大的坑——SQL 里的列名是编的。他在问怎么防。

**你的答案**：

> 我的场景不是生成 SQL，是生成销售回复——但同样有"LLM 编造事实"的问题。我的防御分三层：
>
> 1. **RAG 强制 grounding**——AI 草稿 prompt 里明确写："产品功能、定价、竞品对比必须从知识库引用，知识库没有的诚实说不知道，绝不编造"。这不是 100% 有效，但大幅降低了编造概率。
>
> 2. **引用溯源**——LLM 回答里的每个事实性主张都带 `[Source N]` 引用标注，用户可以回查到具体 chunk。如果 LLM 编了一个 KB 里不存在的信息，引用标注会暴露这个问题。
>
> 3. **评测层**——我的 Faithfulness 指标就是专门测这个的：LLM Judge 逐句比对 answer 和 context，"答案里有、context 里没有"的 claim 标记为幻觉。每次改 prompt 或调 RAG 参数后跑一遍 Faithfulness 指标。
>
> 他的场景（Text-to-SQL）对这个问题更敏感——一个编的列名直接导致 SQL 报错。我的场景里，编造事实的危害是"给客户错误信息"，通过 HITL 审批来兜底——AI 草稿最终是人审核后才发出的。

---

### Q15: 向量检索召回 DDL、规则和示例时，怎么控制噪声和上下文长度？

**面试官在问什么**：检索结果太多或太噪 → 塞进 prompt 里太长 → LLM 迷失。怎么控制质量？

**你的答案**：

> 三层控制：
> 1. **RRF 融合本身就是去噪**——只有同时在向量和关键词两条路径上都排名靠前的 chunk 才会在融合后排名高。单边高但另一边低的"噪音结果"会被 RRF 自然压低。
> 2. **Reranker 做最终精排**——TF 融合后保留 Top 15 个候选，Cohere Reranker 逐一精读打分，最终只取 Top 5 送入 LLM。Reranker 的交叉编码器评分远比初始向量相似度精准。
> 3. **Confidence Gate 设最低门槛**——Top 5 里如果最高分 < 0.4，直接告诉用户"未找到相关信息"，不硬塞给 LLM。
>
> 上下文长度方面：我只取每个 chunk 的前 600 字符进 prompt，而不是整个 chunk（1000 字符）。引用里有完整内容供用户回查，但 prompt 里不用全量。这也是为什么 chunk size 选了 1000 而不是 500 或 2000——太小会导致信息碎片化，太大了 prompt 会膨胀。1000 是在覆盖度和上下文密度之间的平衡。

---

### Q16: PGVector 和 HNSW 在这个项目里主要解决了什么问题？

**面试官在问什么**：确认你确实用了 pgvector，不是只在简历上写了个关键词。

**你的答案**：

> pgvector 解决了两个问题：
> 1. **零额外基础设施的向量检索**——不需要维护 Pinecone/Weaviate 等专用向量数据库。向量列和业务数据在同一张表里，`WHERE organization_id = $1 AND embedding <=> $2::vector` 一个查询同时做权限过滤和向量搜索。
> 2. **事务一致性**——删除文档时，Prisma cascade 删 DocumentChunk 的同时 embedding 也一起删。Pinecone 上删除需要在两个系统间协调。
>
> HNSW 我没用——当前用的是 pgvector 的 IVFFlat 索引（先建 probes，再跑聚类）。HNSW 的构建时间更长但查询更快。目前在几千 chunk 的规模下 IVFFlat 够用。换 HNSW 只需要改 pgvector 索引类型，不需要改代码。

---

### Q17: 自学习闭环是怎么做的？哪些内容会沉淀回知识库？

**面试官在问什么**：他的系统里是"用户纠正 SQL 结果 → 沉淀为规则/示例"。你的系统里有没有类似的机制？

**你的答案**：

> 坦白说我的系统目前没有自学习闭环。这不是遗漏——是场景决定的。
>
> 他的 Text-to-SQL 场景天然适合自学习——用户纠正一个 SQL 的 join 条件，这个纠正就是一条新规则，可以直接沉淀回去。但我的场景是销售对话——Agent 回了一封草稿，人审核后修改了再发送。**这个修改能被学习吗？** 很难。因为销售对话的成功标准不是"回答正确"，而是"客户回复了预约了"——从 AI 草稿到最终成交之间，有太多外部变量。
>
> 如果我要做，方向不是"学习用户的修改"，而是**学习用户的行为模式**——Agent 点了多少次 AI 草稿、有多少次直接发送、有多少次被拒绝。被拒绝的草稿有什么共同特征（太长了？太正式了？缺了报价？）——这些 pattern 可以反馈到 prompt 模板里。但这不是 Phase 22 的事——先提高可用性，再考虑学习。
>
> 目前系统最接近"沉淀"的机制是 **Prompt Registry** + Feature Flag 灰度——改 prompt 后先 rollout 10% 用户，看回复率变化，好的推全量。这是"人工驱动的持续改进"，不是自动学习，但在当前阶段够了。

---

### Q18: 最终解决了什么业务问题？效果怎么验证？

**面试官在问什么**：这其实是 18 题里最重要的一题。他问的不是技术指标，是**业务价值**。

**你的答案**：

> 这个系统的核心价值是**让销售团队同时处理更多客户，同时保持回复质量和一致性**。
>
> 具体来说：
> - **知识一致性**：所有 AI 回复基于同一套知识库，不会出现"Alice 说产品支持 API 对接、Bob 说不行"的情况。RAG 的引用溯源让客户可以验证信息来源。
> - **响应速度**：客户在 Portal 发消息 → Agent 在 Inbox 实时收到 → 点 AI 草稿 → RAG 检索 + DeepSeek 生成 → 30 秒内就能生成一封基于知识库的专业回复。比 Agent 自己查文档、组织语言快 5-10 倍。
> - **审批安全**：HITL 确保 AI 起草但不发送——人类做最终裁决。这在销售场景是刚需：AI 写错一句话可能丢一个客户。
>
> 效果验证分两层：
> 1. **技术层**：Golden Dataset 的 Precision@5/Recall@5/MRR/NDCG@5 + Faithfulness/Relevancy。每次改参数都有量化反馈。
> 2. **业务层**：目前没有公网真实用户（这是内部 OS 而非 SaaS 产品），所以没有回复率、转化率等业务指标。但技术指标的量化体系已经建立——一旦有真实用户，把业务指标接入同一套 eval 框架即可。
>
> 如果面试官追问"你怎么知道这个系统真的有用"：我可以当场演示——上传一份产品文档到 KB，在 Portal 问一个问题，Agent 端点 AI 草稿，系统基于刚才上传的文档生成带引用的回复。这是 end-to-end 可演示的。

---

### 如果面试官反复追问你没做过的东西，怎么办

这份面经里约有 5 道题（Q3 后续的规则引擎相关、Q9-Q11 的规则边界、Q17 的自学习）你的系统没有直接对应的实现。这是正常的——你做的是销售 AI，他做的是 Text-to-SQL，领域不同。

**应对策略**：不要编造。说"我的系统在这个维度上做法不同，原因是……"，然后把话头引到你真正做了的事情上。

示例——如果被连续追问规则引擎：

> "我的系统没有规则引擎——我选择了另一种路径。Text-to-SQL 场景天然适合规则引擎，因为表结构是确定的、Join 逻辑是固定的。但销售对话场景里，客户的消息是开放域的自然语言——你不能用规则去匹配'客户现在是什么情绪'、'这个回复应该用什么语气'。所以我用 RAG + LLM 的端到端方案替代了规则层，评测框架替代了规则的有效性验证。两个场景对'确定性'的需求不同，决定了不同的架构选择。"
