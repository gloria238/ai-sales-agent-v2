/**
 * Chat Messages REST API — WebSocket fallback for serverless deployments.
 *
 * POST /api/orgs/{slug}/conversations/{id}/chat-messages
 * GET  /api/orgs/{slug}/conversations/{id}/chat-messages
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { safe } from "@salesagent/ai-core";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });

  if (!membership && session.role !== "customer") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (membership && conversation.organizationId !== membership.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (session.role === "customer") {
    const lead = await prisma.lead.findFirst({
      where: { id: conversation.leadId, userId: session.userId },
    });
    if (!lead) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const url = new URL(req.url);
  const after = url.searchParams.get("after");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

  const where: Record<string, unknown> = { conversationId: params.id };
  if (after) {
    const afterMsg = await prisma.message.findUnique({ where: { id: after } });
    if (afterMsg) {
      where.createdAt = { gt: afterMsg.createdAt };
    }
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      conversationId: true,
      content: true,
      direction: true,
      aiMetadata: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      content: m.content,
      direction: m.direction,
      senderId: (m.aiMetadata as any)?.senderId,
      senderEmail: (m.aiMetadata as any)?.senderEmail,
      senderRole: (m.aiMetadata as any)?.senderRole,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });

  if (!membership && session.role !== "customer") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (membership && conversation.organizationId !== membership.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (session.role === "customer") {
    const lead = await prisma.lead.findFirst({
      where: { id: conversation.leadId, userId: session.userId },
    });
    if (!lead) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { content } = (await req.json()) as { content?: string };
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }
  if (content.length > 5000) {
    return NextResponse.json({ error: "Message too long (max 5000 chars)" }, { status: 400 });
  }

  const direction = session.role === "customer" ? "inbound" : "outbound";

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      content: safe(content),
      direction,
      channel: "chat",
      aiMetadata: {
        senderId: session.userId,
        senderEmail: session.email,
        senderRole: session.role,
      } as any,
    },
  });

  return NextResponse.json({
    message: {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      direction: message.direction,
      senderId: session.userId,
      senderEmail: session.email,
      senderRole: session.role,
      createdAt: message.createdAt.toISOString(),
    },
  });
}
