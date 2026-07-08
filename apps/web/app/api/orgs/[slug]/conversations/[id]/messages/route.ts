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

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

  const where: Record<string, unknown> = {
    conversationId: params.id,
    conversation: { organizationId: membership.organizationId },
  };

  // Cursor-based: load messages older than the cursor message
  if (cursor) {
    const cursorMsg = await prisma.message.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (cursorMsg) {
      where.createdAt = { lt: cursorMsg.createdAt };
    }
  }

  // Fetch limit+1 to determine hasMore (avoid off-by-one on exact pages)
  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  // Reverse to asc order for display
  messages.reverse();

  // nextCursor points to the oldest message in this batch (for loading earlier history)
  const nextCursor = hasMore ? messages[0]?.id ?? null : null;

  return NextResponse.json({ messages, nextCursor, hasMore });
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
      reviewAction: parsed.data.reviewAction ?? null,
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
