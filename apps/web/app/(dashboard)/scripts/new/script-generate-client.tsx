"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";

export function ScriptGenerateClient({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/ai/generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, industry: "SaaS", targetPersona: "Founder/CEO", goal: "Book demo" }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.script || data);
        toast.success("Script generated");
      } else {
        toast.error("Failed to generate script");
      }
    } catch {
      toast.error("AI generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleInstall() {
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/scripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "saas-cold-outreach" }),
      });
      if (res.ok) {
        toast.success("Script installed");
        router.push("/scripts");
      } else {
        toast.error("Failed to install script");
      }
    } catch {
      toast.error("Installation failed");
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.push("/scripts")} className="flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Scripts
      </button>
      <h1 className="text-2xl font-bold text-text mb-6">AI Script Generator</h1>
      <Card className="p-6 rounded-md border border-border bg-bg-card">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-4">
              Describe your target audience, industry, and goal. The AI will generate a complete sales playbook with sequenced steps, subject lines, and templates.
            </p>
            <Textarea
              placeholder="e.g. Generate a cold outbound campaign for SaaS founders who just raised Series A. Focus on the pain of scaling sales without a big team."
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerate} loading={loading} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />Generate Script
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="p-6 rounded-md border border-border bg-bg-card mt-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-accent" />
            <div>
              <h2 className="font-semibold text-text">{result.name || "Generated Script"}</h2>
              <p className="text-xs text-text-muted">{result.steps?.length || 0} steps</p>
            </div>
          </div>
          {result.steps && (
            <div className="space-y-2 mb-4">
              {result.steps.map((step: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-bg-subtle/50 text-sm">
                  <span className="font-medium text-text">Step {i + 1}:</span>{" "}
                  <span className="text-text-muted">{step.subject || step.template?.substring(0, 80) || step.type}</span>
                </div>
              ))}
            </div>
          )}
          {result.bestPractices && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase mb-1">Best Practices</h3>
              <ul className="text-xs text-text-muted space-y-0.5">
                {result.bestPractices.map((bp: string, i: number) => <li key={i}>- {bp}</li>)}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setResult(null)}>Discard</Button>
            <Button onClick={handleInstall}><Sparkles className="w-4 h-4 mr-2" />Install Script</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
