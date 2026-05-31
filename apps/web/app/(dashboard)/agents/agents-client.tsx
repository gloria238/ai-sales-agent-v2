"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Bot, Plus, Settings, MessageSquare, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Agent = {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  isActive: boolean;
  _count: { conversations: number; campaigns: number };
};

export function AgentListClient({ agents, orgSlug }: { agents: Agent[]; orgSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          personality: form.get("personality"),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Agent created");
        setOpen(false);
        router.push(`/agents/${data.agent.id}`);
        router.refresh();
      } else {
        toast.error("Failed to create agent");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">AI SDR Agents</h1>
          <p className="text-sm text-text-muted mt-1">Configure AI sales agents with personality, knowledge, and goals.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <h2 className="text-lg font-semibold text-text mb-4">Create AI SDR Agent</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input name="name" placeholder="Agent name (e.g. Inbound SDR)" required />
              <Input name="description" placeholder="Short description" />
              <Textarea name="personality" placeholder="Personality (e.g. Friendly, consultative B2B SDR with 10 years experience...)" rows={4} />
              <Button type="submit" loading={loading} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <Card className="p-12 text-center glass-card">
          <Bot className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
          <h3 className="text-lg font-medium text-text mb-1">No agents yet</h3>
          <p className="text-sm text-text-muted mb-4">Create your first AI SDR agent to start handling conversations.</p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Agent
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => router.push(`/agents/${agent.id}`)}
              className="text-left"
            >
              <Card className="p-5 glass-card hover:shadow-panel-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-accent" />
                  </div>
                  <Badge variant={agent.isActive ? "default" : "warning"} className="text-[10px]">
                    {agent.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-text mb-1">{agent.name}</h3>
                <p className="text-xs text-text-muted line-clamp-2 mb-3">
                  {agent.description || "No description"}
                </p>
                <div className="flex gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {agent._count.conversations} conversations
                  </span>
                  <span className="flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    {agent._count.campaigns} campaigns
                  </span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
