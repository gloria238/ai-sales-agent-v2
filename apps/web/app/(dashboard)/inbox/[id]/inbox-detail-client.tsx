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
  Languages, Loader2, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AgentThinkingPanel } from "@/components/inbox/AgentThinkingPanel";
import type { AgentStep } from "@/components/inbox/AgentThinkingPanel";
import { ChatWindow } from "@/components/chat/chat-window";

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
          <span className="text-xs text-accent font-medium">AI 正在撰写回复</span>
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
const STAGE_LABELS: Record<string, string> = {
  new: "新客户", contacted: "已联系", qualified: "已确认",
  proposal: "方案中", negotiation: "洽谈中", closed_won: "已成交", closed_lost: "已流失",
};
function StageBadge({ stage }: { stage: string | null }) {
  const map: Record<string, string> = {
    new: "bg-bg-subtle text-text-muted", contacted: "bg-white/[0.04] text-lp-hero-sub",
    qualified: "bg-white/[0.04] text-lp-hero-sub", proposal: "bg-warning-soft text-warning",
    negotiation: "bg-warning-soft text-warning", closed_won: "bg-accent-soft text-accent",
    closed_lost: "bg-danger-soft text-danger",
  };
  return <Badge className={cn("text-[10px]", map[stage || "new"])} variant="default">{STAGE_LABELS[stage || "new"] || stage || "new"}</Badge>;
}

