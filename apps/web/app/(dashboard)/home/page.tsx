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

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Sequential — connection_limit=1 forbids parallel queries
  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) redirect("/login");

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
        <div className="max-w-md w-full animate-fade-in">
          <OnboardingCard show={true} orgSlug={session.orgSlug} />
          <div className="mt-6 rounded-xl border border-border bg-bg-card p-8 text-center">
            <div className="size-14 rounded-xl bg-gradient-to-br from-accent to-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent/20">
              <Bot className="size-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-text mb-2">Deploy your AI sales team</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto leading-relaxed">Create an agent, import leads, launch a campaign. AI qualifies leads and books meetings 24/7.</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/agents" className="rounded-lg bg-accent text-white text-sm font-medium px-5 py-2.5 hover:bg-accent-hover transition-all shadow-sm shadow-accent/20 hover:shadow-md hover:shadow-accent/25">Create Agent</Link>
              <Link href="/leads" className="rounded-lg border border-border text-text-secondary text-sm font-medium px-5 py-2.5 hover:bg-bg-subtle hover:border-accent/30 transition-all">Import Leads</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-5 py-4 lg:px-8 lg:py-6">

      {/* ── Header ─────────────────────────── */}
      <div className="flex items-end justify-between shrink-0 mb-5">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-[0.15em] mb-1">Overview</p>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
            <span className="text-accent">{session.name?.split(" ")[0] || "there"}</span>.
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/agents" className="inline-flex items-center gap-2 rounded-xl bg-accent text-white text-sm font-semibold px-4 py-2.5 hover:bg-accent-hover transition-all shadow-sm shadow-accent/20 hover:shadow-md hover:shadow-accent/25">
            <Plus className="size-4" /> New Agent
          </Link>
          <Link href="/campaigns/new" className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card text-text-secondary text-sm font-medium px-4 py-2.5 hover:bg-bg-subtle hover:border-accent/30 transition-all">
            <Zap className="size-4" /> Campaign
          </Link>
          <Link href="/inbox" className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card text-text-secondary text-sm font-medium px-4 py-2.5 hover:bg-bg-subtle hover:border-accent/30 transition-all">
            <MessageSquare className="size-4" /> Inbox
          </Link>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 shrink-0 mb-5">
        {[
          { label: "Pipeline", value: `$${(estimatedRevenue / 1000).toFixed(1)}k`, sub: `${pipelineCount} deals`, icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/5" },
          { label: "Meetings", value: meetingsThisMonth, sub: "This month", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10", glow: "shadow-blue-500/5" },
          { label: "Reply Rate", value: replyRate ? `${replyRate}%` : "—", sub: totalSent > 0 ? `${totalReplied}/${totalSent}` : "No campaigns", icon: Send, color: "text-violet-400", bg: "bg-violet-500/10", glow: "shadow-violet-500/5" },
          { label: "AI Replies", value: aiResponseRate ? `${aiResponseRate}%` : "—", sub: aiMessageCount > 0 ? `${aiMessageCount} auto` : "Activate agent", icon: Bot, color: "text-accent", bg: "bg-accent/10", glow: "shadow-accent/5" },
        ].map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-in rounded-2xl border border-border bg-bg-card/80 backdrop-blur-sm px-5 py-4 hover:border-accent/30 hover:shadow-lg transition-all duration-300 group"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center gap-3.5">
              <div className={`size-11 rounded-xl ${card.bg} flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-sm transition-all duration-300`}>
                <card.icon className={`size-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-muted tracking-wide">{card.label}</p>
                <p className="text-2xl font-extrabold text-text tracking-tight mt-1">{card.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{card.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Body: 3-column ────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">

        {/* ── Left: Activity ─────────────── */}
        <div className="rounded-2xl border border-border bg-bg-card/80 backdrop-blur-sm shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border shrink-0">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-accent" />
            </span>
            <h2 className="text-sm font-semibold text-text">Live Activity</h2>
            <span className="ml-auto text-[10px] text-text-muted tabular-nums">30s</span>
          </div>
          <div className="flex-1 overflow-hidden p-2.5">
            <ActivityFeed orgSlug={session.orgSlug} />
          </div>
        </div>

        {/* ── Right: Charts (2 cols) ─────── */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4 min-h-0">
          {/* Lead Quality */}
          <div className="rounded-2xl border border-border bg-bg-card/80 backdrop-blur-sm shadow-sm p-5 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-text mb-1">Lead Quality</h3>
            <p className="text-xs text-text-muted mb-4">{leadCount} total leads</p>
            {scoreDonut.length > 0 ? (
              <div className="flex items-center gap-5 flex-1">
                <div className="w-[120px] h-[120px] shrink-0">
                  <DonutChart segments={scoreDonut} size={120} thickness={28} label="Leads" />
                </div>
                <div className="space-y-2 flex-1">
                  {scoreDonut.map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5 text-xs">
                      <span className="size-3 rounded-md shrink-0 shadow-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-text-secondary font-medium">{s.label}</span>
                      <span className="font-bold text-text ml-auto">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-2">
                <Target className="size-6 opacity-20" />
                <p className="text-xs">Score leads to see breakdown</p>
              </div>
            )}
          </div>

          {/* Pipeline */}
          <div className="rounded-2xl border border-border bg-bg-card/80 backdrop-blur-sm shadow-sm p-5 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-text mb-1">Pipeline</h3>
            <p className="text-xs text-text-muted mb-4">{leadCount} leads · {wonThisMonth} won this month</p>
            {pipelineDonut.length > 0 ? (
              <div className="flex items-center gap-5 flex-1">
                <div className="w-[120px] h-[120px] shrink-0">
                  <DonutChart segments={pipelineDonut} size={120} thickness={28} label="Deals" />
                </div>
                <div className="space-y-2 flex-1">
                  {pipelineDonut.map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5 text-xs">
                      <span className="size-3 rounded-md shrink-0 shadow-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-text-secondary font-medium">{s.label}</span>
                      <span className="font-bold text-text ml-auto">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-2">
                <Target className="size-6 opacity-20" />
                <p className="text-xs">Add leads to see pipeline</p>
              </div>
            )}
          </div>

          {/* Campaign reach + Quick stats */}
          <div className="rounded-2xl border border-border bg-bg-card/80 backdrop-blur-sm shadow-sm p-5 col-span-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-text">Campaign Reach</h3>
              {totalSent > 0 && (
                <span className="text-[10px] text-text-muted">
                  {activeCampaigns} active campaign{activeCampaigns !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mb-4">
              {totalSent > 0
                ? `${totalSent} emails sent across all campaigns`
                : "Launch a campaign to see reach data"}
            </p>
            {totalSent > 0 ? (
              <div className="grid grid-cols-3 gap-5 mb-5">
                {[
                  { label: "Sent", val: totalSent, pct: null, color: "from-slate-400 to-slate-500", bg: "bg-slate-400" },
                  { label: "Opened", val: totalOpened, pct: openRate, color: "from-blue-400 to-blue-500", bg: "bg-blue-400" },
                  { label: "Replied", val: totalReplied, pct: replyRate, color: "from-emerald-400 to-emerald-500", bg: "bg-emerald-400" },
                ].map((bar) => (
                  <div key={bar.label} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted font-medium">{bar.label}</span>
                      <span className="text-text-secondary tabular-nums font-semibold">
                        {bar.val}
                        {bar.pct != null && <span className="text-text-muted font-normal ml-1">{bar.pct}%</span>}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-bg-subtle overflow-hidden shadow-inner">
                      <div className={`h-full rounded-full bg-gradient-to-r ${bar.color} transition-all duration-700 shadow-sm`} style={{ width: `${Math.max(3, (bar.val / (totalSent || 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-4 mb-4 rounded-xl bg-bg-subtle/50 border border-border/50">
                <p className="text-xs text-text-muted">
                  No campaign data yet —{" "}
                  <Link href="/campaigns/new" className="text-accent hover:underline font-semibold">create your first campaign</Link>
                </p>
              </div>
            )}
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { val: agentCount, label: "AI Agents", icon: Bot },
                { val: leadCount, label: "Leads", icon: Target },
                { val: activeCampaigns, label: "Campaigns", icon: Zap },
                { val: activeConversations, label: "Threads", icon: MessageSquare },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-bg-subtle/70 py-3 px-2 hover:bg-bg-muted transition-colors group">
                  <s.icon className="size-3.5 mx-auto mb-1.5 text-text-muted group-hover:text-accent transition-colors" />
                  <p className="text-lg font-extrabold text-text tabular-nums">{s.val}</p>
                  <p className="text-[10px] text-text-muted mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
