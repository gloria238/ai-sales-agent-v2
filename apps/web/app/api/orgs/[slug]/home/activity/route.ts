import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const perm = checkPermission(membership.role, "view_leads");
  if (perm) return perm;

  const orgId = membership.organizationId;

  // Sequential queries — connection_limit=1, parallel exhausts pgBouncer pool
  const recentActivities = await prisma.leadActivity.findMany({
    where: { organizationId: orgId },
    include: { lead: { select: { id: true, name: true, email: true, company: true, stage: true, score: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const recentAuditLogs = await prisma.auditLog.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Merge and sort by time, interleaving activities and audit logs
  const feed: Array<{
    id: string;
    type: "lead_activity" | "audit";
    action: string;
    description: string;
    lead?: { id: string; name: string; email: string | null; company: string | null; stage: string | null; score: number | null };
    userName?: string;
    createdAt: string;
    targetType?: string;
  }> = [];

  for (const a of recentActivities) {
    let description = "";
    switch (a.type) {
      case "created": description = "创建了客户"; break;
      case "stage_change": {
        const meta = a.metadata as any;
        const stageNames: Record<string, string> = {
          new: "新客户", contacted: "已联系", qualified: "已确认",
          proposal: "方案中", negotiation: "洽谈中", closed_won: "已成交", closed_lost: "已流失",
        };
        description = `从「${stageNames[meta?.fromStage] || meta?.fromStage || "?"}」→「${stageNames[meta?.toStage] || meta?.toStage || "?"}」`;
        break;
      }
      case "email_sent": description = "发送了邮件"; break;
      case "email_received": description = "收到客户回复"; break;
      case "meeting_booked": description = "预约了会议"; break;
      case "ai_followup": description = a.content || "AI 自动跟进"; break;
      case "note": description = a.content || "添加了备注"; break;
      default: description = a.type;
    }
    feed.push({
      id: a.id,
      type: "lead_activity",
      action: a.type,
      description,
      lead: a.lead ? {
        id: a.lead.id,
        name: a.lead.name,
        email: a.lead.email,
        company: a.lead.company,
        stage: a.lead.stage,
        score: a.lead.score,
      } : undefined,
      userName: a.userName ?? undefined,
      createdAt: a.createdAt.toISOString(),
    });
  }

  for (const log of recentAuditLogs) {
    feed.push({
      id: log.id,
      type: "audit",
      action: log.action,
      description: `${log.targetType} · ${log.action}`,
      userName: log.userName ?? undefined,
      targetType: log.targetType,
      createdAt: log.createdAt.toISOString(),
    });
  }

  // Sort merged feed by createdAt descending
  feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ feed: feed.slice(0, 15) });
}
