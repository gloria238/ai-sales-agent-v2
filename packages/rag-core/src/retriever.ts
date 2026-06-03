import type { EmbeddedChunk, SearchResult, SearchResponse } from "./types";
import type { EmbeddingProvider } from "./embeddings";
import type { StorageAdapter } from "./storage";
import type { Reranker } from "./reranker";
import { NoopReranker } from "./reranker";

export interface RetrieveOptions {
  topK?: number;
  minScore?: number;
  reranker?: Reranker;
}

/** Retrieve relevant chunks for a query using cosine similarity.
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
  const reranker = options.reranker ?? new NoopReranker();

  // 1. Embed the query
  const queryEmbedding = await embedder.embed(query);

  // 2. Get all chunks for this org
  const chunks = await storage.getChunks(organizationId);
  if (chunks.length === 0) {
    return { query, results: [], topK };
  }

  // 3. Compute cosine similarity
  let scored: SearchResult[] = chunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // 4. Filter by minimum score
  scored = scored.filter((r) => r.score >= minScore);

  // 5. Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // 6. Apply reranker (NoopReranker by default — just passes through)
  if (scored.length > 0) {
    scored = await reranker.rerank(
      query,
      scored.slice(0, Math.min(topK * 2, scored.length)), // rerank 2x topK
    );
  }

  // 7. Take top K
  return {
    query,
    results: scored.slice(0, topK),
    topK,
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
