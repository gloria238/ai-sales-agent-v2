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
  // Silently degrades to Noop if DEEPSEEK_API_KEY is not set.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { initRagPipeline } = await import("@salesagent/rag-core/rag-init");
      await initRagPipeline();
    } catch { /* rag-core may not be available (e.g. edge runtime) */ }
  }
}
