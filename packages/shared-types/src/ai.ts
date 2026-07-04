// ── DeepSeek API types ──────────────────────────────────────────────
export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface DeepSeekResponse {
  choices: Array<{ message: { content: string }; finish_reason: string }>;
  usage?: TokenUsage;
}

// ── AI Client Error ─────────────────────────────────────────────────
export class AIClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable?: boolean,
  ) {
    super(message);
    this.name = "AIClientError";
  }
}

// ── AI Execution Results ────────────────────────────────────────────
export interface ComposeResult {
  subject: string;
  body: string;
  tone: string;
  suggestedAction: string;
}

export interface ScoreResult {
  score: number;
  label: string;
  breakdown: Record<string, number>;
  signals: string[];
  concerns: string[];
  recommendedAction: string;
}
