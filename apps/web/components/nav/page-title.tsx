"use client";
import { usePathname } from "next/navigation";

const SECTION_LABELS: Record<string, string> = {
  home: "Dashboard",
  inbox: "Inbox",
  campaigns: "Campaigns",
  leads: "Leads",
  agents: "Agents",
  analytics: "Analytics",
  scripts: "Scripts",
  settings: "Settings",
  docs: "API Docs",
  "audit-log": "Audit Log",
};

export function PageTitle() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Show the first meaningful segment as the page title
  // If on inbox/[id], show "Inbox"
  // If on leads/[id], show "Leads"
  const section = segments[0] || "dashboard";
  const label = SECTION_LABELS[section] || section.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium text-text">{label}</span>
    </div>
  );
}
