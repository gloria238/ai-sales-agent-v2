import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  reviewAction: z.enum(["approved", "rejected"]).optional(),
});

/** PATCH /api/orgs/{slug}/conversations/{id}/messages/{messageId}
 *  Update an existing message — used for HITL reviewAction on Worker-generated drafts.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; id: string; messageId: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Verify message belongs to this conversation + org
  const message = await prisma.message.findFirst({
    where: {
      id: params.messageId,
      conversationId: params.id,
      conversation: { organizationId: membership.organizationId },
    },
  });
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const updated = await prisma.message.update({
    where: { id: params.messageId },
    data: { reviewAction: parsed.data.reviewAction ?? null },
  });

  // Reset conversation status from awaiting_approval → active after review
  if (parsed.data.reviewAction && message.conversationId) {
    const conv = await prisma.conversation.findFirst({
      where: { id: message.conversationId, status: "awaiting_approval" },
    });
    if (conv) {
      await prisma.conversation.update({
        where: { id: message.conversationId },
        data: { status: "active", updatedAt: new Date() },
      });
    }
  }

  return NextResponse.json({ message: updated });
}
