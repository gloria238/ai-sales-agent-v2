# SalesAgent AI — 使用手册

> 本文档面向销售负责人、SDR 团队和运营人员，解释 Campaigns（外呼活动）、Agents（AI 代理）的核心能力、AI 如何发挥作用，以及如何将系统落地到真实的企业销售流程中。

---

## 一、Agents（AI 销售代理）

### 1.1 Agents 是什么？

Agent 是你的 **AI 销售开发代表（AI SDR）**。它不是 chatbot，而是一个有目标、有人格、有知识库的 AI 员工。每个 Agent 可以配置为不同的销售角色。

### 1.2 Agent 能做什么？

| 能力 | 说明 |
|------|------|
| **自动回复** | 当潜在客户回复邮件/消息时，Agent 自动撰写个性化回复 |
| **线索评分** | 分析客户意图、预算、决策权、需求、时间线，给出 0-100 分 |
| **意图识别** | 判断客户当前处于什么阶段（了解信息、比价、准备购买） |
| **会议预约** | 识别高意向客户，主动推进到 demo/电话会议 |
| **异议处理** | 针对常见异议（价格、竞品、时机）给出对应话术 |
| **跟进提醒** | 标注需要人工介入的高价值线索，防止遗漏 |

### 1.3 如何微调 Agent？

进入 **Agents → 选择 Agent → 编辑**，你可以配置：

**人格（Personality）**：
```
示例（专业型 SDR）:
"You are a senior B2B SDR with 10 years of SaaS sales experience. 
You use the SPIN selling methodology. You are direct but polite, 
and always aim to qualify and book a meeting."
```

**目标（Goals）**：
```
[
  { "type": "qualify_lead", "priority": 1, "successCriteria": "Lead score ≥ 70" },
  { "type": "book_meeting", "priority": 2, "successCriteria": "Calendar link sent" },
  { "type": "handle_objection", "priority": 3, "successCriteria": "Objection addressed" }
]
```

**知识库（Knowledge Base）**：
```
{
  "productDescription": "SalesAgent AI is...",
  "pricing": "Starter $49/mo, Pro $149/mo, Enterprise custom",
  "faq": [
    { "question": "How does this compare to hiring an SDR?", "answer": "..." }
  ],
  "competitors": [
    { "name": "Competitor X", "strengths": "...", "weaknesses": "..." }
  ],
  "caseStudies": [
    { "title": "Acme Corp 300% pipeline increase", "content": "..." }
  ]
}
```

**关键技巧**：
- 知识库越详细，AI 回复越精准
- 人格描述里写明销售方法论（SPIN/BANT/MEDDIC/Challenger）
- 用真实的 FAQ 和竞品对比喂给 Agent，回复质量会显著提升

### 1.4 AI 在 Agent 中如何工作？

```
客户消息到达
    │
    ▼
1. DeepSeek 分析意图 → 识别客户是想了解信息、比价、还是有购买意向
    │
    ▼
2. 加载 Agent 配置 → 人格 + 知识库 + 目标 + 对话历史
    │
    ▼
3. DeepSeek 撰写回复 → 个性化、目标导向、符合人格
    │
    ▼
4. 判断置信度：
   ├── 高置信度（≥80%）→ 自动发送
   ├── 中置信度 → 存入草稿，人工审批
   └── 高价值线索 → 标记 + 通知销售人员
```

**AI 的边界**：
- AI 不是决策者，是**加速器**。它生成回复、评分、建议，最终由人审批
- 低置信度回复始终走人工审核
- 定价谈判、合同条款等敏感场景建议人工处理

---

## 二、Campaigns（外呼活动）

### 2.1 Campaigns 是什么？

Campaign 是**自动化的外呼序列引擎**。你可以创建一套多步骤的邮件序列，AI 会自动为每位客户个性化邮件内容，按时间表发送，并追踪打开/回复/预约等指标。

### 2.2 Campaign 能做什么？

| 场景 | 序列示例 |
|------|---------|
| **冷外呼（Cold Outreach）** | Day 1: 初封邮件 → Day 3: 跟进 → Day 7: 价值主张 → Day 14: 告别邮件 |
| **再激活（Re-engagement）** | Day 1: "Still interested?" → Day 5: 新功能/案例 → Day 10: 最后联系 |
| **活动邀请（Event）** | Day 1: 邀请 → Day 3: 提醒 → Day 7: Last Call |
| **Demo 跟进** | Day 1: 感谢邮件 + 录屏 → Day 3: FAQ + 案例 → Day 7: 限时优惠 |

### 2.3 Campaign 的创建流程

```
1. 选择 Agent → 决定用什么人格和知识库写邮件
2. 选择 Script → 决定序列结构（几步、每步间隔多久、触发条件）
3. 设置目标受众 → 按 stage、score、tags、source 筛选
4. 设置时间窗口 → 工作日 9:00-18:00，时区感知
5. 启动 → 系统自动执行
```

### 2.4 AI 在 Campaign 中如何工作？

