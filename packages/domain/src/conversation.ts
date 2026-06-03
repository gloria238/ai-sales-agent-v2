// ── Conversation Status ───────────────────────────────────────────
export const CONVERSATION_STATUSES = ["active", "closed", "archived"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

// ── Conversation Channel ──────────────────────────────────────────
export const CONVERSATION_CHANNELS = ["email", "chat", "sms"] as const;
export type ConversationChannel = (typeof CONVERSATION_CHANNELS)[number];

// ── Message Direction ─────────────────────────────────────────────
export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];
