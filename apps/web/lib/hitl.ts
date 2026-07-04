/**
 * Human-in-the-Loop (HITL) State Machine
 *
 * AI-generated email drafts are NEVER auto-sent. Every outbound email
 * requires explicit human approval. This module documents the formal
 * HITL state machine and provides helper functions.
 *
 * ## State Machine
 *
 * ```
 * active ──────────→ inbound received
 *                         │
 *                         ▼
 *                   [AI composes draft]
 *                         │
 *                         ▼
 *                   awaiting_approval ←── conversation status set by worker
 *                         │
 *              ┌──────────┼──────────┐
 *              ▼          ▼          ▼
 *         [Approve]   [Reject]   [24h timeout]
 *              │          │          │
 *              ▼          ▼          ▼
 *          approved     active     active
 *          (email       (draft     (draft
 *           sent)        deleted)   expired)
 * ```
 *
 * ## Conversation Status Values
 *
 * | Status            | Meaning                                      |
 * |-------------------|----------------------------------------------|
 * | `active`          | Normal conversation, no pending AI draft      |
 * | `awaiting_approval` | AI draft ready, waiting for human review     |
 * | `closed`          | Conversation manually closed                  |
 * | `archived`        | Conversation archived                         |
 *
 * ## Message aiDraftStatus Values (in aiMetadata)
 *
 * | Value             | Meaning                                      |
 * |-------------------|----------------------------------------------|
 * | `pending_approval`| AI draft created, not yet reviewed            |
 * | `approved`        | Human approved, email sent                    |
 * | `rejected`        | Human rejected, draft discarded               |
 * | `expired`         | 24h passed without review, draft discarded    |
 */

/** Check if a conversation is waiting for human approval */
export function isAwaitingApproval(status: string): boolean {
  return status === "awaiting_approval";
}

/** Get the display label for HITL status badge */
export function hitlBadgeLabel(status: string): string | null {
  switch (status) {
    case "awaiting_approval": return "Needs Review";
    default: return null;
  }
}

/** Get the color class for HITL status badge */
export function hitlBadgeColor(status: string): string {
  switch (status) {
    case "awaiting_approval": return "bg-warning/15 text-warning ring-1 ring-warning/30";
    default: return "bg-bg-subtle text-text-muted";
  }
}
