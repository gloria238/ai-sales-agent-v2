import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";
import { sendMessageSchema } from "@/lib/validation";
import { getRequestContext } from "@/lib/logger";

export async function GET(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

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
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

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

  // Enqueue AI reply composition + email delivery (non-blocking — worker handles if Redis available)
  try {
    const ctx = getRequestContext(req);
    const context = { requestId: ctx.requestId, spanId: `http-${ctx.requestId.slice(0, 8)}` };
    const { conversationQueue, emailQueue } = await import("@salesagent/worker/queue");
    await conversationQueue.add("compose-reply", { conversationId: params.id, context });
    await emailQueue.add("send-outbound", { conversationId: params.id, leadId: conversation.leadId, context });
  } catch {
    // Redis unavailable — message is still saved, AI reply + email won't fire
  }

  return NextResponse.json({ message }, { status: 201 });
}
