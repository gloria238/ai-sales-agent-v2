"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TEMPLATES: Array<{ slug: string; name: string; desc: string; category: string }> = [
  { slug: "saas-cold-outreach", name: "SaaS Cold Outreach — SPIN Method", desc: "4-step cold email sequence for SaaS founders.", category: "cold_outreach" },
  { slug: "b2b-follow-up", name: "B2B Follow-Up Sequence", desc: "3-step follow-up after initial contact.", category: "follow_up" },
  { slug: "re-engagement", name: "Re-engagement Campaign", desc: "3-step re-engagement for cold leads.", category: "re_engagement" },
];

export function ScriptListClient({ scripts, orgSlug }: { scripts: any[]; orgSlug: string }) {
  const router = useRouter();
  const [installing, setInstalling] = useState<string | null>(null);

  async function handleInstall(slug: string) {
    setInstalling(slug);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/scripts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) { toast.success("Script installed"); router.refresh(); }
      else { toast.error("Failed to install script"); }
    } finally { setInstalling(null); }
  }

  const installedSlugs = new Set<string>(scripts.map((s: any) => {
    if (s.name.includes("Cold Outreach")) return "saas-cold-outreach";
    if (s.name.includes("Follow-Up")) return "b2b-follow-up";
    if (s.name.includes("Re-engagement")) return "re-engagement";
    return "";
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">话术脚本</h1>
          <p className="text-sm text-text-muted mt-1">Pre-built sales playbook scripts and AI-generated sequences.</p>
        </div>
        <Button onClick={() => router.push(`/scripts/new`)}><Sparkles className="w-4 h-4 mr-2" />AI Generate Script</Button>
      </div>
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Template Marketplace</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {TEMPLATES.map((t) => {
          const installed = installedSlugs.has(t.slug);
          return (
            <Card key={t.slug} className="p-5 glass-card">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3"><FileText className="w-5 h-5 text-accent" /></div>
              <h3 className="font-semibold text-text text-sm mb-1">{t.name}</h3>
              <p className="text-xs text-text-muted mb-4">{t.desc}</p>
              <Button variant={installed ? "outline" : "default"} size="sm" className="w-full" loading={installing===t.slug} disabled={installed} onClick={()=>handleInstall(t.slug)}>
                {installed ? <><Download className="w-3 h-3 mr-1"/>Installed</> : <><Download className="w-3 h-3 mr-1"/>Install</>}
              </Button>
            </Card>
          );
        })}
      </div>
      {scripts.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Installed Scripts</h2>
          <div className="space-y-2">
            {scripts.map((s) => (
              <Card key={s.id} className="p-4 glass-card hover:shadow-panel-md transition-all cursor-pointer" onClick={() => router.push(`/scripts/${s.id}`)}>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-accent" />
                  <div>
                    <h4 className="font-medium text-text text-sm">{s.name}</h4>
                    <p className="text-xs text-text-muted">{s.description || `${(s.steps as any[])?.length || 0} steps`}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
