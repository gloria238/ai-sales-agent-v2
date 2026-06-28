/**
 * Next.js instrumentation hook — Sentry server initialization.
 * Only registers when SENTRY_DSN is configured.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge" && (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) {
    await import("./sentry.edge.config");
  }
}
