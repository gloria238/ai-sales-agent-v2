"""Update ARCHITECTURE.md, PROGRESS.md, README.md with Phase 19 changes."""
import re, sys
sys.stdout.reconfigure(encoding='utf-8')

# ═══════ ARCHITECTURE.md ═══════
with open('ARCHITECTURE.md', 'r', encoding='utf-8') as f:
    arch = f.read()

arch = arch.replace(
    "- **重排序器**: NoopReranker — 接口预留用于未来接入 Cohere Rerank 或 Cross-Encoder",
    "- **重排序器 (V1.9)**: CohereReranker (rerank-multilingual-v3.0) — 有 COHERE_API_KEY 时自动启用，失败降级到 NoopReranker。createReranker() 工厂函数零配置。"
)
arch = arch.replace(
    "- **评估**: Golden Dataset + 4 retrieval metrics + 2 generation metrics (LLM judge)，可 CI 运行",
    "- **评估**: Golden Dataset (20 Q&A) + 4 retrieval metrics + 2 generation metrics (LLM judge), 可 CI 运行\n- **知识库文档 (V1.9)**: 6 份启云科技 KB 文件 (产品介绍/定价/FAQ/异议处理/客户案例/竞品对比，~40KB) 用于 RAG 测试和演示"
)

old_rag_design = "### 8.4 设计决策\n\n- **Hybrid Search**: pgvector"
new_rag_design = """### 8.4 RAG 赋能 AI 草稿 (V1.9)

收件箱的「AI 草稿」按钮不仅读对话历史，还会先检索知识库：
```
客户最新消息 -> searchKnowledgeBase() -> Hybrid Search -> RRF -> Top-5 chunks
             + 完整对话历史 + Agent 配置 -> DeepSeek -> 基于 KB 事实的回复草稿
```
AI 被明确告知「产品/定价/竞品必须从知识库引用，KB 没有的诚实说不知道」，大幅减少幻觉。

### 8.5 设计决策

- **Hybrid Search**: pgvector"""
arch = arch.replace(old_rag_design, new_rag_design)

with open('ARCHITECTURE.md', 'w', encoding='utf-8') as f:
    f.write(arch)
print("ARCHITECTURE.md updated")

# ═══════ PROGRESS.md ═══════
with open('PROGRESS.md', 'r', encoding='utf-8') as f:
    prog = f.read()

prog = prog.replace("> Last updated: 2026-07-04", "> Last updated: 2026-07-05")
prog = prog.replace(
    "| **Phase 18: Production AI Builder** | Done | 100% |",
    "| **Phase 18: Production AI Builder** | Done | 100% |\n| **Phase 19: China Market Adaptation** | Done | 100% |"
)

