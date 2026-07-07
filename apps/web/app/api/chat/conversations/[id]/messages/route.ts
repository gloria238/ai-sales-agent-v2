/**
 * Portal Chat Messages API — REST fallback for Portal customers.
 *
 * Used when the Socket.IO server is unavailable (e.g., Vercel serverless).
 * The client auto-detects WebSocket availability and falls back to polling this endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { verifyToken } from "@/lib/auth";
import { safe } from "@salesagent/ai-core";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Auth via session cookie
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").filter(Boolean).map((c) => {
      const [key, ...rest] = c.split("=");
      return [key, rest.join("=")];
    })
  );
  const token = cookies["session"];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifyToken(token);
  if (!session || session.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify customer owns this conversation's lead
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { lead: true },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conversation.lead?.userId !== session.userId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { content } = (await req.json()) as { content?: string };
  if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 });
  if (content.length > 5000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      content: safe(content),
      direction: "inbound",
      channel: "chat",
      aiMetadata: {
        senderId: session.userId,
        senderEmail: session.email,
        senderRole: "customer",
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
      senderRole: "customer",
      createdAt: message.createdAt.toISOString(),
    },
  });
}
