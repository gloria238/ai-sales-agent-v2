"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/identity/avatar";
import { presenceFromDate, relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Bot, MessageSquare, Send, CheckCircle, TrendingUp, RefreshCw, Mail, User, Sparkles } from "lucide-react";

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

interface Props {
  orgSlug: string;
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  created: User,
  stage_change: TrendingUp,
  email_sent: Send,
  email_received: Mail,
  meeting_booked: CheckCircle,
  note: MessageSquare,
  // Audit fallbacks
  "agent.created": Bot,
  "campaign.started": Send,
  "lead.qualified": TrendingUp,
  "conversation.closed": CheckCircle,
};

function ActivityIcon({ action }: { action: string }) {
  const Icon = ACTIVITY_ICONS[action] || Sparkles;
  const colors: Record<string, string> = {
    created: "border-l-accent text-accent",
    stage_change: "border-l-green-400 text-green-400",
    email_sent: "border-l-accent text-accent",
    email_received: "border-l-blue-400 text-blue-400",
    meeting_booked: "border-l-green-400 text-green-400",
    note: "border-l-amber-400 text-amber-400",
    "agent.created": "border-l-accent text-accent",
    "campaign.started": "border-l-accent text-accent",
    "lead.qualified": "border-l-green-400 text-green-400",
    "conversation.closed": "border-l-slate-400 text-slate-400",
  };
  const color = colors[action] || "border-l-accent text-accent";

  return (
    <div className={cn("size-8 rounded-lg bg-bg-subtle flex items-center justify-center shrink-0 border-l-2", color)}>
      <Icon className="size-3.5" />
    </div>
  );
}

export function ActivityFeed({ orgSlug }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["activity-feed", orgSlug],
    queryFn: async () => {
      const res = await fetch(`/api/orgs/${orgSlug}/home/activity`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json() as Promise<{ feed: ActivityItem[] }>;
    },
    refetchInterval: 30000, // Poll every 30s for operational feel
  });

  const feed = data?.feed ?? [];

  if (error) {
    return (
      <div className="text-xs text-text-muted">
        Activity feed unavailable
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-bg-subtle" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-48 rounded bg-bg-subtle" />
                <div className="h-2 w-32 rounded bg-bg-subtle" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <Sparkles className="size-6 mx-auto mb-2 opacity-30" />
        <p className="text-xs">Activity will appear here as your AI agents work</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {feed.map((item) => {
        const leadName = item.lead?.name ?? item.userName ?? "System";
        const leadLink = item.lead?.id ? `/leads/${item.lead.id}` : null;

        return (
          <div
            key={item.id}
            className="glass-card p-3 flex items-center gap-3 hover:border-accent/20 transition-all"
          >
            {item.lead ? (
              <Link href={leadLink!} className="shrink-0">
                <Avatar
                  name={item.lead.name}
                  size="sm"
                  seed={item.lead.email || item.lead.name}
                />
              </Link>
            ) : (
              <div className="size-8 rounded-lg bg-bg-subtle flex items-center justify-center shrink-0">
                <ActivityIcon action={item.action} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-text-secondary truncate">
                {item.lead ? (
                  <Link href={leadLink!} className="font-semibold text-text hover:text-accent transition-colors">
                    {item.lead.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-text">{leadName}</span>
                )}
                {" "}
                <span className="text-text-muted">{item.description.toLowerCase()}</span>
              </p>
              {item.lead?.company && (
                <p className="text-[11px] text-text-muted mt-0.5">{item.lead.company}</p>
              )}
            </div>

            <div className="text-[10px] text-text-muted shrink-0 text-right">
              <p>{relativeTime(item.createdAt)}</p>
              {item.type === "audit" && (
                <p className="text-[9px] mt-0.5 opacity-60">{item.targetType}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
