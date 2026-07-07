import type { EmbeddedChunk, SearchResult, SearchResponse, Chunk } from "./types";
import type { EmbeddingProvider } from "./embeddings";
import type { StorageAdapter } from "./storage";
import type { Reranker } from "./reranker";
import { createReranker } from "./reranker";

export interface RetrieveOptions {
  topK?: number;
  minScore?: number;
  reranker?: Reranker;
}

/** Retrieve relevant chunks for a query.
 *
 *  Two paths:
 *    1. If storage.search() is available (PgVector), use native pgvector <=> search.
 *    2. Otherwise fall back to in-memory cosine similarity (InMemoryStorage / MVP).
 *
 *  Multi-tenant: only searches within the given organization. */
export async function retrieve(
  query: string,
  organizationId: string,
  embedder: EmbeddingProvider,
  storage: StorageAdapter,
  options: RetrieveOptions = {},
): Promise<SearchResponse> {
  const topK = options.topK ?? 5;
  const minScore = options.minScore ?? 0;
  const reranker = options.reranker ?? createReranker();

  let scored: SearchResult[];

  // ── Path 1: Native pgvector search ─────────────────────────────────
  if (storage.search) {
    const queryEmbedding = await embedder.embed(query);
    const nativeResults = await storage.search(queryEmbedding, organizationId, Math.max(topK * 4, 15));

    scored = nativeResults
      .filter((r) => r.score >= minScore)
      .map((r) => ({
        chunk: {
          id: r.id,
          documentId: r.documentId,
          organizationId: r.organizationId,
          content: r.content,
          index: r.index,
          metadata: r.metadata,
        } satisfies Chunk,
        score: r.score,
      }));

  // ── Path 2: In-memory cosine similarity fallback ───────────────────
  } else {
    const queryEmbedding = await embedder.embed(query);
    const chunks = await storage.getChunks(organizationId);
    if (chunks.length === 0) {
      return { query, results: [], topK };
    }

    scored = chunks
      .map((chunk) => ({
        chunk: embeddedChunkToChunk(chunk),
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }

  // ── Reranker ───────────────────────────────────────────────────────
  if (scored.length > 0) {
    const toRerank = scored.slice(0, Math.min(topK * 4, scored.length));
    scored = await reranker.rerank(query, toRerank, topK);
  }

  return {
    query,
    results: scored.slice(0, topK),
    topK,
  };
}

function embeddedChunkToChunk(ec: EmbeddedChunk): Chunk {
  return {
    id: ec.id,
    documentId: ec.documentId,
    organizationId: ec.organizationId,
    content: ec.content,
    index: ec.index,
    metadata: ec.metadata,
  };
}

/** Cosine similarity between two vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}
