const FLAGS = {
  ai_compose_response: { env: "FEATURE_AI_COMPOSE", default: true },
  ai_lead_scoring: { env: "FEATURE_AI_SCORE", default: true },
  ai_summarize_conversation: { env: "FEATURE_AI_SUMMARIZE", default: true },
  ai_generate_script: { env: "FEATURE_AI_SCRIPT_GEN", default: true },
  advanced_tables: { env: "FEATURE_ADVANCED_TABLES", default: true },
  realtime_updates: { env: "FEATURE_REALTIME", default: true },
} as const;

export type FeatureFlag = keyof typeof FLAGS;

export function isEnabled(flag: FeatureFlag): boolean {
  const config = FLAGS[flag];
  const envVal = process.env[config.env];
  if (envVal === undefined) return config.default;
  return envVal === "1" || envVal === "true";
}
