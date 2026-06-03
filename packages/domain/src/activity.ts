// ── Lead Activity Types ───────────────────────────────────────────
export const LEAD_ACTIVITY_TYPES = [
  "note",
  "stage_change",
  "assignment",
  "email_sent",
  "email_received",
  "meeting_booked",
] as const;

export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];
