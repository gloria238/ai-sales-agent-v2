import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { Worker, Job } from "bullmq";
import { prisma } from "@salesagent/db";
import { connection, conversationQueue, emailQueue, campaignQueue, scoringQueue } from "./queue";
import type { JobContext } from "./queue";
import { sendEmail } from "./email";
import { callDeepSeekJSON, PROMPT_ARMOR, safe, buildMetric, estimateCost } from "@salesagent/ai-core";
import type { AICallMetricInput } from "@salesagent/ai-core";
import { checkAndMarkDedup } from "./dedup";

const Q_PREFIX = "sales-agent";

// ── AI Response Composition ───────────────────────────────────────
interface ComposeResult {
  subject: string; body: string; tone: string; suggestedAction: string;
}

async function composeAiResponse(conversationId: string, agentId?: string, requestId?: string): Promise<ComposeResult> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { lead: true, agent: true, messages: { orderBy: { createdAt: "asc" }, take: 20 } },
  });
  if (!conversation) throw new Error(`Conversation ${conversationId} not found`);

  const effectiveAgent = agentId
    ? await prisma.agent.findUnique({ where: { id: agentId } })
    : conversation.agent;

  const latestInbound = [...conversation.messages].reverse().find((m) => m.direction === "inbound");

  const system = `${PROMPT_ARMOR}

You are an expert B2B SDR. Compose personalized, helpful sales emails matching the agent's personality. Never fabricate facts. Return JSON only.`;

  const prompt = `Compose a reply for this sales conversation:

LEAD:
  Name: <user_data>${safe(conversation.lead.name)}</user_data>
  Email: <user_data>${safe(conversation.lead.email || "N/A")}</user_data>
  Company: <user_data>${safe(conversation.lead.company || "Unknown")}</user_data>
  Stage: <user_data>${safe(conversation.lead.stage || "new")}</user_data>
  Score: <user_data>${conversation.lead.score ?? "Not scored"}</user_data>

AGENT:
  Personality: ${safe(effectiveAgent?.personality || "Professional, friendly B2B SDR")}
  Goals: ${JSON.stringify(effectiveAgent?.goals || [{ type: "qualify_lead" }])}
  Knowledge: ${JSON.stringify(effectiveAgent?.knowledgeBase || {})}

CONVERSATION:
<user_data>
${conversation.messages.map((m) => `[${m.direction.toUpperCase()}] ${safe(m.content.substring(0, 400))}`).join("\n")}
</user_data>

${latestInbound ? `LATEST INBOUND: <user_data>${safe(latestInbound.content)}</user_data>` : ""}

Return JSON: { "subject": "...", "body": "...", "tone": "friendly|professional|direct|consultative", "suggestedAction": "send_now|review|escalate_to_human" }`;

  const llmStart = Date.now();
  const { result, usage } = await callDeepSeekJSON<ComposeResult>(prompt, system, { temperature: 0.7, timeoutMs: 15_000 });
  const llmLatencyMs = Date.now() - llmStart;

  // Log AI call metric (non-blocking)
  try {
    await prisma.aICallMetric.create({
      data: {
        organizationId: conversation.organizationId,
        jobType: "compose_response",
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        llmLatencyMs,
        totalLatencyMs: llmLatencyMs,
        success: true,
        requestId,
        conversationId,
      },
    });
  } catch { /* metrics logging failure should not block AI */ }

  return result;
}

// ── Lead Scoring ──────────────────────────────────────────────────
interface ScoreResult {
  score: number; label: string; breakdown: Record<string, number>;
  signals: string[]; concerns: string[]; recommendedAction: string;
}

