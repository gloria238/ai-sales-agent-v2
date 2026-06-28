import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;
let ratelimitWindow = 0; // track which window size the cached instance was built for
let redisFallbackWarning = false;

function getRatelimit(windowSize = 100): Ratelimit {
  // Re-create if window size differs from cached instance
  if (ratelimit && ratelimitWindow === windowSize) return ratelimit;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    const redis = new Redis({ url: redisUrl, token: redisToken });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(windowSize, "1 m"),
      analytics: false,
      prefix: `sales-agent:rl:${windowSize}`,
    });
    ratelimitWindow = windowSize;
    return ratelimit;
  }

  // Fallback: try parsing REDIS_URL for Upstash REST
  const redisUrlRaw = process.env.REDIS_URL;
  if (redisUrlRaw && !redisFallbackWarning) {
    console.warn("[rate-limit] UPSTASH_REDIS_REST_URL not set — falling back to in-memory rate limiting (not suitable for production)");
    redisFallbackWarning = true;
  }

  // In-memory fallback with TTL cleanup (shared across function calls)
  const memoryMap = new Map<string, { count: number; resetAt: number }>();
  ratelimit = {
    limit: async (identifier: string) => {
      const now = Date.now();
      const entry = memoryMap.get(identifier);
      if (!entry || now > entry.resetAt) {
        memoryMap.set(identifier, { count: 1, resetAt: now + 60_000 });
        return { success: true, limit: windowSize, remaining: windowSize - 1, reset: now + 60_000 };
      }
      entry.count++;
      return {
        success: entry.count <= windowSize,
        limit: windowSize,
        remaining: Math.max(0, windowSize - entry.count),
        reset: entry.resetAt,
      };
    },
    blockUntilReady: async () => {},
  } as unknown as Ratelimit;

  ratelimitWindow = windowSize;
  return ratelimit;
}

export async function checkRateLimit(
  identifier: string,
  windowSize = 100,
): Promise<{
  allowed: boolean;
  remaining: number;
  reset: number;
}> {
  const failClosed = process.env.RATE_LIMIT_FAIL_CLOSED === "true";

  try {
    const rl = getRatelimit(windowSize);
    const result = await rl.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // When RATE_LIMIT_FAIL_CLOSED=true, deny on Redis outage
    // When false (default), fail open for availability
    if (failClosed) {
      console.error("[rate-limit] Redis unreachable — denying request (fail-closed)");
      return { allowed: false, remaining: 0, reset: Date.now() + 60_000 };
    }
    return { allowed: true, remaining: 1, reset: Date.now() + 60_000 };
  }
}
