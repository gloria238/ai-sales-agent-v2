// ── Membership Roles ──────────────────────────────────────────────
// Mirrors Prisma MembershipRole enum but as pure TypeScript
export const MEMBERSHIP_ROLES = ["owner", "admin", "operator", "viewer"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];
