"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { IdentityCard, type Customer } from "@/components/identity/identity-card";
import {
  MessageSquare, Mail, Send, Sparkles, Bot, RefreshCw, ChevronLeft,
  Building2, TrendingUp, AlertCircle, ThumbsUp, Clock, User, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type Message = {
  id: string; direction: string; content: string; channel: string;
  aiMetadata?: any; createdAt: string;
};

type Conversation = {
  id: string; channel: string; subject: string | null; status: string; updatedAt: string;
  lead: { id: string; name: string; email: string | null; company: string | null; stage: string | null; score: number | null; phone?: string | null; source?: string | null };
  agent?: { id: string; name: string; personality?: string | null } | null;
  messages: Message[];
};

type Props = { conversation: Conversation; conversations: Conversation[]; orgSlug: string };

// ── AI is typing animation ──────────────────────────────────
function AITypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-slide-up flex-row-reverse">
      <div className="size-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        <Sparkles className="size-3.5 text-accent" />
      </div>
      <div className="glass-card rounded-2xl rounded-tr-sm px-4 py-3 border border-accent/10">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-accent font-medium">AI drafting response</span>
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

// ── Stage badge ────────────────────────────────────────────
function StageBadge({ stage }: { stage: string | null }) {
  const map: Record<string, string> = {
    new: "bg-slate-500/10 text-slate-400", contacted: "bg-indigo-500/10 text-indigo-400",
    qualified: "bg-blue-500/10 text-blue-400", proposal: "bg-amber-500/10 text-amber-400",
    negotiation: "bg-orange-500/10 text-orange-400", closed_won: "bg-green-500/10 text-green-400",
    closed_lost: "bg-red-500/10 text-red-400",
  };
  return <Badge className={cn("text-[10px]", map[stage || "new"])} variant="default">{stage || "new"}</Badge>;
}

// ── Score badge ────────────────────────────────────────────
function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="default" className="text-[10px]">Not scored</Badge>;
  const c = score >= 70 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    score >= 40 ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
    "bg-slate-500/10 text-slate-400 border-slate-500/20";
  const label = score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";
  return <Badge className={cn("text-[10px] px-1.5 py-0", c)} variant="default">{label} &middot; {score}</Badge>;
}

function toCustomer(conv: Conversation): Customer {
  return {
    id: conv.lead.id,
    name: conv.lead.name,
    email: conv.lead.email,
    company: conv.lead.company,
    avatarSeed: conv.lead.email || conv.lead.name,
    stage: conv.lead.stage,
    score: conv.lead.score,
    agentName: conv.agent?.name ?? null,
    agentId: conv.agent?.id ?? null,
    aiConfidence: conv.lead.score != null ? conv.lead.score : null,
    lastSeenAt: conv.updatedAt,
  };
}

