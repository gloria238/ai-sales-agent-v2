/**
 * Query Router — classifies user queries into categories for tuned retrieval.
 *
 * Why: Different question types need different retrieval strategies.
 *   - "How to reset my password?" → FAQ (exact match, strict threshold)
 *   - "Tell me about your product features" → Product (broad recall)
 *   - "How much does it cost?" → Pricing (precise match, cite specific doc)
 *   - "How do you compare to Competitor X?" → Competitor (broad recall)
 *   - "Do you have any customer success stories?" → Case (case study docs)
 *
 * Pattern: Interface in rag-core, LLM classifier injected by caller.
 */

import type { QueryCategory } from "./hybrid-retriever";

// ── Types ────────────────────────────────────────────────────────────

export interface RoutingResult {
  category: QueryCategory;
  confidence: number; // 0-1
}

export interface QueryRouter {
  route(query: string): Promise<RoutingResult>;
}

// ── Noop Implementation ───────────────────────────────────────────────

/** No-op router — classifies everything as "general". */
export class NoopQueryRouter implements QueryRouter {
  async route(_query: string): Promise<RoutingResult> {
    return { category: "general", confidence: 1.0 };
  }
}

// ── Keyword-based Router (fast, no LLM) ──────────────────────────────

/** Fast keyword-based router. Good for common patterns, falls back to general. */
export class KeywordQueryRouter implements QueryRouter {
  private rules: Array<{ keywords: RegExp[]; category: QueryCategory }>;

  constructor() {
    this.rules = [
      {
        keywords: [/how|what|where|when|can i|do you|is there|does it/i],
        category: "faq",
      },
      {
        keywords: [/pric|cost|how much|fee|charge|subscription|plan|tier/i],
        category: "pricing",
      },
      {
        keywords: [/compet|vs|compare|alternative|instead of|better than|difference between/i],
        category: "competitor",
      },
      {
        keywords: [/case|success|story|customer|client|example|testimonial|review/i],
        category: "case",
      },
      {
        keywords: [/product|feature|capability|function|integration|api|support/i],
        category: "product",
      },
    ];
  }

  async route(query: string): Promise<RoutingResult> {
    const lower = query.toLowerCase();

    // Check each category's keyword rules
    let bestMatch: { category: QueryCategory; count: number } = { category: "general", count: 0 };

    for (const rule of this.rules) {
      const matchCount = rule.keywords.filter((re) => re.test(lower)).length;
      if (matchCount > bestMatch.count) {
        bestMatch = { category: rule.category, count: matchCount };
      }
    }

    return {
      category: bestMatch.category,
      confidence: bestMatch.count > 0 ? Math.min(bestMatch.count / 2, 1.0) : 0.5,
    };
  }
}

// ── LLM-Powered Router ────────────────────────────────────────────────

export type RouteLLMCaller = (prompt: string, system?: string, options?: Record<string, unknown>) => Promise<{ result: { category: string; confidence: number } }>;

/**
 * LLM-powered query router using DeepSeek (or any compatible LLM) for zero-shot classification.
 */
export class LLMQueryRouter implements QueryRouter {
  private callLLM: RouteLLMCaller;

  constructor(callLLM: RouteLLMCaller) {
    this.callLLM = callLLM;
  }

  async route(query: string): Promise<RoutingResult> {
    const validCategories = ["faq", "product", "pricing", "competitor", "case", "general"];

    const system = `You are a query classifier for a RAG system. Classify the user's question into one category:

- "faq" — how-to questions, policies, common operational questions
- "product" — product features, capabilities, integrations, technical specs
- "pricing" — costs, plans, billing, subscription fees
- "competitor" — comparisons with competitors, alternatives, differentiation
- "case" — customer stories, case studies, testimonials, examples
- "general" — anything that doesn't clearly fit above

Return JSON: { "category": "...", "confidence": 0.0-1.0 }`;

    const prompt = `Classify this query:\n\n${query}`;

    try {
      const { result } = await this.callLLM(prompt, system, { temperature: 0.0, timeoutMs: 5_000 });
      const category = validCategories.includes(result.category) ? result.category : "general";
      return { category: category as QueryCategory, confidence: result.confidence ?? 0.5 };
    } catch {
      return { category: "general", confidence: 0.5 };
    }
  }
}

// ── Factory ───────────────────────────────────────────────────────────

let _defaultRouter: QueryRouter | null = null;

export function setDefaultQueryRouter(router: QueryRouter): void {
  _defaultRouter = router;
}

export function getDefaultQueryRouter(): QueryRouter {
  return _defaultRouter ?? new KeywordQueryRouter(); // keyword router is fast & free
}