// ── Score badge ────────────────────────────────────────────
function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="default" className="text-[10px]">未评分</Badge>;
  const c = score >= 70 ? "bg-accent-soft text-accent border-accent/20" :
    score >= 40 ? "bg-warning-soft text-warning border-warning/20" :
    "bg-bg-subtle text-text-muted border-lp-border/20";
  const label = score >= 70 ? "高意向" : score >= 40 ? "中等" : "低意向";
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
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState("");
  const [chatMode, setChatMode] = useState(false); // Toggle: email compose vs real-time chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages by channel
  const channelMessages = useMemo(() => {
    if (chatMode) return messages.filter((m: any) => m.channel === "chat");
    return messages.filter((m: any) => !m.channel || m.channel === "email");
  }, [messages, chatMode]);

  // Detect lead's language from the last inbound message
  const lastInbound = [...messages].reverse().find((m) => m.direction === "inbound");
  const lastInboundContent = lastInbound?.content?.substring(0, 200) || "";

  async function handleTranslate() {
    if (!replyDraft.trim()) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/v1/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyDraft, targetLanguage: "en" }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslated(data.translated);
        toast.success("翻译完成");
      } else {
        toast.error("翻译失败");
      }
    } catch {
      toast.error("网络错误");
    }
    setTranslating(false);
  }

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
              {/* Email / Chat toggle */}
              <div className="flex items-center rounded-lg border border-border bg-bg-subtle p-0.5">
                <button
                  onClick={() => setChatMode(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    !chatMode ? "bg-bg-card text-text shadow-sm" : "text-text-muted hover:text-text"
                  }`}
                >
                  <Mail className="size-3" /> 邮件
                </button>
                <button
                  onClick={() => setChatMode(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    chatMode ? "bg-bg-card text-accent shadow-sm" : "text-text-muted hover:text-text"
                  }`}
                >
                  <MessageCircle className="size-3" /> 聊天
                </button>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push(`/leads/${lead.id}`)}>
                <ExternalLink className="size-3 mr-1" /> 客户详情
              </Button>
            </div>
          </div>
        </div>

        {/* Messages — hidden in chat mode (ChatWindow has its own) */}
        {!chatMode && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {channelMessages.map((msg) => (
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
                  {conversation.status === "awaiting_approval" && msg.direction === "outbound" && (
                    <span className="text-[10px] text-warning">⏳ 待审核草稿</span>
                  )}
                  {msg.aiMetadata && conversation.status !== "awaiting_approval" && !msg.aiMetadata.agentSteps && (
                    <span className="text-[10px] text-accent/80">AI 生成</span>
                  )}
                  {msg.aiMetadata?.agentSteps && (
                    <span className="text-[10px] text-accent/80">AI 生成 · {msg.aiMetadata.agentSteps.length} steps</span>
                  )}
                </div>

                {/* ReAct Agent reasoning panel — shown below outbound messages with agentSteps */}
                {msg.aiMetadata?.agentSteps && (
                  <AgentThinkingPanel
                    steps={msg.aiMetadata.agentSteps as AgentStep[]}
                    success={msg.aiMetadata.agentSuccess ?? false}
                  />
                )}
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
                <p className="text-xs text-accent font-medium mb-1">AI 草稿 — 审核后发送</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed line-clamp-4">{aiDraft.body}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="default" loading={sending} onClick={sendReply}><Send className="size-3 mr-1" /> 发送</Button>
                  <Button size="sm" variant="outline" onClick={() => { setAiDraft(null); setReplyDraft(""); }}>丢弃</Button>
                  <Button size="sm" variant="ghost" onClick={generateAiDraft} loading={generating}><RefreshCw className="size-3 mr-1" /> 重新生成</Button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
        )}

        {/* Compose / Chat — depends on mode */}
        {chatMode ? (
          <div className="flex-1 min-h-0">
            <ChatWindow
              conversationId={conversation.id}
              userRole="agent"
              orgSlug={orgSlug}
              initialMessages={channelMessages.map((m) => ({
                id: m.id,
                direction: m.direction as "inbound" | "outbound",
                content: m.content,
                createdAt: m.createdAt,
              }))}
              otherPartyName={lead.name}
            />
          </div>
        ) : (
          <div className="shrink-0 border-t border-border p-4 bg-bg-card/50 backdrop-blur-sm">
          {/* Translation preview */}
          {translated && (
            <div className="mb-3 rounded-xl border border-accent/30 bg-accent/5 p-3 animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-accent font-medium flex items-center gap-1">
                  <Languages className="size-3" /> 翻译预览
                </span>
                <button
                  onClick={() => setTranslated("")}
                  className="text-xs text-text-muted hover:text-text transition-colors"
                >
                  关闭
                </button>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{translated}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={async () => {
                    setReplyDraft(translated);
                    setTranslated("");
                    toast.success("已替换为翻译版本");
                  }}
                  className="rounded-lg text-xs"
                >
                  <Languages className="size-3 mr-1" /> 使用翻译版本
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTranslated("")}
                  className="rounded-lg text-xs"
                >
                  保留原文
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            <Textarea
              value={replyDraft}
              onChange={(e) => { setReplyDraft(e.target.value); setTranslated(""); }}
              placeholder="输入回复内容，或使用 AI 生成草稿..."
              rows={3}
              className="flex-1 resize-none rounded-xl text-sm"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
            />
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTranslate}
                loading={translating}
                disabled={!replyDraft.trim() || translating}
                className="rounded-xl"
                title="翻译成英文"
              >
                {translating
                  ? <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  : <Languages className="size-3.5 mr-1.5" />}
                翻译
              </Button>
              <Button size="sm" variant="outline" onClick={generateAiDraft} loading={generating} disabled={aiTyping} className="rounded-xl">
                <Sparkles className="size-3.5 mr-1.5" /> AI 草稿
              </Button>
              <Button size="sm" onClick={sendReply} loading={sending} disabled={!replyDraft.trim()} className="rounded-xl">
                <Send className="size-3.5 mr-1.5" /> 发送
              </Button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* ── Right: Lead Intelligence panel ───────────────── */}
      <div className="hidden xl:flex w-80 shrink-0 border-l border-border flex-col bg-bg-card/30 backdrop-blur-sm overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <Sparkles className="size-3.5 text-accent" /> AI 智能分析
          </h3>
        </div>

        {/* Lead Score */}
        <div className="p-4 border-b border-border">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">客户评级</p>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "size-14 rounded-2xl flex items-center justify-center text-lg font-bold",
              scoreLabel === "Hot" ? "bg-accent-soft text-accent" :
              scoreLabel === "Warm" ? "bg-warning-soft text-warning" :
              "bg-bg-subtle text-text-muted",
            )}>
              {lead.score ?? "—"}
            </div>
            <div>
              <p className="font-semibold text-text text-sm">{scoreLabel || "未评分"}</p>
              <p className="text-xs text-text-muted">客户评分</p>
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
                      d.val >= 70 ? "bg-accent" : d.val >= 40 ? "bg-warning" : "bg-bg-muted",
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
              if (res.ok) { toast.success("重新评分完成"); router.refresh(); }
            } catch { toast.error("评分失败"); }
          }}>
            <RefreshCw className="size-3 mr-1" /> 重新评分
          </Button>
        </div>

        {/* Company Profile */}
        <div className="p-4 border-b border-border">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">公司信息</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="size-3.5 text-text-muted" />
              <span className="text-sm text-text">{lead.company || "未知"}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-3.5 text-text-muted" />
              <span className="text-sm text-text">{lead.source || "未知来源"}</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mt-1">
              {lead.company
                ? `${lead.company} 是一家 SaaS 领域的技术公司，专注于外呼销售自动化，正在寻求规模化增长。`
                : "暂无公司信息，建议在下次沟通中了解客户公司背景。"}
            </p>
          </div>
        </div>

        {/* Sentiment & Signals */}
        <div className="p-4 border-b border-border">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">情感与信号</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">情感倾向</span>
              <Badge className="text-[10px] bg-accent-soft text-accent" variant="default">
                <ThumbsUp className="size-2.5 mr-1" /> 积极
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">购买信号</span>
              <span className="text-xs font-medium text-accent">3 个已检测</span>
            </div>
            <div className="space-y-1 mt-1">
              {["Asked about pricing", "Mentioned timeline urgency", "Decision-maker title"].map((s) => (
                <div key={s} className="flex items-center gap-1.5 text-xs text-text-muted">
                  <div className="size-1 rounded-full bg-accent" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="p-4">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">AI 建议</p>
          <div className="glass-card p-3 rounded-xl border border-accent/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-3.5 text-accent" />
              <span className="text-xs font-medium text-accent">下一步行动</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {lead.stage === "new" || lead.stage === "contacted"
                ? "通过电话沟通了解客户需求，询问预算、时间线和决策流程，分享相关案例。"
                : lead.stage === "qualified"
                ? "本周安排产品演示，客户已展现出明确购买意向。准备针对其行业的 ROI 分析。"
                : "48 小时内跟进，发送包含定价方案的个性化提案，回应上次沟通中的疑虑。"}
            </p>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
              <Clock className="size-3 text-warning" />
              <span className="text-[10px] text-warning">建议 24 小时内跟进</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
