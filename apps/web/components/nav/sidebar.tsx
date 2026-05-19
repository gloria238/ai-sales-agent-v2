"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Users, Bot, Send, ScrollText, Settings, History, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/providers/theme-toggle";

const primaryItems = [
  { href: "/inbox", label: "Inbox", icon: MessageSquare, badge: true },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/campaigns", label: "Campaigns", icon: Send },
  { href: "/leads", label: "Leads", icon: Users },
];

const secondaryItems = [
  { href: "/scripts", label: "Scripts", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full bg-sidebar-bg border-r border-sidebar-border backdrop-blur-xl" style={{ width: "var(--sidebar-w)" }}>
      {/* Logo area */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <Link href="/home" className="flex items-center gap-2.5 group">
          <div className="size-7 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-accent/20 group-hover:shadow-md group-hover:shadow-accent/30 transition-shadow">
            S
          </div>
          <span className="font-bold text-sm text-text tracking-tight">SalesAgent</span>
        </Link>
      </div>

      {/* Primary nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {primaryItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 relative",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text hover:bg-bg-subtle/80",
                )}
              >
                <Icon className={cn("size-4 shrink-0", isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary")} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto size-1.5 rounded-full bg-accent" />
                )}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Secondary nav */}
        <div className="mt-4 pt-4 border-t border-sidebar-border">
          <div className="space-y-0.5">
            {secondaryItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 relative",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-text-muted hover:text-text-secondary hover:bg-bg-subtle/80",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-sidebar-border flex items-center justify-between">
        <Link href="/docs" className="text-text-muted hover:text-text-secondary transition-colors p-1 rounded-md">
          <BookOpen className="size-3.5" />
        </Link>
        <Link href="/audit-log" className="text-text-muted hover:text-text-secondary transition-colors p-1 rounded-md">
          <History className="size-3.5" />
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}
