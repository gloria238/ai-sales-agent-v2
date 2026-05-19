"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, MessageSquare, Bot, Send, ScrollText, Settings, History, Menu, X } from "lucide-react";
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
  { href: "/docs", label: "API Docs", icon: History },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5 text-zinc-600 dark:text-zinc-400" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-zinc-900 shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold">O</div>
                <span className="font-semibold text-sm dark:text-white">OpsFlow</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="size-5 text-zinc-500" />
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
                      active ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800",
                    )}
                  >
                    <Icon className="size-4 shrink-0" /> {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
