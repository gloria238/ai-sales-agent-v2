/**
 * Query Rewriter — expands user queries into multiple variants for better retrieval recall.
 *
 * Why: Users phrase the same question differently ("怎么退钱" vs "退款流程" vs "如何取消订单").
 * A single query may miss relevant chunks that use different wording.
 * Rewriting generates multiple variants, each searched independently, results merged via RRF.
 *
 * Pattern: Interface in rag-core, LLM implementation injected by caller (like eval judge functions).
 */

// ── Types ────────────────────────────────────────────────────────────

export interface ExpandedQuery {
  /** The query text */
  text: string;
  /** Type of rewrite */
  type: "original" | "keywords" | "synonym" | "decomposition";
}

export interface QueryRewriter {
  /**
   * Rewrite a user query into multiple variants.
   * Always includes the original query as one of the results.
   */
  rewrite(query: string): Promise<ExpandedQuery[]>;
}

// ── Noop Implementation ───────────────────────────────────────────────

/** No-op rewriter — returns the original query unchanged. */
export class NoopQueryRewriter implements QueryRewriter {
  async rewrite(query: string): Promise<ExpandedQuery[]> {
    return [{ text: query, type: "original" }];
  }
}

// ── Factory ───────────────────────────────────────────────────────────

let _defaultRewriter: QueryRewriter | null = null;

/** Set the default query rewriter (call once at app startup). */
export function setDefaultQueryRewriter(rewriter: QueryRewriter): void {
  _defaultRewriter = rewriter;
}

/** Get the default query rewriter, or a Noop if none was set. */
export function getDefaultQueryRewriter(): QueryRewriter {
  return _defaultRewriter ?? new NoopQueryRewriter();
}

// ── LLM-Powered Rewriter ──────────────────────────────────────────────

export type RewriteLLMCaller = (prompt: string, system?: string, options?: Record<string, unknown>) => Promise<{ result: { variants: Array<{ text: string; type: string }> } }>;

/**
 * LLM-powered query rewriter that uses DeepSeek (or any compatible LLM) to:
 *   1. Extract bare keywords for BM25/tsvector optimization
 *   2. Generate a synonym/paraphrase variant
 *   3. Decompose complex questions into sub-questions
 *
 * The LLM call is injected as a callback — keeps rag-core LLM-agnostic.
 */
export class LLMQueryRewriter implements QueryRewriter {
  private callLLM: RewriteLLMCaller;

  constructor(callLLM: RewriteLLMCaller) {
    this.callLLM = callLLM;
  }

  async rewrite(query: string): Promise<ExpandedQuery[]> {
    const system = `You are a query rewriting expert for RAG (Retrieval-Augmented Generation) systems.
Your job is to expand a user's search query into multiple variants that will find relevant documents.

Rules:
- Always include the original query
- "keywords": extract the core keywords (nouns, key terms) — this helps keyword-based search
- "synonym": rewrite the query using different words with the same meaning — this helps semantic search
- "decomposition": for complex multi-part questions, break into separate simple questions; for simple questions, skip this

Return JSON: { "variants": [{ "text": "...", "type": "original|keywords|synonym|decomposition" }] }
Max 4 variants total (including original).`;

    const prompt = `Rewrite this search query into multiple variants:\n\nQuery: ${query}\n\nReturn JSON with variants array.`;

    try {
      const { result } = await this.callLLM(prompt, system, { temperature: 0.2, timeoutMs: 8_000 });
      const variants = result.variants.filter((v) => v.text?.trim());
      if (variants.length === 0) return [{ text: query, type: "original" }];
      return variants.map((v) => ({
        text: v.text.trim(),
        type: (["original", "keywords", "synonym", "decomposition"].includes(v.type) ? v.type : "synonym") as ExpandedQuery["type"],
      }));
    } catch {
      // LLM call failed — fall back to original query only
      return [{ text: query, type: "original" }];
    }
  }
}