```
Campaign 启动
    │
    ▼
1. 受众解析 → 从 Leads 库中筛选匹配条件的目标
    │
    ▼
2. 逐步骤执行（BullMQ 队列）:
    │
    ├── Step 1: AI 个性化邮件 + Resend 发送 + 追踪
    │   └── DeepSeek 将 Script 模板 + Lead 信息 + Agent 人格混合，生成个性化邮件
    │
    ├── [等待 N 天]
    │
    ├── Step 2: 仅对未回复的 Lead 发送跟进
    │   └── AI 引用前一步的内容，变换角度继续推进
    │
    └── 检测到回复 → 自动停止序列 → 转入 Conversation（Agent 接管对话）
    │
    ▼
3. 实时统计 → sent / opened / replied / booked / unsubscribed
```

### 2.5 关键指标

| 指标 | 健康基准 | 说明 |
|------|---------|------|
| 打开率 | >40% | Subject line 吸引力 |
| 回复率 | >10% | 内容相关性和时机 |
| 预约率 | >3% | 序列整体的到 meeting 转化 |
| 退订率 | <1% | 过高说明受众不匹配或频率过高 |

---

## 三、企业落地实践指南

### 3.1 推荐工作流

```
Phase 1: 数据准备
  ├── 导入 Leads（CSV 或 API）
  ├── 定义 Tags（industry, company_size, persona）
  └── 设置 Stage（new → contacted → qualified → ...）

Phase 2: Agent 配置
  ├── 创建至少 2 个 Agent：
  │   ├── Inbound SDR：处理 incoming 咨询
  │   └── Outbound Closer：推进高意向客户到成交
  ├── 填入产品知识库、FAQ、竞品对比
  └── 设置人格和方法论

Phase 3: Campaign 创建
  ├── 选择目标受众（如：所有 stage=new 的 Lead）
  ├── 选择 Script（从市场安装或 AI 生成）
  ├── 关联 Agent
  └── 设置发送时间窗口 + 频率限制

Phase 4: 日常运营
  ├── 每天查看 Inbox → 审批 AI 草稿、处理高优先级对话
  ├── 每周查看 Analytics → 管线健康度、Campaign ROI
  ├── 每月调整 Agent 配置 → 根据实际转化数据优化人格/知识库
  └── 定期刷新 Leads 库 → 清理无效线索、补充新线索
```

### 3.2 典型企业场景

**场景 A: SaaS 公司，冷外呼获客**

1. 导入 500 个目标客户 Leads（从 LinkedIn Sales Navigator 导出）
2. 创建 Agent "Outbound SDR"，配置：
   - 人格：SPIN 方法论，target 技术 VP/CTO
   - 知识库：产品 ROI 数据、技术架构对比、3 个案例
3. 创建 Campaign "Q3 Outbound"，5 步序列，每步间隔 3 天
4. AI 自动为每个 Lead 个性化每封邮件
5. 回复自动进入 Inbox，Agent 接管后续对话
6. 每周通过 Analytics 查看管线变化

**场景 B: 电商公司，已注册未付费激活**

1. 筛选 stage=qualified 但 7 天无活动的 Leads
2. 创建 Agent "Re-engagement Specialist"
3. 创建 Campaign "Winback"，3 步：提醒价值 → 新功能 → 限时优惠
4. 自动运行，跟踪转化回付费的比例

**场景 C: 代理商，多客户并行管理**

1. 每个客户一个 Organization（多租户隔离）
2. 为每个客户创建独立的 Agent + Campaign
3. 通过成员管理给客户只读权限，让他们看到 AI 工作进度

### 3.3 优化循环

```
运行 → 看数据 → 调整 → 再运行

运行 1 周后检查:
├── 打开率低（<20%）？→ 优化 Subject line，调整发送时间
├── 回复率低（<5%）？→ 优化 Agent 人格，补充知识库
├── 退订率高（>2%）？→ 检查受众匹配度，提高内容相关性
├── 预约率低（<1%）？→ 调整 CTA，缩短序列间隔
└── 投诉多？→ 立即暂停，审查受众 + 内容
```

---

## 四、AI 核心能力速查

| AI 功能 | API 端点 | 触发方式 | 用途 |
|---------|---------|---------|------|
| **撰写回复** | `/ai/compose-response` | Inbox 中点击 "AI Draft" | 为客户消息生成个性化回复 |
| **线索评分** | `/ai/score-lead` | Leads 页点击 "Score" | AI 分析客户质量，0-100 分 |
| **对话总结** | `/ai/summarize-conversation` | 自动 / 手动触发 | 生成长对话的摘要 |
| **脚本生成** | `/ai/generate-script` | Scripts 页 "AI Generate" | 根据描述自动生成外呼序列 |

---

## 五、常见问题

**Q: Agent 会不会发错邮件？**
A: 中低置信度回复始终存入草稿，需要人审批后才会发送。你可以在 Agent 设置中调整 `requireHumanApprovalAbove` 阈值。

**Q: Campaign 发送频率会不会被标记为垃圾邮件？**
A: 系统内置频率限制（`maxMessagesPerDay`），且每封邮件都是 AI 个性化生成的，不会发送相同的模板邮件。

**Q: Worker 必须单独部署吗？**
A: 是的。Worker 运行在 Railway 上，负责异步任务（发邮件、执行 Campaign 序列、评分）。Web 端（Vercel）处理 UI 和 API，两者通过 Upstash Redis 通信。

**Q: 如何测试而不发送真实邮件？**
A: 在 Campaign 创建后保持 `draft` 状态，先在 Leads 中手动用 AI 评分和撰写草稿，确认质量后再启动。
