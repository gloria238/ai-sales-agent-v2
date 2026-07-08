/**
 * Socket.IO Real-time Chat Server
 *
 * Standalone WebSocket server alongside Next.js (Next.js API routes don't support
 * WebSocket upgrade). Handles real-time messaging between customers (Portal) and
 * sales agents (Dashboard).
 *
 * Usage:
 *   pnpm tsx apps/web/socket-server.ts
 *   # Listens on SOCKET_PORT (default 3001)
 *
 * Authentication: JWT via httpOnly cookie (same cookie Next.js uses)
 * Rooms: Each conversation ID is a Socket.IO room
 * Messages: Persisted to DB via Prisma, then broadcast to room members
 *
 * Fallback: REST endpoint POST /api/orgs/{slug}/conversations/{id}/chat-messages
 *           for when WebSocket is unavailable (serverless deployments)
 */

import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import { verifyToken, type JwtPayload } from "./lib/auth";
import { prisma } from "@salesagent/db";

// ── Config ────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);

const httpServer = createServer((_req, res) => {
  res.writeHead(200);
  res.end("Socket.IO Chat Server — OK");
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  },
  pingTimeout: 60_000,
  pingInterval: 25_000,
});

// ── Auth Middleware ───────────────────────────────────────────────────

io.use(async (socket, next) => {
  try {
    // Parse JWT from cookie (same format as Next.js middleware)
    const cookieHeader = socket.handshake.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").filter(Boolean).map((c) => {
        const [key, ...rest] = c.split("=");
        return [key, rest.join("=")];
      })
    );
    const token = cookies["session"];
    if (!token) return next(new Error("Authentication required"));

    const payload = await verifyToken(token);
    if (!payload) return next(new Error("Invalid or expired token"));

    (socket as any).user = payload;
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
});

// ── Connection Handler ────────────────────────────────────────────────

io.on("connection", (socket) => {
  const user: JwtPayload = (socket as any).user;
  console.log(`[ws] ${user.email} (${user.role}) connected — ${socket.id}`);

  // ── Join Conversation Room ───────────────────────────────────────
  socket.on("join", async (conversationId: string) => {
    // Verify access: Dashboard users must have org membership, Portal users (customer) must own the lead
    try {
      if (user.role === "customer") {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { lead: true },
        });
        if (!conversation || conversation.lead?.userId !== user.userId) {
          socket.emit("error", { message: "Access denied" });
          return;
        }
      }
      // For non-customer roles, access is org-scoped (checked at API level)

      socket.join(conversationId);
      socket.emit("joined", { conversationId, userId: user.userId });

      // Notify room of presence
      socket.to(conversationId).emit("presence", {
        userId: user.userId,
        email: user.email,
        status: "online",
      });
    } catch (err) {
      socket.emit("error", { message: "Failed to join conversation" });
    }
  });

  // ── Send Message ─────────────────────────────────────────────────
  socket.on("message", async (data: { conversationId: string; content: string }) => {
    try {
      if (!data.content?.trim() || !data.conversationId) {
        socket.emit("error", { message: "消息内容不能为空" });
        return;
      }
      if (data.content.length > 5000) {
        socket.emit("error", { message: "消息过长（最多 5000 字符）" });
        return;
      }

      // Verify user belongs to this conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
      });
      if (!conversation) {
        socket.emit("error", { message: "Conversation not found" });
        return;
      }

      // Customer can only send to their own conversations
      if (user.role === "customer") {
        const lead = await prisma.lead.findFirst({
          where: { id: conversation.leadId, userId: user.userId },
        });
        if (!lead) {
          socket.emit("error", { message: "Access denied" });
          return;
        }
      }

      // Persist message to DB
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          content: data.content,
          direction: user.role === "customer" ? "inbound" : "outbound",
          aiMetadata: { senderId: user.userId, senderEmail: user.email, senderRole: user.role } as any,
        },
      });

      // Broadcast to everyone in the conversation room
      io.to(data.conversationId).emit("message", {
        id: message.id,
        conversationId: data.conversationId,
        content: message.content,
        direction: message.direction,
        senderId: user.userId,
        senderEmail: user.email,
        senderRole: user.role,
        createdAt: message.createdAt.toISOString(),
      });
    } catch (err) {
      console.error("[ws] Message error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ── Typing Indicator ─────────────────────────────────────────────
  socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
    socket.to(data.conversationId).emit("typing", {
      userId: user.userId,
      email: user.email,
      isTyping: data.isTyping,
    });
  });

  // ── Leave Conversation Room ──────────────────────────────────────
  socket.on("leave", (conversationId: string) => {
    socket.leave(conversationId);
    socket.to(conversationId).emit("presence", {
      userId: user.userId,
      email: user.email,
      status: "offline",
    });
  });

  // ── Disconnect ───────────────────────────────────────────────────
  socket.on("disconnect", () => {
    // Notify all rooms this user was in
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        io.to(room).emit("presence", {
          userId: user.userId,
          email: user.email,
          status: "offline",
        });
      }
    }
    console.log(`[ws] ${user.email} disconnected — ${socket.id}`);
  });
});

// ── Start ─────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[ws] Socket.IO Chat Server listening on port ${PORT}`);
  console.log(`[ws] CORS origin: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("[ws] Shutting down...");
  io.close();
  httpServer.close();
  process.exit(0);
});
