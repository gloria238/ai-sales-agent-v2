import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const orgId = membership.organizationId;

  const active = await prisma.conversation.count({ where: { organizationId: orgId, status: "active" } });
  const needsReply = await prisma.conversation.count({
    where: {
      organizationId: orgId,
      status: "active",
      messages: { some: { direction: "inbound", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
    },
  });
  const todayTotal = await prisma.conversation.count({
    where: { organizationId: orgId, updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  const qualifiedLeads = await prisma.lead.count({ where: { organizationId: orgId, score: { gte: 70 } } });
  const activeCampaigns = await prisma.campaign.count({ where: { organizationId: orgId, status: "active" } });

  return NextResponse.json({
    activeConversations: active,
    needsReply,
    todayTotal,
    qualifiedLeads,
    activeCampaigns,
    responseRate: active > 0 ? Math.round((active - needsReply) / active * 100) : 100,
  });
}
