import { describe, it, expect } from "vitest";
import { hasPermission, requirePermission, ROLES, PERMISSION_MAP } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

describe("hasPermission", () => {
  it("owner has all permissions", () => {
    for (const perm of Object.keys(PERMISSION_MAP) as Permission[]) {
      expect(hasPermission("owner", perm)).toBe(true);
    }
  });

  it("admin has expected permissions", () => {
    const adminPerms = [
      "manage_members", "manage_agents", "manage_leads",
      "manage_campaigns", "delete_leads",
      "view_agents", "view_leads", "view_members", "view_audit_log",
      "run_campaigns", "manage_api_keys", "view_api_keys",
    ];
    for (const perm of adminPerms) {
      expect(hasPermission("admin", perm)).toBe(true);
    }
    expect(hasPermission("admin", "manage_org")).toBe(false);
  });

  it("operator has expected permissions", () => {
    expect(hasPermission("operator", "manage_agents")).toBe(true);
    expect(hasPermission("operator", "manage_leads")).toBe(true);
    expect(hasPermission("operator", "manage_campaigns")).toBe(true);
    expect(hasPermission("operator", "run_campaigns")).toBe(true);
    expect(hasPermission("operator", "view_agents")).toBe(true);
    expect(hasPermission("operator", "view_leads")).toBe(true);
    expect(hasPermission("operator", "view_members")).toBe(true);
    expect(hasPermission("operator", "view_audit_log")).toBe(true);

    expect(hasPermission("operator", "manage_org")).toBe(false);
    expect(hasPermission("operator", "manage_members")).toBe(false);
    expect(hasPermission("operator", "delete_leads")).toBe(false);
    expect(hasPermission("operator", "manage_api_keys")).toBe(false);
    expect(hasPermission("operator", "view_api_keys")).toBe(false);
  });

  it("viewer only has view permissions (no mutation)", () => {
    expect(hasPermission("viewer", "view_agents")).toBe(true);
    expect(hasPermission("viewer", "view_leads")).toBe(true);
    expect(hasPermission("viewer", "view_members")).toBe(true);
    expect(hasPermission("viewer", "view_audit_log")).toBe(true);

    expect(hasPermission("viewer", "manage_org")).toBe(false);
    expect(hasPermission("viewer", "manage_members")).toBe(false);
    expect(hasPermission("viewer", "manage_agents")).toBe(false);
    expect(hasPermission("viewer", "manage_leads")).toBe(false);
    expect(hasPermission("viewer", "manage_campaigns")).toBe(false);
    expect(hasPermission("viewer", "delete_leads")).toBe(false);
    expect(hasPermission("viewer", "run_campaigns")).toBe(false);
    expect(hasPermission("viewer", "manage_api_keys")).toBe(false);
  });

  it("returns false for unknown permission", () => {
    expect(hasPermission("owner", "nonexistent" as Permission)).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(hasPermission("superadmin", "manage_org")).toBe(false);
  });
});

describe("requirePermission", () => {
  it("does not throw when role has permission", () => {
    expect(() => requirePermission("owner", "manage_org")).not.toThrow();
    expect(() => requirePermission("admin", "manage_members")).not.toThrow();
    expect(() => requirePermission("operator", "manage_agents")).not.toThrow();
    expect(() => requirePermission("viewer", "view_agents")).not.toThrow();
  });

  it("throws 'Forbidden' when role lacks permission", () => {
    expect(() => requirePermission("viewer", "manage_org")).toThrow("Forbidden");
    expect(() => requirePermission("viewer", "manage_agents")).toThrow("Forbidden");
    expect(() => requirePermission("operator", "manage_org")).toThrow("Forbidden");
    expect(() => requirePermission("admin", "manage_org")).toThrow("Forbidden");
  });
});

describe("ROLES constant", () => {
  it("contains exactly 4 roles in correct order", () => {
    expect(ROLES).toHaveLength(4);
    expect(ROLES).toEqual(["owner", "admin", "operator", "viewer"]);
  });
});

describe("permission-role matrix completeness", () => {
  it("every permission covers at least one role", () => {
    for (const [perm, roles] of Object.entries(PERMISSION_MAP)) {
      expect(roles.length).toBeGreaterThan(0);
    }
  });

  it("owner has every permission", () => {
    for (const roles of Object.values(PERMISSION_MAP)) {
      expect(roles).toContain("owner");
    }
  });

  it("viewer never has mutation permissions", () => {
    const mutationPerms = ["manage_org", "manage_members", "manage_agents",
      "manage_leads", "manage_campaigns", "delete_leads", "run_campaigns",
      "manage_api_keys", "view_api_keys"];
    for (const perm of mutationPerms) {
      expect(PERMISSION_MAP[perm] ?? []).not.toContain("viewer");
    }
  });
});
