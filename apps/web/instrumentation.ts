/**
 * Next.js instrumentation hook — Sentry + RAG pipeline initialization.
 */
export async function register() {
  // ── Sentry ──────────────────────────────────────────────────────
  if (process.env.NEXT_RUNTIME === "nodejs" && (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge" && (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) {
    await import("./sentry.edge.config");
  }

  // ── RAG Pipeline ────────────────────────────────────────────────
  // Wire LLM-powered Query Rewriter + Router at startup.
  // The caller passes callDeepSeekJSON — rag-core never imports ai-core directly.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { callDeepSeekJSON } = await import("@salesagent/ai-core");
      const { initRagPipeline } = await import("@salesagent/rag-core/rag-init");
      if (typeof callDeepSeekJSON === "function") {
        initRagPipeline(callDeepSeekJSON);
      }
    } catch { /* rag-core or ai-core unavailable — use Noop rewriter + Keyword router */ }
  }
}
