/**
 * Operational time utilities for the Identity Stack.
 * Converts raw timestamps into human-readable relative times
 * and derives presence states from activity recency.
 */

export type PresenceState =
  | "online"
  | "idle"
  | "away"
  | "offline"
  | "ai-processing"
  | "handoff-required"
  | "syncing";

export function relativeTime(dateStr: string | Date): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1m ago";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function relativeTimeVerbose(dateStr: string | Date): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Active now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

/**
 * Derive a presence state from a last-seen timestamp.
 * Pure data function — no WebSocket, no realtime. Presence is inferred
 * from how recently the record was active.
 */
export function presenceFromDate(lastSeenAt: string | Date | null | undefined): PresenceState {
  if (!lastSeenAt) return "offline";
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return "online";
  if (mins < 60) return "idle";
  if (mins < 1440) return "away";
  return "offline";
}

/**
 * Returns a human-readable presence label.
 * Only returns a label for states worth surfacing.
 */
export function presenceLabel(state: PresenceState): string | null {
  switch (state) {
    case "online": return "Online now";
    case "idle": return "Idle";
    case "ai-processing": return "AI drafting…";
    case "handoff-required": return "Needs review";
    case "syncing": return "Syncing…";
    default: return null;
  }
}

/**
 * Map presence state to a color class for the presence dot.
 */
export function presenceColor(state: PresenceState): string {
  switch (state) {
    case "online": return "bg-primary";
    case "idle": return "bg-muted-foreground";
    case "away": return "bg-muted";
    case "offline": return "bg-muted";
    case "ai-processing": return "bg-primary";
    case "handoff-required": return "bg-warning";
    case "syncing": return "bg-primary-hover";
  }
}
