import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { const _perm = checkPermission(membership.role, "view_audit_log"); if (_perm) return _perm; }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "30", 10)));
  const action = url.searchParams.get("action") || "";
  const targetType = url.searchParams.get("targetType") || "";

  const where: Record<string, unknown> = { organizationId: membership.organizationId };
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (targetType) where.targetType = targetType;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
  const total = await prisma.auditLog.count({ where });

  return NextResponse.json({
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
