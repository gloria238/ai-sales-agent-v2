"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { History, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  userName: string | null;
  metadata: unknown;
  createdAt: string;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function actionVariant(action: string): "success" | "warning" | "danger" | "default" {
  if (action.includes("created")) return "success";
  if (action.includes("updated") || action.includes("changed")) return "warning";
  if (action.includes("deleted") || action.includes("removed")) return "danger";
  return "default";
}

function UserAvatar({ name }: { name: string | null }) {
  const initials = (name || "S").slice(0, 2).toUpperCase();
  const colors = [
    "bg-accent-soft text-accent",
    "bg-warning-soft text-warning",
    "bg-danger-soft text-danger",
    "bg-bg-subtle text-text-secondary",
    "bg-lp-hero-sub/10 text-lp-hero-sub",
    "bg-white/[0.06] text-text-muted",
  ];
  const colorIdx = (name || "").length % colors.length;
  return (
    <div className={cn("size-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ring-2 ring-lp-background", colors[colorIdx])}>
      {initials}
    </div>
  );
}

export default function AuditLogPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orgSlug, setOrgSlug] = useState("");
  const [slugLoading, setSlugLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orgs").then(async (res) => {
      if (!res.ok) return;
      const orgs = await res.json();
      if (orgs.length > 0) setOrgSlug(orgs[0].slug);
      setSlugLoading(false);
    });
  }, []);

  const queryKey = ["audit-log", orgSlug, page];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "30");
      const res = await fetch(`/api/orgs/${orgSlug}/audit-log?${params}`);
      if (!res.ok) throw new Error("Failed to fetch audit log");
      return res.json() as Promise<{ logs: AuditEntry[]; total: number; totalPages: number }>;
    },
    enabled: !!orgSlug,
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  useEffect(() => { if (data?.totalPages) setTotalPages(data.totalPages); }, [data?.totalPages]);

  if (slugLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardContent className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orgSlug) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Audit Log</h1>
          <p className="text-sm text-text-muted mt-1">Track all changes across your organization.</p>
        </div>
        <Card>
          <EmptyState
            icon={<History className="size-6" />}
            title="No organization found"
            description="You need to be a member of an organization to view the audit log."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Audit Log</h1>
          <p className="text-sm text-text-muted mt-1">Track all changes across your organization.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["audit-log", orgSlug] })}
        >
          <RefreshCw className="size-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-danger mb-3">Failed to load audit log</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["audit-log", orgSlug] })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && isLoading && (
        <Card>
          <CardContent className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!error && !isLoading && logs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<History className="size-6" />}
            title="No audit entries yet"
            description="Changes to workflows, leads, and settings will appear here."
          />
        </Card>
      ) : null}

      {!error && logs.length > 0 && (
        <Card>
          <CardContent className="p-0 divide-y divide-lp-border/20">
            {logs.map((entry) => (
              <div key={entry.id} className="flex gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <UserAvatar name={entry.userName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-text">
                      {entry.userName || "System"}
                    </span>
                    <Badge variant={actionVariant(entry.action)} className="text-[11px] px-1.5 py-0">
                      {entry.action}
                    </Badge>
                    <span className="text-xs text-text-muted">on</span>
                    <span className="text-xs font-medium text-text-secondary">{entry.targetType}</span>
                    {entry.targetId && (
                      <span className="text-[11px] text-text-muted font-mono">#{entry.targetId.slice(0, 8)}</span>
                    )}
                  </div>
                  {entry.metadata ? (
                    <div className="mt-2 text-xs text-text-muted bg-bg-subtle rounded-md p-3 font-mono leading-relaxed overflow-x-auto">
                      {typeof entry.metadata === "string"
                        ? entry.metadata
                        : Object.entries(entry.metadata as Record<string, unknown>).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-text-muted shrink-0">{k}:</span>
                              <span className="text-text-secondary">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                            </div>
                          ))}
                    </div>
                  ) : null}
                </div>
                <div className="text-xs text-text-muted shrink-0 text-right whitespace-nowrap pt-0.5">
                  <div>{formatTimestamp(entry.createdAt)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-lp-border/20 pt-4">
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
            <span className="text-text-muted mx-1">·</span>
            {total} total entries
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-3.5 mr-1" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next
              <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