async function scoreLead(leadId: string, requestId?: string): Promise<ScoreResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { activities: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const activities = lead.activities.map((a) =>
    `  - ${a.type}: ${safe(a.content?.substring(0, 200) || "(no content)")} (${a.createdAt.toISOString()})`
  ).join("\n");

  const system = `${PROMPT_ARMOR}
You are a B2B lead qualification AI. Score leads realistically across BANT dimensions. Return JSON only.`;

  const prompt = `Score this lead for conversion likelihood:

Name: <user_data>${safe(lead.name)}</user_data>
Email: <user_data>${safe(lead.email || "N/A")}</user_data>
Company: <user_data>${safe(lead.company || "Unknown")}</user_data>
Stage: <user_data>${safe(lead.stage || "new")}</user_data>
Source: <user_data>${safe(lead.source || "unknown")}</user_data>
Tags: <user_data>${lead.tags ? JSON.stringify(lead.tags) : "none"}</user_data>
Created: <user_data>${lead.createdAt.toISOString()}</user_data>

Recent Activity:
<user_data>
${activities || "(none)"}
</user_data>

Score across BANT dimensions. Return JSON: { "score": 0-100, "label": "hot|warm|cold", "breakdown": { "intent": 0-100, "budget": 0-100, "authority": 0-100, "need": 0-100, "timeline": 0-100 }, "signals": ["..."], "concerns": ["..."], "recommendedAction": "..." }`;

  const llmStart = Date.now();
  const { result: scoreData, usage } = await callDeepSeekJSON<ScoreResult>(prompt, system, { temperature: 0.3, timeoutMs: 15_000 });
  const llmLatencyMs = Date.now() - llmStart;

  const score = Math.max(0, Math.min(100, Math.round(scoreData.score ?? 0)));

  await prisma.lead.update({ where: { id: leadId }, data: { score } });

  // Log AI call metric (non-blocking)
  try {
    await prisma.aICallMetric.create({
      data: {
        organizationId: lead.organizationId,
        jobType: "score_lead",
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        llmLatencyMs,
        totalLatencyMs: llmLatencyMs,
        success: true,
        requestId,
        leadId,
      },
    });
  } catch { /* metrics logging failure should not block */ }

  return { ...scoreData, score, label: scoreData.label || (score >= 70 ? "hot" : score >= 40 ? "warm" : "cold") };
}

// ── Campaign Step Execution ───────────────────────────────────────
function parseDelay(d: string): number {
  const match = d.match(/^(\d+)\s*(m|min|h|d)$/i);
  if (!match) return 3 * 86400_000;
  const n = parseInt(match[1]);
  switch (match[2].toLowerCase()) {
    case "m": case "min": return n * 60_000;
    case "h": return n * 3600_000;
    case "d": return n * 86400_000;
    default: return 3 * 86400_000;
  }
}

const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function resolveTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_: string, path: string) => {
    let value: unknown = context;
    for (const key of path.split(".")) {
      if (BLOCKED_KEYS.has(key)) return `{{${path}}}`;
      if (value && typeof value === "object") value = (value as Record<string, unknown>)[key];
      else return `{{${path}}}`;
    }
    return value !== undefined && value !== null ? String(value) : `{{${path}}}`;
  });
}

