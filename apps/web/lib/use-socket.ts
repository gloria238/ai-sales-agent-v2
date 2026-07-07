"use client";

/**
 * Socket.IO React Hook — real-time chat client.
 *
 * Usage:
 *   const { messages, sendMessage, typing, setTyping, isConnected } = useSocket(conversationId);
 *
 * Automatically joins/leaves conversation rooms and handles reconnection.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  direction: "inbound" | "outbound";
  senderId: string;
  senderEmail: string;
  senderRole: string;
  createdAt: string;
}

export interface PresenceInfo {
  userId: string;
  email: string;
  status: "online" | "offline";
}

export interface TypingInfo {
  userId: string;
  email: string;
  isTyping: boolean;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function useSocket(conversationId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [presence, setPresence] = useState<PresenceInfo[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId) return;

    // Detect Vercel/Serverless — WebSocket not supported, use REST only
    const isVercel = typeof window !== "undefined" &&
      (window.location.hostname.includes("vercel.app") || !window.location.hostname.includes("localhost"));

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: isVercel ? ["polling"] : ["websocket", "polling"],
      reconnection: !isVercel, // Don't retry on Vercel — no WS server
      reconnectionAttempts: isVercel ? 1 : 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      timeout: isVercel ? 5000 : 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join", conversationId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("joined", (_data: { conversationId: string; userId: string }) => {
      // Successfully joined room
    });

    socket.on("message", (msg: ChatMessage) => {
      setMessages((prev) => {
        // Deduplicate by ID
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("presence", (p: PresenceInfo) => {
      setPresence((prev) => {
        const filtered = prev.filter((x) => x.userId !== p.userId);
        return p.status === "online" ? [...filtered, p] : filtered;
      });
    });

    socket.on("typing", (t: TypingInfo) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (t.isTyping) next.add(t.userId);
        else next.delete(t.userId);
        return next;
      });
    });

    socket.on("error", (err: { message: string }) => {
      console.warn("[ws] Server error:", err.message);
    });

    socket.on("connect_error", (err: Error) => {
      console.warn("[ws] Connection error:", err.message);
      setIsConnected(false);
    });

    return () => {
      socket.emit("leave", conversationId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId]);

  const sendMessage = useCallback((content: string) => {
    const socket = socketRef.current;
    if (!socket || !conversationId || !content.trim()) return;

    socket.emit("message", { conversationId, content });
  }, [conversationId]);

  const setTyping = useCallback((isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;
    socket.emit("typing", { conversationId, isTyping });
  }, [conversationId]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  return {
    messages,
    sendMessage,
    addMessage,
    isConnected,
    presence,
    typingUsers,
    setTyping,
  };
}
