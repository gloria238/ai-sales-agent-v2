import { Queue } from "bullmq";
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error("REDIS_URL environment variable is required");

export const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

const Q_PREFIX = "sales-agent";

// Shared default job options for all queues
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: { age: 3600 * 24 },
  removeOnFail: { age: 3600 * 24 * 7 },
};

// ── JobContext (shared by idempotency + distributed tracing) ────────

export interface JobContext {
  requestId: string;      // HTTP request-level UUID — idempotency key + trace correlation
  spanId?: string;        // Current Worker span (P2-2)
  parentSpanId?: string;  // Upstream HTTP span (P2-2)
}

// AI response composition queue — inbound messages that need an AI reply
export const conversationQueue = new Queue<{ conversationId: string; agentId?: string; context?: JobContext }>("conversation-jobs", {
  connection,
  prefix: Q_PREFIX,
  defaultJobOptions,
});

// Email delivery queue — outbound emails to send via Resend
export const emailQueue = new Queue<{ conversationId?: string; campaignId?: string; leadId: string; context?: JobContext }>("email-jobs", {
  connection,
  prefix: Q_PREFIX,
  defaultJobOptions,
});

// Campaign sequence execution queue — multi-step outbound campaigns
export const campaignQueue = new Queue<{ campaignId: string; leadId: string; stepIndex: number; context?: JobContext }>("campaign-jobs", {
  connection,
  prefix: Q_PREFIX,
  defaultJobOptions,
});

// Lead scoring queue — AI qualification for leads
export const scoringQueue = new Queue<{ leadId: string; context?: JobContext }>("scoring-jobs", {
  connection,
  prefix: Q_PREFIX,
  defaultJobOptions,
});