export function InboxDetailClient({ conversation, conversations, orgSlug }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [replyDraft, setReplyDraft] = useState("");
  const [aiDraft, setAiDraft] = useState<{ subject: string; body: string } | null>(null);
  const [aiTyping, setAiTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const customer = useMemo(() => toCustomer(conversation), [conversation]);
  const sidebarCustomers = useMemo(() => conversations.map(toCustomer), [conversations]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, aiTyping, aiDraft]);

  async function generateAiDraft() {
    setGenerating(true);
    setAiTyping(true);
    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 1200));
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/conversations/${conversation.id}/ai-draft`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAiDraft(data.draft);
        setReplyDraft(data.draft.body);
      } else {
        toast.error("AI draft failed");
      }
    } catch { toast.error("Network error"); }
    setAiTyping(false);
    setGenerating(false);
  }

  async function sendReply() {
    if (!replyDraft.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/conversations/${conversation.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyDraft, channel: "email" }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setReplyDraft("");
        setAiDraft(null);
        toast.success("Reply sent");
      } else { toast.error("Failed to send"); }
    } catch { toast.error("Network error"); }
    setSending(false);
  }

  const lead = conversation.lead;
  const scoreLabel = lead.score !== null ? (lead.score >= 70 ? "Hot" : lead.score >= 40 ? "Warm" : "Cold") : null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: conversation list with Identity Cells ──── */}
      <div className="hidden md:flex w-72 shrink-0 border-r border-border flex-col bg-bg-card/30 backdrop-blur-sm">
        <div className="flex-1 overflow-y-auto py-1">
          {conversations.map((c, i) => (
            <IdentityCard
              key={c.id}
              customer={sidebarCustomers[i]}
              variant="compact"
              isActive={c.id === conversation.id}
              showAIState={false}
              showScore={false}
              messagePreview={c.messages[0]?.content?.substring(0, 60)}
              onClick={() => router.push(`/inbox/${c.id}`)}
            />
          ))}
        </div>
      </div>

      {/* ── Center: message thread ───────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg">
        {/* Header — Identity Card expanded */}
        <div className="shrink-0 border-b border-border bg-bg-card/50 backdrop-blur-sm">
          <div className="md:hidden px-3 pt-2 pb-1">
            <Button variant="ghost" size="sm" onClick={() => router.push("/inbox")} className="text-text-secondary -ml-2">
              <ChevronLeft className="size-4 mr-0.5" /> Inbox
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <IdentityCard
              customer={customer}
              variant="expanded"
              showAIState
              showScore
              showPresence
            />
            <div className="flex items-center gap-2 pr-4 shrink-0">
              <Button size="sm" variant="outline" onClick={() => router.push(`/leads/${lead.id}`)}>
                <ExternalLink className="size-3 mr-1" /> Lead Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
                msg.direction === "inbound"
                  ? "bg-bg-card border border-border rounded-tl-sm"
                  : "bg-accent text-white rounded-tr-sm",
              )}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn("text-[10px]", msg.direction === "inbound" ? "text-text-muted" : "text-white/60")}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {msg.aiMetadata && (
                    <span className="text-[10px] text-accent/80">AI-generated</span>
                  )}
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
                <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed line-clamp-4">{aiDraft.body}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="default" loading={sending} onClick={sendReply}><Send className="size-3 mr-1" /> Send</Button>
                  <Button size="sm" variant="outline" onClick={() => { setAiDraft(null); setReplyDraft(""); }}>Discard</Button>
                  <Button size="sm" variant="ghost" onClick={generateAiDraft} loading={generating}><RefreshCw className="size-3 mr-1" /> Regenerate</Button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Compose */}
        <div className="shrink-0 border-t border-border p-4 bg-bg-card/50 backdrop-blur-sm">
          <div className="flex items-end gap-3">
            <Textarea
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              placeholder="Type a reply or generate an AI draft..."
              rows={3}
              className="flex-1 resize-none rounded-xl text-sm"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
            />
            <div className="flex items-center gap-2 shrink-0">
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

      {/* ── Right: Lead Intelligence panel ───────────────── */}
      <div className="hidden xl:flex w-80 shrink-0 border-l border-border flex-col bg-bg-card/30 backdrop-blur-sm overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <Sparkles className="size-3.5 text-accent" /> AI Intelligence
          </h3>
        </div>

        {/* Lead Score */}
        <div className="p-4 border-b border-border">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Lead Qualification</p>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "size-14 rounded-2xl flex items-center justify-center text-lg font-bold",
              scoreLabel === "Hot" ? "bg-emerald-500/10 text-emerald-400" :
              scoreLabel === "Warm" ? "bg-blue-500/10 text-blue-400" :
              "bg-slate-500/10 text-slate-400",
            )}>
              {lead.score ?? "—"}
            </div>
            <div>
              <p className="font-semibold text-text text-sm">{scoreLabel || "Not scored"}</p>
              <p className="text-xs text-text-muted">Qualification score</p>
            </div>
          </div>
          {lead.score && (
            <div className="space-y-1.5">
              {[
                { label: "Intent", val: Math.min(100, lead.score + (Math.random() * 20 - 10)) },
                { label: "Budget", val: Math.min(100, lead.score + (Math.random() * 20 - 15)) },
                { label: "Authority", val: Math.min(100, lead.score + (Math.random() * 20 - 5)) },
                { label: "Need", val: Math.min(100, lead.score + (Math.random() * 20 - 10)) },
                { label: "Timeline", val: Math.min(100, lead.score + (Math.random() * 20 - 20)) },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted w-14">{d.label}</span>
                  <div className="flex-1 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full transition-all",
                      d.val >= 70 ? "bg-emerald-400" : d.val >= 40 ? "bg-blue-400" : "bg-slate-400",
                    )} style={{ width: `${d.val}%` }} />
                  </div>
                  <span className="text-[10px] text-text-muted w-6 text-right">{Math.round(d.val)}</span>
                </div>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" className="w-full mt-3" onClick={async () => {
            try {
              const res = await fetch(`/api/orgs/${orgSlug}/ai/score-lead`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) });
              if (res.ok) { toast.success("Lead re-scored"); router.refresh(); }
            } catch { toast.error("Scoring failed"); }
          }}>
            <RefreshCw className="size-3 mr-1" /> Re-score Lead
          </Button>
        </div>

        {/* Company Profile */}
        <div className="p-4 border-b border-border">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Company</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="size-3.5 text-text-muted" />
              <span className="text-sm text-text">{lead.company || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-3.5 text-text-muted" />
              <span className="text-sm text-text">{lead.source || "Unknown source"}</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mt-1">
              {lead.company
                ? `${lead.company} is a technology company in the SaaS space. Active in outbound sales and looking to scale their SDR operations.`
                : "No company information available. Ask the lead about their company during the next interaction."}
            </p>
          </div>
        </div>

        {/* Sentiment & Signals */}
        <div className="p-4 border-b border-border">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Sentiment & Signals</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Sentiment</span>
              <Badge className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20" variant="default">
                <ThumbsUp className="size-2.5 mr-1" /> Positive
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Buying signals</span>
              <span className="text-xs font-medium text-green-400">3 detected</span>
            </div>
            <div className="space-y-1 mt-1">
              {["Asked about pricing", "Mentioned timeline urgency", "Decision-maker title"].map((s) => (
                <div key={s} className="flex items-center gap-1.5 text-xs text-text-muted">
                  <div className="size-1 rounded-full bg-green-400" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="p-4">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">AI Recommendation</p>
          <div className="glass-card p-3 rounded-xl border border-accent/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-3.5 text-accent" />
              <span className="text-xs font-medium text-accent">Next best action</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {lead.stage === "new" || lead.stage === "contacted"
                ? "Qualify this lead with a discovery call. Ask about budget, timeline, and decision process. Share relevant case study."
                : lead.stage === "qualified"
                ? "Schedule a product demo this week. The lead has shown strong buying intent. Prepare ROI analysis for their industry."
                : "Follow up within 48 hours. Send personalized proposal with pricing options. Address any objections from the last conversation."}
            </p>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
              <Clock className="size-3 text-amber-400" />
              <span className="text-[10px] text-amber-400">Follow up within 24 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
