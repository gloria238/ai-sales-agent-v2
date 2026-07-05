export { callDeepSeek, callDeepSeekJSON, extractBalancedJSON, AIClientError } from "./client";
export {
  PROMPT_ARMOR,
  COMPOSE_RESPONSE_SYSTEM,
  LEAD_SCORING_SYSTEM,
  SUMMARIZE_CONVERSATION_SYSTEM,
  GENERATE_SCRIPT_SYSTEM,
  buildComposeResponsePrompt,
  buildLeadScoringPrompt,
  buildSummarizeConversationPrompt,
  buildGenerateScriptPrompt,
  safe,
} from "./prompts";
export { composeResponse, scoreLead, generateScript, summarizeConversation, detectLanguage, translateText } from "./agents";
export { buildMetric, estimateCost } from "./metrics";
export { getPromptConfig, PROMPT_REGISTRY } from "./prompt-registry";
export { runReActAgent } from "./agent-executor";
export type { Tool, AgentStep, AgentRunResult } from "./agent-executor";
export type { AICallMetricInput, AIJobType, MetricContext } from "./metrics";
export type { PromptKey, PromptVersion, VersionedPromptConfig } from "./prompt-registry";
export type { ComposeResult, ScoreResult } from "@salesagent/shared-types";
