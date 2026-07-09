import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";

/** GET /api/orgs/{slug}/metrics/ai?days=7
 *  Four-layer AI metrics dashboard — system, quality, business, risk.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const url = new URL(req.url);
  const days = Math.min(parseInt(url.searchParams.get("days") || "7", 10), 90);
  const from = new Date(Date.now() - days * 24 * 3600_000);
  const orgId = membership.organizationId;

  // ── System Layer: latency percentiles + total calls ──────────
  const [percentileRows] = (await prisma.$queryRawUnsafe(
    `SELECT
      percentile_cont(0.5) WITHIN GROUP (ORDER BY "totalLatencyMs")::int AS p50,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY "totalLatencyMs")::int AS p95
    FROM sales_agent."AICallMetric"
    WHERE "organizationId" = $1
      AND "createdAt" >= $2`,
    orgId,
    from,
  )) as unknown as [Record<string, number | null>];
  const p50 = percentileRows?.["p50"] ?? null;
  const p95 = percentileRows?.["p95"] ?? null;

  const totalCalls = await prisma.aICallMetric.count({
    where: { organizationId: orgId, createdAt: { gte: from } },
  });

  // ── Quality Layer: daily call counts ─────────────────────────
  const dailyMetrics = await prisma.aICallMetric.findMany({
    where: { organizationId: orgId, createdAt: { gte: from } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<string, number>();
  for (const m of dailyMetrics) {
    const day = m.createdAt.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  }
  const dailyCalls = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Business Layer: status distribution + handoff rate ───────
  const statusGroups = await prisma.conversation.groupBy({
    by: ["status"],
    where: { organizationId: orgId },
    _count: true,
  });
  const statusDistribution = statusGroups.map((g) => ({
    status: g.status,
    count: g._count,
  }));

  // Handoff rate: conversations with AI outbound messages / total conversations
  // (approximation — true handoff tracking requires reviewAction or audit log)
  const totalConversations = await prisma.conversation.count({
    where: { organizationId: orgId },
  });
  const aiInvolvedConversations = await prisma.conversation.count({
    where: {
      organizationId: orgId,
      messages: {
        some: { direction: "outbound", aiMetadata: { not: undefined as any } },
      },
    },
  });
  const handoffRate = totalConversations > 0
    ? Math.round((aiInvolvedConversations / totalConversations) * 100) / 100
    : null;

  // Draft adoption rate — from Message.reviewAction audit trail
  const totalReviewable = await prisma.message.count({
    where: {
      conversation: { organizationId: orgId },
      direction: "outbound",
      reviewAction: { not: null },
    },
  });
  const approvedCount = await prisma.message.count({
    where: {
      conversation: { organizationId: orgId },
      direction: "outbound",
      reviewAction: "approved",
    },
  });
  const draftAdoptionRate = totalReviewable > 0
    ? Math.round((approvedCount / totalReviewable) * 100) / 100
    : null;

  // ── Risk Layer: timeouts ─────────────────────────────────────
  const timeouts = await prisma.aICallMetric.count({
    where: {
      organizationId: orgId,
      errorType: { contains: "timeout", mode: "insensitive" },
      createdAt: { gte: from },
    },
  });

  return NextResponse.json({
    system: {
      p50: p50 ?? 0,
      p95: p95 ?? 0,
      totalCalls,
      kbHitRate: null, // kbChunksUsed column not in AICallMetric yet
    },
    quality: {
      avgKbChunks: null,
      dailyCalls,
      dailyKbHit: [],
    },
    business: {
      statusDistribution,
      handoffRate,
      draftAdoptionRate,
    },
    risk: {
      confidenceGateFired: null,
      timeouts,
    },
    period: {
      days,
      from: from.toISOString(),
      to: new Date().toISOString(),
    },
  });
}
