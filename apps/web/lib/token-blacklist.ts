import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let fallbackWarned = false;

function getRedis(): Redis | null {
  if (redis) return redis;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    redis = new Redis({ url: redisUrl, token: redisToken });
    return redis;
  }

  if (!fallbackWarned) {
    console.warn("[token-blacklist] UPSTASH_REDIS_REST_URL not set — JWT revocation unavailable (tokens cannot be revoked)");
    fallbackWarned = true;
  }
  return null;
}

/** Revoke a specific JWT token by its jti. TTL matches max JWT lifetime (7 days). */
export async function revokeToken(jti: string): Promise<void> {
  const r = getRedis();
  if (!r) return;

  const key = `revoked:jti:${jti}`;
  // Store with TTL = 7 days (the max JWT expiry). After that, the JWT itself expires
  // so keeping the blacklist entry longer is unnecessary.
  await r.set(key, "1", { ex: 60 * 60 * 24 * 7 });
}

/** Check if a token's jti has been revoked. */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const r = getRedis();
  if (!r) {
    // No Redis — can't check blacklist. Fail-open by default (allow token).
    // Set TOKEN_REVOCATION_FAIL_CLOSED=true to deny tokens when Redis is unreachable.
    if (process.env.TOKEN_REVOCATION_FAIL_CLOSED === "true") {
      console.error("[token-blacklist] Redis unavailable — rejecting token (fail-closed)");
      return true;
    }
    return false;
  }

  try {
    const key = `revoked:jti:${jti}`;
    const result = await r.get(key);
    return result !== null;
  } catch {
    // Redis error — same fail-closed logic
    if (process.env.TOKEN_REVOCATION_FAIL_CLOSED === "true") {
      console.error("[token-blacklist] Redis error — rejecting token (fail-closed)");
      return true;
    }
    return false;
  }
}
