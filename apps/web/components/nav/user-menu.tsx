"use client";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/identity/avatar";
import { LogOut, Settings } from "lucide-react";
import { useCallback } from "react";

interface UserMenuProps {
  user: { name: string; email: string };
  org: { name: string; slug: string };
}

export function UserMenu({ user, org }: UserMenuProps) {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center gap-2.5 cursor-pointer rounded-xl px-2.5 py-1.5 hover:bg-bg-subtle transition-all duration-200">
            <Avatar name={user.name} seed={user.email} size="sm" />
            <div className="text-left hidden sm:block">
              <div className="text-sm font-semibold text-text leading-tight tracking-tight">{user.name}</div>
              <div className="text-xs text-text-muted leading-tight">{org.name}</div>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-3 py-2 text-xs text-text-muted border-b border-border">
            <p className="font-medium text-text truncate">{user.name}</p>
            <p className="truncate">{user.email}</p>
          </div>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="size-3.5 mr-2 text-text-muted" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="size-3.5 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
