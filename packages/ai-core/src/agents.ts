import { callDeepSeekJSON } from "./client";
import type { ComposeResult, ScoreResult } from "@salesagent/shared-types";
import { getPromptConfig } from "./prompt-registry";
import type { PromptKey } from "./prompt-registry";

// ── Types for DI (caller injects their own data-fetching) ────────

export interface AgentContext {
  conversationId: string;
  agentId?: string;
}

export interface DataProvider {
  getConversation(id: string): Promise<ConversationData | null>;
  getLead(id: string): Promise<LeadData | null>;
  getAgent(id: string): Promise<AgentConfigData | null>;
  updateLeadScore(leadId: string, score: number): Promise<void>;
}

export interface ConversationData {
  lead: LeadData;
  agent: AgentConfigData | null;
  messages: MessageData[];
}

export interface LeadData {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  stage: string | null;
  score: number | null;
  source: string | null;
  tags: unknown;
  createdAt: string;
  activities?: ActivityData[];
}

export interface AgentConfigData {
  id: string;
  name: string;
  personality: unknown;
  goals: unknown;
  knowledgeBase: unknown;
}

export interface MessageData {
  direction: string;
  content: string;
  createdAt: string;
}

export interface ActivityData {
  type: string;
  content: string | null;
  createdAt: string;
}

// ── Compose Response ──────────────────────────────────────────────

export async function composeResponse(
  conversation: ConversationData,
  agentOverride?: AgentConfigData | null,
  promptVersion?: string,
): Promise<ComposeResult> {
  const effectiveAgent = agentOverride ?? conversation.agent;
  const latestInbound = [...conversation.messages]
    .reverse()
    .find((m) => m.direction === "inbound");

  const config = getPromptConfig("compose_response", promptVersion);
  const prompt = config.builder({
    leadName: conversation.lead.name,
    leadEmail: conversation.lead.email || "N/A",
    leadStage: conversation.lead.stage || "new",
    leadCompany: conversation.lead.company || undefined,
    leadScore: conversation.lead.score ?? undefined,
    agentPersonality:
      (effectiveAgent?.personality as string) || "Professional, friendly B2B SDR",
    agentGoals: effectiveAgent?.goals
      ? JSON.stringify(effectiveAgent.goals)
      : '[{"type":"qualify_lead"}]',
    knowledgeBase: effectiveAgent?.knowledgeBase
      ? JSON.stringify(effectiveAgent.knowledgeBase)
      : "{}",
    conversationHistory: conversation.messages.map((m) => ({
      direction: m.direction,
      content: m.content,
      createdAt: m.createdAt,
    })),
    latestMessage: latestInbound?.content,
  });

  return callDeepSeekJSON<ComposeResult>(prompt, config.system, {
    temperature: 0.7,
  }).then(({ result }) => result);
}

// ── Score Lead ────────────────────────────────────────────────────

export async function scoreLead(lead: LeadData, promptVersion?: string): Promise<ScoreResult> {
  const config = getPromptConfig("score_lead", promptVersion);
  const prompt = config.builder({
    name: lead.name,
    email: lead.email,
    company: lead.company,
    stage: lead.stage,
    source: lead.source,
    tags: lead.tags,
    createdAt: lead.createdAt,
    recentActivity: lead.activities?.map((a) => ({
      type: a.type,
      content: a.content,
      createdAt: a.createdAt,
    })),
  });

  const { result, usage: _scoreUsage } = await callDeepSeekJSON<ScoreResult>(prompt, config.system, {
    temperature: 0.3,
  });

  const score = Math.max(0, Math.min(100, Math.round(result.score ?? 0)));

  return {
    ...result,
    score,
    label: result.label || (score >= 70 ? "hot" : score >= 40 ? "warm" : "cold"),
  };
}

// ── Summarize Conversation ────────────────────────────────────────

export async function summarizeConversation(params: {
  leadName: string;
  leadCompany?: string;
  messages: Array<{ direction: string; content: string; createdAt: string }>;
}, promptVersion?: string): Promise<{
  summary: string;
  keyPoints: string[];
  objections: string[];
  sentiment: string;
  buyingSignals: string[];
  missingInfo: string[];
  nextSteps: string[];
  shouldEscalate: boolean;
}> {
  const config = getPromptConfig("summarize_conversation", promptVersion);
  const prompt = config.builder(params);
  const { result } = await callDeepSeekJSON<{
    summary: string; keyPoints: string[]; objections: string[]; sentiment: string;
    buyingSignals: string[]; missingInfo: string[]; nextSteps: string[]; shouldEscalate: boolean;
  }>(prompt, config.system, { temperature: 0.3 });
  return result;
}

// ── Generate Script ───────────────────────────────────────────────

export async function generateScript(params: {
  description: string;
  industry?: string;
  targetPersona?: string;
  goal?: string;
  channel?: string;
}, promptVersion?: string): Promise<{
  name: string;
  description: string;
  category: string;
  bestPractices: string[];
  subjectLineTips: string[];
  steps: Array<{
    order: number;
    type: string;
    template?: string;
    subject?: string;
    delay?: string;
    condition?: string;
  }>;
}> {
  const config = getPromptConfig("generate_script", promptVersion);
  const prompt = config.builder(params);
  const { result } = await callDeepSeekJSON<{
    name: string; description: string; category: string; bestPractices: string[];
    subjectLineTips: string[]; steps: Array<{
      order: number; type: string; template?: string; subject?: string;
      delay?: string; condition?: string;
    }>;
  }>(prompt, config.system, { temperature: 0.7 });
  return result;
}
