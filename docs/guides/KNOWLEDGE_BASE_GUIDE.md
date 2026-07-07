# Agent Knowledge Base — 完整指南

## 1. Knowledge Base 是如何工作的？

当你使用 Inbox 的 "AI Draft" 生成回复时，系统会：

```
1. 从数据库加载当前 Agent 的 knowledgeBase（JSON 对象）
2. 把它序列化成字符串
3. 直接注入到发给 DeepSeek 的 prompt 里
4. AI 根据知识库内容撰写个性化回复
```

**具体流程（代码层面）：**

`apps/web/lib/prompts.ts` 的 `buildComposeResponsePrompt()` 函数接收 `knowledgeBase` 参数，拼接进 prompt：

```
AGENT CONFIG:
  Personality: "You are a senior B2B SDR..."
  Goals: [{"type":"qualify_lead",...}]
  Knowledge Base: {"productDescription":"...", "pricing":"...", "faq":[...]}
```

AI 系统指令里有一条：
> "Use the agent's knowledge base (product info, pricing, FAQs) when relevant"
> "Never make up facts not in the knowledge base"

**所以 Knowledge Base 直接影响 AI 回复的准确性和专业性。**

## 2. Knowledge Base 的 JSON 结构

```json
{
  "productDescription": "SalesAgent AI 是一个 AI SDR 外呼销售系统...",
  "pricing": "Starter $49/月 (100封/月), Pro $149/月 (500封/月), Enterprise 定制",
  "faq": [
    {
      "question": "和其他 CRM 有什么区别？",
      "answer": "SalesAgent 不是传统 CRM，而是 AI 代替 SDR 主动联系、评分、跟进的系统..."
    },
    {
      "question": "如何导入现有数据？",
      "answer": "支持 CSV 导入和 API 对接..."
    }
  ],
  "competitors": [
    {
      "name": "竞争对手A",
      "strengths": "品牌知名度高",
      "weaknesses": "价格贵3倍，无AI自动跟进"
    }
  ],
  "caseStudies": [
    {
      "title": "某 SaaS 公司 3 个月管线和增长300%",
      "content": "使用 SalesAgent 后，该公司的 AI Agent 每天处理 50+ 外呼..."
    }
  ]
}
```

**关键字段说明：**

| 字段 | 作用 | 何时使用 |
|------|------|---------|
| `productDescription` | AI 介绍产品时的核心描述 | 客户询问"你们做什么的" |
| `pricing` | 定价信息 | 客户问价格、预算讨论 |
| `faq` | 常见问答 | AI 自动回答常规问题 |
| `competitors` | 竞品对比 | 客户提到竞品，AI 会引用弱项 |
| `caseStudies` | 成功案例 | 客户需要social proof时引用 |

## 3. 如何添加/更改 Knowledge Base

**当前方式（Agent 详情页编辑 Personality 字段后手动补充）**：

目前 Agent detail 页只支持编辑 `name`、`description`、`personality`，不支持直接编辑 knowledgeBase JSON。

**最快的添加方式 — 通过 Prisma Studio：**

```bash
pnpm --filter @salesagent/db prisma studio
```

打开后找到 `sales_agent.Agent` 表，点击你要编辑的 Agent，在 `knowledgeBase` 字段填入 JSON。

**示例：给 "Inbound SDR" Agent 添加知识库**

```json
{"productDescription":"SalesAgent helps B2B SaaS companies automate outbound sales with AI SDRs. Our AI agents qualify leads, send personalized emails, and book meetings 24/7.","pricing":"Starter $49/mo for up to 100 emails. Pro $149/mo for 500 emails. Enterprise custom pricing with dedicated AI agents.","faq":[{"question":"How is this different from hiring SDRs?","answer":"An AI SDR works 24/7, never forgets to follow up, costs 10x less, and handles 10x more conversations simultaneously."}]}
```

## 4. 如何模拟真人 SDR 实现销售自动化

**核心理念：AI 不是自动发送器，而是你的虚拟销售代表。**

### 4.1 人格设计

```
❌ 不好: "You are an AI assistant. Help customers."
✅ 好: "You are Sarah, a senior B2B SaaS SDR with 8 years of experience selling to VP Sales and CROs at mid-market companies. You use the MEDDIC methodology. You are direct, data-driven, and always aim to uncover pain before pitching. You write like a smart, busy professional — short sentences, specific questions, no fluff."
```

### 4.2 知识库必须真实

```
❌ 不好: {"productDescription": "We sell software."}
✅ 好: 填入真实的产品描述、价格、FAQ、3个案例、2个竞品的优劣势
```

### 4.3 目标驱动

```
✅ 好的 Goals:
[
  {"type":"qualify_lead","priority":1,"successCriteria":"Lead score ≥ 70 and budget confirmed"},
  {"type":"book_meeting","priority":2,"successCriteria":"15-min discovery call scheduled via Calendly"},
  {"type":"handle_objection","priority":3,"successCriteria":"Specific concern addressed with data or case study"}
]
```

### 4.4 人机协作流程

```
AI 自动处理 (80%工作量):
├── 首次回复、常规跟进
├── 线索评分和分级
├── 外呼序列执行
└── 常见问答

人审批 (20% 关键决策):
├── 高价值线索（score > 80）
├── 定价谈判、合同条款
├── 客户投诉/退款请求
└── 新产品/新场景（AI 还没训练过的）
```

### 4.5 优化循环

```
第1周: 写好 Personality + Knowledge Base → 跑一周 Campain
第2周: 查看 Analytics → 回复率低的邮件是哪些？→ 调整 Personality 或 KB
第3周: A/B 测试不同人格 → 哪个转化高保留哪个
第4周: 从真实对话中提取遗漏的 FAQ → 补充进 KB
```

## 5. 常见问题

**Q: AI 会不会编造不存在的信息？**
A: 系统 prompt 有 "Never make up facts not in the knowledge base" 指令。知识库越详细，AI 越不容易编造。如果你发现 AI 乱说，说明 KB 里缺少那个信息。

**Q: 如何让 AI 用我的语气说话？**
A: Personality 字段里写下具体描述："Write like you're on Slack — casual but competent. No marketing jargon."

**Q: 不同 Agent 能用不同知识库吗？**
A: 可以。比如 "Inbound SDR" 用 FAQ 型 KB，"Enterprise Closer" 用案例+ROI型 KB。
