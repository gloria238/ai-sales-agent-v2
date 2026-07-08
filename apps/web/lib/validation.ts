import { z } from "zod";

// ── Shared validators ───────────────────────────────────────────
const email = z.string().email("Invalid email format").max(320, "Email too long");
const slug = z.string().min(1).max(60).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens");
const name = z.string().min(1, "Name is required").max(255, "Name too long");
const stage = z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]);

// ── Lead input ───────────────────────────────────────────────────
export const createLeadSchema = z.object({
  name: name,
  email: email.optional().nullable(),
  company: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  stage: stage.optional().default("new"),
  source: z.enum(["website", "referral", "outbound", "linkedin", "other"]).optional(),
  dealAmount: z.number().min(0).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
});

export const updateLeadSchema = z.object({
  name: name.optional(),
  email: email.optional().nullable(),
  company: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  stage: stage.optional(),
  source: z.enum(["website", "referral", "outbound", "linkedin", "other"]).optional(),
  score: z.number().int().min(0).max(100).optional(),
  assignedTo: z.string().uuid().optional(),
  dealAmount: z.number().min(0).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
});

// ── Agent input ──────────────────────────────────────────────────
export const createAgentSchema = z.object({
  name: name,
  description: z.string().max(1000).optional(),
  personality: z.string().max(2000).optional(),
  goals: z.array(z.object({
    type: z.enum(["qualify_lead", "book_meeting", "handle_objection", "nurture", "follow_up"]),
    priority: z.number().int().min(1).max(10),
    successCriteria: z.string().max(500),
  })).max(20).optional(),
  knowledgeBase: z.object({
    productDescription: z.string().max(5000).optional(),
    pricing: z.string().max(2000).optional(),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).max(50).optional(),
    competitors: z.array(z.object({
      name: z.string(),
      strengths: z.string().optional(),
      weaknesses: z.string().optional(),
    })).max(20).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

// ── Conversation / Message input ─────────────────────────────────
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1, "Message is required").max(10000, "Message too long"),
  channel: z.enum(["email", "chat"]).default("email"),
  reviewAction: z.enum(["approved", "rejected"]).optional(), // HITL — set when sending an AI draft
});

export const generateAiDraftSchema = z.object({
  conversationId: z.string().uuid().optional(),
});

// ── Campaign input ───────────────────────────────────────────────
export const createCampaignSchema = z.object({
  name: name,
  description: z.string().max(2000).optional(),
  scriptId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
  targetAudience: z.object({
    stage: z.array(stage).optional(),
    scoreMin: z.number().int().min(0).max(100).optional(),
    scoreMax: z.number().int().min(0).max(100).optional(),
    tags: z.array(z.string()).optional(),
    source: z.array(z.string()).optional(),
  }).optional(),
  schedule: z.object({
    timezone: z.string().optional(),
    workingHours: z.object({ start: z.string(), end: z.string() }).optional(),
    maxPerDay: z.number().int().min(1).max(1000).optional(),
  }).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

// ── Organization input ──────────────────────────────────────────
export const createOrgSchema = z.object({
  name: name,
  slug: slug,
});

export const updateOrgSchema = z.object({
  name: name.optional(),
  slug: slug.optional(),
});

// ── Member input ─────────────────────────────────────────────────
export const inviteMemberSchema = z.object({
  email: email,
  role: z.enum(["admin", "operator", "viewer"]),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "operator", "viewer"]),
});

// ── API key input ───────────────────────────────────────────────
export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

// ── Lead import ──────────────────────────────────────────────────
export const leadImportRowSchema = z.object({
  Name: z.string().min(1).max(255).optional(),
  name: z.string().min(1).max(255).optional(),
  Email: email.optional(),
  email: email.optional(),
  Company: z.string().max(255).optional(),
  company: z.string().max(255).optional(),
  Stage: stage.optional(),
  stage: stage.optional(),
  DealAmount: z.coerce.number().min(0).optional(),
  dealAmount: z.coerce.number().min(0).optional(),
  Tags: z.string().max(500).optional(),
  tags: z.string().max(500).optional(),
});

export const leadImportSchema = z.object({
  rows: z.array(leadImportRowSchema).min(1).max(500),
});

// ── AI inputs ────────────────────────────────────────────────────
export const composeResponseSchema = z.object({
  conversationId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
});

export const scoreLeadSchema = z.object({
  leadId: z.string().uuid(),
});

export const summarizeConversationSchema = z.object({
  conversationId: z.string().uuid(),
});

export const generateScriptSchema = z.object({
  description: z.string().min(1, "Description required").max(3000, "Description too long"),
  industry: z.string().max(200).optional(),
  targetPersona: z.string().max(200).optional(),
  goal: z.string().max(500).optional(),
  channel: z.enum(["email"]).default("email").optional(),
});

// ── Script install ──────────────────────────────────────────────
export const installScriptSchema = z.object({
  slug: z.string().min(1, "Script slug required"),
});

// ── Auth input ───────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(320, "Email too long"),
  password: z.string().min(1, "Password required"),
});

export const registerSchema = z.object({
  name: name,
  email: email,
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
});
