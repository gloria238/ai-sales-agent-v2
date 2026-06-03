export const ROLES = ["owner", "admin", "operator", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSION_MAP: Record<string, Role[]> = {
  manage_org: ["owner"],
  manage_members: ["owner", "admin"],
  manage_agents: ["owner", "admin", "operator"],
  manage_leads: ["owner", "admin", "operator"],
  delete_leads: ["owner", "admin"],
  manage_campaigns: ["owner", "admin", "operator"],
  view_agents: ["owner", "admin", "operator", "viewer"],
  view_leads: ["owner", "admin", "operator", "viewer"],
  view_members: ["owner", "admin", "operator", "viewer"],
  view_audit_log: ["owner", "admin", "operator", "viewer"],
  manage_api_keys: ["owner", "admin"],
  view_api_keys: ["owner", "admin"],
  run_campaigns: ["owner", "admin", "operator"],
};

export type Permission = keyof typeof PERMISSION_MAP;
