"use client";
import { usePathname } from "next/navigation";

const SECTION_LABELS: Record<string, string> = {
  home: "工作台",
  inbox: "收件箱",
  campaigns: "外呼活动",
  leads: "客户管理",
  agents: "AI 助理",
  analytics: "数据分析",
  scripts: "话术脚本",
  settings: "设置",
  docs: "API 文档",
  "audit-log": "审计日志",
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
