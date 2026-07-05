import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { callDeepSeekJSON, PROMPT_ARMOR, safe, buildMetric } from "@salesagent/ai-core";
import { createEmbeddingProvider } from "@salesagent/rag-core/embeddings";
import { reciprocalRankFusion } from "@salesagent/rag-core";

type ChunkRow = {
  id: string; documentId: string; content: string; chunkIndex: number;
  metadata: Record<string, unknown>; similarity: number;
};

/** Search the org's knowledge base using hybrid retrieval (vector + keyword → RRF) */
async function searchKnowledgeBase(
  query: string,
  orgId: string,
): Promise<ChunkRow[]> {
  // Parallel: vector search + keyword search
  const vectorPromise = (async (): Promise<ChunkRow[]> => {
    try {
      const embedder = createEmbeddingProvider();
      const queryEmbedding = await embedder.embed(query);
      const embStr = `[${queryEmbedding.join(",")}]`;
      return await prisma.$queryRawUnsafe<ChunkRow[]>(
        `SELECT id, "documentId", content, "chunkIndex", metadata,
                1 - (embedding <=> $1::vector) AS similarity
         FROM sales_agent."DocumentChunk"
         WHERE "organizationId" = $2 AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector LIMIT 10`,
        embStr, orgId,
      );
    } catch { return []; }
  })();

  const keywordPromise = (async (): Promise<ChunkRow[]> => {
    try {
      const tsquery = query.split(/\s+/).filter((w) => w.length > 1).map((w) => `${w}:*`).join(" & ");
      if (tsquery) {
        try {
          return await prisma.$queryRawUnsafe<ChunkRow[]>(
            `SELECT id, "documentId", content, "chunkIndex", metadata,
                    ts_rank(search_vector, to_tsquery('english', $1)) AS similarity
             FROM sales_agent."DocumentChunk"
             WHERE "organizationId" = $2 AND search_vector @@ to_tsquery('english', $1)
             ORDER BY similarity DESC LIMIT 10`,
            tsquery, orgId,
          );
        } catch { /* tsvector column may not exist */ }
      }
    } catch { /* ignore */ }

    const keywords = query.split(/\s+/).filter((w) => w.length > 1).join(" | ");
    return await prisma.$queryRawUnsafe<ChunkRow[]>(
      `SELECT id, "documentId", content, "chunkIndex", metadata, 0.5 AS similarity
       FROM sales_agent."DocumentChunk"
       WHERE "organizationId" = $1 AND content ~* $2 LIMIT 10`,
      orgId, keywords || query,
    );
  })();

  const [vectorChunks, keywordChunks] = await Promise.all([vectorPromise, keywordPromise]);

  // RRF fusion
  const fused = reciprocalRankFusion(
    [
      vectorChunks.map((c) => ({ id: c.id, score: c.similarity })),
      keywordChunks.map((c) => ({ id: c.id, score: c.similarity })),
    ],
    60, 5,
  );

  const allChunks = [...vectorChunks, ...keywordChunks];
  const chunkMap = new Map(allChunks.map((c) => [c.id, c]));
  return fused.map((f) => chunkMap.get(f.id)!).filter(Boolean);
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

  // ═══ Step 1: Search Knowledge Base ═══════════════════════════════
  // Use the latest inbound message as the search query for RAG retrieval
  const latestInbound = [...allMessages].reverse().find((m) => m.direction === "inbound");
  const searchQuery = latestInbound?.content.slice(0, 500) ?? lead.name;
  const kbChunks = await searchKnowledgeBase(searchQuery, membership.organizationId);

  // Build KB context from retrieved chunks
  let kbContext = "";
  if (kbChunks.length > 0) {
    kbContext = kbChunks.map((c, i) =>
      `[KB ${i + 1}] (${(c.metadata as Record<string,string>)?.title || "文档"}, 段落${c.chunkIndex}):\n${c.content.slice(0, 600)}`
    ).join("\n\n");
  }

  // ═══ Step 2: Build conversation history ══════════════════════════
  const history = allMessages
    .map((m) => {
      const who = m.direction === "inbound" ? "客户" : "我方";
      return `[${who}]: ${m.content.slice(0, 600)}`;
    })
    .join("\n\n");

  const lastOutbound = [...allMessages].reverse().find((m) => m.direction === "outbound");

  // ═══ Step 3: Build prompt with KB context + conversation ═════════
  const system = PROMPT_ARMOR + `
你是一个专业的 B2B 销售顾问。你的公司叫「启云科技」，产品是企业级 AI 客服与销售自动化 SaaS。
撰写销售跟进消息时，必须遵守以下规则：

1. 【知识库优先】如果有知识库内容，必须基于知识库的事实来回答
   - 产品功能、定价、竞品对比、客户案例等信息必须从知识库引用
   - 知识库没有的信息，诚实说"我确认一下再回复"，绝不编造
2. 【上下文连贯】仔细阅读完整对话历史，不要重复已经说过的话
3. 【语言跟随】用客户使用的语言回复
4. 【阶段匹配】根据客户的当前阶段决定下一步行动
5. 【风格】自然、专业、有人情味

返回 JSON：
{ "subject": "主题", "body": "正文", "tone": "friendly|professional|consultative", "suggestedAction": "send_now|review" }`;

  const prompt = `撰写销售回复草稿：

客户信息: ${safe(lead.name)}（${safe(lead.company || "未知")}）
阶段: ${safe(lead.stage || "new")} | 评分: ${lead.score ?? "未评分"}

你的角色: ${safe(agent?.name || "AI 销售助理")}
性格: ${safe(agent?.personality || "专业友好")}

${kbContext ? `【知识库参考内容】\n${kbContext}\n` : "【知识库】无相关内容，请基于对话历史和销售经验回复。\n"}

【完整对话历史】
${history || "（新对话，无历史消息）"}

${latestInbound ? `【客户最新消息】${safe(latestInbound.content.slice(0, 1000))}` : "客户尚未发消息。"}
${lastOutbound ? `【我方最后回复】${safe(lastOutbound.content.slice(0, 300))}` : ""}

请基于知识库参考内容和完整对话历史撰写回复。如果知识库有相关信息，一定要引用。不要重复对话中已经说过的内容。`;

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
          usage, llmLatencyMs, llmLatencyMs, true, kbChunks.length > 0 && kbChunks[0].similarity < 0.6,
        ),
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({
      draft,
      kbChunksUsed: kbChunks.length,
    });
  } catch (err) {
    console.error("[ai-draft] Failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "AI 草稿生成失败" }, { status: 500 });
  }
}
