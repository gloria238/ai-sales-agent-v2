/**
 * Hybrid Retriever — unified RAG retrieval pipeline.
 *
 * Pipeline:
 *   1. Query Rewriting (optional) — expand query into variants
 *   2. Query Routing (optional)   — classify query type → tuned retrieval params
 *   3. Hybrid Search (parallel): vector (pgvector) + keyword (tsvector/regex)
 *   4. RRF Fusion (k=60)          — merge vector + keyword results
 *   5. Reranker (Cohere/Noop)     — cross-encoder rescoring
 *   6. Confidence Gate (optional) — low-score → secondary retrieval
 *
 * This replaces the ~60 lines of duplicated inline SQL in kb/ask and ai-draft routes.
 */

import type { EmbeddedChunk, SearchResult, Chunk } from "./types";
import type { EmbeddingProvider } from "./embeddings";
import type { Reranker } from "./reranker";
import { createReranker } from "./reranker";
import { reciprocalRankFusion } from "./rrf";
import type { SqlExecutor, KeywordSearchResult } from "./keyword-search";
import { keywordSearch } from "./keyword-search";
import type { QueryRewriter } from "./query-rewriter";
import { getDefaultQueryRewriter } from "./query-rewriter";
import type { QueryRouter } from "./query-router";
import { getDefaultQueryRouter } from "./query-router";

// ── Types ────────────────────────────────────────────────────────────

export interface HybridRetrieveOptions {
  /** Number of results to return after the full pipeline. Default: 5 */
  topK?: number;
  /** Minimum similarity score threshold (0-1). Results below this are filtered. */
  minScore?: number;
  /** Reranker instance. Uses createReranker() auto-detect by default. */
  reranker?: Reranker;
  /** Enable confidence-gated secondary retrieval. Default: true */
  enableConfidenceGate?: boolean;
  /** Minimum score to skip secondary retrieval (only used if enableConfidenceGate=true). Default: 0.7 */
  confidenceThreshold?: number;
  /** Optional query variants from rewriter (if not provided, uses original query only) */
  queryVariants?: string[];
  /** Optional routing info to tune retrieval params */
  routeCategory?: QueryCategory;
  /** Query rewriter — expands query into variants. Uses getDefaultQueryRewriter() if not set. */
  rewriter?: QueryRewriter;
  /** Query router — classifies query for tuned retrieval params. Uses getDefaultQueryRouter() if not set. */
  router?: QueryRouter;
}

export type QueryCategory = "faq" | "product" | "pricing" | "competitor" | "case" | "general";

/** Per-category retrieval parameter tuning */
export const CATEGORY_PARAMS: Record<QueryCategory, { topK: number; vectorWeight: number; keywordWeight: number; minScore: number }> = {
  faq:        { topK: 3, vectorWeight: 0.6, keywordWeight: 0.4, minScore: 0.5 },
  product:    { topK: 5, vectorWeight: 0.5, keywordWeight: 0.5, minScore: 0.3 },
  pricing:    { topK: 3, vectorWeight: 0.7, keywordWeight: 0.3, minScore: 0.5 },
  competitor: { topK: 5, vectorWeight: 0.5, keywordWeight: 0.5, minScore: 0.3 },
  case:       { topK: 5, vectorWeight: 0.5, keywordWeight: 0.5, minScore: 0.3 },
  general:    { topK: 5, vectorWeight: 0.5, keywordWeight: 0.5, minScore: 0.3 },
};

export interface HybridRetrieveResult {
  query: string;
  results: Array<{
    chunk: Chunk;
    score: number;
  }>;
  /** Query variants used for retrieval (from rewriter) */
  queryVariants: string[];
  /** Category assigned by router */
  routeCategory: QueryCategory;
  /** Whether a secondary retrieval pass was triggered */
  secondaryRetrievalUsed: boolean;
  /** Total number of unique chunks considered (before final topK slice) */
  totalCandidates: number;
}

// ── Internal ChunkRow type (from raw SQL) ─────────────────────────────

type ChunkRow = {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
  similarity: number;
};

// ── Vector Search ─────────────────────────────────────────────────────

