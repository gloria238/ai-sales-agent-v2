/**
 * RAG Initialization — wires up LLM-powered rewriter and router at app startup.
 *
 * Import this once at app startup (e.g., in instrumentation.ts or a top-level layout)
 * to enable query rewriting and intelligent routing for all RAG calls.
 *
 * Without this, the system uses NoopQueryRewriter + KeywordQueryRouter (fast, free, zero setup).
 * With this, it uses DeepSeek for more intelligent query expansion and classification.
 *
 * Usage:
 *   import { initRagPipeline } from "@salesagent/rag-core/rag-init";
 *   initRagPipeline(); // call once at startup
 */

import { LLMQueryRewriter, setDefaultQueryRewriter, type RewriteLLMCaller } from "./query-rewriter";
import { LLMQueryRouter, setDefaultQueryRouter, type RouteLLMCaller } from "./query-router";

/**
 * Initialize the RAG pipeline with LLM-powered rewriter and router.
 *
 * Dynamically imports @salesagent/ai-core to avoid hard dependency.
 * Silently degrades to Noop if ai-core is not available or DEEPSEEK_API_KEY is not set.
 */
export async function initRagPipeline(): Promise<void> {
  // Only enable LLM features if DEEPSEEK_API_KEY is configured
  if (!process.env.DEEPSEEK_API_KEY) {
    console.log("[rag-init] DEEPSEEK_API_KEY not set — using Noop rewriter + Keyword router");
    return;
  }

  try {
    // Dynamic import — ai-core is not a hard dependency of rag-core
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiCore: any = await import("@salesagent/ai-core");
    const callLLM = aiCore.callDeepSeekJSON as <T>(prompt: string, system?: string, options?: Record<string, unknown>) => Promise<{ result: T }>;

    // ── Wire LLM Query Rewriter ────────────────────────────────────
    const rewriteLLMCaller: RewriteLLMCaller = async (prompt, system, options) => {
      const opts = options as { temperature?: number; timeoutMs?: number } | undefined;
      return callLLM<{ variants: Array<{ text: string; type: string }> }>(
        prompt,
        system,
        { temperature: opts?.temperature ?? 0.2, timeoutMs: opts?.timeoutMs ?? 8_000 },
      );
    };
    setDefaultQueryRewriter(new LLMQueryRewriter(rewriteLLMCaller));

    // ── Wire LLM Query Router ─────────────────────────────────────
    const routeLLMCaller: RouteLLMCaller = async (prompt, system, options) => {
      const opts = options as { temperature?: number; timeoutMs?: number } | undefined;
      return callLLM<{ category: string; confidence: number }>(
        prompt,
        system,
        { temperature: opts?.temperature ?? 0.0, timeoutMs: opts?.timeoutMs ?? 5_000 },
      );
    };
    setDefaultQueryRouter(new LLMQueryRouter(routeLLMCaller));

    console.log("[rag-init] LLM-powered Query Rewriter + Router enabled (DeepSeek)");
  } catch (err) {
    console.warn("[rag-init] Failed to load ai-core — using Noop rewriter + Keyword router:", err instanceof Error ? err.message : String(err));
  }
}
