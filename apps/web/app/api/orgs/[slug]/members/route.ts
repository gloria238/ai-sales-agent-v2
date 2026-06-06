import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { inviteMemberSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({
      where: { userId: session.userId, organization: { slug: params.slug } },
    });
    if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const _perm = checkPermission(membership.role, "view_members"); if (_perm) return _perm;

    const members = await prisma.membership.findMany({
      where: { organizationId: membership.organizationId },
      include: { user: true },
    });

    return NextResponse.json(
      members.map((m) => ({ id: m.id, userId: m.userId, name: m.user.name, email: m.user.email, role: m.role })),
    );
  } catch (error) {
    console.error("Members GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({
      where: { userId: session.userId, organization: { slug: params.slug } },
    });
    if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const _perm = checkPermission(membership.role, "manage_members"); if (_perm) return _perm;

    const body = await request.json();
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { email, role } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found. Ask them to register first." }, { status: 404 });

    const existing = await prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId: membership.organizationId, userId: user.id } },
    });
    if (existing) return NextResponse.json({ error: "User is already a member" }, { status: 409 });

    const created = await prisma.membership.create({
      data: { organizationId: membership.organizationId, userId: user.id, role },
      include: { user: true },
    });

    await logAudit({
      organizationId: membership.organizationId,
      userId: session.userId,
      userName: session.name ?? "Unknown",
      action: "member.added",
      targetType: "Membership",
      targetId: created.id,
      metadata: { addedUserId: user.id, addedEmail: email, role },
    });

    return NextResponse.json({ id: created.id, userId: created.userId, name: created.user.name, email: created.user.email, role: created.role }, { status: 201 });
  } catch (error) {
    console.error("Members POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
