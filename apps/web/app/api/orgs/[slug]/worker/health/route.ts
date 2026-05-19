import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({
      where: { userId: session.userId, organization: { slug: params.slug } },
    });
    if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

    requirePermission(membership.role, "view_agents");

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [recentEvent, activeJobs] = await Promise.all([
      prisma.message.findFirst({
        where: { createdAt: { gte: fiveMinAgo } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.campaignRun.count({ where: { status: "running" } }),
    ]);

    const worker = {
      status: recentEvent ? "running" : "idle",
      lastPoll: recentEvent?.createdAt?.toISOString() ?? null,
      activeJobs,
    };

    const orgFilter = { campaign: { organizationId: membership.organizationId } };
    const [queued, running, completed] = await Promise.all([
      prisma.campaignRun.count({ where: { status: "queued", ...orgFilter } }),
      prisma.campaignRun.count({ where: { status: "running", ...orgFilter } }),
      prisma.campaignRun.count({ where: { status: "completed", ...orgFilter } }),
    ]);

    return NextResponse.json({ worker, queue: { queued, running, completed } });
  } catch (error) {
    console.error("Worker health error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
