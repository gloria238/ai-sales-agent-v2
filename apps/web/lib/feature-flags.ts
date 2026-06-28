/**
 * Feature Flags — backward-compatible re-export.
 *
 * All 6 existing usages route through `isEnabled()` with this signature.
 * For DB-backed flags (per-org targeting, rollouts), use `isEnabledAsync()` from feature-flags-v2.
 * Removed 2 unused flags: advanced_tables, realtime_updates (never checked in any route).
 */

export { isEnabledSync as isEnabled } from "./feature-flags-v2";

// Re-export the async variant for new code
export { isEnabled as isEnabledAsync } from "./feature-flags-v2";

export type FeatureFlag =
  | "ai_compose_response"
  | "ai_lead_scoring"
  | "ai_summarize_conversation"
  | "ai_generate_script";
