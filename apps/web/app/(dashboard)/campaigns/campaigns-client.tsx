"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Plus, Play, BarChart3 } from "lucide-react";
import { toast } from "sonner";

type Campaign = {
  id: string; name: string; description: string | null; status: string;
  stats: any; script: { id: string; name: string } | null;
  agent: { id: string; name: string } | null; _count: { runs: number };
};

export function CampaignListClient({ campaigns, orgSlug }: { campaigns: Campaign[]; orgSlug: string }) {
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);

  async function handleStart(campaignId: string) {
    setStarting(campaignId);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/campaigns/${campaignId}/start`, { method: "POST" });
      if (res.ok) { toast.success("Campaign started"); router.refresh(); }
      else { const data = await res.json(); toast.error(data.error || "Failed to start"); }
    } finally { setStarting(null); }
  }

  const statusBadge = (s: string) => ({
    draft: "bg-bg-card text-text-muted", active: "bg-green-500/10 text-green-400 border-green-500/20",
    paused: "bg-amber-500/10 text-amber-400 border-amber-500/20", completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  }[s] || "bg-bg-card text-text-muted");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Outbound Campaigns</h1>
          <p className="text-sm text-text-muted mt-1">Create and manage outbound email sequences with AI personalization.</p>
        </div>
        <Button onClick={() => router.push(`/campaigns/new`)}><Plus className="w-4 h-4 mr-2" />New Campaign</Button>
      </div>
      {campaigns.length === 0 ? (
        <Card className="p-12 text-center glass-card">
          <Send className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
          <h3 className="text-lg font-medium text-text mb-1">No campaigns yet</h3>
          <p className="text-sm text-text-muted mb-4">Create your first outbound campaign with AI-personalized email sequences.</p>
          <Button onClick={() => router.push(`/campaigns/new`)}><Plus className="w-4 h-4 mr-2" />Create Campaign</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="p-5 glass-card hover:shadow-panel-md transition-all cursor-pointer" onClick={() => router.push(`/campaigns/${c.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Send className="w-5 h-5 text-accent" /></div>
                  <div>
                    <h3 className="font-semibold text-text">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={cn("text-[10px]", statusBadge(c.status))} variant="default">{c.status}</Badge>
                      {c.script && <span className="text-xs text-text-muted">Script: {c.script.name}</span>}
                      {c.agent && <span className="text-xs text-text-muted">Agent: {c.agent.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {c.stats && <div className="hidden md:flex gap-3 text-xs text-text-muted"><span>Sent: {c.stats.sent||0}</span><span>Opened: {c.stats.opened||0}</span><span>Replied: {c.stats.replied||0}</span></div>}
                  {c.status === "draft" && <Button size="sm" variant="outline" loading={starting===c.id} onClick={(ev)=>{ev.stopPropagation();handleStart(c.id)}}><Play className="w-3 h-3 mr-1"/>Start</Button>}
                  {c.status === "active" && <Button size="sm" variant="outline" onClick={(ev)=>{ev.stopPropagation();router.push(`/campaigns/${c.id}`)}}><BarChart3 className="w-3 h-3 mr-1"/>View</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
