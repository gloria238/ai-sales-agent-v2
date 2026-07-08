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

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿", active: "进行中", paused: "已暂停", completed: "已完成",
};

export function CampaignListClient({ campaigns, orgSlug }: { campaigns: Campaign[]; orgSlug: string }) {
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);

  async function handleStart(campaignId: string) {
    setStarting(campaignId);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/campaigns/${campaignId}/start`, { method: "POST" });
      if (res.ok) { toast.success("活动已启动"); router.refresh(); }
      else { const data = await res.json(); toast.error(data.error || "启动失败"); }
    } finally { setStarting(null); }
  }

  const statusBadge = (s: string) => ({
    draft: "bg-bg-subtle text-text-muted", active: "bg-primary/10 text-primary border-primary/20",
    paused: "bg-warning/10 text-warning border-warning/20", completed: "bg-bg-subtle text-text-secondary border-lp-border/20",
  }[s] || "bg-bg-subtle text-text-muted");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">外呼活动</h1>
          <p className="text-sm text-text-muted mt-1">创建和管理 AI 个性化邮件外呼序列，自动化客户触达。</p>
        </div>
        <Button onClick={() => router.push("/campaigns/new")}><Plus className="w-4 h-4 mr-2" />新建活动</Button>
      </div>
      {campaigns.length === 0 ? (
        <Card className="p-12 text-center rounded-md border border-border bg-bg-card">
          <Send className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
          <h3 className="text-lg font-medium text-text mb-1">暂无外呼活动</h3>
          <p className="text-sm text-text-muted mb-4">创建第一个 AI 个性化外呼活动，让 AI 自动跟进客户。</p>
          <Button onClick={() => router.push("/campaigns/new")}><Plus className="w-4 h-4 mr-2" />创建活动</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="p-5 rounded-md border border-border bg-bg-card hover:shadow-panel-md transition-all cursor-pointer" onClick={() => router.push(`/campaigns/${c.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Send className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-text">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={cn("text-[10px]", statusBadge(c.status))} variant="default">{STATUS_LABELS[c.status] || c.status}</Badge>
                      {c.script && <span className="text-xs text-text-muted">话术：{c.script.name}</span>}
                      {c.agent && <span className="text-xs text-text-muted">坐席：{c.agent.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {c.stats && <div className="hidden md:flex gap-3 text-xs text-text-muted"><span>发送：{c.stats.sent||0}</span><span>打开：{c.stats.opened||0}</span><span>回复：{c.stats.replied||0}</span></div>}
                  {c.status === "draft" && <Button size="sm" variant="outline" loading={starting===c.id} onClick={(ev)=>{ev.stopPropagation();handleStart(c.id)}}><Play className="w-3 h-3 mr-1"/>启动</Button>}
                  {c.status === "active" && <Button size="sm" variant="outline" onClick={(ev)=>{ev.stopPropagation();router.push(`/campaigns/${c.id}`)}}><BarChart3 className="w-3 h-3 mr-1"/>查看</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
