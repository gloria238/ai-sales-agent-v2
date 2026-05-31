import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({
      where: { userId: session.userId, organization: { slug: params.slug } },
    });
    if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

    // Try to reach the actual worker health endpoint
    let workerStatus: string = "unknown";
    let workerUptime: number | null = null;
    const workerUrl = process.env.WORKER_HEALTH_URL;

    if (workerUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(workerUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          workerStatus = data.status || "running";
          workerUptime = data.uptime ?? null;
        } else {
          workerStatus = "unreachable";
        }
      } catch {
        workerStatus = "unreachable";
      }
    }

    // DB-based activity check as supplementary info
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentEvent = await prisma.message.findFirst({
      where: { conversation: { organizationId: membership.organizationId }, createdAt: { gte: fiveMinAgo } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const activeCampaignRuns = await prisma.campaignRun.count({ where: { status: "running" } });

    const orgFilter = { campaign: { organizationId: membership.organizationId } };
    const queued = await prisma.campaignRun.count({ where: { status: "queued", ...orgFilter } });
    const running = await prisma.campaignRun.count({ where: { status: "running", ...orgFilter } });
    const completed = await prisma.campaignRun.count({ where: { status: "completed", ...orgFilter } });

    return NextResponse.json({
      worker: {
        status: workerStatus,
        uptime: workerUptime,
        recentActivity: !!recentEvent,
        lastActivityAt: recentEvent?.createdAt?.toISOString() ?? null,
        activeJobs: activeCampaignRuns,
      },
      queue: { queued, running, completed },
    });
  } catch (error) {
    console.error("Worker health error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
