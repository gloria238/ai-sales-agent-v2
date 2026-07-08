# 模块 4：RAG Pipeline

## 结论

RAG pipeline 是一个 6 阶段检索管线（Query Rewriter → Query Router → Hybrid Search → RRF → Reranker → Confidence Gate），加上 Redis 语义缓存（exact + cosine≥0.95）和增量索引（SHA-256 content hash）。评估框架有 30 条 SalesAgent 领域 Golden Dataset，当前 Precision@5=0.62。中文分词用 bigram 匹配取代英文 tokenizer。

---

## 1. Query Rewriter 的三个变体

### 实现位置

`packages/rag-core/src/query-rewriter.ts` — `LLMQueryRewriter` 类。

### 三种变体

| 变体 | 策略 | 用途 |
|------|------|------|
| **原始查询** | 直接透传 | 保底——防止改写失败或引入噪音 |
| **关键词提取** | 提取名词/实体，去掉连接词和语气词 | BM25/keyword search 优化——关键词在 tsvector 匹配中有更高权重 |
| **同义改写** | 换个说法但保持语义 | 语义搜索优化——不同表述覆盖不同的向量方向 |

### LLM Prompt

Rewriter 通过回调注入 DeepSeek（保持 rag-core 无 LLM 硬依赖），prompt 是：
```
"Rewrite the following user query into 3 variants for better search retrieval:
 1. Original query (as-is)
 2. Keyword-focused variant (extract key terms)
 3. Synonym-based variant (different wording, same meaning)
 
 Output as JSON array of 3 strings."
```

### 失败降级

`LLMQueryRewriter.rewrite()` 失败 → NoopQueryRewriter → 只返回原始查询。cache 层在 rewrite 之后、检索之前。

---

## 2. Query Router 的六个分类

### 实现位置

`packages/rag-core/src/query-router.ts` — `LLMQueryRouter` + `KeywordQueryRouter`。

### 六个分类

| 分类 | 触发 | 差异参数 |
|------|------|---------|
| **faq** | 包含"怎么"、"如何"、"支持"等 | topK=5, vectorWeight=0.5, keywordWeight=0.5 |
| **product** | 包含"产品"、"功能"、"有什么" | topK=5, vectorWeight=0.6, keywordWeight=0.4 |
| **pricing** | 包含"价格"、"多少钱"、"¥" | topK=3, vectorWeight=0.4, keywordWeight=0.6, minScore=0.6 |
| **competitor** | 包含"对比"、"销售易"、"竞品" | topK=5, vectorWeight=0.6, keywordWeight=0.4 |
| **case** | 包含"案例"、"客户"、"用了" | topK=5, vectorWeight=0.5, keywordWeight=0.5 |
| **general** | 默认 fallback | topK=5, vectorWeight=0.5, keywordWeight=0.5 |

### 分类错误的后果

- FAQ 误判为 pricing → 搜索阈值过严，可能返回空结果
- Product 误判为 general → 不会导致错误结果，但检索精度下降
- **fallback 机制**：`KeywordQueryRouter` 是快速免费版本，基于关键词匹配分类。`LLMQueryRouter` 更精准但需要 LLM 调用。

### CATEGORY_PARAMS 查表

每个分类有独立的 `topK`、`vectorWeight`、`keywordWeight`、`minScore`——FAQ 类向量权重偏高（用户问法多样），定价类关键词权重更高（数字和货币符号更适合精确匹配）。

---

## 3. 向量搜索和关键词搜索的权重分配

### RRF 公式

```
RRF_score(doc) = Σ 1/(k + rank_i(doc))
其中 k = 60
rank_i(doc) 是文档在第 i 个排序列表中的排名
```

### k=60 是怎么选的

- `k` 越大 → 排名差异的影响越小 → 更平等地对待两个列表
- `k` 越小 → 排名差异的影响越大 → 更强调高排名文档
- **学术界常用 k=60**（来自 Cormack et al. 2009 的原始论文）——这是一个经验值，不是针对本项目调出来的

### 改成 k=30 或 k=120 的影响

| 值 | 效果 | 适用场景 |
|----|------|---------|
| k=30 | 向量搜索的高排名文档获得更多权重 | 向量搜索明显比关键词搜索好时 |
| k=60 | 平衡 | 当前设置 |
| k=120 | 关键词搜索的高排名文档获得更多权重 | tsvector 的精确匹配比 pgvector 的语义搜索更可靠时 |

**建议**：本项目没有做 k 值的 grid search。如果要优化，应该在 eval 集上扫 k ∈ [1, 200] 取最高 Precision@5。

---

## 4. Confidence Gate 的 0.7 阈值

### 来源

`hybrid-retriever.ts` 中 top-1 score < 0.7 触发 expanded search（放宽 topK + 降低 minScore）。

**这个 0.7 是拍的，不是测出来的**。代码里没有 calibration 逻辑，没有 eval 结果支撑。

### 如何测

1. 在 eval 数据集（30 条）上，跑 retrieval 但不触发 confidence gate
2. 对每条 query，记录 top-1 cosine similarity
3. 画出 top-1 score 的分布直方图
4. 找出区分"有相关结果"和"无相关结果"的最佳分界点（ROC 曲线的 optimal point）
5. 在 eval 集上验证：设置阈值后，expanded search 是否确实提高了 recall

### 如何调整

```typescript
const MIN_CONFIDENCE = 0.7;  // ← 改成从 env/MIN_CONFIDENCE_SCORE 读，支持运行时调整
```

---

## 5. Cohere Reranker 的作用

### 实现位置

`packages/rag-core/src/reranker.ts` — `CohereReranker` (rerank-multilingual-v3.0) + `NoopReranker` fallback。

