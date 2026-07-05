/**
 * Feature Flag System v2 — DB-backed with env-var fallback.
 *
 * Evaluation order:
 * 1. In-memory TTL cache (60s)
 * 2. DB lookup per organization+key
 * 3. Environment variable fallback (backward compat)
 * 4. Default value
 *
 * Zero breaking changes — all existing `isEnabled()` calls work unchanged.
 */

import { prisma } from "@salesagent/db";

// ═══ Flag Registry ═══════════════════════════════════════════════════════

interface FlagDefinition {
  key: string;
  env: string;
  default: boolean;
  description?: string;
}

const FLAGS: Record<string, FlagDefinition> = {
  ai_compose_response: { key: "ai_compose_response", env: "FEATURE_AI_COMPOSE", default: true, description: "AI email response composition" },
  ai_lead_scoring: { key: "ai_lead_scoring", env: "FEATURE_AI_SCORE", default: true, description: "AI lead scoring" },
  ai_summarize_conversation: { key: "ai_summarize_conversation", env: "FEATURE_AI_SUMMARIZE", default: true, description: "AI conversation summarization" },
  ai_generate_script: { key: "ai_generate_script", env: "FEATURE_AI_SCRIPT_GEN", default: true, description: "AI script generation" },

  // Channel flags — per-org communication channel toggles (Phase 19)
  email_channel: { key: "email_channel", env: "FEATURE_EMAIL_CHANNEL", default: false, description: "Email delivery via Resend (default off for China market)" },
  wechat_channel: { key: "wechat_channel", env: "FEATURE_WECHAT_CHANNEL", default: true, description: "WeChat/WeCom messaging channel (default on for China market)" },
};

// ═══ Prompt Version Flags (string-typed, stored in FeatureFlag.rules.promptVersion) ═══

const PROMPT_VERSION_MAP: Record<string, { env: string; default: string }> = {
  compose_prompt_version:   { env: "PROMPT_COMPOSE_VER",   default: "v1" },
  score_prompt_version:     { env: "PROMPT_SCORE_VER",     default: "v1" },
  summarize_prompt_version: { env: "PROMPT_SUMMARIZE_VER", default: "v1" },
  script_prompt_version:    { env: "PROMPT_SCRIPT_VER",    default: "v1" },
};

/** Get the active prompt version for a given key, resolved from DB rules or env var.
 *  Falls back to "v1" if no override is configured.
 */
export async function getPromptVersionFlag(
  flagKey: string,
  orgId?: string | null,
): Promise<string> {
  const mapping = PROMPT_VERSION_MAP[flagKey];
  if (!mapping) return "v1";

  // Check DB per-org override
  if (orgId) {
    try {
      const record = await prisma.featureFlag.findUnique({
        where: { organizationId_key: { organizationId: orgId, key: flagKey } },
      });
      if (record?.rules) {
        const rules = record.rules as { promptVersion?: string };
        if (rules.promptVersion) return rules.promptVersion;
      }
    } catch { /* DB unreachable — fall through */ }
  }

  // Env var fallback
  const envValue = process.env[mapping.env];
  if (envValue) return envValue;

  return mapping.default;
}

// ═══ Memory Cache ════════════════════════════════════════════════════════

const cache = new Map<string, { value: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

function cacheKey(orgId: string | null, flagKey: string): string {
  return `${orgId || "_global"}:${flagKey}`;
}

function cacheGet(orgId: string | null, flagKey: string): boolean | null {
  const key = cacheKey(orgId, flagKey);
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.value;
  if (entry) cache.delete(key); // expired
  return null;
}

function cacheSet(orgId: string | null, flagKey: string, value: boolean): void {
  cache.set(cacheKey(orgId, flagKey), { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ═══ Evaluation ══════════════════════════════════════════════════════════

/** Check if a feature flag is enabled. */
export async function isEnabled(flagKey: string, orgId?: string | null, userId?: string, role?: string): Promise<boolean> {
  const defn = FLAGS[flagKey];
  if (!defn) {
    console.warn(`[feature-flags] Unknown flag: ${flagKey}`);
    return false;
  }

  // 1. Check memory cache
  const cached = cacheGet(orgId || null, flagKey);
  if (cached !== null) return cached;

  // 2. Check DB (per-organization override)
  if (orgId) {
    try {
      const record = await prisma.featureFlag.findUnique({
        where: { organizationId_key: { organizationId: orgId, key: flagKey } },
      });

      if (record) {
        const result = evaluateFlag(record, userId, role);
        cacheSet(orgId, flagKey, result);
        return result;
      }
    } catch {
      // DB unreachable — fall through to env var
    }
  }

  // 3. Check global (null orgId) DB flag
  try {
    const global = await prisma.featureFlag.findUnique({
      where: { organizationId_key: { organizationId: "__global__", key: flagKey } },
    });

    if (global) {
      const result = evaluateFlag(global, userId, role);
      cacheSet(null, flagKey, result);
      return result;
    }
  } catch {
    // DB unreachable — fall through to env var
  }

  // 4. Environment variable fallback (backward compat)
  const envValue = process.env[defn.env];
  if (envValue !== undefined) {
    const result = envValue === "true" || envValue === "1";
    cacheSet(orgId || null, flagKey, result);
    return result;
  }

  // 5. Default
  cacheSet(orgId || null, flagKey, defn.default);
  return defn.default;
}

/** Synchronous check using only env vars (no DB). For middleware/edge contexts. */
export function isEnabledSync(flagKey: string): boolean {
  const defn = FLAGS[flagKey];
  if (!defn) return false;
  const envValue = process.env[defn.env];
  if (envValue !== undefined) return envValue === "true" || envValue === "1";
  return defn.default;
}

// ═══ Helpers ═════════════════════════════════════════════════════════════

interface FlagRecord {
  enabled: boolean;
  rolloutPercent: number;
  rules?: any;
}

function evaluateFlag(record: FlagRecord, userId?: string, role?: string): boolean {
  if (!record.enabled) return false;

  // Rollout percentage: hash userId to a 0-99 bucket
  if (record.rolloutPercent < 100 && userId) {
    const bucket = hashBucket(userId);
    if (bucket >= record.rolloutPercent) return false;
  }

  // Targeting rules
  if (record.rules) {
    const rules = record.rules as { roles?: string[]; userIds?: string[] };
    // If roles are specified, user must have one of them
    if (rules.roles?.length && role && !rules.roles.includes(role)) return false;
    // If userIds are specified, user must be in the list
    if (rules.userIds?.length && userId && !rules.userIds.includes(userId)) return false;
  }

  return true;
}

function hashBucket(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100;
}
