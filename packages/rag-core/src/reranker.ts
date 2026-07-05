import type { SearchResult } from "./types";

/**
 * Reranker interface — pluggable re-ranking for search results.
 *
 * Implementations:
 *   - NoopReranker: passes results through unchanged (default)
 *   - CohereReranker: uses Cohere Rerank API for cross-encoder scoring
 */
export interface Reranker {
  rerank(query: string, results: SearchResult[], topN?: number): Promise<SearchResult[]>;
}

/** No-op reranker — passes results through without modification. */
export class NoopReranker implements Reranker {
  async rerank(_query: string, results: SearchResult[], topN?: number): Promise<SearchResult[]> {
    return topN ? results.slice(0, topN) : results;
  }
}

/**
 * Cohere Reranker — uses Cohere's Rerank API for cross-encoder scoring.
 *
 * Requires COHERE_API_KEY environment variable.
 * Falls back to NoopReranker on API failure.
 *
 * Model: rerank-multilingual-v3.0 (supports Chinese + English)
 */
export class CohereReranker implements Reranker {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model = "rerank-multilingual-v3.0") {
    const key = apiKey ?? process.env.COHERE_API_KEY;
    if (!key) throw new Error("COHERE_API_KEY is required for CohereReranker");
    this.apiKey = key;
    this.model = model;
  }

  async rerank(
    query: string,
    results: SearchResult[],
    topN?: number,
  ): Promise<SearchResult[]> {
    if (results.length === 0) return [];

    const top = topN ?? results.length;

    try {
      const response = await fetch("https://api.cohere.com/v1/rerank", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          query,
          documents: results.map((r) => r.chunk.content),
          top_n: top,
          return_documents: false,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Cohere API ${response.status}: ${text.slice(0, 200)}`);
      }

      const data = (await response.json()) as {
        results: Array<{ index: number; relevance_score: number }>;
      };

      return data.results.map((r) => ({
        ...results[r.index],
        score: r.relevance_score,
      }));
    } catch (e) {
      console.warn(
        `[CohereReranker] Failed, falling back to Noop: ${e instanceof Error ? e.message : String(e)}`,
      );
      return results.slice(0, top);
    }
  }
}

/**
 * Factory: returns CohereReranker if COHERE_API_KEY is set, otherwise NoopReranker.
 * Use this for zero-config deployments — gracefully degrades when no API key.
 */
export function createReranker(): Reranker {
  const key = process.env.COHERE_API_KEY;
  return key ? new CohereReranker(key) : new NoopReranker();
}
