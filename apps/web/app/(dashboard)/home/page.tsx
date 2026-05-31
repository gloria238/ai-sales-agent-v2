import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OnboardingCard } from "../onboarding-card";
import { ActivityFeed } from "./activity-feed";
import { DonutChart } from "./donut-chart";
import { MessageSquare, Bot, Zap, Plus, Send, Sparkles, Target } from "lucide-react";

const AVG_DEAL_SIZE = 5000;

export default async function DashboardHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) redirect("/login");

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const leadCount = await prisma.lead.count({ where: { organizationId: org.id } });
  const agentCount = await prisma.agent.count({ where: { organizationId: org.id } });
  const activeConversations = await prisma.conversation.count({ where: { organizationId: org.id, status: "active" } });
  const activeCampaigns = await prisma.campaign.count({ where: { organizationId: org.id, status: "active" } });
  const leadsByStage = await prisma.lead.groupBy({ by: ["stage"], where: { organizationId: org.id }, _count: true });
  const meetingsThisMonth = await prisma.leadActivity.count({ where: { lead: { organizationId: org.id }, type: "meeting_booked", createdAt: { gte: startOfMonth } } });
  const campaigns = await prisma.campaign.findMany({ where: { organizationId: org.id, status: { not: "draft" } }, select: { stats: true } });
  const aiMessageCount = await prisma.message.count({ where: { conversation: { organizationId: org.id }, direction: "outbound", aiMetadata: { not: undefined as any } } });
  const totalOutbound = await prisma.message.count({ where: { conversation: { organizationId: org.id }, direction: "outbound" } });

  const stageMap = Object.fromEntries(leadsByStage.map((s) => [s.stage ?? "new", s._count]));
  const pipelineCount = (stageMap.qualified || 0) + (stageMap.proposal || 0) + (stageMap.negotiation || 0);
  const estimatedRevenue = pipelineCount * AVG_DEAL_SIZE;
  const wonThisMonth = stageMap.closed_won || 0;

  let hotLeads = 0, warmLeads = 0;
  for (const [stage, count] of Object.entries(stageMap)) {
    if (stage === "qualified" || stage === "proposal" || stage === "negotiation" || stage === "closed_won") hotLeads += count;
    else if (stage === "contacted") warmLeads += count;
  }
  const coldLeads = leadCount - hotLeads - warmLeads;
  const scoreDonut = [
    { label: "Hot", value: hotLeads, color: "#34d399" },
    { label: "Warm", value: warmLeads, color: "#60a5fa" },
    { label: "Cold", value: coldLeads, color: "#94a3b8" },
  ].filter(s => s.value > 0);

  const pipelineDonut = [
    { label: "New", value: stageMap.new || 0, color: "#94a3b8" },
    { label: "Contacted", value: stageMap.contacted || 0, color: "#818cf8" },
    { label: "Qualified", value: stageMap.qualified || 0, color: "#60a5fa" },
    { label: "Proposal", value: stageMap.proposal || 0, color: "#fbbf24" },
    { label: "Won", value: stageMap.closed_won || 0, color: "#34d399" },
  ].filter(s => s.value > 0);

  let totalSent = 0, totalOpened = 0, totalReplied = 0;
  for (const c of campaigns) { const s = (c.stats || {}) as Record<string, number>; totalSent += s.sent || 0; totalOpened += s.opened || 0; totalReplied += s.replied || 0; }
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : null;
  const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : null;
  const aiResponseRate = totalOutbound > 0 ? ((aiMessageCount / totalOutbound) * 100).toFixed(0) : null;

  if (leadCount === 0 && agentCount === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <OnboardingCard show={true} orgSlug={session.orgSlug} />
          <div className="mt-6 rounded-xl border border-border bg-bg-card p-8">
            <div className="size-12 rounded-xl bg-gradient-to-br from-accent to-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-md shadow-accent/20">
              <Bot className="size-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-text mb-2">Deploy your AI sales team</h3>
            <p className="text-sm text-text-secondary mb-5">Create an agent, import leads, launch a campaign. AI qualifies leads and books meetings 24/7.</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/agents" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent-hover transition-colors shadow-sm shadow-accent/20">Create Agent</Link>
              <Link href="/leads" className="rounded-lg border border-border text-text-secondary text-sm font-medium px-4 py-2.5 hover:bg-bg-subtle transition-colors">Import Leads</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-4 py-3 lg:px-6 lg:py-4">

      {/* ── Header ─────────────────────────── */}
      <div className="flex items-end justify-between shrink-0 mb-3">
        <div>
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.15em]">Overview</p>
          <h1 className="text-lg font-bold tracking-tight text-text">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {session.name?.split(" ")[0] || "there"}.
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/agents" className="inline-flex items-center gap-1 rounded-md bg-accent text-white text-xs font-medium px-2.5 py-1.5 hover:bg-accent-hover transition-colors shadow-sm shadow-accent/20">
            <Plus className="size-3" /> New Agent
          </Link>
          <Link href="/campaigns/new" className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-card text-text-secondary text-xs font-medium px-2.5 py-1.5 hover:bg-bg-subtle transition-colors">
            <Zap className="size-3" /> Campaign
          </Link>
          <Link href="/inbox" className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-card text-text-secondary text-xs font-medium px-2.5 py-1.5 hover:bg-bg-subtle transition-colors">
            <MessageSquare className="size-3" /> Inbox
          </Link>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────── */}
      <div className="grid grid-cols-4 gap-2.5 shrink-0 mb-3">
        {[
          { label: "Pipeline", value: `$${(estimatedRevenue / 1000).toFixed(1)}k`, sub: `${pipelineCount} deals`, icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Meetings", value: meetingsThisMonth, sub: "This month", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Reply Rate", value: replyRate ? `${replyRate}%` : "—", sub: totalSent > 0 ? `${totalReplied}/${totalSent}` : "No campaigns", icon: Send, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "AI Replies", value: aiResponseRate ? `${aiResponseRate}%` : "—", sub: aiMessageCount > 0 ? `${aiMessageCount} auto` : "Activate agent", icon: Bot, color: "text-accent", bg: "bg-accent/10" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-bg-card px-3 py-2.5 hover:border-accent/20 transition-colors cursor-pointer">
            <div className={`size-7 rounded-md ${card.bg} flex items-center justify-center mb-1.5`}>
              <card.icon className={`size-3.5 ${card.color}`} />
            </div>
            <p className="text-[10px] font-medium text-text-muted">{card.label}</p>
            <p className="text-xl font-bold text-text tracking-tight">{card.value}</p>
            <p className="text-[10px] text-text-muted">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Body: 3-column ────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2.5 min-h-0">

        {/* ── Left: Activity ─────────────── */}
        <div className="rounded-lg border border-border bg-bg-card flex flex-col min-h-0">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border shrink-0">
            <span className="relative flex size-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" /><span className="relative inline-flex rounded-full size-1.5 bg-accent" /></span>
            <h2 className="text-xs font-semibold text-text">Activity</h2>
          </div>
          <div className="flex-1 overflow-hidden p-1.5">
            <ActivityFeed orgSlug={session.orgSlug} />
          </div>
        </div>

        {/* ── Right: Charts (2 cols) ─────── */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-2.5 min-h-0">
          {/* Lead Quality + Pipeline side by side */}
          <div className="rounded-lg border border-border bg-bg-card p-3 flex flex-col justify-center">
            <h3 className="text-xs font-semibold text-text mb-0.5">Lead Quality</h3>
            <p className="text-[10px] text-text-muted mb-2">{leadCount} leads</p>
            {scoreDonut.length > 0 ? (
              <div className="flex items-center gap-3 flex-1">
                <div className="w-[88px] h-[88px] shrink-0">
                  <DonutChart segments={scoreDonut} size={88} thickness={20} />
                </div>
                <div className="space-y-1 flex-1">
                  {scoreDonut.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
                      <span className="size-2 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-text-secondary">{s.label}</span>
                      <span className="font-semibold text-text ml-auto">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-xs text-text-muted text-center flex-1 flex items-center justify-center">Score leads to see breakdown</p>}
          </div>

          <div className="rounded-lg border border-border bg-bg-card p-3 flex flex-col justify-center">
            <h3 className="text-xs font-semibold text-text mb-0.5">Pipeline</h3>
            <p className="text-[10px] text-text-muted mb-2">{leadCount} leads · {wonThisMonth} won</p>
            {pipelineDonut.length > 0 ? (
              <div className="flex items-center gap-3 flex-1">
                <div className="w-[88px] h-[88px] shrink-0">
                  <DonutChart segments={pipelineDonut} size={88} thickness={20} />
                </div>
                <div className="space-y-1 flex-1">
                  {pipelineDonut.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
                      <span className="size-2 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-text-secondary">{s.label}</span>
                      <span className="font-semibold text-text ml-auto">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-xs text-text-muted text-center flex-1 flex items-center justify-center">Add leads to see pipeline</p>}
          </div>

          {/* Campaign reach + Quick stats row */}
          <div className="rounded-lg border border-border bg-bg-card p-3 col-span-2">
            <h3 className="text-xs font-semibold text-text mb-1">Campaign Reach</h3>
            <p className="text-[10px] text-text-muted mb-2">
              {totalSent > 0
                ? `${totalSent} emails · ${activeCampaigns} active campaign${activeCampaigns !== 1 ? "s" : ""}`
                : "Launch a campaign to see reach data"}
            </p>
            {totalSent > 0 ? (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: "Sent", val: totalSent, pct: null, color: "bg-slate-400" },
                  { label: "Opened", val: totalOpened, pct: openRate, color: "bg-blue-400" },
                  { label: "Replied", val: totalReplied, pct: replyRate, color: "bg-emerald-400" },
                ].map((bar) => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-text-muted font-medium">{bar.label}</span>
                      <span className="text-text-secondary tabular-nums font-semibold">{bar.val}{bar.pct != null ? <span className="text-text-muted font-normal"> {bar.pct}%</span> : ""}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
                      <div className={`h-full rounded-full ${bar.color} transition-all duration-700`} style={{ width: `${Math.max(2, (bar.val / (totalSent || 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { val: agentCount, label: "Agents" },
                { val: leadCount, label: "Leads" },
                { val: activeCampaigns, label: "Campaigns" },
                { val: activeConversations, label: "Threads" },
              ].map((s) => (
                <div key={s.label} className="rounded-md bg-bg-subtle py-1.5">
                  <p className="text-sm font-bold text-text">{s.val}</p>
                  <p className="text-[9px] text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