async function executeCampaignStep(campaignId: string, leadId: string, stepIndex: number, requestId?: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { script: true, agent: true },
  });
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const steps = (campaign.script?.steps as any[]) || [];
  if (stepIndex >= steps.length) {
    console.log(`Campaign ${campaignId}: lead ${leadId} sequence complete`);
    return;
  }

  const step = steps[stepIndex];

  if (step.type === "delay") {
    const delayMs = step.delay ? parseDelay(step.delay) : 86400_000;
    await campaignQueue.add("send-email", { campaignId, leadId, stepIndex: stepIndex + 1, context: requestId ? { requestId: `${requestId}-s${stepIndex + 1}`, spanId: `campaign-delay-${stepIndex + 1}`, parentSpanId: requestId } : undefined }, { delay: delayMs });
    return;
  }

  let subject = step.subject || "Following up";
  let body = step.template || "Hi {{lead.name}},\n\n...";

  if (step.type === "ai_email") {
    try {
      const system = `${PROMPT_ARMOR}
You personalize outbound sales emails. Return JSON only.`;

      const aiPrompt = `Personalize this sales email:
Lead: <user_data>${safe(lead.name)} (${safe(lead.company || "N/A")})</user_data>, Stage: <user_data>${safe(lead.stage || "new")}</user_data>
Guidance: ${safe(step.template)}
Agent: ${safe(campaign.agent?.personality || "Professional SDR")}

Return JSON: { "subject": "...", "body": "..." }`;

      const llmStart = Date.now();
      const { result: composed, usage } = await callDeepSeekJSON<{ subject: string; body: string }>(
        aiPrompt, system, { temperature: 0.7, timeoutMs: 15_000 },
      );
      const llmLatencyMs = Date.now() - llmStart;
      subject = composed.subject || subject;
      body = composed.body || body;

      // Log AI call metric (non-blocking)
      try {
        await prisma.aICallMetric.create({
          data: {
            organizationId: campaign.organizationId,
            jobType: "campaign_ai",
            promptTokens: usage?.prompt_tokens ?? 0,
            completionTokens: usage?.completion_tokens ?? 0,
            totalTokens: usage?.total_tokens ?? 0,
            llmLatencyMs,
            totalLatencyMs: llmLatencyMs,
            success: true,
            requestId,
            leadId,
          },
        });
      } catch { /* metrics logging failure should not block */ }
    } catch (err) {
      console.warn(`AI personalization failed for lead ${leadId}, using template`);
      // Log failed AI call metric
      try {
        await prisma.aICallMetric.create({
          data: {
            organizationId: campaign.organizationId,
            jobType: "campaign_ai",
            success: false,
            fallbackUsed: true,
            errorType: err instanceof Error ? err.message.slice(0, 200) : "unknown",
            requestId,
            leadId,
            llmLatencyMs: 0,
            totalLatencyMs: 0,
          },
        });
      } catch { /* metrics logging failure should not block */ }
    }
  }

  const ctx = { lead: { name: lead.name, email: lead.email, company: lead.company } };
  body = resolveTemplate(body, ctx);
  subject = resolveTemplate(subject, ctx);

  if (process.env.RESEND_API_KEY) {
    await sendEmail({ action: "send_email", to: lead.email || "", subject, body }, { lead });
  }

  const currentStats = (campaign.stats as any) || {};
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { stats: { ...currentStats, sent: (currentStats.sent || 0) + 1 } },
  });

  await prisma.leadActivity.create({
    data: { leadId, organizationId: campaign.organizationId, type: "email_sent", content: `Campaign: ${subject}` },
  });

  if (stepIndex + 1 < steps.length) {
    const nextDelay = step.delay ? parseDelay(step.delay) : 3 * 86400_000;
    await campaignQueue.add("send-email", { campaignId, leadId, stepIndex: stepIndex + 1, context: requestId ? { requestId: `${requestId}-s${stepIndex + 1}`, spanId: `campaign-next-${stepIndex + 1}`, parentSpanId: requestId } : undefined }, { delay: nextDelay });
  }
}

// ── Health tracking ──────────────────────────────────────────────
let activeJobs = 0;
function writeHealth(status: string) {
  try {
    fs.writeFileSync(
      path.resolve(process.cwd(), "../../.worker-health.json"),
      JSON.stringify({ status, activeJobs, lastPoll: new Date().toISOString(), pid: process.pid }),
    );
  } catch { /* non-critical */ }
}
function incr() { activeJobs++; writeHealth("running"); }
function decr() { activeJobs = Math.max(0, activeJobs - 1); writeHealth(activeJobs > 0 ? "running" : "waiting"); }

// ── 4 BullMQ Workers (with retry config) ──────────────────────────
const workerOpts = {
  connection,
  prefix: Q_PREFIX,
  settings: {
    backoffStrategy: (attemptsMade: number) => Math.min(1000 * Math.pow(2, attemptsMade), 60_000),
  },
};

const conversationWorker = new Worker("conversation-jobs", async (job: Job<{ conversationId: string; agentId?: string; context?: JobContext }>) => {
  // Idempotency check
  if (job.data.context?.requestId) {
    const isFirst = await checkAndMarkDedup(job.data.context.requestId);
    if (!isFirst) { console.log(`[idempotent] Skipping duplicate conversation job ${job.data.context.requestId}`); return { skipped: true }; }
  }
  const traceId = job.data.context?.requestId;
  if (traceId) console.log(JSON.stringify({ level: "info", requestId: traceId, spanId: "worker-conversation", message: "AI compose started", conversationId: job.data.conversationId }));
  const result = await composeAiResponse(job.data.conversationId, job.data.agentId, traceId);
  await prisma.message.create({
    data: {
      conversationId: job.data.conversationId,
      direction: "outbound", content: result.body, channel: "email",
      aiMetadata: { tone: result.tone, suggestedAction: result.suggestedAction },
    },
  });
  // AI draft is saved as a message but NEVER auto-sent.
  // Human approval is required before any outbound email goes out.
  // Set awaiting_approval status so the inbox can highlight it.
  await prisma.conversation.update({ where: { id: job.data.conversationId }, data: { status: "awaiting_approval", updatedAt: new Date() } });
  if (traceId) console.log(JSON.stringify({ level: "info", requestId: traceId, spanId: "worker-conversation", message: "AI compose completed", conversationId: job.data.conversationId }));
}, { ...workerOpts, concurrency: 5 });

