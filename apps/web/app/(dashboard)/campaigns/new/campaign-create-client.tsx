"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Save } from "lucide-react";
import { toast } from "sonner";

export function CampaignCreateClient({ agents, scripts, orgSlug }: { agents: Array<{ id: string; name: string }>; scripts: Array<{ id: string; name: string; category: string | null }>; orgSlug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", scriptId: "", agentId: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          scriptId: form.scriptId || null,
          agentId: form.agentId || null,
          targetAudience: {},
          schedule: {},
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("活动创建成功");
        router.push(`/campaigns/${data.campaign.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "创建失败");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.push("/campaigns")} className="flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回活动列表
      </button>
      <h1 className="text-2xl font-bold text-text mb-6">创建外呼活动</h1>
      <Card className="p-6 rounded-md border border-border bg-bg-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">活动名称</label>
            <Input name="name" placeholder="例如：Q3 企业客户拓展计划" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">活动描述</label>
            <Textarea name="description" placeholder="描述活动目标和目标客户群体…" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">AI 坐席</label>
              <select className="w-full h-10 rounded-lg border border-border bg-bg-card px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })}>
                <option value="">无（纯手动）</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">话术脚本</label>
              <select className="w-full h-10 rounded-lg border border-border bg-bg-card px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" value={form.scriptId} onChange={(e) => setForm({ ...form, scriptId: e.target.value })}>
                <option value="">无（AI 自动生成）</option>
                {scripts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.push("/campaigns")}>取消</Button>
            <Button type="submit" loading={loading}><Send className="w-4 h-4 mr-2" />创建活动</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
