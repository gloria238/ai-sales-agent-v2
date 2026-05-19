import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { sendMessageSchema } from "@/lib/validation";

export async function GET(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requirePermission(membership.role, "view_agents");

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id, conversation: { organizationId: membership.organizationId } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requirePermission(membership.role, "manage_agents");

  const body = await req.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      direction: "outbound",
      content: parsed.data.content,
      channel: parsed.data.channel,
    },
  });

  await prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ message }, { status: 201 });
}
