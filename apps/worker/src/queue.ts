import { Queue } from "bullmq";
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error("REDIS_URL environment variable is required");

export const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

const Q_PREFIX = "sales-agent";

// AI response composition queue — inbound messages that need an AI reply
export const conversationQueue = new Queue<{ conversationId: string }>("conversation-jobs", {
  connection,
  prefix: Q_PREFIX,
});

// Email delivery queue — outbound emails to send via Resend
export const emailQueue = new Queue<{ conversationId?: string; campaignId?: string; leadId: string }>("email-jobs", {
  connection,
  prefix: Q_PREFIX,
});

// Campaign sequence execution queue — multi-step outbound campaigns
export const campaignQueue = new Queue<{ campaignId: string; leadId: string; stepIndex: number }>("campaign-jobs", {
  connection,
  prefix: Q_PREFIX,
});

// Lead scoring queue — AI qualification for leads
export const scoringQueue = new Queue<{ leadId: string }>("scoring-jobs", {
  connection,
  prefix: Q_PREFIX,
});
