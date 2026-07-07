import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ChatWindow } from "@/components/chat/chat-window";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Agent Chat Page — real-time chat with a customer.
 *
 * URL: /chat?conversation={conversationId}
 * Navigate here from the Inbox "Chat" button.
 */

export default async function ChatPage({
  searchParams,
}: {
  searchParams: { conversation?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "customer") redirect("/portal/conversations");

  const conversationId = searchParams.conversation;
  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-text-muted text-sm">请从收件箱选择一个对话开始聊天</p>
          <Link href="/inbox" className="text-accent text-sm hover:underline mt-2 inline-block">
            ← 返回收件箱
          </Link>
        </div>
      </div>
    );
  }

  // Fetch conversation + messages
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      lead: { select: { id: true, name: true, company: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">对话不存在</p>
      </div>
    );
  }

  const customerName = conversation.lead?.name || "客户";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-card">
        <Link
          href={`/inbox/${conversationId}`}
          className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-bg-subtle transition-colors shrink-0"
        >
          <ArrowLeft className="size-4 text-text-muted" />
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-text truncate">
            {customerName}
            {conversation.lead?.company ? ` · ${conversation.lead.company}` : ""}
          </h2>
          <p className="text-xs text-text-muted">
            {conversation.subject || "实时聊天"}
          </p>
        </div>
        <Link
          href={`/leads/${conversation.leadId}`}
          className="text-xs text-accent hover:underline shrink-0"
        >
          查看客户资料
        </Link>
      </div>

      {/* Chat */}
      <ChatWindow
        conversationId={conversationId}
        userRole="agent"
        orgSlug={session.orgSlug}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          direction: m.direction as "inbound" | "outbound",
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        }))}
        otherPartyName={customerName}
      />
    </div>
  );
}
