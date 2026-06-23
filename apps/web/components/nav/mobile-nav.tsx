"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, MessageSquare, Bot, Send, TrendingUp, Settings, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/providers/theme-toggle";

const navItems = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/campaigns", label: "Campaigns", icon: Send },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5 text-text-secondary" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-lp-background/95 backdrop-blur-xl shadow-xl border-r border-lp-border/30 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-md bg-accent flex items-center justify-center text-white text-xs font-bold">S</div>
                <span className="font-semibold text-sm text-text">SalesAgent</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/[0.04] transition-colors">
                <X className="size-5 text-text-muted" />
              </button>
            </div>
            <nav className="space-y-0.5 flex-1">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-text-muted hover:text-text hover:bg-white/[0.04]",
                    )}
                  >
                    <Icon className="size-4 shrink-0" /> {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-lp-border/30 pt-3 flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