### 作用

Reranker 在 RRF fusion 之后重新排序 top-K 结果。Cohere Rerank 是一个 cross-encoder——它把 query 和每个 chunk 成对输入 BERT，输出相关度分数。比 cosine similarity 更精准，因为能捕捉 query-chunk 之间的语义交互。

### 量化数据

**没有**。代码里没有 A/B 对比 CohereReranker vs NoopReranker 在 eval 集上的分数差异。这是已知债务。

### 如果去掉 Reranker

- 排名质量下降：RRF fusion 本身是在混合两个排序列表，但余弦距离对短 query 的区分度有限
- 中文场景影响更大：rerank-multilingual-v3.0 是多语言模型，对中文语义理解好于纯向量距离
- 运营成本降低：去掉 Cohere API 调用可以省 ~200ms 延迟和 API 费用

---

## 6. Semantic Cache 的两层缓存

### 实现位置

`packages/rag-core/src/semantic-cache.ts` — `RedisSemanticCache`。

### 两层触发条件

```
Layer 1 — Exact Match Cache:
  用户 query → SHA-256 → Redis key: rag:cache:exact:{orgId}:{hash}
  命中条件: 完全相同的 query 文本（normalize 后）
  TTL: 1 hour
  命中后: 直接返回缓存的 results，跳过整个 pipeline

Layer 2 — Semantic Match Cache:
  用户 query → embedding → Redis key: rag:cache:embeddings:{orgId}:*
  遍历所有 embedding key，计算 cosine similarity
  命中条件: cosine ≥ 0.95
  命中后: 返回最相似 query 的缓存结果
  未命中: 把本次 query + embedding + results 写入 cache
```

### cosine ≥ 0.95 的依据

这个阈值**没有严格的实验依据**。考虑：

- OpenAI text-embedding-3-small 的 cosine similarity 在相同含义的中文 query 上通常在 0.90-0.98 范围
- 0.95 偏高——可能漏掉一些语义相似但表述略有不同的查询
- 降低到 0.85 会增加误匹配风险（不同 query 返回不相干的缓存结果）

### 为什么期望 FAQ 场景 60% 命中率

FAQ 的 query 高度重复（"怎么收费"、"免费试用"、"支持企业微信吗"），所以 exact match + 高 cosine threshold 大概率命中。非 FAQ 场景（长尾查询）命中率很低。

### 失效策略

```typescript
// 上传新 KB 文档时自动调用
semanticCache.invalidateOrg(orgId);

// 删除/更新文档时
semanticCache.invalidateDocuments(orgId, documentIds);
```

---

## 7. RAG eval 的 30 个问答对

### Precision@5=0.62 的解读

```
Precision@5 = 0.62 意味着：
  Top-5 检索结果中，平均 3.1 个是相关的
  或者说：在 30 个测试问题上，平均每问有 3.1/5 个正确结果
```

### 好还是差

| 基准值 | 场景 | 评价 |
|--------|------|------|
| < 0.4 | 初始基准 | 不可用 |
| 0.5-0.7 | 小规模知识库 (100-200 chunks)，未调参 | **及格** |
| 0.7-0.85 | 经过参数调优的 RAG | 好 |
| > 0.85 | 专业领域 + 大模型 reranker + 精调 embedding | 优秀 |

**当前 0.62 在"及格"线上**——能用，但有较大提升空间。

### 行业基准

- OpenAI 的 embedding 基准在 MS MARCO 上 MRR@10 ≈ 0.35（开放域）
- 企业知识库 RAG 通常在 Precision@5 ∈ [0.5, 0.8]，取决于领域
- 30 个问题是比较小的样本量，置信区间较宽——换一批问题结果可能浮动 5-10%

### 如何提升到 0.8

1. **调 k 值**：在 eval 集上 grid search RRF k ∈ [1, 200]，取最优
2. **调 confidence 阈值**：找到 expanded search 触发的最佳阈值
3. **改进 chunker**：当前 1000 字符/chunk，对中文可能太大（中文信息密度低）
4. **加 HyDE**：Hypothetical Document Embeddings — 先让 LLM 生成假设答案，用假设答案的 embedding 去搜
5. **元数据过滤**：在检索时用 document type、category 预过滤

---

## 8. 中文 bigram 匹配

### 为什么标准分词器不适用

英文 tokenizer（空格分词）对中文不适用：
```
英文: "What is the guest policy?" → ["what", "guest", "policy"]
中文: "访客政策是什么" → 空格分词 → ["访客政策是什么"] (一个 token!)
```

### Bigram 实现

```typescript
// eval/metrics.ts — bigram match for Chinese
function tokenize(text: string): string[] {
  if (/[一-鿿]/.test(text)) {
    // Chinese: split into bigrams (2-char sliding window)
    const tokens: string[] = [];
    for (let i = 0; i < text.length - 1; i++) {
      tokens.push(text.slice(i, i + 2));
    }
    return tokens;
  }
  // English: whitespace split
  return text.toLowerCase().split(/\s+/).filter(Boolean);
}
```

"访客政策是什么" → ["访客", "客政", "政策", "策是", "是什", "什么"]

### Bigram 的局限性

- 过分割：很多 bigram 没有语义（"策是"、"是什"）
- 噪音补偿：bigram 数量多，增大了匹配概率，但也可能引入 false positive
- 更好的方案：用 jieba 分词或 LLM tokenizer 的正确中文分词

### 在 eval 中的作用

Bigram 匹配只用于 eval 指标计算（判断 retrieved chunk 是否在 golden answer chunks 里），不影响实际检索质量。实际检索走 pgvector cosine + tsvector FTS，不依赖 bigram。
