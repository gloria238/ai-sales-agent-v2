import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { updateMemberRoleSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: { slug: string; membershipId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const _perm = checkPermission(membership.role, "manage_members"); if (_perm) return _perm;

  const target = await prisma.membership.findFirst({
    where: { id: params.membershipId, organizationId: membership.organizationId },
  });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { role } = parsed.data;

  // Prevent removing the last owner
  if (target.role === "owner" && role !== "owner") {
    const ownerCount = await prisma.membership.count({
      where: { organizationId: membership.organizationId, role: "owner" },
    });
    if (ownerCount <= 1) return NextResponse.json({ error: "Cannot demote the last owner" }, { status: 400 });
  }

  const updated = await prisma.membership.update({
    where: { id: params.membershipId },
    data: { role },
    include: { user: true },
  });

  await logAudit({
    organizationId: membership.organizationId,
    userId: session.userId,
    userName: session.name ?? "Unknown",
    action: "member.updated",
    targetType: "Membership",
    targetId: params.membershipId,
    metadata: { fromRole: target.role, toRole: role, memberUserId: target.userId },
  });

  return NextResponse.json({ id: updated.id, userId: updated.userId, name: updated.user.name, email: updated.user.email, role: updated.role });
}

export async function DELETE(request: Request, { params }: { params: { slug: string; membershipId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const _perm = checkPermission(membership.role, "manage_members"); if (_perm) return _perm;

  const target = await prisma.membership.findFirst({
    where: { id: params.membershipId, organizationId: membership.organizationId },
  });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  // Prevent removing the last owner
  if (target.role === "owner") {
    const ownerCount = await prisma.membership.count({
      where: { organizationId: membership.organizationId, role: "owner" },
    });
    if (ownerCount <= 1) return NextResponse.json({ error: "Cannot remove the last owner" }, { status: 400 });
  }

  await prisma.membership.delete({ where: { id: params.membershipId } });

  await logAudit({
    organizationId: membership.organizationId,
    userId: session.userId,
    userName: session.name ?? "Unknown",
    action: "member.removed",
    targetType: "Membership",
    targetId: params.membershipId,
    metadata: { removedUserId: target.userId, removedRole: target.role },
  });

  return new NextResponse(null, { status: 204 });
}
