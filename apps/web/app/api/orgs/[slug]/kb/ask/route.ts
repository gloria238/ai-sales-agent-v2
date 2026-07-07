import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { callDeepSeekJSON, PROMPT_ARMOR, safe } from "@salesagent/ai-core";
import { createEmbeddingProvider, hybridRetrieve, type SqlExecutor } from "@salesagent/rag-core";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const { question } = (await req.json()) as { question?: string };
  if (!question || typeof question !== "string" || question.length > 2000) {
    return NextResponse.json({ error: "question is required (max 2000 chars)" }, { status: 400 });
  }

  try {
    // ═══ Semantic Cache Check (best-effort, silently degrades) ═════
    const embedder = createEmbeddingProvider();
    let queryEmbedding: number[] | null = null;
    try { queryEmbedding = await embedder.embed(question); } catch { /* embedding failed, skip cache */ }
    if (queryEmbedding) {
      try {
        const { getSemanticCache } = await import("@salesagent/rag-core");
        const cache = getSemanticCache();
        const cacheResult = await cache.get(question, queryEmbedding, membership.organizationId);
        if (cacheResult.hit && cacheResult.entry) {
          return NextResponse.json({
            answer: cacheResult.entry.answer,
            citations: [],
            cached: true,
            cacheMatchType: cacheResult.matchType,
          });
        }
      } catch { /* cache disabled or Redis unavailable — proceed with full pipeline */ }
    }

    // ═══ Unified Hybrid Retrieval (vector + keyword → RRF → Reranker) ═══
    const sqlExecutor: SqlExecutor = async (query: string, ...params: unknown[]) =>
      prisma.$queryRawUnsafe(query, ...params);

    const { results, secondaryRetrievalUsed } = await hybridRetrieve(
      sqlExecutor,
      embedder,
      question,
      membership.organizationId,
      { topK: 5 },
    );

    const chunks = results.map((r) => r.chunk);

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "No relevant documents found. Try uploading some knowledge base documents first.",
        citations: [],
        chunks: [],
      });
    }

    // ═══ Build context from retrieved chunks ════════════════════════════
    const context = chunks.map((c, i) =>
      `[Source ${i + 1}] (from ${c.metadata?.title || "Document"}, chunk ${c.index}):\n${safe(c.content)}`
    ).join("\n\n");

    // ═══ Answer with LLM ════════════════════════════════════════════════
    const system = `${PROMPT_ARMOR}
You are a helpful AI assistant. Answer questions based ONLY on the provided context. If the context doesn't contain the answer, say so. Never make up information. Cite sources using [Source N] notation. Return JSON only.`;

    const prompt = `Context:
${context}

Question: <user_data>${safe(question)}</user_data>

Answer the question based on the context above. Include source citations like [Source 1] in your answer. Return JSON: { "answer": "..." }`;

    const { result: aiAnswer, usage: _askUsage } = await callDeepSeekJSON<{ answer: string }>(prompt, system, { temperature: 0.3 });

    // Log AI call metric (non-blocking)
    try {
      await prisma.aICallMetric.create({
        data: {
          organizationId: membership.organizationId,
          jobType: "kb_ask",
          promptTokens: _askUsage?.prompt_tokens ?? 0,
          completionTokens: _askUsage?.completion_tokens ?? 0,
          totalTokens: _askUsage?.total_tokens ?? 0,
          llmLatencyMs: 0,
          totalLatencyMs: 0,
          success: chunks.length > 0,
          fallbackUsed: secondaryRetrievalUsed,
        },
      });
    } catch { /* metrics logging failure should not block */ }

    // Build citations
    const citations = results.map((r) => ({
      id: r.chunk.id,
      documentId: r.chunk.documentId,
      title: r.chunk.metadata?.title || "Document",
      fileName: r.chunk.metadata?.fileName || "Unknown",
      excerpt: r.chunk.content.slice(0, 200) + (r.chunk.content.length > 200 ? "…" : ""),
      chunkIndex: r.chunk.index,
      score: Math.round(r.score * 100) / 100,
    }));

    // Write to semantic cache (non-blocking)
    if (queryEmbedding) {
      try {
        const { getSemanticCache } = await import("@salesagent/rag-core");
        const cache = getSemanticCache();
        await cache.set({
          query: question,
          queryEmbedding,
        answer: aiAnswer.answer,
        chunkIds: results.map((r) => r.chunk.id),
        scores: results.map((r) => r.score),
        createdAt: Date.now(),
        orgId: membership.organizationId,
      });
    } catch { /* cache write failure should not block response */ }
    }

    return NextResponse.json({
      answer: aiAnswer.answer,
      citations,
      chunks: results.map((r) => ({
        id: r.chunk.id,
        content: r.chunk.content.slice(0, 300),
        score: Math.round(r.score * 100) / 100,
      })),
    });
  } catch (err) {
    console.error("[kb/ask] Error processing question:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to process your question. Please try again." }, { status: 500 });
  }
}
