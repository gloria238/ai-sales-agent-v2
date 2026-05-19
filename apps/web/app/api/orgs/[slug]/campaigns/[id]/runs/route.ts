import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";

export async function GET(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requirePermission(membership.role, "view_agents");

  const runs = await prisma.campaignRun.findMany({
    where: { campaignId: params.id, campaign: { organizationId: membership.organizationId } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ runs });
}
