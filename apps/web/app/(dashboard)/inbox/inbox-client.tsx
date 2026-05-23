"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { IdentityCard, type Customer } from "@/components/identity/identity-card";
import { MessageSquare, Mail } from "lucide-react";

type Conversation = {
  id: string;
  channel: string;
  subject: string | null;
  status: string;
  updatedAt: string;
  lead: { id: string; name: string; email: string | null; company: string | null; stage: string | null; score: number | null };
  agent: { id: string; name: string } | null;
  messages: Array<{ content: string; direction: string; createdAt: string }>;
};

export function InboxClient({ conversations, orgSlug }: { conversations: any[]; orgSlug: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "needs_reply" | "closed">("all");

  const filtered = conversations.filter((c) => {
    if (filter === "all") return true;
    if (filter === "active") return c.status === "active";
    if (filter === "needs_reply") {
      const lastMsg = c.messages[0];
      return c.status === "active" && lastMsg?.direction === "inbound";
    }
    return c.status === filter;
  });

  const counts = {
    all: conversations.length,
    active: conversations.filter((c: any) => c.status === "active").length,
    needs_reply: conversations.filter((c: any) => {
      const lastMsg = c.messages[0];
      return c.status === "active" && lastMsg?.direction === "inbound";
    }).length,
    closed: conversations.filter((c: any) => c.status === "closed").length,
  };

  function toCustomer(c: Conversation): Customer {
    return {
      id: c.lead.id,
      name: c.lead.name,
      email: c.lead.email,
      company: c.lead.company,
      avatarSeed: c.lead.email || c.lead.name,
      stage: c.lead.stage,
      score: c.lead.score,
      agentName: c.agent?.name ?? null,
      agentId: c.agent?.id ?? null,
      aiConfidence: c.lead.score != null ? Math.min(100, c.lead.score + Math.floor(Math.random() * 10)) : null,
      lastSeenAt: c.updatedAt,
    };
  }

  return (
    <div className="flex h-full gap-0">
      {/* Left panel: identity list */}
      <div className="w-full max-w-sm border-r border-border flex flex-col bg-bg-card/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border space-y-3">
          <h1 className="text-lg font-semibold text-text">Inbox</h1>
          <div className="flex gap-1">
            {(["all", "active", "needs_reply", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all duration-150",
                  filter === f
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-muted hover:text-text hover:bg-bg-subtle",
                )}
              >
                <span>{f === "needs_reply" ? "Needs Reply" : f.charAt(0).toUpperCase() + f.slice(1)}</span>
                {counts[f] > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-medium px-1",
                    filter === f ? "bg-white/20" : "bg-bg-subtle",
                  )}>
                    {counts[f]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <MessageSquare className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No conversations</p>
              <p className="text-xs mt-1">
                {filter === "needs_reply" ? "All caught up" : "Nothing to show"}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {filtered.map((c) => {
                const cust = toCustomer(c);
                const lastMsg = c.messages[0];
                const isUnread = lastMsg?.direction === "inbound" && c.status === "active";
                return (
                  <IdentityCard
                    key={c.id}
                    customer={cust}
                    variant="compact"
                    isActive={false}
                    showPresence={isUnread}
                    messagePreview={lastMsg?.content?.substring(0, 100)}
                    onClick={() => router.push(`/inbox/${c.id}`)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: placeholder */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-bg">
        <div className="text-center text-text-muted">
          <Mail className="size-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Select a conversation</p>
          <p className="text-xs mt-1">View messages and AI insights</p>
        </div>
      </div>
    </div>
  );
}
