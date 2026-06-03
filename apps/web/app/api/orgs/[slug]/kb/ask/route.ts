import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { callDeepSeekJSON, extractBalancedJSON } from "@salesagent/ai-core";
import { createEmbeddingProvider } from "@salesagent/rag-core/embeddings";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const { question } = (await req.json()) as { question?: string };
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  try {
    // 1. Try vector search first, fall back to keyword search
    let chunks: Array<{
      id: string; document_id: string; content: string; chunk_index: number;
      metadata: Record<string, unknown>; similarity: number;
    }> = [];

    try {
      const embedder = createEmbeddingProvider();
      const queryEmbedding = await embedder.embed(question);
      const embStr = `[${queryEmbedding.join(",")}]`;
      chunks = await prisma.$queryRawUnsafe<typeof chunks>(
        `SELECT id, document_id, content, chunk_index, metadata,
                1 - (embedding <=> $1::vector) AS similarity
         FROM sales_agent."DocumentChunk"
         WHERE organization_id = $2 AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT 5`,
        embStr,
        membership.organizationId,
      );
    } catch {
      // Vector search failed — fall back to keyword search
    }

    // 2. Fallback: keyword search (ILIKE) if no vector results
    if (chunks.length === 0) {
      const keywords = question.split(/\s+/).filter((w) => w.length > 2).join(" | ");
      const raw = await prisma.$queryRawUnsafe<typeof chunks>(
        `SELECT id, document_id, content, chunk_index, metadata, 0.5 AS similarity
         FROM sales_agent."DocumentChunk"
         WHERE organization_id = $1
           AND content ~* $2
         LIMIT 5`,
        membership.organizationId,
        keywords || question,
      );
      chunks = raw;
    }

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "No relevant documents found. Try uploading some knowledge base documents first.",
        citations: [],
        chunks: [],
      });
    }

    // 3. Build context from retrieved chunks
    const context = chunks.map((c, i) =>
      `[Source ${i + 1}] (from ${(c.metadata as Record<string,string>)?.title || "Document"}, chunk ${c.chunk_index}):\n${c.content}`
    ).join("\n\n");

    // 4. Answer with LLM
    const system = `You are a helpful AI assistant. Answer questions based ONLY on the provided context. If the context doesn't contain the answer, say so. Never make up information. Cite sources using [Source N] notation.`;
    const prompt = `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer the question based on the context above. Include source citations like [Source 1] in your answer.`;

    const aiAnswer = await callDeepSeekJSON<{ answer: string }>(prompt, system, { temperature: 0.3 });

    // 5. Build citations
    const citations = chunks.map((c) => ({
      id: c.id,
      documentId: c.document_id,
      title: (c.metadata as Record<string,string>)?.title || "Document",
      fileName: (c.metadata as Record<string,string>)?.fileName || "Unknown",
      excerpt: c.content.slice(0, 200) + (c.content.length > 200 ? "…" : ""),
      chunkIndex: c.chunk_index,
      score: Math.round(c.similarity * 100) / 100,
    }));

    return NextResponse.json({
      answer: aiAnswer.answer,
      citations,
      chunks: chunks.map((c) => ({ id: c.id, content: c.content.slice(0, 300), score: Math.round(c.similarity * 100) / 100 })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    return NextResponse.json({ error: `Query failed: ${msg}` }, { status: 500 });
  }
}
