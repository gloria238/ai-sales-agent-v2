import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await getScopedLead(session.userId, params.slug, params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { requirePermission(lead._membershipRole, "view_leads"); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const { _membershipRole, ...data } = lead;
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await getScopedLead(session.userId, params.slug, params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { requirePermission(lead._membershipRole, "manage_leads"); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const body = await request.json();
  const allowedFields = ["name", "email", "stage", "ownerId", "tags"];
  const changes: Record<string, unknown> = {};

  for (const key of allowedFields) {
    if (body[key] !== undefined) changes[key] = body[key];
  }

  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const old = await tx.lead.findUniqueOrThrow({ where: { id: params.id } });
    const newStage = changes.stage as string | undefined;

    if (newStage && newStage !== old.stage) {
      await tx.leadActivity.create({
        data: {
          leadId: params.id,
          organizationId: old.organizationId,
          userId: session.userId,
          userName: session.name ?? "Unknown",
          type: "stage_change",
          content: `Stage changed from ${old.stage || "none"} to ${newStage}`,
          metadata: { fromStage: old.stage, toStage: newStage },
        },
      });
    }

    delete changes.createdAt;
    delete changes.updatedAt;

    const result = await tx.lead.update({
      where: { id: params.id },
      data: changes,
    });

    await tx.auditLog.create({
      data: {
        organizationId: old.organizationId,
        userId: session.userId,
        userName: session.name ?? "Unknown",
        action: "lead.updated",
        targetType: "Lead",
        targetId: params.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: changes as any,
      },
    });

    return result;
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await getScopedLead(session.userId, params.slug, params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { requirePermission(lead._membershipRole, "delete_leads"); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const leadData = await prisma.lead.findUniqueOrThrow({ where: { id: params.id } });

  await prisma.$transaction(async (tx) => {
    await tx.lead.delete({ where: { id: params.id } });

    await tx.auditLog.create({
      data: {
        organizationId: leadData.organizationId,
        userId: session.userId,
        userName: session.name ?? "Unknown",
        action: "lead.deleted",
        targetType: "Lead",
        targetId: params.id,
        metadata: { name: leadData.name, email: leadData.email, stage: leadData.stage },
      },
    });
  });

  return new NextResponse(null, { status: 204 });
}

// Helper: fetch lead with membership role check in one query
async function getScopedLead(userId: string, orgSlug: string, leadId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId, organization: { slug: orgSlug } },
  });
  if (!membership) return null;

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: membership.organizationId },
  });
  if (!lead) return null;

  return { ...lead, _membershipRole: membership.role };
}
