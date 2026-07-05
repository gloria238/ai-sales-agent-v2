import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { callDeepSeekJSON, PROMPT_ARMOR, safe } from "@salesagent/ai-core";
import { createEmbeddingProvider } from "@salesagent/rag-core/embeddings";
import { reciprocalRankFusion } from "@salesagent/rag-core";

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
    type ChunkRow = {
      id: string; documentId: string; content: string; chunkIndex: number;
      metadata: Record<string, unknown>; similarity: number;
    };

    // 1. Parallel: vector search + keyword search (hybrid)
    //    NOTE: Prisma columns are camelCase (no @map) — use quoted identifiers
    const vectorPromise = (async (): Promise<ChunkRow[]> => {
      try {
        const embedder = createEmbeddingProvider();
        const queryEmbedding = await embedder.embed(question);
        const embStr = `[${queryEmbedding.join(",")}]`;
        return await prisma.$queryRawUnsafe<ChunkRow[]>(
          `SELECT id, "documentId", content, "chunkIndex", metadata,
                  1 - (embedding <=> $1::vector) AS similarity
           FROM sales_agent."DocumentChunk"
           WHERE "organizationId" = $2 AND embedding IS NOT NULL
           ORDER BY embedding <=> $1::vector
           LIMIT 10`,
          embStr,
          membership.organizationId,
        );
      } catch {
        return [];
      }
    })();

    const keywordPromise = (async (): Promise<ChunkRow[]> => {
      try {
        // Try tsvector FTS first
        const tsquery = question.split(/\s+/).filter((w) => w.length > 1).map((w) => `${w}:*`).join(" & ");
        if (tsquery) {
          try {
            return await prisma.$queryRawUnsafe<ChunkRow[]>(
              `SELECT id, "documentId", content, "chunkIndex", metadata,
                      ts_rank(search_vector, to_tsquery('english', $1)) AS similarity
               FROM sales_agent."DocumentChunk"
               WHERE "organizationId" = $2 AND search_vector @@ to_tsquery('english', $1)
               ORDER BY similarity DESC LIMIT 10`,
              tsquery,
              membership.organizationId,
            );
          } catch { /* tsvector column may not exist — fall through */ }
        }
      } catch { /* ignore */ }

      // Regex fallback — works without embeddings or tsvector
      const keywords = question.split(/\s+/).filter((w) => w.length > 1).join(" | ");
      return await prisma.$queryRawUnsafe<ChunkRow[]>(
        `SELECT id, "documentId", content, "chunkIndex", metadata, 0.5 AS similarity
         FROM sales_agent."DocumentChunk"
         WHERE "organizationId" = $1 AND content ~* $2 LIMIT 10`,
        membership.organizationId,
        keywords || question,
      );
    })();

    const [vectorChunks, keywordChunks] = await Promise.all([vectorPromise, keywordPromise]);

    // 2. RRF fusion
    const fused = reciprocalRankFusion(
      [
        vectorChunks.map((c) => ({ id: c.id, score: c.similarity })),
        keywordChunks.map((c) => ({ id: c.id, score: c.similarity })),
      ],
      60,
      5,
    );

    // 3. Map fused IDs back to full chunk data (dedup by ID)
    const allChunks = [...vectorChunks, ...keywordChunks];
    const chunkMap = new Map(allChunks.map((c) => [c.id, c]));
    const chunks = fused.map((f) => chunkMap.get(f.id)!).filter(Boolean);

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "No relevant documents found. Try uploading some knowledge base documents first.",
        citations: [],
        chunks: [],
      });
    }

    // 3. Build context from retrieved chunks
    const context = chunks.map((c, i) =>
      `[Source ${i + 1}] (from ${(c.metadata as Record<string,string>)?.title || "Document"}, chunk ${c.chunkIndex}):\n${safe(c.content)}`
    ).join("\n\n");

    // 4. Answer with LLM — PROMPT_ARMOR + <user_data> wrapping on user question
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
          fallbackUsed: chunks.length > 0 && (chunks[0] as any).similarity === 0.5,
        },
      });
    } catch { /* metrics logging failure should not block */ }

    // 5. Build citations
    const citations = chunks.map((c) => ({
      id: c.id,
      documentId: c.documentId,
      title: (c.metadata as Record<string,string>)?.title || "Document",
      fileName: (c.metadata as Record<string,string>)?.fileName || "Unknown",
      excerpt: c.content.slice(0, 200) + (c.content.length > 200 ? "…" : ""),
      chunkIndex: c.chunkIndex,
      score: Math.round(c.similarity * 100) / 100,
    }));

    return NextResponse.json({
      answer: aiAnswer.answer,
      citations,
      chunks: chunks.map((c) => ({ id: c.id, content: c.content.slice(0, 300), score: Math.round(c.similarity * 100) / 100 })),
    });
  } catch (err) {
    console.error("[kb/ask] Error processing question:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to process your question. Please try again." }, { status: 500 });
  }
}
