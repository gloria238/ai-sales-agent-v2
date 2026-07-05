export const ROLES = ["owner", "admin", "operator", "viewer", "customer"] as const;
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

export function hasPermission(role: string, permission: Permission): boolean {
  const allowed = PERMISSION_MAP[permission];
  if (!allowed) return false;
  return allowed.includes(role as Role);
}

export function requirePermission(role: string, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error("Forbidden");
  }
}

import { NextResponse } from "next/server";

/** Returns null if allowed, or a 403 Response if denied. Use: `const err = checkPermission(...); if (err) return err;` */
export function checkPermission(role: string, permission: Permission): NextResponse | null {
  if (!hasPermission(role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
