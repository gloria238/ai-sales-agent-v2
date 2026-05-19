import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";

export async function POST(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "run_campaigns"); if (_perm) return _perm;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
    include: { script: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status === "active") return NextResponse.json({ error: "Campaign is already running" }, { status: 400 });

  // Resolve target audience
  const audience: Record<string, unknown> = (campaign.targetAudience as any) || {};
  const leadWhere: Record<string, unknown> = { organizationId: membership.organizationId };
  if (audience.stage) leadWhere.stage = { in: audience.stage };
  if (audience.scoreMin !== undefined || audience.scoreMax !== undefined) {
    leadWhere.score = {};
    if (audience.scoreMin !== undefined) (leadWhere.score as any).gte = audience.scoreMin;
    if (audience.scoreMax !== undefined) (leadWhere.score as any).lte = audience.scoreMax;
  }
  if (audience.tags) leadWhere.tags = { hasSome: audience.tags };
  if (audience.source) leadWhere.source = { in: audience.source };

  const leads = await prisma.lead.findMany({
    where: leadWhere as any,
    select: { id: true },
    take: (campaign.schedule as any)?.maxPerDay || 100,
  });

  if (leads.length === 0) {
    return NextResponse.json({ error: "No leads matched the target audience" }, { status: 400 });
  }

  // Create campaign run
  const run = await prisma.campaignRun.create({
    data: {
      campaignId: params.id,
      status: "running",
      recipientCount: leads.length,
      stats: { completed: 0, failed: 0, pending: leads.length },
      startedAt: new Date(),
    },
  });

  // Update campaign status
  await prisma.campaign.update({
    where: { id: params.id },
    data: { status: "active", stats: { ...(campaign.stats as any || {}), sent: ((campaign.stats as any)?.sent || 0) + leads.length } },
  });

  // Dispatch to queue (dynamic import — only if Redis is available)
  try {
    const { campaignQueue } = await import("@salesagent/worker/queue");
    for (const lead of leads) {
      await campaignQueue.add("send-email", { campaignId: params.id, leadId: lead.id, stepIndex: 0 });
    }
  } catch {
    console.warn("Campaign queue unavailable — run persisted but jobs not dispatched");
  }

  return NextResponse.json({ run, leadCount: leads.length });
}
