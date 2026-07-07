import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@salesagent/db";
import { notFound } from "next/navigation";
import { ChatWindow } from "@/components/chat/chat-window";
import { ArrowLeft } from "lucide-react";

/**
 * Customer Portal — Real-time Chat Detail.
 *
 * Phase 21: WebSocket real-time chat replaces the Phase 19 disabled textarea.
 * Falls back to REST polling if Socket.IO server is not running.
 */

export default async function PortalConversationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Verify customer session from JWT cookie
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return notFound();

  const session = await verifyToken(token);
  if (!session || session.role !== "customer") return notFound();

  // Fetch conversation — must belong to a lead owned by this customer
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      lead: { select: { id: true, name: true, company: true, userId: true } },
      agent: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  if (!conversation) return notFound();

  // Security: customer can only view their own lead's conversations
  if (conversation.lead?.userId !== session.userId) {
    return notFound();
  }

  const agentName = conversation.agent?.name || "AI 销售助理";

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <a
          href="/portal/conversations"
          className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-bg-subtle transition-colors shrink-0"
        >
          <ArrowLeft className="size-4 text-text-muted" />
        </a>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-text truncate">
            {conversation.subject || agentName}
          </h2>
          <p className="text-xs text-text-muted">{agentName} · 在线</p>
        </div>
      </div>

      {/* Chat */}
      <ChatWindow
        conversationId={params.id}
        userRole="customer"
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          direction: m.direction as "inbound" | "outbound",
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        }))}
        otherPartyName={agentName}
      />
    </div>
  );
}