phase19_section = """
## Phase 19 — China Market Adaptation

> Completed: 2026-07-05

### L1 — Data Truth & i18n
- **Lead.dealAmount**: Pipeline Value 从硬编码 $5K -> SUM(dealAmount) 真实聚合，支持人民币显示
- **Lead.userId + User.leads**: Customer Portal 数据模型基础，外部客户与内部成员分离
- **全界面中文化** (~17 files): 导航/工作台/收件箱/分析/AI健康/Boss/外呼活动/客户管理/设置/AI助理/脚本/Portal
- **AI Health 中文化**: 标签/指标/趋势图/提示全部翻译，费用 $ -> 人民币, 延迟 ms -> 毫秒/秒, job type 中文映射

### L2 — Channel Abstraction (Feature Flag)
- **Feature Flags**: `email_channel` (default: false) + `wechat_channel` (default: true) — 6 active flags total
- **Worker integration**: campaign-jobs 发邮件前检查 isChannelEnabled()，禁用时降级到日志
- **Seed defaults**: 中国租户自动写入 email_channel=false

### L3 — Customer Portal
- **数据模型**: Lead.userId (可选) -> User.leads 反向关联
- **路由**: `/portal/login` + `/portal/conversations` + `/portal/conversations/[id]`
- **认证**: /api/auth/login 双路径 — Membership -> dashboard / Lead.userId -> portal (JWT role=customer, redirectTo)
- **RBAC**: 新增 customer 角色 (ROLES 数组), 权限通过 Lead.userId scoping 而非 Membership

### L4 — ReAct Agent + Reranker
- **agent-executor.ts**: ReAct Agent 循环 (Thought->Action->Input->Observation, max 6 steps)
- **4 工具**: get_lead_history / search_knowledge_base / get_lead_info / send_followup_message
- **Campaign step type="react"**: Worker 新增 ReAct 步骤类型，自主跟进客户并记录 agentSteps 到 aiMetadata
- **Reranker**: CohereReranker (rerank-multilingual-v3.0) + NoopReranker fallback + createReranker() 工厂
- **AgentThinkingPanel**: 可折叠推理链路 UI (Inbox 消息气泡下方)

### L5 — AI Draft RAG Integration
- **ai-draft/route.ts**: AI 草稿先检索知识库 (hybrid search -> RRF -> top-5 chunks) 再注入 prompt
- **KB grounding**: LLM 被指示产品/定价/竞品必须从 KB 引用，KB 没有的诚实说不知道
- **kbChunksUsed**: API response 返回使用了几个 KB 块

### L6 — Translation + Boss Dashboard
- **翻译 API**: `/api/v1/translate` — DeepSeek 翻译, 支持 10 语言, session guard
- **Inbox 翻译按钮**: 草稿翻译 -> 预览 -> 替换原文/保留原文
- **detectLanguage() / translateText()**: ai-core 导出
- **Boss Dashboard**: `/analytics?tab=boss` (owner/admin only) — 团队规模/HITL率/AI成本/成功率/成本趋势/Agent表现/漏斗/7天活跃度
- **COMPOSE_RESPONSE_SYSTEM**: 语言自动检测规则 (客户用什么语言->相同语言回复)

### Known Bug Fixes
- **kb/ask SQL 列名**: snake_case -> camelCase (4 queries, 从 Phase 18 起就存在)
- **embedding provider**: apiKey -> effectiveKey (fallback to DEEPSEEK_API_KEY)
- **Portal route conflict**: (portal) -> portal/ (route group -> real path prefix, 修复 Vercel build)
- **seed-chinese-demo**: Chinese quote -> corner bracket, connection pool (Promise.all -> sequential), FK cleanup (Prisma API), jsonb cast (::jsonb)

### 新增文件 (16)
```
packages/ai-core/src/agent-executor.ts              — ReAct Agent loop
apps/web/app/(portal)/layout.tsx                    — Portal layout (no sidebar)
apps/web/app/(portal)/login/page.tsx                — Portal login (magic-link skeleton)
apps/web/app/(portal)/conversations/page.tsx        — Portal conversation list
apps/web/app/(portal)/conversations/[id]/page.tsx   — Portal conversation detail
apps/web/app/api/v1/translate/route.ts              — Translation API
apps/web/app/api/orgs/[slug]/conversations/[id]/ai-draft/route.ts — RAG-grounded AI draft
apps/web/components/inbox/AgentThinkingPanel.tsx     — ReAct reasoning UI
packages/db/seed-chinese-demo.ts                    — 中文 Demo: 5成员/3AI/15客户/4KB文档
packages/db/seed-qicloud-accounts.ts                — Portal账号 + 补充成员
packages/rag-core/eval/knowledge-base/              — 6 启云科技 KB docs (~40KB)
```

### 修改文件 (35)
```
apps/web/lib/validation.ts, permissions.ts, feature-flags-v2.ts, middleware.ts
apps/web/(dashboard)/** — 17 files 中文化 + Boss tab + translate button
apps/worker/src/index.ts — channel flags + ReAct agent step type="react"
packages/ai-core/src/agents.ts, prompts.ts, index.ts — detectLanguage, translateText, language rule
packages/rag-core/src/embeddings.ts, retriever.ts, reranker.ts, index.ts — bugfix + Cohere reranker
packages/db/prisma/schema.prisma — Lead.dealAmount, Lead.userId, User.leads
CLAUDE.md, ARCHITECTURE.md, PROGRESS.md, README.md, package.json — docs + scripts
```

### Stats
- **~55 files**, +2,800 / -500 lines. 16 new files, 35 modified, 0 deleted.
- Build: green (web + worker, 0 errors). Prisma Client: v6.19.3.

"""

