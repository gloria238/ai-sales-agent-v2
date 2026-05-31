import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OnboardingCard } from "../onboarding-card";
import { ActivityFeed } from "./activity-feed";
import { DonutChart } from "./donut-chart";
import { MessageSquare, Bot, Zap, Plus, Send, ArrowUpRight, ArrowDownRight, Sparkles, Target } from "lucide-react";

const AVG_DEAL_SIZE = 5000;

export default async function DashboardHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) redirect("/login");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twentyFourHrsAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // ── Sequential queries — connection_limit=1 ──
  const leadCount = await prisma.lead.count({ where: { organizationId: org.id } });
  const agentCount = await prisma.agent.count({ where: { organizationId: org.id } });
  const activeConversations = await prisma.conversation.count({ where: { organizationId: org.id, status: "active" } });
  const activeCampaigns = await prisma.campaign.count({ where: { organizationId: org.id, status: "active" } });
  const leadsByStage = await prisma.lead.groupBy({ by: ["stage"], where: { organizationId: org.id }, _count: true });
  const meetingsThisMonth = await prisma.leadActivity.count({ where: { lead: { organizationId: org.id }, type: "meeting_booked", createdAt: { gte: startOfMonth } } });

  const stageMap = Object.fromEntries(leadsByStage.map((s) => [s.stage ?? "new", s._count]));
  const pipelineValue = (stageMap.qualified || 0) + (stageMap.proposal || 0) + (stageMap.negotiation || 0);
  const estimatedRevenue = pipelineValue * AVG_DEAL_SIZE;
  const wonThisMonth = stageMap.closed_won || 0;

  // Score breakdown from stage grouping (no extra query)
  let hotLeads = 0, warmLeads = 0, coldLeads = 0;
  for (const [stage, count] of Object.entries(stageMap)) {
    if (stage === "qualified" || stage === "proposal" || stage === "negotiation") hotLeads += count;
    else if (stage === "contacted") warmLeads += count;
    else if (stage === "closed_won" || stage === "closed_lost" || stage === "new") coldLeads += count;
  }
  const unscoredLeads = Math.max(0, leadCount - hotLeads - warmLeads - coldLeads);

  const scoreDonut = [
    { label: "Hot", value: hotLeads, color: "#34d399" },
    { label: "Warm", value: warmLeads, color: "#60a5fa" },
    { label: "Cold", value: coldLeads, color: "#94a3b8" },
    { label: "New", value: unscoredLeads, color: "#e2e8f0" },
  ].filter(s => s.value > 0);

  const pipelineDonut = [
    { label: "New", value: stageMap.new || 0, color: "#94a3b8" },
    { label: "Contacted", value: stageMap.contacted || 0, color: "#818cf8" },
    { label: "Qualified", value: stageMap.qualified || 0, color: "#60a5fa" },
    { label: "Proposal", value: stageMap.proposal || 0, color: "#fbbf24" },
    { label: "Won", value: stageMap.closed_won || 0, color: "#34d399" },
  ].filter(s => s.value > 0);

  // Campaign stats from DB (one query)
  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: org.id, status: { not: "draft" } },
    select: { stats: true },
  });

  let totalSent = 0, totalOpened = 0, totalReplied = 0;
  for (const c of campaigns) { const s = (c.stats || {}) as Record<string, number>; totalSent += s.sent || 0; totalOpened += s.opened || 0; totalReplied += s.replied || 0; }
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : null;
  const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : null;

  // AI rate from message count
  const aiMessageCount = await prisma.message.count({
    where: { conversation: { organizationId: org.id }, direction: "outbound", aiMetadata: { not: undefined as any } },
  });
  const totalOutbound = await prisma.message.count({
    where: { conversation: { organizationId: org.id }, direction: "outbound" },
  });
  const aiResponseRate = totalOutbound > 0 ? ((aiMessageCount / totalOutbound) * 100).toFixed(0) : null;

  const metricCards = [
    { label: "Pipeline Value", value: `$${(estimatedRevenue / 1000).toFixed(1)}k`, sub: `${pipelineValue} active deals`, icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Meetings", value: String(meetingsThisMonth), sub: "This month", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Reply Rate", value: replyRate ? `${replyRate}%` : "—", sub: totalSent > 0 ? `${totalReplied} replies` : "No campaigns", icon: Send, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "AI Autopilot", value: aiResponseRate ? `${aiResponseRate}%` : "—", sub: aiMessageCount > 0 ? `${aiMessageCount} AI replies` : "Activate agent", icon: Bot, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:px-8 lg:py-5 space-y-4 animate-slide-up">

          {/* ── Header ─────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.15em] mb-1">Overview</p>
              <h1 className="text-xl font-bold tracking-tight text-text">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {session.name?.split(" ")[0] || "there"}.
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/agents" className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-white text-[13px] font-medium px-3 py-1.5 hover:bg-accent-hover transition-colors shadow-sm shadow-accent/20">
                <Plus className="size-3.5" /> New Agent
              </Link>
              <Link href="/campaigns/new" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card text-text-secondary text-[13px] font-medium px-3 py-1.5 hover:bg-bg-subtle transition-colors">
                <Zap className="size-3.5" /> Campaign
              </Link>
              <Link href="/inbox" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card text-text-secondary text-[13px] font-medium px-3 py-1.5 hover:bg-bg-subtle transition-colors">
                <MessageSquare className="size-3.5" /> Inbox
              </Link>
            </div>
          </div>

          <OnboardingCard show={agentCount === 0 && leadCount === 0} orgSlug={session.orgSlug} />

          {/* ── KPI Cards ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {metricCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-border bg-bg-card px-4 py-3 hover:border-accent/20 hover:shadow-sm transition-all duration-200 group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className={`size-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`size-3.5 ${card.color}`} />
                  </div>
                </div>
                <p className="text-[11px] font-medium text-text-muted mt-2 mb-0.5">{card.label}</p>
                <p className="text-2xl font-bold text-text tracking-tight leading-tight">{card.value}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Main grid: Activity + Charts ────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Activity — compact, 5 items max, no scrollbar */}
            <div className="lg:col-span-1 rounded-xl border border-border bg-bg-card flex flex-col">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
                <span className="relative flex size-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" /><span className="relative inline-flex rounded-full size-1.5 bg-accent" /></span>
                <h2 className="text-sm font-semibold text-text">Activity</h2>
              </div>
              <div className="p-2">
                <ActivityFeed orgSlug={session.orgSlug} />
              </div>
            </div>

            {/* Charts — 2 cols */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Score Donut */}
              <div className="rounded-xl border border-border bg-bg-card p-4">
                <h3 className="text-sm font-semibold text-text mb-1">Lead Quality</h3>
                <p className="text-[11px] text-text-muted mb-3">{leadCount} leads scored</p>
                {leadCount > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="w-[100px] h-[100px] shrink-0">
                      <DonutChart segments={scoreDonut} size={100} thickness={24} />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      {scoreDonut.map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
                          <span className="size-2 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-text-secondary">{s.label}</span>
                          <span className="font-semibold text-text ml-auto">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted py-6 text-center">Score leads to see breakdown</p>
                )}
              </div>

              {/* Pipeline Donut */}
              <div className="rounded-xl border border-border bg-bg-card p-4">
                <h3 className="text-sm font-semibold text-text mb-1">Pipeline</h3>
                <p className="text-[11px] text-text-muted mb-3">{leadCount} leads · {wonThisMonth} won</p>
                {leadCount > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="w-[100px] h-[100px] shrink-0">
                      <DonutChart segments={pipelineDonut} size={100} thickness={24} />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      {pipelineDonut.map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
                          <span className="size-2 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-text-secondary">{s.label}</span>
                          <span className="font-semibold text-text ml-auto">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted py-6 text-center">Add leads to see pipeline</p>
                )}
              </div>

              {/* Campaign reach or quick stats */}
              {totalSent > 0 ? (
                <div className="rounded-xl border border-border bg-bg-card p-4 sm:col-span-2">
                  <h3 className="text-sm font-semibold text-text mb-1">Campaign Reach</h3>
                  <p className="text-[11px] text-text-muted mb-3">{totalSent} emails · {activeCampaigns} active campaign{activeCampaigns !== 1 ? "s" : ""}</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Sent", val: totalSent, color: "bg-slate-400" },
                      { label: "Opened", val: totalOpened, pct: openRate, color: "bg-blue-400" },
                      { label: "Replied", val: totalReplied, pct: replyRate, color: "bg-emerald-400" },
                    ].map((bar) => (
                      <div key={bar.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-text-muted font-medium">{bar.label}</span>
                          <span className="text-text-secondary tabular-nums font-semibold">{bar.val}{bar.pct != null ? <span className="text-text-muted font-normal"> {bar.pct}%</span> : ""}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
                          <div className={`h-full rounded-full ${bar.color} transition-all duration-700`} style={{ width: `${Math.max(2, (bar.val / (totalSent || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-bg-card p-4 sm:col-span-2">
                  <h3 className="text-sm font-semibold text-text mb-3">Overview</h3>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {[
                      { val: agentCount, label: "Agents" },
                      { val: leadCount, label: "Leads" },
                      { val: activeCampaigns, label: "Campaigns" },
                      { val: activeConversations, label: "Threads" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-bg-subtle py-2.5">
                        <p className="text-lg font-bold text-text">{s.val}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Empty state ──────────────────────────────── */}
          {leadCount === 0 && agentCount === 0 && (
            <div className="rounded-xl border border-border bg-bg-card p-10 text-center">
              <div className="size-12 rounded-xl bg-gradient-to-br from-accent to-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-md shadow-accent/20">
                <Bot className="size-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Ready to deploy your AI sales team?</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto mb-5">Create an AI agent, import leads, and launch a campaign. Your AI SDR qualifies leads and books meetings 24/7.</p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/agents" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent-hover transition-colors shadow-sm shadow-accent/20">Create Agent</Link>
                <Link href="/leads" className="rounded-lg border border-border text-text-secondary text-sm font-medium px-4 py-2.5 hover:bg-bg-subtle transition-colors">Import Leads</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
