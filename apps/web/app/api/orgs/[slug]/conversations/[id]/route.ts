import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { z } from "zod";

const updateConversationSchema = z.object({
  status: z.enum(["active", "closed", "archived"]).optional(),
  agentId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
    include: {
      lead: true,
      agent: { select: { id: true, name: true, personality: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  return NextResponse.json({ conversation });
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
  const parsed = updateConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const updated = await prisma.conversation.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ conversation: updated });
}
