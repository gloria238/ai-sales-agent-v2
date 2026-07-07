/**
 * RAG Initialization — wires up LLM-powered rewriter and router at app startup.
 *
 * This module does NOT import @salesagent/ai-core directly (rag-core has no LLM dependency).
 * Instead, the caller provides a `callDeepSeekJSON` function — this keeps rag-core
 * LLM-agnostic and prevents webpack from trying to resolve ai-core at build time.
 *
 * Usage in instrumentation.ts:
 *   import { callDeepSeekJSON } from "@salesagent/ai-core";
 *   initRagPipeline(callDeepSeekJSON);
 */

import { LLMQueryRewriter, setDefaultQueryRewriter, type RewriteLLMCaller } from "./query-rewriter";
import { LLMQueryRouter, setDefaultQueryRouter, type RouteLLMCaller } from "./query-router";

type DeepSeekCaller = (prompt: string, system?: string, options?: Record<string, unknown>) => Promise<{ result: unknown }>;

/**
 * Initialize RAG pipeline with LLM-powered rewriter and router.
 *
 * @param callDeepSeekJSON — The LLM caller function (from @salesagent/ai-core).
 *   Passed in by the caller so rag-core never imports ai-core directly.
 *   If omitted, uses Noop rewriter + Keyword router (fast, free, zero setup).
 */
export function initRagPipeline(callDeepSeekJSON?: DeepSeekCaller): void {
  if (!callDeepSeekJSON) {
    console.log("[rag-init] No LLM caller provided — using Keyword router + Noop rewriter");
    return;
  }

  // ── Wire LLM Query Rewriter ────────────────────────────────────
  const rewriteLLMCaller: RewriteLLMCaller = async (prompt, system, options) => {
    const opts = options as { temperature?: number; timeoutMs?: number } | undefined;
    const result = await callDeepSeekJSON(prompt, system, {
      temperature: opts?.temperature ?? 0.2,
      timeoutMs: opts?.timeoutMs ?? 8_000,
    });
    return result as { result: { variants: Array<{ text: string; type: string }> } };
  };
  setDefaultQueryRewriter(new LLMQueryRewriter(rewriteLLMCaller));

  // ── Wire LLM Query Router ─────────────────────────────────────
  const routeLLMCaller: RouteLLMCaller = async (prompt, system, options) => {
    const opts = options as { temperature?: number; timeoutMs?: number } | undefined;
    const result = await callDeepSeekJSON(prompt, system, {
      temperature: opts?.temperature ?? 0.0,
      timeoutMs: opts?.timeoutMs ?? 5_000,
    });
    return result as { result: { category: string; confidence: number } };
  };
  setDefaultQueryRouter(new LLMQueryRouter(routeLLMCaller));

  console.log("[rag-init] LLM-powered Query Rewriter + Router enabled");
}
