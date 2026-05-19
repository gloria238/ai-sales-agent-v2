"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare, Mail, Clock, Star, ChevronRight } from "lucide-react";

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

  const scoreLabel = (score: number | null) => {
    if (score === null) return null;
    if (score >= 70) return { text: "Hot", color: "bg-red-500/10 text-red-400 border-red-500/20" };
    if (score >= 40) return { text: "Warm", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    return { text: "Cold", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Left panel: conversation list */}
      <div className="w-full max-w-sm border-r border-border flex flex-col bg-bg-card/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-semibold text-text mb-3">Inbox</h1>
          <div className="flex gap-1">
            {(["all", "active", "needs_reply", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs rounded-lg transition-colors",
                  filter === f
                    ? "bg-accent text-white"
                    : "text-text-muted hover:text-text hover:bg-bg-card"
                )}
              >
                {f === "needs_reply" ? "Needs Reply" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations</p>
            </div>
          ) : (
            filtered.map((c) => {
              const lastMsg = c.messages[0];
              const label = scoreLabel(c.lead.score);
              return (
                <button
                  key={c.id}
                  onClick={() => router.push(`/inbox/${c.id}`)}
                  className="w-full text-left p-4 border-b border-border hover:bg-bg-card transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-text truncate">{c.lead.name}</span>
                        {label && (
                          <Badge className={cn("text-[10px] px-1.5 py-0", label.color)} variant="outline">
                            {label.text}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{c.lead.company || c.lead.email || "No contact info"}</p>
                      <p className="text-xs text-text-muted mt-1 truncate max-w-[220px]">
                        {lastMsg ? lastMsg.content.substring(0, 80) : "No messages"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-text-muted">
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </span>
                      {lastMsg?.direction === "inbound" && c.status === "active" && (
                        <span className="w-2 h-2 rounded-full bg-accent" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: placeholder */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-bg">
        <div className="text-center text-text-muted">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a conversation to view</p>
        </div>
      </div>
    </div>
  );
}
