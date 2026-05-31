import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createLeadSchema } from "@/lib/validation";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
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

  try {
    const _perm = checkPermission(membership.role, "view_leads"); if (_perm) return _perm;
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const stage = url.searchParams.get("stage") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";

  const where: Record<string, unknown> = { organizationId: membership.organizationId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (stage) {
    where.stage = stage;
  }

  const allowedSortFields = ["name", "email", "stage", "createdAt"];
  const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const actualSortOrder = sortOrder === "asc" ? "asc" : "desc";

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { [actualSortBy]: actualSortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });
  const total = await prisma.lead.count({ where });

  return NextResponse.json({
    leads,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
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

  try {
    const _perm = checkPermission(membership.role, "manage_leads"); if (_perm) return _perm;
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { name, email, stage, tags } = parsed.data;

  // Sequential ops — pgBouncer incompatible with interactive $transaction
  const l = await prisma.lead.create({
    data: {
      organizationId: membership.organizationId,
      name,
      email,
      stage,
      tags: tags || [],
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: l.id,
      organizationId: membership.organizationId,
      userId: session.userId,
      userName: session.name ?? "Unknown",
      type: "created",
      content: "Lead created",
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: membership.organizationId,
      userId: session.userId,
      userName: session.name ?? "Unknown",
      action: "lead.created",
      targetType: "Lead",
      targetId: l.id,
      metadata: { name, email, stage: stage || "new" },
    },
  });

  const lead = l;

  return NextResponse.json(lead, { status: 201 });
}
