// Re-export all mock data from a single barrel
export { MOCK_KPIS, MOCK_RECENT_ACTIVITY, activityIcon } from "./mock-dashboard";
export type { KpiData, ActivityItem as DashboardActivityItem } from "./mock-dashboard";

export { MOCK_CONVERSATIONS } from "./mock-inbox";
export type { MockConversation, MockMessage, Source } from "./mock-inbox";

export { MOCK_KB_STATS, MOCK_DOCUMENTS } from "./mock-kb";
export type { MockDocument, KBStats } from "./mock-kb";

export { MOCK_KB_ANSWERS, SUGGESTED_QUESTIONS, findAnswer, FALLBACK_ANSWER } from "./mock-playground";
export type { PlaygroundAnswer, PlaygroundSource } from "./mock-playground";

export { MOCK_SYSTEM_STATS, PIPELINE_STEPS, TECH_STACK, ARCHITECTURE_LAYERS } from "./mock-system";
export type { SystemStats } from "./mock-system";
