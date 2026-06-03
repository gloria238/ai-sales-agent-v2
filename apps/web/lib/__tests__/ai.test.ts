import { describe, it, expect } from "vitest";

import {
  COMPOSE_RESPONSE_SYSTEM, buildComposeResponsePrompt,
  LEAD_SCORING_SYSTEM, buildLeadScoringPrompt,
  SUMMARIZE_CONVERSATION_SYSTEM, buildSummarizeConversationPrompt,
  GENERATE_SCRIPT_SYSTEM, buildGenerateScriptPrompt,
} from "@salesagent/ai-core";
import { isEnabled } from "@/lib/feature-flags";

// ── Compose Response Tests ─────────────────────────────────────

describe("COMPOSE_RESPONSE_SYSTEM", () => {
  it("includes JSON output fields", () => {
    expect(COMPOSE_RESPONSE_SYSTEM).toContain("subject");
    expect(COMPOSE_RESPONSE_SYSTEM).toContain("body");
    expect(COMPOSE_RESPONSE_SYSTEM).toContain("tone");
    expect(COMPOSE_RESPONSE_SYSTEM).toContain("suggestedAction");
  });

  it("includes agent personality guidance", () => {
    expect(COMPOSE_RESPONSE_SYSTEM).toContain("personality");
  });

  it("includes email types", () => {
    for (const t of ["welcome", "follow-up", "cold-outreach", "re-engagement", "proposal"]) {
      expect(COMPOSE_RESPONSE_SYSTEM).toContain(t);
    }
  });
});

describe("buildComposeResponsePrompt", () => {
  it("includes lead data and agent config", () => {
    const prompt = buildComposeResponsePrompt({
      leadName: "Alice", leadEmail: "alice@test.com", leadStage: "qualified",
      leadCompany: "Acme", leadScore: 85,
      agentPersonality: "Friendly SDR", agentGoals: "qualify",
      knowledgeBase: "SaaS product", conversationHistory: [],
    });
    expect(prompt).toContain("Alice");
    expect(prompt).toContain("alice@test.com");
    expect(prompt).toContain("Acme");
    expect(prompt).toContain("85");
    expect(prompt).toContain("Friendly SDR");
  });

  it("renders conversation history", () => {
    const prompt = buildComposeResponsePrompt({
      leadName: "Bob", leadEmail: "b@b.com", leadStage: "new",
      agentPersonality: "Direct", agentGoals: "book", knowledgeBase: "{}",
      conversationHistory: [
        { direction: "inbound", content: "Tell me about pricing", createdAt: "2026-01-01" },
        { direction: "outbound", content: "Sure, let me share details", createdAt: "2026-01-01" },
      ],
    });
    expect(prompt).toContain("Tell me about pricing");
    expect(prompt).toContain("[INBOUND]");
    expect(prompt).toContain("[OUTBOUND]");
  });
});

// ── Lead Scoring Tests ─────────────────────────────────────────

describe("LEAD_SCORING_SYSTEM", () => {
  it("includes BANT dimensions", () => {
    expect(LEAD_SCORING_SYSTEM).toContain("intent");
    expect(LEAD_SCORING_SYSTEM).toContain("budget");
    expect(LEAD_SCORING_SYSTEM).toContain("authority");
    expect(LEAD_SCORING_SYSTEM).toContain("need");
    expect(LEAD_SCORING_SYSTEM).toContain("timeline");
  });

  it("includes scoring labels", () => {
    expect(LEAD_SCORING_SYSTEM).toContain("hot");
    expect(LEAD_SCORING_SYSTEM).toContain("warm");
    expect(LEAD_SCORING_SYSTEM).toContain("cold");
  });
});

