import type { TokenUsage } from "@salesagent/shared-types";

// ── Types ──────────────────────────────────────────────────────────

export type AIJobType =
  | "compose_response"
  | "score_lead"
  | "summarize_conversation"
  | "generate_script"
  | "campaign_ai"
  | "kb_ask";

export interface AICallMetricInput {
  organizationId: string;
  jobType: AIJobType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  llmLatencyMs: number;
  totalLatencyMs: number;
  success: boolean;
  fallbackUsed: boolean;
  retryCount: number;
  errorType?: string;
  requestId?: string;
  conversationId?: string;
  leadId?: string;
  promptVersion?: string;
}

// ── Cost Calculation ────────────────────────────────────────────────

/** DeepSeek pricing per 1M tokens */
const DEEPSEEK_PRICE_PER_1M = {
  prompt: 0.14,    // $0.14 / 1M input tokens
  completion: 0.28, // $0.28 / 1M output tokens
};

/** Calculate estimated cost in USD from token usage */
export function estimateCost(promptTokens: number, completionTokens: number): number {
  const promptCost = (promptTokens * DEEPSEEK_PRICE_PER_1M.prompt) / 1_000_000;
  const completionCost = (completionTokens * DEEPSEEK_PRICE_PER_1M.completion) / 1_000_000;
  return Math.round((promptCost + completionCost) * 1_000_000) / 1_000_000; // round to 6 decimal places
}

// ── Metric Builder ──────────────────────────────────────────────────

export interface MetricContext {
  organizationId: string;
  jobType: AIJobType;
  model?: string;
  conversationId?: string;
  leadId?: string;
  requestId?: string;
  promptVersion?: string;
  retryCount?: number;
}

/** Build an AICallMetricInput from context + LLM call result */
export function buildMetric(
  ctx: MetricContext,
  usage: TokenUsage | undefined,
  llmLatencyMs: number,
  totalLatencyMs: number,
  success: boolean,
  fallbackUsed: boolean,
  errorType?: string,
): AICallMetricInput {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? (promptTokens + completionTokens);

  return {
    organizationId: ctx.organizationId,
    jobType: ctx.jobType,
    model: ctx.model ?? "deepseek-chat",
    promptTokens,
    completionTokens,
    totalTokens,
    llmLatencyMs,
    totalLatencyMs,
    success,
    fallbackUsed,
    retryCount: ctx.retryCount ?? 0,
    errorType,
    requestId: ctx.requestId,
    conversationId: ctx.conversationId,
    leadId: ctx.leadId,
    promptVersion: ctx.promptVersion,
  };
}
