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
  Building2, Clock, User, ExternalLink, Star, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ChatWindow } from "@/components/chat/chat-window";

type Message = {
  id: string; direction: string; content: string; channel: string;
  aiMetadata?: any; reviewAction?: string | null; createdAt: string;
};

type Props = { conversations: any[]; orgSlug: string; selectedId?: string };

function AITypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-slide-up flex-row-reverse">
      <div className="size-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        <Sparkles className="size-3.5 text-accent" />
      </div>
      <div className="rounded-lg rounded-tr-sm px-4 py-3 border border-accent/10 bg-bg-card">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-accent font-medium">AI 起草中…</span>
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
  const sl = lead.score != null ? (lead.score >= 70 ? "高意向" : lead.score >= 40 ? "中等" : "低意向") : null;
  const sc = sl === "高意向" ? "text-accent bg-accent-soft" :
    sl === "中等" ? "text-warning bg-warning-soft" : "text-text-muted bg-bg-subtle";

  return (
    <div className="relative inline-flex items-center">
      <button onClick={() => setShow(!show)} className="p-1 rounded-md hover:bg-bg-subtle text-text-muted hover:text-text transition-colors" title="客户详情">
        <ExternalLink className="size-3.5" />
      </button>
      {show && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShow(false)} />
          <div className="absolute left-full top-0 ml-2 z-20 w-72 bg-bg-card border border-border rounded-xl shadow-sm p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={lead.name} size="md" seed={lead.email || lead.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text truncate">{lead.name}</p>
                <p className="text-xs text-text-muted truncate">{lead.email || "无邮箱"}</p>
              </div>
            </div>
            <div className="space-y-2">
              {lead.company && (
                <div className="flex items-center gap-2 text-xs text-text-secondary"><Building2 className="size-3 shrink-0 text-text-muted" />{lead.company}</div>
              )}
              {lead.stage && <Badge className="text-[10px]">{lead.stage.replace(/_/g, " ")}</Badge>}
              {lead.score != null && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted">评分：</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", sc)}>{lead.score}</span>
                </div>
              )}
              <a href={`/leads/${lead.id}`} className="block text-xs text-accent hover:underline font-medium mt-2 pt-2 border-t border-border">查看完整信息 →</a>
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
  const sl = lead.score != null ? (lead.score >= 70 ? "高意向" : lead.score >= 40 ? "中等" : "低意向") : null;

  const suggestion = lead.stage === "new" || lead.stage === "contacted"
    ? "了解客户预算和时间线，分享相关案例。"
    : lead.stage === "qualified"
    ? "客户已准备就绪，安排产品演示并强调 ROI。"
    : "保持跟进：分享新内容，持续建立信任。";

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
          <div className="text-xs text-text-muted truncate">{lead.email || "无邮箱"}</div>
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
            sl === "高意向" ? "text-accent bg-accent-soft" :
            sl === "中等" ? "text-warning bg-warning-soft" :
            "text-text-muted bg-bg-subtle",
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
  const [filter, setFilter] = useState<"all" | "active" | "needs_review" | "needs_reply" | "closed">("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [aiDraft, setAiDraft] = useState<{ subject: string; body: string; tone?: string; suggestedAction?: string } | null>(null);
  const [aiTyping, setAiTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [chatMode, setChatMode] = useState(false);

  // Filter messages by channel: email mode = email/legacy, chat mode = chat only
  const channelMessages = useMemo(() => {
    if (chatMode) return messages.filter((m: any) => m.channel === "chat");
    // Email mode: show email messages and legacy messages (no channel set)
    return messages.filter((m: any) => !m.channel || m.channel === "email");
  }, [messages, chatMode]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const filtered = conversations.filter((c: any) => {
    if (filter === "all") return true;
    if (filter === "active") return c.status === "active" || c.status === "awaiting_approval";
    if (filter === "needs_review") return c.status === "awaiting_approval";
    if (filter === "needs_reply") {
      const lastMsg = c.messages[0];
      return c.status === "active" && lastMsg?.direction === "inbound";
    }
    return c.status === filter;
  });

  const counts = {
    all: conversations.length,
    active: conversations.filter((c: any) => c.status === "active" || c.status === "awaiting_approval").length,
    needs_review: conversations.filter((c: any) => c.status === "awaiting_approval").length,
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
    if (!selectedId) { setMessages([]); setNextCursor(null); setHasMore(false); return; }
    setMsgsLoading(true);
    setReplyDraft("");
    setAiDraft(null);
    fetch(`/api/orgs/${orgSlug}/conversations/${selectedId}/messages?limit=50`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        setMessages(data.messages || []);
        setNextCursor(data.nextCursor ?? null);
        setHasMore(data.hasMore ?? false);
      })
      .catch(() => toast.error("加载消息失败"))
      .finally(() => setMsgsLoading(false));
  }, [selectedId, orgSlug]);

  async function loadMoreMessages() {
    if (!selectedId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    const container = messagesContainerRef.current;
    const oldScrollHeight = container?.scrollHeight ?? 0;

    try {
      const res = await fetch(`/api/orgs/${orgSlug}/conversations/${selectedId}/messages?cursor=${nextCursor}&limit=50`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => [...(data.messages || []), ...prev]);
      setNextCursor(data.nextCursor ?? null);
      setHasMore(data.hasMore ?? false);

      // Preserve scroll position: offset by the newly added content height
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop += (newScrollHeight - oldScrollHeight);
        }
      });
    } catch {
      toast.error("加载历史消息失败");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping, aiDraft]);

  async function generateAiDraft() {
    if (!selectedId) return;
    setGenerating(true); setAiTyping(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      toast.error("AI 响应超时，请稍后重试");
    }, 30_000);

    try {
      const res = await fetch(`/api/orgs/${orgSlug}/conversations/${selectedId}/ai-draft`, {
        method: "POST",
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setAiDraft(data.draft);
        setReplyDraft(data.draft.body);
      } else { toast.error("AI 草稿生成失败"); }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        toast.error("网络错误");
      }
    } finally {
      clearTimeout(timeout);
      setAiTyping(false);
      setGenerating(false);
    }
  }

  async function sendReply() {
    if (!replyDraft.trim() || !selectedId) return;
    setSending(true);
    try {
      const body: Record<string, unknown> = { content: replyDraft, channel: "email" };
      if (aiDraft) body.reviewAction = "approved"; // Was approved AI draft
      const res = await fetch(`/api/orgs/${orgSlug}/conversations/${selectedId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setReplyDraft(""); setAiDraft(null);
        toast.success("已发送");
        // If this was a Worker draft approval, record it for HITL audit trail
        patchWorkerDraft("approved");
      } else { toast.error("发送失败"); }
    } catch { toast.error("网络错误"); }
    setSending(false);
  }

  /** Patch Worker-generated draft message with reviewAction (HITL audit trail). */
  async function patchWorkerDraft(action: "approved" | "rejected") {
    const workerDraft = [...messages].reverse().find(
      (m) => m.direction === "outbound" && !m.reviewAction
    );
    if (!workerDraft || !selectedId) return;
    try {
      await fetch(
        `/api/orgs/${orgSlug}/conversations/${selectedId}/messages/${workerDraft.id}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewAction: action }) },
      );
      setMessages((prev) => prev.map((m) =>
        m.id === workerDraft.id ? { ...m, reviewAction: action } : m
      ));
    } catch { /* non-blocking — message send/reject already completed */ }
  }

  function handleBack() { setSelectedId(null); }

  const lead = selectedConv?.lead;

  const LEFT_WIDTH = "w-full md:w-80 lg:w-96";

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left panel ─────────────────────────────────── */}
      <div className={cn(
        "border-r border-border flex flex-col bg-bg-card/50 shrink-0",
        LEFT_WIDTH, selectedId ? "hidden md:flex" : "flex",
      )}>
        <div className="p-4 border-b border-border space-y-3 shrink-0">
          <h1 className="text-lg font-semibold text-text">收件箱</h1>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "active", "needs_review", "needs_reply", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all duration-150",
                  filter === f ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text hover:bg-bg-subtle",
                )}
              >
                <span>{f === "all" ? "全部" : f === "active" ? "进行中" : f === "needs_review" ? "⏳ 待审核" : f === "needs_reply" ? "待回复" : "已关闭"}</span>
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
              <p className="text-sm font-medium">暂无对话</p>
              <p className="text-xs mt-1">
                {filter === "all" && "所有对话将显示在这里"}
                {filter === "active" && "当前没有进行中的对话"}
                {filter === "needs_review" && "没有需要审核的草稿"}
                {filter === "needs_reply" && "所有客户消息已回复完毕"}
                {filter === "closed" && "没有已关闭的对话"}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {filtered.map((c: any) => {
                const lastMsg = c.messages[0];
                const isUnread = lastMsg?.direction === "inbound" && c.status === "active";
                const needsReview = c.status === "awaiting_approval";
                return (
                  <div key={c.id} className="relative">
                    {needsReview && (
                      <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/15 text-warning ring-1 ring-warning/30">
                        ⏳ 待审核
                      </div>
                    )}
                  <IdentityCard
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
                  </div>
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
            <p className="text-sm font-medium">选择对话查看详情</p>
            <p className="text-xs mt-1">查看消息与 AI 分析</p>
          </div>
        </div>
      ) : selectedConv ? (
        <div className="flex-1 flex flex-col min-w-0 bg-bg overflow-hidden">

          {/* Header */}
          <div className="shrink-0 border-b border-border bg-bg-card">
            <div className="md:hidden px-3 pt-2 pb-1">
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-text-secondary -ml-2">
                <ChevronLeft className="size-4 mr-0.5" /> Inbox
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <DetailHeader lead={selectedConv.lead} agent={selectedConv.agent} conversation={selectedConv} />
              <div className="flex items-center gap-2 pr-3 shrink-0">
                <div className="flex items-center rounded-lg border border-border bg-bg-subtle p-0.5">
                  <button onClick={() => setChatMode(false)} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${!chatMode ? "bg-bg-card text-text shadow-sm" : "text-text-muted hover:text-text"}`}>
                    <Mail className="size-3" /> 邮件
                  </button>
                  <button onClick={() => setChatMode(true)} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${chatMode ? "bg-bg-card text-accent shadow-sm" : "text-text-muted hover:text-text"}`}>
                    <MessageCircle className="size-3" /> 聊天
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat mode: ChatWindow replaces messages + compose */}
          {chatMode ? (
            <div className="flex-1 min-h-0">
              <ChatWindow
                conversationId={selectedId!}
                userRole="agent"
                orgSlug={orgSlug}
                initialMessages={channelMessages.map((m) => ({ id: m.id, direction: m.direction as "inbound" | "outbound", content: m.content, createdAt: m.createdAt }))}
                otherPartyName={selectedConv?.lead?.name || "客户"}
              />
            </div>
          ) : (
          <>
          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
                {/* Load earlier messages */}
                {hasMore && (
                  <div className="flex justify-center pb-2">
                    <button
                      onClick={loadMoreMessages}
                      disabled={loadingMore}
                      className="text-xs text-text-muted hover:text-accent transition-colors px-3 py-1 rounded-md hover:bg-bg-subtle"
                    >
                      {loadingMore ? "加载中..." : "加载更早的消息"}
                    </button>
                  </div>
                )}
                {!hasMore && messages.length >= 50 && (
                  <div className="flex justify-center pb-2">
                    <span className="text-[10px] text-text-muted">已显示全部消息</span>
                  </div>
                )}
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
                      "max-w-[70%] rounded-lg px-4 py-2.5",
                      msg.direction === "inbound" ? "bg-bg-card border border-border rounded-tl-sm" : "bg-accent text-white rounded-tr-sm",
                    )}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn("text-[10px]", msg.direction === "inbound" ? "text-text-muted" : "text-white/60")}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {selectedConv.status === "awaiting_approval" && msg.direction === "outbound" && (
                          <span className="text-[10px] text-warning">⏳ 待审核草稿</span>
                        )}
                        {msg.aiMetadata && selectedConv.status !== "awaiting_approval" && (
                          <span className="text-[10px] text-accent/80">AI 生成</span>
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
                    <div className="max-w-[70%] rounded-lg rounded-tr-sm px-4 py-2.5 bg-accent/5 border border-accent/20 border-dashed">
                      <p className="text-xs text-accent font-medium mb-1">AI 草稿 — 发送前请审核</p>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{aiDraft.body}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="default" loading={sending} onClick={sendReply}><Send className="size-3 mr-1" /> 发送</Button>
                        <Button size="sm" variant="outline" onClick={() => { setAiDraft(null); setReplyDraft(""); patchWorkerDraft("rejected"); }}>放弃</Button>
                        <Button size="sm" variant="ghost" onClick={generateAiDraft} loading={generating}><RefreshCw className="size-3 mr-1" /> 重新生成</Button>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Compose — wider */}
          <div className="shrink-0 border-t border-border p-4 bg-bg-card">
            <div className="flex flex-col gap-3">
              <Textarea
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder="输入回复内容，或使用 AI 生成草稿…"
                rows={4}
                className="w-full resize-none rounded-xl text-sm"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              />
              <div className="flex items-center gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={generateAiDraft} loading={generating} disabled={aiTyping} className="rounded-xl">
                  <Sparkles className="size-3.5 mr-1.5" /> AI 草稿
                </Button>
                <Button size="sm" onClick={sendReply} loading={sending} disabled={!replyDraft.trim()} className="rounded-xl">
                  <Send className="size-3.5 mr-1.5" /> 发送
                </Button>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-bg h-full">
          <div className="text-center text-text-muted">
            <MessageSquare className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">对话不存在</p>
          </div>
        </div>
      )}
    </div>
  );
}
