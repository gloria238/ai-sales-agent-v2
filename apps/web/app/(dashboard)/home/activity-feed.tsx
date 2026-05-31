"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/identity/avatar";
import { relativeTime } from "@/lib/time";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "lead_activity" | "audit";
  action: string;
  description: string;
  lead?: { id: string; name: string; email: string | null; company: string | null; stage: string | null; score: number | null };
  userName?: string;
  createdAt: string;
  targetType?: string;
}

interface Props { orgSlug: string }

const MAX_VISIBLE = 15;

export function ActivityFeed({ orgSlug }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["activity-feed", orgSlug],
    queryFn: async () => {
      const res = await fetch(`/api/orgs/${orgSlug}/home/activity`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json() as Promise<{ feed: ActivityItem[] }>;
    },
    refetchInterval: 30000,
  });

  const feed = (data?.feed ?? []).slice(0, MAX_VISIBLE);

  if (error) {
    return <div className="text-xs text-text-muted px-2 py-4 text-center">Activity unavailable</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-px">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 animate-pulse">
            <div className="size-6 rounded-full bg-bg-subtle shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-28 rounded bg-bg-subtle" />
              <div className="h-1.5 w-16 rounded bg-bg-subtle" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <div className="text-center">
          <Sparkles className="size-4 mx-auto mb-1 opacity-20" />
          <p className="text-[10px]">Activity will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-px">
      {feed.map((item) => {
        const leadLink = item.lead?.id ? `/leads/${item.lead.id}` : null;
        return (
          <div key={item.id} className="flex items-center gap-2 py-1.5 px-1.5 rounded-md hover:bg-bg-subtle/50 transition-colors">
            {item.lead ? (
              <Link href={leadLink!} className="shrink-0">
                <Avatar name={item.lead.name} size="sm" seed={item.lead.email || item.lead.name} />
              </Link>
            ) : (
              <div className="size-5 rounded-full bg-bg-subtle flex items-center justify-center shrink-0">
                <span className="text-[9px] font-semibold text-text-muted">{(item.userName || "S")[0]}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-text-secondary truncate">
                {item.lead ? (
                  <Link href={leadLink!} className="font-semibold text-text hover:text-accent transition-colors">
                    {item.lead.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-text">{item.userName || "System"}</span>
                )}
                {" "}
                <span className="text-text-muted">{item.description.toLowerCase()}</span>
              </p>
            </div>
            <span className="text-[9px] text-text-muted shrink-0">{relativeTime(item.createdAt)}</span>
          </div>
        );
      })}
    </div>
  );
}
