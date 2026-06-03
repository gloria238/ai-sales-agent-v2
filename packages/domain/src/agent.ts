// ── Agent Goals ───────────────────────────────────────────────────
export const AGENT_GOAL_TYPES = [
  "qualify_lead",
  "book_meeting",
  "handle_objection",
  "nurture",
  "follow_up",
] as const;

export type AgentGoalType = (typeof AGENT_GOAL_TYPES)[number];

export interface AgentGoal {
  type: AgentGoalType;
  priority: number;
  successCriteria: string;
}

// ── Sales Methodologies ───────────────────────────────────────────
export const SALES_METHODOLOGIES = [
  "SPIN",
  "BANT",
  "MEDDIC",
  "Challenger",
  "custom",
] as const;

export type SalesMethodology = (typeof SALES_METHODOLOGIES)[number];
