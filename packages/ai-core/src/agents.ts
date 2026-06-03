import { callDeepSeekJSON } from "./client";
import {
  COMPOSE_RESPONSE_SYSTEM,
  LEAD_SCORING_SYSTEM,
  SUMMARIZE_CONVERSATION_SYSTEM,
  GENERATE_SCRIPT_SYSTEM,
  buildComposeResponsePrompt,
  buildLeadScoringPrompt,
  buildSummarizeConversationPrompt,
  buildGenerateScriptPrompt,
} from "./prompts";
import type { ComposeResult, ScoreResult } from "@salesagent/shared-types";

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
): Promise<ComposeResult> {
  const effectiveAgent = agentOverride ?? conversation.agent;
  const latestInbound = [...conversation.messages]
    .reverse()
    .find((m) => m.direction === "inbound");

  const prompt = buildComposeResponsePrompt({
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

  return callDeepSeekJSON<ComposeResult>(prompt, COMPOSE_RESPONSE_SYSTEM, {
    temperature: 0.7,
  });
}

// ── Score Lead ────────────────────────────────────────────────────

export async function scoreLead(lead: LeadData): Promise<ScoreResult> {
  const prompt = buildLeadScoringPrompt({
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

  const result = await callDeepSeekJSON<ScoreResult>(prompt, LEAD_SCORING_SYSTEM, {
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
}): Promise<{
  summary: string;
  keyPoints: string[];
  objections: string[];
  sentiment: string;
  buyingSignals: string[];
  missingInfo: string[];
  nextSteps: string[];
  shouldEscalate: boolean;
}> {
  const prompt = buildSummarizeConversationPrompt(params);
  return callDeepSeekJSON(prompt, SUMMARIZE_CONVERSATION_SYSTEM, { temperature: 0.3 });
}

// ── Generate Script ───────────────────────────────────────────────

export async function generateScript(params: {
  description: string;
  industry?: string;
  targetPersona?: string;
  goal?: string;
  channel?: string;
}): Promise<{
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
  const prompt = buildGenerateScriptPrompt(params);
  return callDeepSeekJSON(prompt, GENERATE_SCRIPT_SYSTEM, { temperature: 0.7 });
}
