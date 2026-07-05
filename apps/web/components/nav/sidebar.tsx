"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, MessageSquare, Users, Bot, Send, TrendingUp,
  Settings, PanelLeftClose, PanelLeft, LogOut, ChevronUp, BookOpen,
} from "lucide-react";
import { ThemeToggle } from "@/components/providers/theme-toggle";
import { Avatar } from "@/components/identity/avatar";

const primaryItems = [
  { href: "/home", label: "工作台", icon: LayoutDashboard },
  { href: "/inbox", label: "收件箱", icon: MessageSquare, badge: true },
  { href: "/campaigns", label: "外呼活动", icon: Send },
  { href: "/leads", label: "线索管理", icon: Users },
];

const secondaryItems = [
  { href: "/analytics", label: "数据分析", icon: TrendingUp },
  { href: "/kb", label: "知识库", icon: BookOpen },
  { href: "/agents", label: "AI 助理", icon: Bot },
  { href: "/settings", label: "设置", icon: Settings },
];

interface Props {
  currentOrg: { id?: string; name: string; slug: string };
  orgs: { id: string; name: string; slug: string; role: string }[];
  user: { name: string; email: string };
  SidebarHeader: React.ComponentType<{
    currentOrg: { name: string; slug: string };
    orgs: { id: string; name: string; slug: string; role: string }[];
  }>;
}

export function Sidebar({ currentOrg, orgs, user, SidebarHeader }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  const sidebarWidth = collapsed ? "w-[68px]" : "w-60";

  return (
    <aside className={cn(
      "hidden lg:flex flex-col border-r border-lp-border/30 bg-sidebar-bg/95 backdrop-blur-xl shrink-0 transition-all duration-200",
      sidebarWidth,
    )}>
      {/* Logo + collapse button */}
      <div className={cn(
        "flex items-center border-b border-lp-border/30 shrink-0 transition-all duration-200",
        collapsed ? "px-3 py-4 justify-center" : "px-4 py-4 justify-between",
      )}>
        {!collapsed && (
          <Link href="/home" className="flex items-center gap-2.5 group">
            <div className="size-7 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-accent/20">
              S
            </div>
            <span className="font-bold text-sm text-text tracking-tight">SalesAgent</span>
          </Link>
        )}
        {/* Collapsed: logo doubles as expand button */}
        {collapsed && (
          <div className="relative group/logo">
            <Link href="/home" className="size-8 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-accent/20 group-hover/logo:opacity-0 transition-opacity block">
              S
            </Link>
            <button
              onClick={() => setCollapsed(false)}
              className="absolute inset-0 size-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 opacity-0 group-hover/logo:opacity-100 transition-all shadow-sm"
              title="展开侧边栏"
            >
              <PanelLeft className="size-3.5" />
            </button>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-white/[0.04] text-text-muted hover:text-text transition-colors"
            title="收起侧边栏"
          >
            <PanelLeftClose className="size-3.5" />
          </button>
        )}
      </div>

      {/* Org header */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <SidebarHeader currentOrg={currentOrg} orgs={orgs} />
        </div>
      )}

      {/* Nav */}
      <div className={cn("flex-1 overflow-y-auto py-2", collapsed ? "px-2" : "px-2")}>
        <div className="space-y-0.5">
          {primaryItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg transition-all duration-150 relative",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2",
                  "text-[13px] font-medium",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text hover:bg-white/[0.04]",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("size-4 shrink-0", isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary")} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>

        <div className={cn("my-3 border-t border-lp-border/30", collapsed ? "mx-1" : "mx-2")} />

        <div className="space-y-0.5">
          {secondaryItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg transition-all duration-150 relative",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2",
                  "text-[13px] font-medium",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-text-muted hover:text-text-secondary hover:bg-white/[0.04]",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer: User + Theme */}
      <div className={cn(
        "border-t border-lp-border/30",
        collapsed ? "px-2 py-3" : "px-3 py-2",
      )}>
        {/* Theme toggle */}
        <div className={cn("flex", collapsed ? "justify-center mb-3" : "mb-2")}>
          <ThemeToggle />
        </div>

        {/* User area */}
        <div className="relative group/user">
          {/* Expand hint on hover when collapsed */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/user:opacity-100 transition-opacity p-1 rounded-md bg-bg-card border border-border shadow-sm text-text-muted hover:text-text z-10"
              title="展开侧边栏"
            >
              <PanelLeft className="size-3.5" />
            </button>
          )}
          <button
            onClick={() => setUserOpen(!userOpen)}
            className={cn(
              "w-full flex items-center rounded-lg hover:bg-white/[0.04] transition-colors",
              collapsed ? "justify-center p-1.5" : "gap-2.5 px-2 py-1.5",
            )}
          >
            <Avatar name={user.name} size={collapsed ? "sm" : "sm"} seed={user.email} />
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-semibold text-text truncate leading-tight">{user.name}</div>
                  <div className="text-[10px] text-text-muted truncate leading-tight">{user.email}</div>
                </div>
                <ChevronUp className={cn("size-3 text-text-muted transition-transform", userOpen && "rotate-180")} />
              </>
            )}
          </button>

          {/* Dropup menu */}
          {userOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
              <div className={cn(
                "absolute bottom-full left-0 mb-1 z-20 bg-bg-card border border-border rounded-xl shadow-xl py-1 min-w-[180px]",
                collapsed && "left-full -translate-x-1/2 ml-3 mb-0 bottom-0",
              )}>
                <div className="px-3 py-2 text-xs text-text-muted border-b border-border">
                  <p className="font-medium text-text truncate">{user.name}</p>
                  <p className="truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => { router.push("/settings"); setUserOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-white/[0.04] transition-colors"
                >
                  <Settings className="size-3.5 text-text-muted" /> 设置
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-white/[0.04] transition-colors"
                >
                  <LogOut className="size-3.5" /> 退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
