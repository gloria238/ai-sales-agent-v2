"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, MessageSquare, Bot, Send, ScrollText, Settings, History, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/providers/theme-toggle";

const navItems = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/campaigns", label: "Campaigns", icon: Send },
  { href: "/scripts", label: "Scripts", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/audit-log", label: "Audit Log", icon: History },
  { href: "/docs", label: "API Docs", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full">
      <div className="space-y-0.5 px-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent/10 text-accent shadow-sm"
                  : "text-text-secondary hover:text-text hover:bg-bg-subtle",
              )}
            >
              <Icon className={cn(
                "size-4 shrink-0 transition-colors duration-200",
                isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary",
              )} />
              <span className="tracking-tight">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1 h-5 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
      <div className="px-2 pb-3">
        <div className="border-t border-border pt-3 flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
