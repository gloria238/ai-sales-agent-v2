import type { SearchResult } from "./types";

/**
 * Reranker interface — reserved for future use.
 *
 * When you're ready to add a real reranker (Cohere, BGE, Jina, cross-encoder),
 * implement this interface. For now, NoopReranker passes results through unchanged.
 */
export interface Reranker {
  rerank(query: string, results: SearchResult[]): Promise<SearchResult[]>;
}

/** No-op reranker — passes results through without modification. */
export class NoopReranker implements Reranker {
  async rerank(_query: string, results: SearchResult[]): Promise<SearchResult[]> {
    return results;
  }
}
