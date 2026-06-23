"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Send, TrendingUp, Users, Mail, MousePointerClick, Reply, Calendar,
  CheckCircle2, XCircle, Clock, ArrowLeft, Play, Pause, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

type Campaign = {
  id: string; name: string; description: string | null; status: string;
  targetAudience?: any; schedule?: any; stats?: any;
  script?: { name: string; steps: any[] } | null;
  agent?: { id: string; name: string } | null;
  runs: Array<{ id: string; status: string; recipientCount: number | null; stats?: any; startedAt?: string; finishedAt?: string }>;
};

export function CampaignDetailClient({ campaign, orgSlug }: { campaign: Campaign; orgSlug: string }) {
  const router = useRouter();
  const stats = campaign.stats || {};
  const total = stats.sent || 0;
  const opened = stats.opened || 0;
  const clicked = stats.clicked || 0;
  const replied = stats.replied || 0;
  const booked = stats.booked || 0;

  const openRate = total > 0 ? Math.round((opened / total) * 100) : 0;
  const replyRate = total > 0 ? Math.round((replied / total) * 100) : 0;
  const clickRate = total > 0 ? Math.round((clicked / total) * 100) : 0;
  const bookRate = replied > 0 ? Math.round((booked / replied) * 100) : 0;

  const statusBadge = (s: string) => ({
    draft: "bg-bg-subtle text-text-muted", active: "bg-accent-soft text-accent border-accent/20",
    paused: "bg-warning-soft text-warning border-warning/20", completed: "bg-bg-subtle text-text-secondary border-lp-border/20",
  }[s] || "");

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <button onClick={() => router.push("/campaigns")} className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors">
        <ArrowLeft className="size-3.5" /> Back to campaigns
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-text">{campaign.name}</h1>
            <Badge className={cn("text-[10px]", statusBadge(campaign.status))} variant="default">{campaign.status}</Badge>
          </div>
          <p className="text-sm text-text-muted">{campaign.description || "No description"}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
            {campaign.script && <span>Script: <span className="text-text-secondary font-medium">{campaign.script.name}</span></span>}
            {campaign.agent && <span>Agent: <span className="text-text-secondary font-medium">{campaign.agent.name}</span></span>}
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "draft" && (
            <Button size="sm" onClick={async () => {
              const res = await fetch(`/api/orgs/${orgSlug}/campaigns/${campaign.id}/start`, { method: "POST" });
              if (res.ok) { toast.success("Campaign started"); router.refresh(); } else { toast.error("Failed to start"); }
            }}><Play className="size-3.5 mr-1" /> Start Campaign</Button>
          )}
          {campaign.status === "active" && (
            <Button size="sm" variant="outline" onClick={async () => {
              await fetch(`/api/orgs/${orgSlug}/campaigns/${campaign.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paused" }) });
              toast.success("Campaign paused"); router.refresh();
            }}><Pause className="size-3.5 mr-1" /> Pause</Button>
          )}
        </div>
      </div>

      {/* Revenue metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Send, label: "Emails Sent", val: total.toLocaleString(), sub: "total delivered", color: "text-accent", bg: "bg-accent-soft" },
          { icon: MousePointerClick, label: "Open Rate", val: `${openRate}%`, sub: `${opened} of ${total}`, color: "text-lp-hero-sub", bg: "bg-white/[0.04]" },
          { icon: Reply, label: "Reply Rate", val: `${replyRate}%`, sub: `${replied} replies`, color: "text-accent", bg: "bg-accent-soft" },
          { icon: Calendar, label: "Meetings Booked", val: String(booked), sub: `${bookRate}% of replies`, color: "text-warning", bg: "bg-warning-soft" },
        ].map((m) => (
          <Card key={m.label} className="p-4 glass-card">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
                <m.icon className={`size-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-text">{m.val}</p>
                <p className="text-[11px] text-text-muted">{m.label}</p>
                <p className="text-[10px] text-text-muted/60">{m.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Funnel visualization */}
      <Card className="p-6 glass-card">
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2"><BarChart3 className="size-4 text-accent" /> Conversion Funnel</h3>
        <div className="space-y-3">
          {[
            { label: "Sent", count: total, color: "bg-accent", width: 100 },
            { label: "Opened", count: opened, color: "bg-lp-hero-sub/60", width: openRate },
            { label: "Clicked", count: clicked, color: "bg-warning/60", width: clickRate },
            { label: "Replied", count: replied, color: "bg-accent/60", width: replyRate },
            { label: "Booked", count: booked, color: "bg-warning", width: bookRate },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-16 text-right">{f.label}</span>
              <div className="flex-1 h-6 bg-bg-subtle rounded-full overflow-hidden relative">
                <div className={cn("h-full rounded-full transition-all duration-700", f.color)} style={{ width: `${Math.max(f.width, f.count > 0 ? 4 : 0)}%` }} />
              </div>
              <span className="text-xs font-semibold text-text w-10">{f.count}</span>
              {f.label !== "Sent" && <span className="text-[10px] text-text-muted w-8">{f.width}%</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* Script preview + Recent runs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Script steps */}
        <div className="lg:col-span-3">
          <h3 className="text-sm font-semibold text-text mb-3">Sequence Steps</h3>
          <div className="space-y-2">
            {(campaign.script?.steps as any[] || []).map((step: any, i: number) => (
              <Card key={i} className="p-4 glass-card flex items-start gap-3">
                <div className="size-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0 mt-0.5">{step.order}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="text-[10px]" variant="default">{step.type}</Badge>
                    {step.delay && <span className="text-[10px] text-text-muted">Delay: {step.delay}</span>}
                  </div>
                  <p className="text-xs text-text-secondary font-medium truncate">{step.subject || "No subject"}</p>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{step.template}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent runs */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-text mb-3">Recent Runs</h3>
          {campaign.runs.length === 0 ? (
            <Card className="p-6 glass-card text-center text-sm text-text-muted">No runs yet</Card>
          ) : (
            <div className="space-y-2">
              {campaign.runs.map((run) => (
                <Card key={run.id} className="p-3 glass-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className={cn("text-[10px]", {
                        queued: "bg-bg-subtle text-text-muted", running: "bg-accent-soft text-accent",
                        completed: "bg-accent-soft text-accent", failed: "bg-danger-soft text-danger",
                      }[run.status])} variant="default">{run.status}</Badge>
                      <span className="text-xs text-text-muted ml-2">{run.recipientCount} recipients</span>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {run.startedAt ? new Date(run.startedAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
