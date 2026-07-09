import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { callDeepSeekJSON, PROMPT_ARMOR, safe, buildMetric } from "@salesagent/ai-core";
import { createEmbeddingProvider, hybridRetrieve, type SqlExecutor } from "@salesagent/rag-core";

/** Search the org's knowledge base using the unified hybrid retrieval pipeline */
async function searchKnowledgeBase(query: string, orgId: string) {
  const embedder = createEmbeddingProvider();
  const sqlExecutor: SqlExecutor = async (q: string, ...params: unknown[]) =>
    prisma.$queryRawUnsafe(q, ...params);

  return hybridRetrieve(sqlExecutor, embedder, query, orgId, { topK: 5 });
}

export async function POST(
  _req: Request,
  { params }: { params: { slug: string; id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { lead: true, agent: true, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation || conversation.organizationId !== membership.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const agent = conversation.agent;
  const lead = conversation.lead;
  const allMessages = conversation.messages;

  // ═══ Step 1: Search Knowledge Base (hybrid: vector + keyword → RRF → Reranker) ═══
  const latestInbound = [...allMessages].reverse().find((m) => m.direction === "inbound");
  const searchQuery = latestInbound?.content.slice(0, 500) ?? lead.name;
  let kbResults: Awaited<ReturnType<typeof searchKnowledgeBase>>["results"] = [];
  try {
    const result = await searchKnowledgeBase(searchQuery, membership.organizationId);
    kbResults = result.results;
  } catch (err) {
    console.warn("[ai-draft] KB search failed, proceeding without KB context:", err instanceof Error ? err.message : String(err));
  }

  // Build KB context from retrieved chunks
  let kbContext = "";
  if (kbResults.length > 0) {
    kbContext = kbResults.map((r, i) =>
      `[KB ${i + 1}] (${r.chunk.metadata?.title || "文档"}, 段落${r.chunk.index}):\n${r.chunk.content.slice(0, 600)}`
    ).join("\n\n");
  }

  // ═══ Step 2: Build conversation history ═════════════════════════════════
  const history = allMessages
    .map((m) => {
      const who = m.direction === "inbound" ? "客户" : "我方";
      return `[${who}]: <user_data>${safe(m.content.slice(0, 600))}</user_data>`;
    })
    .join("\n\n");

  const lastOutbound = [...allMessages].reverse().find((m) => m.direction === "outbound");

  // ═══ Step 3: Build prompt with KB context + conversation ════════════════
  const system = PROMPT_ARMOR + `
你是「启云科技」的 AI 销售助理，专注企业级 AI 客服与销售自动化 SaaS。

## 行为准则

**知识库优先**
产品功能、定价、竞品对比、客户案例，必须基于知识库内容，
引用时在句尾标注来源，格式：「（来源：{文档名}）」。
知识库中不存在的信息，统一写：「这个问题我向团队确认后告知您，预计当天内回复。」
绝对不允许编造数据、价格或功能。

**语言跟随**
严格使用客户来信的语言回复（中文 / 英文 / 其他）。

**历史连贯**
通读完整对话历史后再写，不重复已说过的内容，不重复已问过的问题。

**写作风格**
- 开头不要"您好！感谢您的来信。"式的套话
- 直接切入客户关心的点
- 结尾必须有且只有一个明确的行动号召（CTA），如"您这周方便安排演示吗？"
- 正文不超过 200 字

## 阶段行动对照

| lead.stage | 本次目标 | CTA 方向 |
|------------|---------|---------|
| new / contacted | 建立信任，了解痛点 | 提一个开放性问题，挖掘业务场景 |
| qualified | 展示价值匹配度 | 邀约演示 / 发送案例 |
| proposal | 推进决策 | 回应具体顾虑，强调 ROI 或试用方案 |
| negotiation | 促成签约 | 处理最后异议，给出明确下一步 |

## 输出格式

返回严格的 JSON，不加 Markdown 代码块包裹，不加注释：

{
  "subject": "邮件主题（≤15字，点出核心价值或问题）",
  "body": "正文（≤200字，直接切入，结尾一个 CTA）",
  "tone": "friendly | professional | consultative",
  "suggestedAction": "send_now | review",
  "confidence": 0.0~1.0（对本次回复质量的自评分）,
  "caveat": "若有无法从知识库确认的信息在此注明，否则填空字符串"
}

suggestedAction 判定规则（严格按此选择，不得自行判断）：
- send_now：标准跟进场景，无具体报价或承诺，知识库信息充分，confidence ≥ 0.8
- review：含具体报价 / 竞品承诺 / 异议处理 / 知识库信息不足 / confidence < 0.8`;

  const prompt = `请撰写销售回复草稿。

## 客户信息
- 姓名：${safe(lead.name)}
- 公司：${safe(lead.company || "未知")}
- 当前阶段：${safe(lead.stage || "new")}
- 线索评分：${lead.score ?? "未评分"}

## 负责 Agent
- 名称：${safe(agent?.name || "AI 销售助理")}
- 性格风格：${safe(agent?.personality || "专业、直接、以客户业务为中心")}

${kbContext ? `## 知识库参考内容\n${kbContext}\n` : "## 知识库\n未检索到相关内容，请基于对话历史回复，不要编造产品信息。\n"}

## 完整对话历史（时间由远到近）
${history || "（新对话，无历史消息）"}

${latestInbound ? `## 客户最新消息\n<user_data>${safe(latestInbound.content.slice(0, 1000))}</user_data>` : "客户尚未发消息。"}
${lastOutbound ? `## 我方最后回复（避免重复）\n<user_data>${safe(lastOutbound.content.slice(0, 300))}</user_data>` : "（本次为首次回复）"}

请严格按 System Prompt 中的 JSON 格式输出，不加任何额外说明。`;

  try {
    const llmStart = Date.now();
    const { result: draft, usage } = await callDeepSeekJSON<{
      subject: string; body: string; tone: string; suggestedAction: string;
    }>(prompt, system, { temperature: 0.7, timeoutMs: 25_000 });
    const llmLatencyMs = Date.now() - llmStart;

    try {
      await prisma.aICallMetric.create({
        data: buildMetric(
          {
            organizationId: membership.organizationId,
            jobType: "compose_response",
            conversationId: conversation.id,
            leadId: lead.id,
          },
          usage, llmLatencyMs, llmLatencyMs, true, kbResults.length > 0 && (kbResults[0]?.score ?? 0) < 0.6,
        ),
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({
      draft,
      kbChunksUsed: kbResults.length,
    });
  } catch (err) {
    console.error("[ai-draft] Failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "AI 草稿生成失败" }, { status: 500 });
  }
}
