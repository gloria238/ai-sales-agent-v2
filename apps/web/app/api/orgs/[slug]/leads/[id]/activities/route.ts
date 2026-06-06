import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { z } from "zod";

const createActivitySchema = z.object({
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
});

export async function GET(request: Request, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const _perm = checkPermission(membership.role, "view_leads"); if (_perm) return _perm;

  const activities = await prisma.leadActivity.findMany({
    where: {
      leadId: params.id,
      organizationId: membership.organizationId,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(activities);
}

export async function POST(request: Request, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const _perm = checkPermission(membership.role, "manage_leads"); if (_perm) return _perm;

  const body = await request.json();
  const parsed = createActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const activity = await prisma.leadActivity.create({
    data: {
      leadId: params.id,
      organizationId: membership.organizationId,
      userId: session.userId,
      userName: session.name ?? "Unknown",
      type: "note",
      content: parsed.data.content.trim(),
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
