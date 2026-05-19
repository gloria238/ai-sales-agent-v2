import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkerStatusCard } from "../worker-status-card";
import { OnboardingCard } from "../onboarding-card";
import { ArrowRight, MessageSquare, Users, Bot, Zap, CheckCircle, TrendingUp, Plus } from "lucide-react";

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
          <h1 className="text-2xl font-bold tracking-tight text-text">{org.name}</h1>
          <p className="text-sm text-text-secondary mt-1">Monitor AI SDR performance, leads, and campaign health.</p>
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

      {/* Bento Grid — SDR metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/inbox" className="group">
          <div className="glass-card p-5 h-full cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="size-11 rounded-2xl bg-accent-soft flex items-center justify-center">
                <MessageSquare className="size-5 text-accent" />
              </div>
              <ArrowRight className="size-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-text">{activeConversations}</p>
            <p className="text-sm text-text-secondary mt-1">Active Conversations</p>
          </div>
        </Link>

        <Link href="/leads" className="group">
          <div className="glass-card p-5 h-full cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="size-11 rounded-2xl bg-success-soft flex items-center justify-center">
                <Users className="size-5 text-success" />
              </div>
              <ArrowRight className="size-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-text">{qualifiedLeads}</p>
            <p className="text-sm text-text-secondary mt-1">Qualified Leads</p>
          </div>
        </Link>

        <Link href="/agents" className="group">
          <div className="glass-card p-5 h-full cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="size-11 rounded-2xl bg-bg-subtle flex items-center justify-center">
                <Bot className="size-5 text-text-secondary" />
              </div>
              <ArrowRight className="size-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-text">{agentCount}</p>
            <p className="text-sm text-text-secondary mt-1">AI Agents</p>
          </div>
        </Link>
      </div>

      {/* SDR health — 4 mini cards */}
      {(conversationCount > 0 || activeCampaigns > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: MessageSquare, label: "Needs Reply", count: needsReply, color: "text-danger", bg: "bg-danger-soft" },
            { icon: CheckCircle, label: "Response Rate", count: `${activeConversations > 0 ? Math.round((activeConversations - needsReply) / activeConversations * 100) : 100}%`, color: "text-success", bg: "bg-success-soft" },
            { icon: Zap, label: "Today's Activity", count: todayTotal, color: "text-accent", bg: "bg-accent-soft" },
            { icon: TrendingUp, label: "Active Campaigns", count: activeCampaigns, color: "text-warning", bg: "bg-warning-soft" },
          ].map(({ icon: Icon, label, count, color, bg }) => (
            <div key={label} className="glass-card p-4 flex items-center gap-3">
              <div className={`size-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`size-4 ${color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-text">{count}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-column: Activity feed + Worker health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-accent" />
            <h3 className="text-sm font-semibold text-text">Live Activity</h3>
            <span className="relative flex size-1.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full size-1.5 bg-accent" />
            </span>
          </div>
          <div className="space-y-1.5">
            {[
              { icon: "🤖", text: "AI qualified lead from", highlight: "Stripe integration", time: "2 min ago", color: "border-l-accent" },
              { icon: "📅", text: "Meeting booked via", highlight: "follow-up sequence #3", time: "8 min ago", color: "border-l-green-400" },
              { icon: "📨", text: "Campaign", highlight: "SaaS Founder Q2 Outreach", time: "15 min ago", sub: " — 12 emails sent", color: "border-l-blue-400" },
              { icon: "🔄", text: "Campaign retry executed for", highlight: "3 bounced emails", time: "22 min ago", color: "border-l-amber-400" },
              { icon: "⭐", text: "Lead score updated:", highlight: "Alice Chen → 87 (Hot)", time: "31 min ago", color: "border-l-red-400" },
              { icon: "✉️", text: "AI draft approved by", highlight: "Sarah (Admin)", time: "45 min ago", sub: " — reply sent to Bob Martinez", color: "border-l-accent" },
              { icon: "🎯", text: "New lead created:", highlight: "David Kim · SaaSFast", time: "1 hour ago", color: "border-l-green-400" },
            ].map((item, i) => (
              <div key={i} className={cn("glass-card p-3 border-l-2 flex items-center gap-3", item.color)}>
                <span className="text-sm shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-secondary truncate">
                    {item.text} <span className="font-medium text-text">{item.highlight}</span>
                    {item.sub && <span className="text-text-muted">{item.sub}</span>}
                  </p>
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
