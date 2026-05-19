import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";
import { updateCampaignSchema } from "@/lib/validation";

export async function GET(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
    include: {
      script: true,
      agent: { select: { id: true, name: true } },
      runs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  return NextResponse.json({ campaign });
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_campaigns"); if (_perm) return _perm;

  const body = await req.json();
  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.scriptId !== undefined) data.scriptId = parsed.data.scriptId;
  if (parsed.data.agentId !== undefined) data.agentId = parsed.data.agentId;
  if (parsed.data.targetAudience !== undefined) data.targetAudience = parsed.data.targetAudience;
  if (parsed.data.schedule !== undefined) data.schedule = parsed.data.schedule;

  const updated = await prisma.campaign.update({ where: { id: params.id }, data });

  return NextResponse.json({ campaign: updated });
}
