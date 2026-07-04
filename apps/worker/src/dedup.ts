import { connection } from "./queue";

const DEDUP_TTL_SECONDS = 24 * 3600; // 24 hours
const KEY_PREFIX = "job:dedup";

/**
 * Check if a job with the given requestId has already been processed.
 * Uses Redis SET NX (atomic "set if not exists") for race-free dedup.
 */
export async function checkAndMarkDedup(requestId: string): Promise<boolean> {
  const key = `${KEY_PREFIX}:${requestId}`;
  try {
    // SET key "1" NX EX TTL — returns "OK" if key didn't exist, null if it did
    const result = await connection.set(key, "1", "EX", DEDUP_TTL_SECONDS, "NX");
    if (result === "OK") {
      return true; // First time seeing this requestId — proceed
    }
    return false; // Already processed — should skip
  } catch {
    // fail-open: if Redis is down, allow the job to proceed (may duplicate, won't drop)
    console.warn("[dedup] Redis unavailable — skipping idempotency check (fail-open)");
    return true;
  }
}