describe("buildLeadScoringPrompt", () => {
  it("includes lead profile fields", () => {
    const prompt = buildLeadScoringPrompt({
      name: "Alice", email: "alice@c.com", company: "Acme",
      stage: "qualified", source: "website", tags: ["vip"],
      createdAt: "2026-01-01",
    });
    expect(prompt).toContain("Alice");
    expect(prompt).toContain("alice@c.com");
    expect(prompt).toContain("Acme");
    expect(prompt).toContain("qualified");
    expect(prompt).toContain("website");
  });

  it("handles missing optional fields", () => {
    const prompt = buildLeadScoringPrompt({
      name: "Bob", email: null, company: null,
      stage: null, source: null, tags: null, createdAt: "2026-01-01",
    });
    expect(prompt).toContain("N/A");
  });

  it("includes pipeline stage info", () => {
    const prompt = buildLeadScoringPrompt({
      name: "Carol", email: "c@d.com", company: null,
      stage: "proposal", source: null, tags: null, createdAt: "2026-01-01",
    });
    expect(prompt).toContain("closed_won");
    expect(prompt).toContain("closed_lost");
  });
});

// ── Summarize Conversation Tests ───────────────────────────────

describe("SUMMARIZE_CONVERSATION_SYSTEM", () => {
  it("includes required fields", () => {
    expect(SUMMARIZE_CONVERSATION_SYSTEM).toContain("summary");
    expect(SUMMARIZE_CONVERSATION_SYSTEM).toContain("keyPoints");
    expect(SUMMARIZE_CONVERSATION_SYSTEM).toContain("objections");
    expect(SUMMARIZE_CONVERSATION_SYSTEM).toContain("sentiment");
    expect(SUMMARIZE_CONVERSATION_SYSTEM).toContain("shouldEscalate");
  });
});

describe("buildSummarizeConversationPrompt", () => {
  it("includes lead and messages", () => {
    const prompt = buildSummarizeConversationPrompt({
      leadName: "Alice", leadCompany: "Acme",
      messages: [
        { direction: "inbound", content: "I need help", createdAt: "2026-01-01" },
        { direction: "outbound", content: "How can I assist?", createdAt: "2026-01-01" },
      ],
    });
    expect(prompt).toContain("Alice");
    expect(prompt).toContain("Acme");
    expect(prompt).toContain("I need help");
    expect(prompt).toContain("[INBOUND]");
  });
});

// ── Generate Script Tests ──────────────────────────────────────

describe("GENERATE_SCRIPT_SYSTEM", () => {
  it("includes step types", () => {
    expect(GENERATE_SCRIPT_SYSTEM).toContain("email");
    expect(GENERATE_SCRIPT_SYSTEM).toContain("ai_email");
    expect(GENERATE_SCRIPT_SYSTEM).toContain("delay");
  });

  it("includes campaign categories", () => {
    expect(GENERATE_SCRIPT_SYSTEM).toContain("cold_outreach");
    expect(GENERATE_SCRIPT_SYSTEM).toContain("follow_up");
  });
});

describe("buildGenerateScriptPrompt", () => {
  it("includes description and target params", () => {
    const prompt = buildGenerateScriptPrompt({
      description: "Cold outreach for SaaS founders",
      industry: "SaaS", targetPersona: "Founder", goal: "Book demo",
    });
    expect(prompt).toContain("Cold outreach for SaaS founders");
    expect(prompt).toContain("SaaS");
    expect(prompt).toContain("Founder");
    expect(prompt).toContain("Book demo");
  });
});

// ── Feature Flags Tests ────────────────────────────────────────

describe("isEnabled", () => {
  it("ai_compose_response defaults to true", () => {
    expect(isEnabled("ai_compose_response")).toBe(true);
  });
  it("ai_lead_scoring defaults to true", () => {
    expect(isEnabled("ai_lead_scoring")).toBe(true);
  });
  it("ai_summarize_conversation defaults to true", () => {
    expect(isEnabled("ai_summarize_conversation")).toBe(true);
  });
  it("ai_generate_script defaults to true", () => {
    expect(isEnabled("ai_generate_script")).toBe(true);
  });
  it("advanced_tables defaults to true", () => {
    expect(isEnabled("advanced_tables")).toBe(true);
  });
  it("realtime_updates defaults to true", () => {
    expect(isEnabled("realtime_updates")).toBe(true);
  });
});
