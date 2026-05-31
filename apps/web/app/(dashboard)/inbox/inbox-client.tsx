"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { IdentityCard, type Customer } from "@/components/identity/identity-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/identity/avatar";
import { relativeTime, presenceFromDate } from "@/lib/time";
import {
  MessageSquare, Mail, Send, Sparkles, RefreshCw, ChevronLeft,
  Building2, Clock, User, ExternalLink, Star,
} from "lucide-react";
import { toast } from "sonner";

type Message = {
  id: string; direction: string; content: string; channel: string;
  aiMetadata?: any; createdAt: string;
};

type Props = { conversations: any[]; orgSlug: string; selectedId?: string };

function AITypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-slide-up flex-row-reverse">
      <div className="size-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        <Sparkles className="size-3.5 text-accent" />
      </div>
      <div className="rounded-2xl rounded-tr-sm px-4 py-3 border border-accent/10 bg-bg-card">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-accent font-medium">AI drafting…</span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Lead detail popover ──────────────────────────────────
function LeadPopover({ lead }: { lead: any }) {
  const [show, setShow] = useState(false);
  const sl = lead.score != null ? (lead.score >= 70 ? "Hot" : lead.score >= 40 ? "Warm" : "Cold") : null;
  const sc = sl === "Hot" ? "text-emerald-400 bg-emerald-500/10" :
    sl === "Warm" ? "text-blue-400 bg-blue-500/10" : "text-slate-400 bg-slate-500/10";

  return (
    <div className="relative inline-flex items-center">
      <button onClick={() => setShow(!show)} className="p-1 rounded-md hover:bg-bg-subtle text-text-muted hover:text-text transition-colors" title="Lead details">
        <ExternalLink className="size-3.5" />
      </button>
      {show && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShow(false)} />
          <div className="absolute left-full top-0 ml-2 z-20 w-72 bg-bg-card border border-border rounded-xl shadow-xl p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={lead.name} size="md" seed={lead.email || lead.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text truncate">{lead.name}</p>
                <p className="text-xs text-text-muted truncate">{lead.email || "No email"}</p>
              </div>
            </div>
            <div className="space-y-2">
              {lead.company && (
                <div className="flex items-center gap-2 text-xs text-text-secondary"><Building2 className="size-3 shrink-0 text-text-muted" />{lead.company}</div>
              )}
              {lead.stage && <Badge className="text-[10px]">{lead.stage.replace(/_/g, " ")}</Badge>}
              {lead.score != null && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted">Score:</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", sc)}>{lead.score}</span>
                </div>
              )}
              <a href={`/leads/${lead.id}`} className="block text-xs text-accent hover:underline font-medium mt-2 pt-2 border-t border-border">View full profile →</a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Detail header — rich customer info + AI suggestion ───
function DetailHeader({ lead, agent, conversation }: { lead: any; agent: any; conversation: any }) {
  const presence = presenceFromDate(conversation.updatedAt);
  const lastSeen = relativeTime(conversation.updatedAt);
  const sl = lead.score != null ? (lead.score >= 70 ? "Hot" : lead.score >= 40 ? "Warm" : "Cold") : null;

  const suggestion = lead.stage === "new" || lead.stage === "contacted"
    ? "Qualify: ask about budget & timeline. Share relevant case study."
    : lead.stage === "qualified"
    ? "Ready for demo. Highlight ROI and offer a trial."
    : "Nurture: share new content, stay top-of-mind.";

  return (
    <div className="px-4 py-3 space-y-2.5">
      {/* Top row: avatar + name + lead popover + time */}
      <div className="flex items-center gap-3">
        <Avatar name={lead.name} size="md" seed={lead.email || lead.name} presence={presence} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text truncate">{lead.name}</span>
            <LeadPopover lead={lead} />
          </div>
          <div className="text-xs text-text-muted truncate">{lead.email || "No email"}</div>
        </div>
        <span className="text-[10px] text-text-muted shrink-0">{lastSeen}</span>
      </div>

      {/* Info badges row */}
      <div className="flex items-center gap-2 flex-wrap ml-[3.25rem]">
        {lead.company && (
          <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary"><Building2 className="size-3 text-text-muted" />{lead.company}</span>
        )}
        {lead.stage && (
          <Badge className="text-[10px] capitalize">{lead.stage.replace(/_/g, " ")}</Badge>
        )}
        {lead.score != null && (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            sl === "Hot" ? "text-emerald-400 bg-emerald-500/10" :
            sl === "Warm" ? "text-blue-400 bg-blue-500/10" :
            "text-slate-400 bg-slate-500/10",
          )}>
            <Star className="size-2.5" />{lead.score}
          </span>
        )}
        {agent?.name && (
          <span className="inline-flex items-center gap-1 text-[10px] text-accent"><Sparkles className="size-2.5" />{agent.name}</span>
        )}
      </div>

      {/* AI suggestion bar */}
      <div className="ml-[3.25rem] flex items-start gap-1.5 text-[11px] text-text-muted bg-accent/5 rounded-lg px-2.5 py-1.5 border border-accent/10">
        <Sparkles className="size-3 text-accent shrink-0 mt-px" />
        <span>{suggestion}</span>
      </div>
    </div>
  );
}


