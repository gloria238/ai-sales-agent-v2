import { NextResponse } from "next/server";
import type { getRequestContext } from "@/lib/logger";
import { logError } from "@/lib/logger";

type Ctx = ReturnType<typeof getRequestContext>;

interface ApiErrorOptions {
  /** HTTP status code to return. Derived from error type when 500. */
  status?: number;
  /** Safe message for the client (never expose stack traces). */
  message?: string;
  /** Whether to log the error. Defaults to true for 5xx, false for 4xx. */
  log?: boolean;
}

/**
 * Centralized API error handler.
 * - Maps known error types to appropriate HTTP status codes.
 * - Returns safe, non-leaking JSON responses.
 * - Logs 5xx errors (and optionally 4xx) via the structured logger.
 * - Reports to Sentry for 5xx errors (when SENTRY_DSN is configured).
 */
export function handleApiError(
  ctx: Ctx,
  error: unknown,
  opts: ApiErrorOptions = {},
): NextResponse {
  const shouldLog = opts.log ?? true;
  const message = opts.message ?? getSafeMessage(error);
  let status = opts.status ?? getStatus(error);

  // Determine if this is a server error (500 range)
  const isServerError = status >= 500;

  if (shouldLog) {
    logError(ctx, message, error);
  }

  // Report to Sentry for server errors
  if (isServerError && typeof globalThis !== "undefined") {
    try {
      // Dynamic import to avoid bundle issues when Sentry is not configured
      const Sentry = (globalThis as any).__SENTRY__;
      if (Sentry?.captureException) {
        Sentry.captureException(error);
      }
    } catch {
      // Sentry not available — noop
    }
  }

  return NextResponse.json(
    { error: isServerError ? "Internal server error" : message },
    { status },
  );
}

/** Map error to a safe, non-leaking client message. */
function getSafeMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "ZodError") return "Invalid input";
    if (error.message.includes("Unique constraint")) return "Resource already exists";
    if (error.message.includes("Record to delete does not exist")) return "Resource not found";
    return error.message.length < 200 ? error.message : "Unexpected error";
  }
  return "Unexpected error";
}

/** Map error type/name to an HTTP status code. */
function getStatus(error: unknown): number {
  if (error instanceof Error) {
    switch (error.name) {
      case "ZodError":
        return 400;
      case "NotFoundError":
        return 404;
      case "ConflictError":
        return 409;
      case "UnauthorizedError":
        return 401;
      case "ForbiddenError":
        return 403;
      case "RateLimitError":
        return 429;
      default:
        break;
    }
    // Prisma not-found errors
    if (error.message.includes("Record to delete does not exist") ||
        error.message.includes("Record to update does not exist")) {
      return 404;
    }
    // Prisma unique constraint violations
    if (error.message.includes("Unique constraint")) {
      return 409;
    }
  }
  return 500;
}

/** Shorthand: throw a 404 Not Found. */
export function notFound(message = "Not found"): never {
  const err = new Error(message);
  err.name = "NotFoundError";
  throw err;
}

/** Shorthand: throw a 400 Bad Request. */
export function badRequest(message = "Bad request"): never {
  const err = new Error(message);
  err.name = "ZodError";
  throw err;
}

/** Shorthand: throw a 403 Forbidden. */
export function forbidden(message = "Forbidden"): never {
  const err = new Error(message);
  err.name = "ForbiddenError";
  throw err;
}
