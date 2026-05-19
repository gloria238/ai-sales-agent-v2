import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";
import { createCampaignSchema } from "@/lib/validation";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      script: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
      _count: { select: { runs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_campaigns"); if (_perm) return _perm;

  const body = await req.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const campaign = await prisma.campaign.create({
    data: {
      organizationId: membership.organizationId,
      name: parsed.data.name,
      description: parsed.data.description,
      scriptId: parsed.data.scriptId,
      agentId: parsed.data.agentId,
      targetAudience: parsed.data.targetAudience as any,
      schedule: parsed.data.schedule as any,
      stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, booked: 0, unsubscribed: 0 },
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