// ── Main Component ───────────────────────────────────────

export function InboxClient({ conversations, orgSlug, selectedId: initialSelectedId }: Props) {
  const [filter, setFilter] = useState<"all" | "active" | "needs_reply" | "closed">("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [aiDraft, setAiDraft] = useState<{ subject: string; body: string; tone?: string; suggestedAction?: string } | null>(null);
  const [aiTyping, setAiTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filtered = conversations.filter((c: any) => {
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

  const selectedConv = useMemo(() => {
    if (!selectedId) return null;
    const raw = conversations.find((c: any) => c.id === selectedId);
    if (!raw) return null;
    return { ...raw, messages } as any;
  }, [selectedId, conversations, messages]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    setMsgsLoading(true);
    setReplyDraft("");
    setAiDraft(null);
    fetch(`/api/orgs/${orgSlug}/conversations/${selectedId}/messages`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => { setMessages(data.messages || []); })
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setMsgsLoading(false));
  }, [selectedId, orgSlug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping, aiDraft]);

  async function generateAiDraft() {
    if (!selectedId) return;
    setGenerating(true); setAiTyping(true);
    const minDelay = 800 + Math.random() * 600;
    await new Promise((r) => setTimeout(r, minDelay));
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/conversations/${selectedId}/ai-draft`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAiDraft(data.draft);
        setReplyDraft(data.draft.body);
      } else { toast.error("AI draft failed"); }
    } catch { toast.error("Network error"); }
    setAiTyping(false); setGenerating(false);
  }

  async function sendReply() {
    if (!replyDraft.trim() || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/conversations/${selectedId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyDraft, channel: "email" }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setReplyDraft(""); setAiDraft(null);
        toast.success("Reply sent");
      } else { toast.error("Failed to send"); }
    } catch { toast.error("Network error"); }
    setSending(false);
  }

  function handleBack() { setSelectedId(null); }

  const lead = selectedConv?.lead;

  const LEFT_WIDTH = "w-full md:w-80 lg:w-96";

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left panel ─────────────────────────────────── */}
      <div className={cn(
        "border-r border-border flex flex-col bg-bg-card/50 backdrop-blur-sm shrink-0",
        LEFT_WIDTH, selectedId ? "hidden md:flex" : "flex",
      )}>
        <div className="p-4 border-b border-border space-y-3 shrink-0">
          <h1 className="text-lg font-semibold text-text">Inbox</h1>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "active", "needs_reply", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all duration-150",
                  filter === f ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text hover:bg-bg-subtle",
                )}
              >
                <span>{f === "needs_reply" ? "Needs Reply" : f.charAt(0).toUpperCase() + f.slice(1)}</span>
                {counts[f] > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-medium px-1",
                    filter === f ? "bg-white/20" : "bg-bg-subtle",
                  )}>{counts[f]}</span>
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
              <p className="text-xs mt-1">{filter === "needs_reply" ? "All caught up" : "Nothing to show"}</p>
            </div>
          ) : (
            <div className="py-1">
              {filtered.map((c: any) => {
                const lastMsg = c.messages[0];
                const isUnread = lastMsg?.direction === "inbound" && c.status === "active";
                return (
                  <IdentityCard
                    key={c.id}
                    customer={{
                      id: c.lead.id, name: c.lead.name, email: c.lead.email,
                      company: c.lead.company, avatarSeed: c.lead.email || c.lead.name,
                      stage: c.lead.stage, score: c.lead.score,
                      agentName: c.agent?.name ?? null, agentId: c.agent?.id ?? null,
                      aiConfidence: c.lead.score ?? null, lastSeenAt: c.updatedAt,
                    }}
                    variant="compact"
                    isActive={c.id === selectedId}
                    showPresence={isUnread}
                    messagePreview={lastMsg?.content?.substring(0, 140)}
                    onClick={() => setSelectedId(c.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right side ─────────────────────────────────── */}
      {!selectedId ? (
        <div className="hidden md:flex flex-1 items-center justify-center bg-bg h-full">
          <div className="text-center text-text-muted">
            <Mail className="size-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="text-xs mt-1">View messages and AI insights</p>
          </div>
        </div>
      ) : selectedConv ? (
        <div className="flex-1 flex flex-col min-w-0 bg-bg overflow-hidden">

          {/* Header */}
          <div className="shrink-0 border-b border-border bg-bg-card/50 backdrop-blur-sm">
            <div className="md:hidden px-3 pt-2 pb-1">
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-text-secondary -ml-2">
                <ChevronLeft className="size-4 mr-0.5" /> Inbox
              </Button>
            </div>
            <DetailHeader lead={selectedConv.lead} agent={selectedConv.agent} conversation={selectedConv} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {msgsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex items-start gap-3", msg.direction === "outbound" ? "flex-row-reverse" : "")}>
                    <div className={cn(
                      "size-7 rounded-full flex items-center justify-center shrink-0",
                      msg.direction === "inbound" ? "bg-bg-subtle" : "bg-accent/10",
                    )}>
                      {msg.direction === "inbound"
                        ? <User className="size-3.5 text-text-muted" />
                        : msg.aiMetadata ? <Sparkles className="size-3.5 text-accent" /> : <User className="size-3.5 text-accent" />
                      }
                    </div>
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2.5",
                      msg.direction === "inbound" ? "bg-bg-card border border-border rounded-tl-sm" : "bg-accent text-white rounded-tr-sm",
                    )}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn("text-[10px]", msg.direction === "inbound" ? "text-text-muted" : "text-white/60")}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {msg.aiMetadata && <span className="text-[10px] text-accent/80">AI-generated</span>}
                      </div>
                    </div>
                  </div>
                ))}

                {aiTyping && <AITypingIndicator />}

                {aiDraft && !aiTyping && (
                  <div className="flex items-start gap-3 flex-row-reverse animate-slide-up">
                    <div className="size-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <Sparkles className="size-3.5 text-accent" />
                    </div>
                    <div className="max-w-[70%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-accent/5 border border-accent/20 border-dashed">
                      <p className="text-xs text-accent font-medium mb-1">AI Draft — review before sending</p>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{aiDraft.body}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="default" loading={sending} onClick={sendReply}><Send className="size-3 mr-1" /> Send</Button>
                        <Button size="sm" variant="outline" onClick={() => { setAiDraft(null); setReplyDraft(""); }}>Discard</Button>
                        <Button size="sm" variant="ghost" onClick={generateAiDraft} loading={generating}><RefreshCw className="size-3 mr-1" /> Regenerate</Button>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Compose — wider */}
          <div className="shrink-0 border-t border-border p-4 bg-bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col gap-3">
              <Textarea
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder="Type a reply or generate an AI draft…"
                rows={4}
                className="w-full resize-none rounded-xl text-sm"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              />
              <div className="flex items-center gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={generateAiDraft} loading={generating} disabled={aiTyping} className="rounded-xl">
                  <Sparkles className="size-3.5 mr-1.5" /> AI Draft
                </Button>
                <Button size="sm" onClick={sendReply} loading={sending} disabled={!replyDraft.trim()} className="rounded-xl">
                  <Send className="size-3.5 mr-1.5" /> Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-bg h-full">
          <div className="text-center text-text-muted">
            <MessageSquare className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Conversation not found</p>
          </div>
        </div>
      )}
    </div>
  );
}
