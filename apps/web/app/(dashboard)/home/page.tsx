import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkerStatusCard } from "../worker-status-card";
import { OnboardingCard } from "../onboarding-card";
import { ArrowRight, MessageSquare, Users, Bot, Zap, CheckCircle, TrendingUp, Plus, Send, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) redirect("/login");

  const [
    conversationCount, leadCount, agentCount,
    activeConversations, needsReply, todayTotal,
    qualifiedLeads, activeCampaigns,
    leadsByStage,
  ] = await Promise.all([
    prisma.conversation.count({ where: { organizationId: org.id } }),
    prisma.lead.count({ where: { organizationId: org.id } }),
    prisma.agent.count({ where: { organizationId: org.id } }),
    prisma.conversation.count({ where: { organizationId: org.id, status: "active" } }),
    prisma.conversation.count({
      where: {
        organizationId: org.id, status: "active",
        messages: { some: { direction: "inbound", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      },
    }),
    prisma.conversation.count({
      where: { organizationId: org.id, updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.lead.count({ where: { organizationId: org.id, score: { gte: 70 } } }),
    prisma.campaign.count({ where: { organizationId: org.id, status: "active" } }),
    prisma.lead.groupBy({ by: ["stage"], where: { organizationId: org.id }, _count: true }),
  ]);

  const stageMap = Object.fromEntries(leadsByStage.map((s) => [s.stage ?? "new", s._count]));
  const stages = [
    { key: "new", label: "New", color: "#94a3b8" },
    { key: "contacted", label: "Contacted", color: "#6366f1" },
    { key: "qualified", label: "Qualified", color: "#3b82f6" },
    { key: "proposal", label: "Proposal", color: "#f59e0b" },
    { key: "negotiation", label: "Negotiation", color: "#f97316" },
    { key: "closed_won", label: "Won", color: "#10b981" },
    { key: "closed_lost", label: "Lost", color: "#ef4444" },
  ];
  const maxStageCount = Math.max(1, ...stages.map((s) => stageMap[s.key] ?? 0));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-slide-up">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {session.name?.split(" ")[0] || "there"}</h1>
          <p className="text-sm text-text-secondary mt-1">Your AI sales team is working.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/agents" className="inline-flex items-center gap-2 rounded-xl bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent-hover transition-colors duration-200 shadow-sm shadow-accent/25">
            <Plus className="size-4" /> New Agent
          </Link>
          <Link href="/campaigns" className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card text-text-secondary text-sm font-medium px-4 py-2.5 hover:bg-bg-subtle transition-colors duration-200">
            <Zap className="size-4" /> Campaigns
          </Link>
          <Link href="/inbox" className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card text-text-secondary text-sm font-medium px-4 py-2.5 hover:bg-bg-subtle transition-colors duration-200">
            <MessageSquare className="size-4" /> Inbox
          </Link>
        </div>
      </div>

      <OnboardingCard show={agentCount === 0 && leadCount === 0} orgSlug={session.orgSlug} />

      {/* AI Team Status — staff overview */}
      <div className="flex items-center gap-4">
        <div className="flex -space-x-2">
          {["Inbound SDR", "Outbound Closer", "Enterprise Agent"].map((name, i) => (
            <div key={name} className="size-9 rounded-full bg-accent-soft border-2 border-bg flex items-center justify-center shrink-0 relative group cursor-pointer" title={name}>
              <Bot className="size-4 text-accent" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-accent border-2 border-bg agent-active" />
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-accent flex items-center gap-1.5">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full size-1.5 bg-accent" />
            </span>
            {agentCount} agents active
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">handling {activeConversations} conversations</p>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1"><CheckCircle className="size-3 text-success" /> {needsReply} need reply</span>
          <span className="flex items-center gap-1"><TrendingUp className="size-3 text-accent" /> {qualifiedLeads} qualified</span>
        </div>
      </div>

      {/* Activity Feed — main content */}
      <div>
        <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          Activity
          <span className="relative flex size-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full size-1.5 bg-accent" />
          </span>
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-1">
            {[
              { icon: Bot, text: "AI replied to", highlight: "Alice Chen", time: "2 min ago", meta: "Inbound SDR · auto-sent", color: "border-l-accent" },
              { icon: TrendingUp, text: "Lead qualified:", highlight: "Bob Martinez → 87 (Hot)", time: "8 min ago", meta: "Intent: high · Budget: confirmed", color: "border-l-green-400" },
              { icon: Send, text: "Campaign email sent to", highlight: "12 leads", time: "15 min ago", meta: "SaaS Founder Q2 Outreach · step 2/4", color: "border-l-accent" },
              { icon: CheckCircle, text: "Meeting booked with", highlight: "Carol Davis", time: "22 min ago", meta: "Outbound Closer · Thursday 2pm", color: "border-l-green-400" },
              { icon: MessageSquare, text: "New inbound message from", highlight: "David Kim", time: "31 min ago", meta: "SaaSFast · asking about pricing", color: "border-l-blue-400" },
              { icon: Bot, text: "AI escalated to human:", highlight: "Eva Johansson", time: "45 min ago", meta: "Enterprise deal · needs approval", color: "border-l-amber-400" },
              { icon: RefreshCw, text: "Campaign retry:", highlight: "3 bounced emails recovered", time: "1 hour ago", meta: "Re-engagement campaign", color: "border-l-amber-400" },
            ].map((item, i) => (
              <div key={i} className={cn("glass-card p-3 border-l-2 flex items-center gap-3 cursor-pointer hover:border-accent/40 transition-all", item.color)}>
                <div className="size-8 rounded-lg bg-bg-subtle flex items-center justify-center shrink-0">
                  <item.icon className="size-3.5 text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-secondary truncate">
                    {item.text} <span className="font-semibold text-text">{item.highlight}</span>
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">{item.meta}</p>
                </div>
                <span className="text-[10px] text-text-muted shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text">Worker Health</h3>
          <WorkerStatusCard orgSlug={org.slug} />
        </div>
      </div>

      {/* Lead pipeline chart */}
      {leadCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-text-muted" />
            <h3 className="text-sm font-semibold text-text">Lead Pipeline</h3>
          </div>
          <div className="glass-card p-6">
            <div className="space-y-3">
              {stages.map((stage) => {
                const count = stageMap[stage.key] ?? 0;
                const width = (count / maxStageCount) * 100;
                return (
                  <div key={stage.key} className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary w-24 shrink-0">{stage.label}</span>
                    <div className="flex-1 h-7 bg-bg-subtle rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.max(width, count > 0 ? 6 : 0)}%`, backgroundColor: stage.color, opacity: count > 0 ? 1 : 0.2 }} />
                    </div>
                    <span className="text-sm font-semibold text-text w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {leadCount === 0 && agentCount === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="size-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
            <Bot className="size-8 text-accent opacity-60" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">Ready to deploy your AI SDR?</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
            Create your first AI agent, import leads, and launch an outbound campaign.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/agents" className="rounded-xl bg-accent text-white text-sm font-medium px-5 py-2.5 hover:bg-accent-hover transition-colors duration-200">
              Create Agent
            </Link>
            <Link href="/leads" className="rounded-xl border border-border text-text-secondary text-sm font-medium px-5 py-2.5 hover:bg-bg-subtle transition-colors duration-200">
              Import Leads
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
