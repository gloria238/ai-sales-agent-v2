"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkerStatusCard({ orgSlug }: { orgSlug: string }) {
  const [data, setData] = useState<{
    worker: { status: string; lastPoll?: string; activeRuns?: number };
    queue: { queued: number; running: number; dead_letter: number };
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchHealth() {
      try {
        const res = await fetch(`/api/orgs/${orgSlug}/worker/health`);
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelled) setData(d);
      } catch { /* ignore */ }
    }
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const workerOk = data?.worker?.status === "running";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">Worker</span>
          </div>
          <span className={cn("size-2 rounded-full", workerOk ? "bg-primary" : "bg-bg-muted")} />
        </div>
        {data ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Status</span>
              <span className={cn("font-medium", workerOk ? "text-primary" : "text-text-muted")}>
                {data.worker.status}
              </span>
            </div>
            {data.worker.lastPoll && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Last poll</span>
                <span className="text-text-secondary font-mono text-[11px]">
                  {new Date(data.worker.lastPoll).toLocaleTimeString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Queue</span>
              <span className="text-text-secondary">
                {data.queue.queued} queued, {data.queue.running} running
              </span>
            </div>
            {data.queue.dead_letter > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-danger">Dead letter</span>
                <span className="text-danger font-medium">{data.queue.dead_letter}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-3 bg-bg-subtle rounded animate-pulse-soft w-3/4" />
            <div className="h-3 bg-bg-subtle rounded animate-pulse-soft w-1/2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
