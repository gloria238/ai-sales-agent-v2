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
} from "./prompts";
export { composeResponse, scoreLead, generateScript, summarizeConversation } from "./agents";
export type { ComposeResult, ScoreResult } from "@salesagent/shared-types";