async function vectorSearch(
  sql: SqlExecutor,
  embedder: EmbeddingProvider,
  query: string,
  orgId: string,
  topK: number,
): Promise<ChunkRow[]> {
  try {
    const queryEmbedding = await embedder.embed(query);
    const embStr = `[${queryEmbedding.join(",")}]`;
    const rows = await sql(
      `SELECT id, "documentId", content, "chunkIndex", metadata,
              1 - (embedding <=> $1::vector) AS similarity
       FROM sales_agent."DocumentChunk"
       WHERE "organizationId" = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      embStr,
      orgId,
      topK,
    ) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: r.id as string,
      documentId: r.documentId as string,
      content: r.content as string,
      chunkIndex: r.chunkIndex as number,
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
      similarity: typeof r.similarity === "number" ? r.similarity : 0,
    }));
  } catch {
    return [];
  }
}

// ── Row → Chunk conversion ────────────────────────────────────────────

function rowToChunk(row: ChunkRow, orgId: string): Chunk {
  return {
    id: row.id,
    documentId: row.documentId,
    organizationId: orgId,
    content: row.content,
    index: row.chunkIndex,
    metadata: {
      title: (row.metadata as Record<string, string>)?.title ?? "Document",
      fileName: (row.metadata as Record<string, string>)?.fileName ?? "Unknown",
    },
  };
}

// ── Main Pipeline ─────────────────────────────────────────────────────

/**
 * Full hybrid retrieval pipeline with reranker and optional confidence gate.
 *
 * @param sql        — Raw SQL executor (Prisma.$queryRawUnsafe or similar)
 * @param embedder   — Embedding provider for vector search
 * @param query      — User's query
 * @param orgId      — Organization ID for tenant isolation
 * @param options    — Pipeline options (reranker, confidence gate, query variants, routing)
 */
export async function hybridRetrieve(
  sql: SqlExecutor,
  embedder: EmbeddingProvider,
  query: string,
  orgId: string,
  options: HybridRetrieveOptions = {},
): Promise<HybridRetrieveResult> {
  const topK = options.topK ?? 5;
  const minScore = options.minScore ?? 0;
  const reranker = options.reranker ?? createReranker();
  const enableConfidenceGate = options.enableConfidenceGate ?? true;
  const confidenceThreshold = options.confidenceThreshold ?? 0.7;
  const rewriter = options.rewriter ?? getDefaultQueryRewriter();
  const router = options.router ?? getDefaultQueryRouter();

  // ── Step 0a: Query Rewriting ───────────────────────────────────────
  const expandedQueries = await rewriter.rewrite(query);
  const queryVariants = options.queryVariants ?? expandedQueries.map((eq) => eq.text);

  // ── Step 0b: Query Routing ─────────────────────────────────────────
  const routeCategory = options.routeCategory ?? (await router.route(query)).category;
  const categoryParams = CATEGORY_PARAMS[routeCategory];

  // ── Step 1: Multi-query retrieval ──────────────────────────────────
  // Run hybrid search for each query variant in parallel
  const allVectorResults: ChunkRow[] = [];
  const allKeywordResults: KeywordSearchResult[] = [];

  for (const variant of queryVariants) {
    const searchTopK = Math.max(topK * 2, 10); // fetch more for reranker to work with
    const [vec, kw] = await Promise.all([
      vectorSearch(sql, embedder, variant, orgId, searchTopK),
      keywordSearch(sql, variant, orgId, searchTopK),
    ]);
    allVectorResults.push(...vec);
    allKeywordResults.push(...kw);
  }

  // Deduplicate by chunk ID within each list
  const seenVec = new Set<string>();
  const dedupedVector = allVectorResults.filter((r) => {
    if (seenVec.has(r.id)) return false;
    seenVec.add(r.id);
    return true;
  });
  const seenKw = new Set<string>();
  const dedupedKeyword = allKeywordResults.filter((r) => {
    if (seenKw.has(r.id)) return false;
    seenKw.add(r.id);
    return true;
  });

  // ── Step 2: RRF Fusion ─────────────────────────────────────────────
  const fused = reciprocalRankFusion(
    [
      dedupedVector.map((c) => ({ id: c.id, score: c.similarity })),
      dedupedKeyword.map((c) => ({ id: c.id, score: c.score })),
    ],
    60,
    Math.max(topK * 3, 15), // keep more candidates for reranker
  );

  // Convert keyword results to ChunkRow format for unified handling
  const keywordRows: ChunkRow[] = dedupedKeyword.map((r) => ({
    id: r.id,
    documentId: r.documentId,
    content: r.content,
    chunkIndex: r.chunkIndex,
    metadata: r.metadata,
    similarity: r.score,
  }));

  // Map fused IDs back to full chunk data
  const allChunks = [...dedupedVector, ...keywordRows];
  const chunkMap = new Map(allChunks.map((c) => [c.id, c]));
  let candidates = fused
    .map((f) => {
      const row = chunkMap.get(f.id);
      return row ? { row, rrfScore: f.score } : null;
    })
    .filter((c): c is { row: ChunkRow; rrfScore: number } => c !== null);

  const totalCandidates = candidates.length;

  // ── Step 3: Confidence Gate (secondary retrieval) ───────────────────
  let secondaryRetrievalUsed = false;
  if (enableConfidenceGate && candidates.length > 0) {
    const topScore = candidates[0].rrfScore;
    if (topScore < confidenceThreshold) {
      secondaryRetrievalUsed = true;
      // Expand: use original query with relaxed params for a second pass
      const expandedTopK = Math.max(topK * 3, 20);
      const [vec2, kw2] = await Promise.all([
        vectorSearch(sql, embedder, query, orgId, expandedTopK),
        keywordSearch(sql, query, orgId, expandedTopK),
      ]);

      // Merge with existing, deduplicate
      const existingIds = new Set(candidates.map((c) => c.row.id));
      for (const r of vec2) { if (!existingIds.has(r.id)) { candidates.push({ row: r, rrfScore: r.similarity * 0.5 }); existingIds.add(r.id); } }
      for (const r of kw2) { if (!existingIds.has(r.id)) { candidates.push({ row: { id: r.id, documentId: r.documentId, content: r.content, chunkIndex: r.chunkIndex, metadata: r.metadata, similarity: r.score }, rrfScore: r.score * 0.5 }); existingIds.add(r.id); } }
    }
  }

  // ── Step 4: Filter by minScore ──────────────────────────────────────
  candidates = candidates.filter((c) => c.rrfScore >= minScore);

  if (candidates.length === 0) {
    return { query, results: [], queryVariants, routeCategory, secondaryRetrievalUsed, totalCandidates };
  }

  // ── Step 5: Reranker ────────────────────────────────────────────────
  // Convert to SearchResult format for the reranker
  const searchResults: SearchResult[] = candidates.map((c) => ({
    chunk: rowToChunk(c.row, orgId),
    score: c.rrfScore,
  }));

  const toRerank = searchResults.slice(0, Math.min(topK * 4, searchResults.length));
  const reranked = await reranker.rerank(query, toRerank, topK);

  return {
    query,
    results: reranked,
    queryVariants,
    routeCategory,
    secondaryRetrievalUsed,
    totalCandidates,
  };
}