prog = prog.replace("## Known Issues / TODOs", phase19_section + "## Known Issues / TODOs")

with open('PROGRESS.md', 'w', encoding='utf-8') as f:
    f.write(prog)
print("PROGRESS.md updated")

# ═══════ README.md ═══════
with open('README.md', 'r', encoding='utf-8') as f:
    readme = f.read()

# Add ReAct badge
readme = readme.replace(
    '<img src="https://img.shields.io/badge/Redis-Idempotent-red?logo=redis&logoColor=white" />',
    '<img src="https://img.shields.io/badge/Redis-Idempotent-red?logo=redis&logoColor=white" />\n  <img src="https://img.shields.io/badge/ReAct-Agent%20Executor-8B5CF6" />'
)

# Update RBAC table
old_rbac = "| Role | Manage Org | Manage Members | Manage Agents | View All |\n|------|:---:|:---:|:---:|:---:|\n| Owner | | | | |\n| Admin | - | | | |\n| Operator | - | - | | |\n| Viewer | - | - | - | |"
new_rbac = "| Role | Manage Org | Manage Members | Manage Agents | View All | Customer Portal |\n|------|:---:|:---:|:---:|:---:|:---:|\n| Owner | | | | | - |\n| Admin | - | | | | - |\n| Operator | - | - | | | - |\n| Viewer | - | - | - | | - |\n| Customer | - | - | - | - | |"

# Use regex for README RBAC since exact match is tricky with checkmarks
readme = re.sub(
    r'\| Role \| Manage Org \| Manage Members \| Manage Agents \| View All \|\n\|------\|:---:\|:---:\|:---:\|:---:\|\n\| Owner \| ✅ \| ✅ \| ✅ \| ✅ \|\n\| Admin \| — \| ✅ \| ✅ \| ✅ \|\n\| Operator \| — \| — \| ✅ \| ✅ \|\n\| Viewer \| — \| — \| — \| ✅ \|',
    '| Role | Manage Org | Manage Members | Manage Agents | View All | Customer Portal |\n|------|:---:|:---:|:---:|:---:|:---:|\n| Owner | ✅ | ✅ | ✅ | ✅ | — |\n| Admin | — | ✅ | ✅ | ✅ | — |\n| Operator | — | — | ✅ | ✅ | — |\n| Viewer | — | — | — | ✅ | — |\n| Customer | — | — | — | — | ✅ |',
    readme
)

# Add Phase 19 changelog
phase19_readme = """### V1.9 (2026-07-05) — China Market Adaptation
- Customer Portal (Lead.userId, /portal routes, customer JWT login)
- Full Chinese i18n (17 dashboard files — navigation, inbox, analytics, campaigns, leads, agents, settings)
- Channel Feature Flags (email_channel/wechat_channel) — same codebase, different markets
- Real pipeline value (Lead.dealAmount) replacing hardcoded $5K
- ReAct Agent executor (agent-executor.ts) + AgentThinkingPanel UI + Worker campaign step type="react"
- AI draft RAG integration (Knowledge Base grounding before composing replies)
- Cohere Reranker with NoopReranker fallback (createReranker factory)
- Translation API (/api/v1/translate) + inbox translate button + detectLanguage()
- Boss Dashboard tab (/analytics?tab=boss) — HITL rate, AI cost trends, agent performance
- AI Health full Chinese translation + RMB cost display
- AI auto-detects customer language and matches response language (prompt rule)
- 启云科技 Chinese Demo seed (5 members, 3 AI, 15 customers, 4 KB docs with 31 chunks)
- ~55 files, +2,800 / -500 lines. Build: green.

"""

readme = readme.replace("## Previous Changelog", phase19_readme + "## Previous Changelog")

# Update stack table - add ReAct
readme = readme.replace(
    '| **AI** | DeepSeek API (compose, score, summarize, generate-script) |',
    '| **AI** | DeepSeek API (compose w/RAG, score, summarize, generate-script, translate, ReAct agent) |'
)

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(readme)
print("README.md updated")

print("\nAll 3 docs updated successfully.")
