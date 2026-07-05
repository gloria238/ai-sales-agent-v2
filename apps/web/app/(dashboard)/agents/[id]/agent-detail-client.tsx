"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Bot, MessageSquare, Send, Settings, Save } from "lucide-react";
import { toast } from "sonner";

type Agent = {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  goals: any;
  knowledgeBase: any;
  isActive: boolean;
  conversations: Array<{ id: string; subject: string | null; status: string; updatedAt: string }>;
  campaigns: Array<{ id: string; name: string; status: string }>;
};

export function AgentDetailClient({ agent, orgSlug }: { agent: Agent; orgSlug: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description || "");
  const [personality, setPersonality] = useState(agent.personality || "");

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, personality }),
      });
      if (res.ok) {
        toast.success("Agent updated");
        setEditing(false);
        router.refresh();
      } else {
        toast.error("Failed to update agent");
      }
    } finally {
      setSaving(false);
    }
  }

  const goals = Array.isArray(agent.goals) ? agent.goals : [];
  const kb = agent.knowledgeBase || {};

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => router.push("/agents")} className="flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Agents
      </button>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Bot className="w-7 h-7 text-accent" />
          </div>
          <div>
            {editing ? (
              <Input value={name} onChange={(e) => setName(e.target.value)} className="text-2xl font-bold mb-1" />
            ) : (
              <h1 className="text-2xl font-bold text-text">{agent.name}</h1>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={agent.isActive ? "default" : "warning"} className="text-[10px]">
                {agent.isActive ? "Active" : "Paused"}
              </Badge>
              <span className="text-sm text-text-muted">{agent.conversations.length} conversations · {agent.campaigns.length} campaigns</span>
            </div>
          </div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}><Save className="w-4 h-4 mr-2" />Save</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}><Settings className="w-4 h-4 mr-2" />编辑</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 glass-card">
            <h2 className="font-semibold text-text mb-3">Personality</h2>
            {editing ? (
              <Textarea value={personality} onChange={(e) => setPersonality(e.target.value)} rows={4} />
            ) : (
              <p className="text-sm text-text-muted leading-relaxed">{agent.personality || "No personality configured"}</p>
            )}
          </Card>

          <Card className="p-5 glass-card">
            <h2 className="font-semibold text-text mb-3">Description</h2>
            {editing ? (
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            ) : (
              <p className="text-sm text-text-muted">{agent.description || "No description"}</p>
            )}
          </Card>

          <Card className="p-5 glass-card">
            <h2 className="font-semibold text-text mb-3">Goals ({goals.length})</h2>
            {goals.length === 0 ? (
              <p className="text-sm text-text-muted">No goals configured</p>
            ) : (
              <div className="space-y-2">
                {goals.map((g: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="default" className="text-[10px]">{g.type || g.priority || `Goal ${i + 1}`}</Badge>
                    <span className="text-text-muted">{g.successCriteria || JSON.stringify(g)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 glass-card">
            <h2 className="font-semibold text-text mb-3">Knowledge Base</h2>
            {Object.keys(kb).length === 0 ? (
              <p className="text-sm text-text-muted">No knowledge base configured</p>
            ) : (
              <dl className="space-y-2 text-sm">
                {Object.entries(kb).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-text-muted text-xs uppercase tracking-wide">{key}</dt>
                    <dd className="text-text">{typeof value === "string" ? value.substring(0, 100) : JSON.stringify(value).substring(0, 100)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card className="p-5 glass-card">
            <h2 className="font-semibold text-text mb-3">Recent Conversations</h2>
            {agent.conversations.length === 0 ? (
              <p className="text-sm text-text-muted">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {agent.conversations.map((c) => (
                  <button key={c.id} onClick={() => router.push(`/inbox`)} className="w-full text-left p-2 rounded-lg hover:bg-bg-subtle transition-colors">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-sm text-text truncate">{c.subject || "No subject"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 glass-card">
            <h2 className="font-semibold text-text mb-3">Linked Campaigns</h2>
            {agent.campaigns.length === 0 ? (
              <p className="text-sm text-text-muted">No campaigns linked</p>
            ) : (
              <div className="space-y-2">
                {agent.campaigns.map((c) => (
                  <button key={c.id} onClick={() => router.push(`/campaigns/${c.id}`)} className="w-full text-left p-2 rounded-lg hover:bg-bg-subtle transition-colors">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-sm text-text">{c.name}</span>
                      <Badge variant="default" className="text-[10px] ml-auto">{c.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
