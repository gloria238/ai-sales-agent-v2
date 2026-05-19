import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";
import { updateAgentSchema } from "@/lib/validation";

export async function GET(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const agent = await prisma.agent.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
    include: {
      _count: { select: { conversations: true, campaigns: true } },
    },
  });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  return NextResponse.json({ agent });
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  const body = await req.json();
  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const agent = await prisma.agent.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
  });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.personality !== undefined) data.personality = parsed.data.personality;
  if (parsed.data.goals !== undefined) data.goals = parsed.data.goals;
  if (parsed.data.knowledgeBase !== undefined) data.knowledgeBase = parsed.data.knowledgeBase;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  const updated = await prisma.agent.update({ where: { id: params.id }, data });

  return NextResponse.json({ agent: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  const agent = await prisma.agent.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
  });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // Unlink conversations from this agent before deleting
  await prisma.conversation.updateMany({ where: { agentId: params.id }, data: { agentId: null } });
  await prisma.agent.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
