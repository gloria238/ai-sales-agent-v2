import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { signToken } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { updateOrgSchema } from "@/lib/validation";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
    include: { organization: true },
  });

  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
  });
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const _perm = checkPermission(membership.role, "manage_org"); if (_perm) return _perm;

  const body = await request.json();
  const parsed = updateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.slug) {
    const exists = await prisma.organization.findUnique({ where: { slug: parsed.data.slug } });
    if (exists && exists.id !== membership.organizationId) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }
    data.slug = parsed.data.slug;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.organization.update({
    where: { id: membership.organizationId },
    data,
  });

  await logAudit({
    organizationId: membership.organizationId,
    userId: session.userId,
    userName: session.name ?? "Unknown",
    action: "organization.updated",
    targetType: "Organization",
    targetId: updated.id,
    metadata: data,
  });

  const response = NextResponse.json({ id: updated.id, name: updated.name, slug: updated.slug });

  // Re-issue JWT if slug changed, otherwise subsequent API calls use stale slug → 404
  if (data.slug && data.slug !== params.slug) {
    const token = await signToken({
      userId: session.userId,
      email: session.email,
      name: session.name,
      orgId: session.orgId,
      orgSlug: data.slug,
      role: session.role,
    });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }

  return response;
}