const emailWorker = new Worker("email-jobs", async (job: Job<{ leadId: string; subject?: string; body?: string; to?: string; context?: JobContext }>) => {
  if (job.data.context?.requestId) {
    const isFirst = await checkAndMarkDedup(job.data.context.requestId);
    if (!isFirst) { console.log(`[idempotent] Skipping duplicate email job ${job.data.context.requestId}`); return { skipped: true }; }
  }
  const lead = await prisma.lead.findUnique({ where: { id: job.data.leadId } });
  if (!lead?.email) throw new Error(`Lead has no email`);
  await sendEmail({
    action: "send_email",
    to: job.data.to || lead.email,
    subject: job.data.subject || "Following up",
    body: job.data.body || "Hi {{lead.name}},\n\n...",
  }, { lead });
}, { ...workerOpts, concurrency: 5 });

const campaignWorker = new Worker("campaign-jobs", async (job: Job<{ campaignId: string; leadId: string; stepIndex: number; context?: JobContext }>) => {
  if (job.data.context?.requestId) {
    const isFirst = await checkAndMarkDedup(job.data.context.requestId);
    if (!isFirst) { console.log(`[idempotent] Skipping duplicate campaign job ${job.data.context.requestId}`); return { skipped: true }; }
  }
  await executeCampaignStep(job.data.campaignId, job.data.leadId, job.data.stepIndex, job.data.context?.requestId);
}, { ...workerOpts, concurrency: 3 });

const scoringWorker = new Worker("scoring-jobs", async (job: Job<{ leadId: string; context?: JobContext }>) => {
  if (job.data.context?.requestId) {
    const isFirst = await checkAndMarkDedup(job.data.context.requestId);
    if (!isFirst) { console.log(`[idempotent] Skipping duplicate scoring job ${job.data.context.requestId}`); return { skipped: true }; }
  }
  await scoreLead(job.data.leadId, job.data.context?.requestId);
}, { ...workerOpts, concurrency: 3 });

// ═── Queue default job options (set at queue creation) ───────
// BullMQ 5.x: defaultJobOptions is read-only on Queue instances.
// Options are configured in queue.ts constructors instead.
// Worker-level backoffStrategy below handles retry timing.

// ── Event handlers ───────────────────────────────────────────────
for (const w of [conversationWorker, emailWorker, campaignWorker, scoringWorker]) {
  w.on("active", incr);
  w.on("completed", decr);
  w.on("failed", (job, err) => { console.error(`Job ${job?.id} failed (attempts: ${job?.attemptsMade})`, err); decr(); });
  w.on("error", (err) => console.error("Worker error:", err));
}
conversationWorker.on("ready", () => console.log("Conversation worker ready"));
emailWorker.on("ready", () => console.log("Email worker ready"));
campaignWorker.on("ready", () => console.log("Campaign worker ready"));
scoringWorker.on("ready", () => { console.log("All 4 workers listening (prefix: sales-agent)"); writeHealth("running"); });

// ── Healthcheck ──────────────────────────────────────────────────
const port = parseInt(process.env.PORT ?? "8080", 10);
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", activeJobs, uptime: process.uptime() }));
});
server.listen(port, "0.0.0.0", () => console.log(`Healthcheck on 0.0.0.0:${port}`));

// ── Shutdown ─────────────────────────────────────────────────────
async function shutdown() {
  console.log("Shutting down...");
  await Promise.all([conversationWorker.close(), emailWorker.close(), campaignWorker.close(), scoringWorker.close()]);
  await Promise.all([conversationQueue.close(), emailQueue.close(), campaignQueue.close(), scoringQueue.close()]);
  await connection.quit();
  await prisma.$disconnect();
  server.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
