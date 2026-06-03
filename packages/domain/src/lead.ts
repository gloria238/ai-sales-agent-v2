// ── Lead Pipeline Stages ──────────────────────────────────────────
export const LEAD_STAGES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

/** Valid stage transitions. A lead can only move forward through the pipeline. */
export const STAGE_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  new: ["contacted", "qualified"],
  contacted: ["qualified", "closed_lost"],
  qualified: ["proposal", "closed_lost"],
  proposal: ["negotiation", "closed_won", "closed_lost"],
  negotiation: ["closed_won", "closed_lost"],
  closed_won: [],
  closed_lost: [],
};

// ── Lead Scoring ──────────────────────────────────────────────────
export const LEAD_SCORE_LABELS = ["hot", "warm", "cold"] as const;
export type LeadScoreLabel = (typeof LEAD_SCORE_LABELS)[number];

export const SCORE_THRESHOLDS = {
  hot: 70,
  warm: 40,
  // below 40 = cold
} as const;

export function scoreLabel(score: number): LeadScoreLabel {
  if (score >= SCORE_THRESHOLDS.hot) return "hot";
  if (score >= SCORE_THRESHOLDS.warm) return "warm";
  return "cold";
}

// ── Lead Sources ──────────────────────────────────────────────────
export const LEAD_SOURCES = [
  "website",
  "referral",
  "outbound",
  "linkedin",
  "event",
  "other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];
