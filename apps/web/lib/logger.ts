import crypto from "crypto";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LOG_LEVEL = (process.env.LOG_LEVEL || "info") as LogLevel;
const minLevelValue = LOG_LEVEL_ORDER[MIN_LOG_LEVEL] ?? 1;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JWT_RE = /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g;

/** Hash PII values (emails, JWTs) before logging. */
function redactValue(v: unknown): unknown {
  if (typeof v !== "string") return v;
  let redacted = v.replace(EMAIL_RE, (m) => `sha256:${crypto.createHash("sha256").update(m).digest("hex").slice(0, 12)}`);
  redacted = redacted.replace(JWT_RE, "[REDACTED_JWT]");
  return redacted;
}

function redactObject(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = typeof v === "string" ? redactValue(v) : v;
  }
  return out;
}

export function getRequestContext(req: Request) {
  const url = new URL(req.url);
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return {
    method: req.method,
    path: url.pathname,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

function shouldLog(level: LogLevel): boolean {
  return (LOG_LEVEL_ORDER[level] ?? 1) >= minLevelValue;
}

export function logDebug(ctx: ReturnType<typeof getRequestContext>, message: string, data?: Record<string, unknown>) {
  if (!shouldLog("debug")) return;
  const entry = { level: "debug", ...ctx, message, ...(data ? redactObject(data) : {}) };
  console.log(JSON.stringify(entry));
}

export function logInfo(ctx: ReturnType<typeof getRequestContext>, message: string, data?: Record<string, unknown>) {
  if (!shouldLog("info")) return;
  const entry = { level: "info", ...ctx, message, ...(data ? redactObject(data) : {}) };
  console.log(JSON.stringify(entry));
}

export function logError(ctx: ReturnType<typeof getRequestContext>, message: string, err?: unknown) {
  if (!shouldLog("error")) return;
  const entry = {
    level: "error",
    ...ctx,
    message,
    error: err instanceof Error ? { message: err.message, name: err.name } : String(err ?? "unknown"),
  };
  console.error(JSON.stringify(entry));
}

export function logWarn(ctx: ReturnType<typeof getRequestContext>, message: string, data?: Record<string, unknown>) {
  if (!shouldLog("warn")) return;
  const entry = { level: "warn", ...ctx, message, ...(data ? redactObject(data) : {}) };
  console.warn(JSON.stringify(entry));
}

// ── Trace Helpers ──────────────────────────────────────────────────

/** Trace context for distributed tracing (HTTP → Queue → LLM → DB).
 *  Injected into log entries so every hop carries the same requestId.
 */
export interface TraceContext {
  requestId: string;
  spanId?: string;
  parentSpanId?: string;
}

/** Return a partial record to spread into any log entry for trace correlation. */
export function withTrace(trace: TraceContext): Record<string, unknown> {
  return {
    requestId: trace.requestId,
    spanId: trace.spanId,
    parentSpanId: trace.parentSpanId,
  };
}
