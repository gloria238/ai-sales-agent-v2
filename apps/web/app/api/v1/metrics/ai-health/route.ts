import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { estimateCost } from "@salesagent/ai-core";

/** GET /api/v1/metrics/ai-health?orgSlug=acme&period=24h
 *  Aggregate AI call metrics for the AI Health Dashboard.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: session.orgSlug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "24h";
  const hours = period === "7d" ? 168 : period === "30d" ? 720 : 24;

  const since = new Date(Date.now() - hours * 3600_000);

  // ── Summary (last N hours) ──────────────────────────────
  const metrics = await prisma.aICallMetric.findMany({
    where: { organizationId: membership.organizationId, createdAt: { gte: since } },
    select: { jobType: true, promptTokens: true, completionTokens: true, llmLatencyMs: true, success: true, fallbackUsed: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const totalCalls = metrics.length;
  const succeededCalls = metrics.filter((m) => m.success);
  const fallbackCalls = metrics.filter((m) => m.fallbackUsed);

  // Latency P50 / P95 — use SQL percentile_cont (consistent with ai-metrics route)
  const [percentileRows] = (await prisma.$queryRawUnsafe(
    `SELECT
      percentile_cont(0.5) WITHIN GROUP (ORDER BY "llmLatencyMs")::int AS p50,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY "llmLatencyMs")::int AS p95
    FROM sales_agent."AICallMetric"
    WHERE "organizationId" = $1
      AND "createdAt" >= $2`,
    membership.organizationId,
    since,
  )) as unknown as [Record<string, number | null>];
  const p50 = percentileRows?.["p50"] ?? 0;
  const p95 = percentileRows?.["p95"] ?? 0;

  // Total cost — use shared estimateCost()
  const totalPromptTokens = metrics.reduce((s, m) => s + m.promptTokens, 0);
  const totalCompletionTokens = metrics.reduce((s, m) => s + m.completionTokens, 0);
  const totalCost = estimateCost(totalPromptTokens, totalCompletionTokens);

  // Fallback rate
  const fallbackRate = totalCalls > 0 ? fallbackCalls.length / totalCalls : 0;

  // By job type — use shared estimateCost()
  const byJobType = ["compose_response", "score_lead", "summarize_conversation", "generate_script", "campaign_ai", "kb_ask"]
    .map((jt) => {
      const group = metrics.filter((m) => m.jobType === jt);
      const groupPromptTokens = group.reduce((s, m) => s + m.promptTokens, 0);
      const groupCompletionTokens = group.reduce((s, m) => s + m.completionTokens, 0);
      return {
        jobType: jt,
        count: group.length,
        avgLatency: group.length > 0 ? Math.round(group.reduce((s, m) => s + m.llmLatencyMs, 0) / group.length) : 0,
        cost: group.length > 0 ? estimateCost(groupPromptTokens, groupCompletionTokens) : 0,
      };
    })
    .filter((g) => g.count > 0);

  // Daily tokens (past 30 days)
  const dailySince = new Date(Date.now() - 30 * 24 * 3600_000);
  const dailyMetrics = await prisma.aICallMetric.findMany({
    where: { organizationId: membership.organizationId, createdAt: { gte: dailySince } },
    select: { promptTokens: true, completionTokens: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<string, { promptTokens: number; completionTokens: number }>();
  for (const m of dailyMetrics) {
    const day = m.createdAt.toISOString().slice(0, 10);
    const entry = dailyMap.get(day) || { promptTokens: 0, completionTokens: 0 };
    entry.promptTokens += m.promptTokens;
    entry.completionTokens += m.completionTokens;
    dailyMap.set(day, entry);
  }
  const dailyTokens = Array.from(dailyMap.entries())
    .map(([date, d]) => ({ date, promptTokens: d.promptTokens, completionTokens: d.completionTokens }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Alerts
  const alerts: Array<{ level: "warning" | "critical"; message: string }> = [];
  if (p95 > 10_000) alerts.push({ level: "critical", message: "P95 AI latency exceeding 10s threshold" });
  else if (p95 > 8_000) alerts.push({ level: "warning", message: "P95 AI latency approaching 10s threshold" });
  if (fallbackRate > 0.1) alerts.push({ level: "critical", message: "AI fallback rate exceeds 10%" });
  else if (fallbackRate > 0.05) alerts.push({ level: "warning", message: "AI fallback rate above 5%" });

  return NextResponse.json({
    summary: {
      totalCalls,
      avgLatencyP50: p50,
      avgLatencyP95: p95,
      totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
      fallbackRate: Math.round(fallbackRate * 100) / 100,
      successRate: totalCalls > 0 ? Math.round((succeededCalls.length / totalCalls) * 100) : 100,
    },
    byJobType,
    dailyTokens,
    alerts,
  });
}
