"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Send, Clock, Mail, Bot } from "lucide-react";

type Script = {
  id: string; name: string; description: string | null; category: string;
  steps: any[]; campaigns: Array<{ id: string; name: string; status: string }>;
};

const CATEGORY_LABELS: Record<string, string> = {
  cold_outreach: "Cold Outreach", follow_up: "Follow-Up", re_engagement: "Re-engagement",
  demo_request: "Demo Request", objection_handling: "Objection Handling",
};

const STEP_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />, ai_email: <Bot className="w-4 h-4" />,
  delay: <Clock className="w-4 h-4" />,
};

export function ScriptDetailClient({ script, orgSlug }: { script: Script; orgSlug: string }) {
  const router = useRouter();
  const steps = Array.isArray(script.steps) ? script.steps : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.push("/scripts")} className="flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Scripts
      </button>
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center">
            <FileText className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">{script.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="text-[10px]">{CATEGORY_LABELS[script.category] || script.category}</Badge>
              <span className="text-sm text-text-muted">{steps.length} steps</span>
            </div>
          </div>
        </div>
        <Button onClick={() => router.push(`/campaigns/new`)}><Send className="w-4 h-4 mr-2" />Use in Campaign</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5 rounded-md border border-border bg-bg-card mb-6">
            <h2 className="font-semibold text-text mb-3">Sequence Steps</h2>
            {steps.length === 0 ? <p className="text-sm text-text-muted">No steps defined</p> : (
              <div className="space-y-3">
                {steps.map((step: any, i: number) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-bg-subtle/50">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      {STEP_ICONS[step.type] || <Send className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-text-muted uppercase">Step {i + 1}</span>
                        <Badge variant="default" className="text-[10px]">{step.type}</Badge>
                        {step.delay && step.delay !== "0d" && <span className="text-xs text-text-muted">Wait {step.delay}</span>}
                      </div>
                      {step.subject && <p className="text-sm font-medium text-text truncate">{step.subject}</p>}
                      {step.template && <p className="text-xs text-text-muted mt-1 line-clamp-2">{step.template}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 rounded-md border border-border bg-bg-card">
            <h2 className="font-semibold text-text mb-2">Description</h2>
            <p className="text-sm text-text-muted">{script.description || "No description"}</p>
          </Card>
          {script.campaigns.length > 0 && (
            <Card className="p-5 rounded-md border border-border bg-bg-card">
              <h2 className="font-semibold text-text mb-3">Used in Campaigns</h2>
              <div className="space-y-2">
                {script.campaigns.map((c) => (
                  <button key={c.id} onClick={() => router.push(`/campaigns/${c.id}`)} className="w-full text-left p-2 rounded-lg hover:bg-bg-subtle transition-colors">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-sm text-text">{c.name}</span>
                      <Badge variant="default" className="text-[10px] ml-auto">{c.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
