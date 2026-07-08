"use client";

/**
 * ChatWindow — reusable real-time chat component.
 *
 * Used by:
 *   - Portal:    Customer chats with sales agent
 *   - Dashboard: Sales agent chats with customer
 *
 * Supports: WebSocket (Socket.IO) with REST polling fallback.
 * Agent mode: "AI Draft" button calls RAG-grounded ai-draft API (Phase 21a).
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Wifi, WifiOff, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useSocket, type ChatMessage } from "@/lib/use-socket";

interface ChatWindowProps {
  conversationId: string;
  /** User's role: "customer" for Portal, anything else for Dashboard */
  userRole: "customer" | "agent";
  /** Initial messages loaded from server (pre-populated before WebSocket connects) */
  initialMessages?: Array<{
    id: string; direction: "inbound" | "outbound"; content: string; createdAt: string;
  }>;
  /** Display name for the other party */
  otherPartyName: string;
  /** Whether the other party is online (from WebSocket presence) */
  otherPartyOnline?: boolean;
  /** Org slug — required for AI Draft API call (agent mode only) */
  orgSlug?: string;
}

export function ChatWindow({
  conversationId,
  userRole,
  initialMessages = [],
  otherPartyName,
  otherPartyOnline = false,
  orgSlug,
}: ChatWindowProps) {
  const { messages: wsMessages, sendMessage, setTyping, isConnected, typingUsers, addMessage } = useSocket(conversationId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiDraft, setAiDraft] = useState<{ subject: string; body: string; kbChunksUsed: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const isAgent = userRole === "agent";

  // Merge initial SSR messages with WebSocket messages
  const allMessages = [...initialMessages.map(toChatMsg), ...wsMessages];

  // Deduplicate by ID
  const seenIds = new Set<string>();
  const uniqueMessages = allMessages.filter((m) => {
    if (seenIds.has(m.id)) return false;
    seenIds.add(m.id);
    return true;
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [uniqueMessages.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      if (isConnected) {
        sendMessage(content);
      } else {
        // REST fallback
        if (orgSlug) {
          await fetch(`/api/orgs/${orgSlug}/conversations/${conversationId}/chat-messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content }),
          });
        } else {
          await fetch(`/api/chat/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content }),
          });
        }
      }
      setInput("");
      setAiDraft(null);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }, [input, sending, isConnected, sendMessage, conversationId, orgSlug]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (value: string) => {
    setInput(value);
    if (aiDraft) setAiDraft(null);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping(true);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
  };

  // ── AI Draft — call the RAG-grounded ai-draft API ──────────────
  const handleAiDraft = useCallback(async () => {
    if (!orgSlug || generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/conversations/${conversationId}/ai-draft`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.draft?.body) {
          setAiDraft({ ...data.draft, kbChunksUsed: data.kbChunksUsed ?? 0 });
        }
      } else {
        console.warn("[AI Draft] API call failed");
      }
    } catch (err) {
      console.error("[AI Draft] Network error:", err);
    } finally {
      setGenerating(false);
    }
  }, [orgSlug, conversationId, generating]);

  // ── Send approved AI draft ──────────────────────────────────────
  const handleSendDraft = useCallback(async () => {
    if (!aiDraft?.body || sending) return;
    setSending(true);
    try {
      if (isConnected) {
        sendMessage(aiDraft.body);
      } else if (orgSlug) {
        await fetch(`/api/orgs/${orgSlug}/conversations/${conversationId}/chat-messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: aiDraft.body, reviewAction: "approved" }),
        });
      } else {
        await fetch(`/api/chat/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: aiDraft.body, reviewAction: "approved" }),
        });
      }
      setAiDraft(null);
    } catch (err) {
      console.error("Failed to send draft:", err);
    } finally {
      setSending(false);
    }
  }, [aiDraft, sending, isConnected, sendMessage, conversationId, orgSlug]);

  return (
    <div className="flex flex-col h-full">
      {/* Connection status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-subtle/50">
        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <Wifi className="size-3 text-green-500" />
          ) : (
            <WifiOff className="size-3 text-amber-500" />
          )}
          <span className="text-text-muted">
            {isConnected ? "实时连接" : "轮询模式"}
          </span>
          <span className="text-text-muted">·</span>
          <span className={otherPartyOnline ? "text-green-500" : "text-text-muted"}>
            {otherPartyOnline ? `${otherPartyName} 在线` : `${otherPartyName} 离线`}
          </span>
        </div>
        {typingUsers.size > 0 && (
          <span className="text-xs text-accent animate-pulse">对方正在输入...</span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {uniqueMessages.length === 0 && (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            发送第一条消息开始对话
          </div>
        )}

        {uniqueMessages.map((msg) => {
          const isMine = userRole === "customer"
            ? msg.direction === "inbound"
            : msg.direction === "outbound";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isMine ? "justify-end" : "justify-start"}`}
            >
              {!isMine && (
                <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="size-4 text-accent" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-lg px-4 py-3 ${
                  isMine
                    ? "bg-accent text-white rounded-br-md"
                    : "bg-bg-card border border-border rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1.5 text-xs ${
                  isMine ? "text-white/60" : "text-text-muted"
                }`}>
                  <span>{formatTime(msg.createdAt)}</span>
                </div>
              </div>

              {isMine && (
                <div className="size-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="size-4 text-accent" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex gap-3 justify-start">
            <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Bot className="size-4 text-accent" />
            </div>
            <div className="bg-bg-card border border-border rounded-lg rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="size-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* AI Draft bubble — matches email inbox pattern */}
        {aiDraft && isAgent && (
          <div className="flex gap-3 justify-end px-4 py-1 animate-slide-up">
            <div className="max-w-[75%] rounded-lg rounded-br-md px-4 py-3 bg-accent/5 border border-accent/20 border-dashed">
              <p className="text-xs text-accent font-medium mb-1 flex items-center gap-1.5">
                <Sparkles className="size-3" />
                AI 草稿 — 审核后发送
                {aiDraft.kbChunksUsed > 0 && (
                  <span className="text-[10px] text-text-muted font-normal">
                    · 引用 {aiDraft.kbChunksUsed} 个知识库片段
                  </span>
                )}
              </p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed line-clamp-4 break-words">{aiDraft.body}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSendDraft}
                  disabled={!aiDraft?.body || sending}
                  className="rounded-lg bg-accent text-white text-xs font-medium px-3 py-1.5 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  {sending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                  发送
                </button>
                <button
                  onClick={() => setAiDraft(null)}
                  className="rounded-lg border border-border bg-bg-card text-text-secondary text-xs font-medium px-3 py-1.5 hover:bg-bg-subtle transition-colors"
                >
                  丢弃
                </button>
                <button
                  onClick={handleAiDraft}
                  disabled={generating}
                  className="rounded-lg text-text-muted text-xs font-medium px-3 py-1.5 hover:text-accent hover:bg-accent/5 transition-colors flex items-center gap-1"
                >
                  {generating ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                  重新生成
                </button>
              </div>
            </div>
            <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-1">
              <Bot className="size-4 text-accent" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          {/* AI Draft button — agent only */}
          {isAgent && orgSlug && (
            <button
              onClick={handleAiDraft}
              disabled={generating}
              className="rounded-xl border border-accent/30 bg-accent/5 text-accent text-sm font-medium px-3.5 py-2.5 hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 flex items-center gap-1.5"
              title="基于知识库和对话历史生成 AI 草稿"
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              <span className="hidden sm:inline">AI 草稿</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAgent ? "输入消息... (Enter 发送)" : "输入消息咨询 AI 助理... (Enter 发送)"}
            className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="rounded-xl bg-accent text-white text-sm font-medium px-5 py-2.5 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 flex items-center gap-1.5"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            <span className="hidden sm:inline">发送</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function toChatMsg(m: { id: string; direction: string; content: string; createdAt: string }): ChatMessage {
  return {
    id: m.id,
    conversationId: "",
    content: m.content,
    direction: m.direction as "inbound" | "outbound",
    senderId: "",
    senderEmail: "",
    senderRole: "",
    createdAt: m.createdAt,
  };
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    return isToday ? time : `${d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })} ${time}`;
  } catch {
    return "";
  }
}
