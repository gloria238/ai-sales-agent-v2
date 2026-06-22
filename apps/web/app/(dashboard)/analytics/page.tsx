import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { TrendingUp, Send, BarChart3, Bot, DollarSign, Target, CalendarCheck } from "lucide-react";

const AVG_DEAL_SIZE = 5000;

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) redirect("/login");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Sequential queries — connection_limit=1, parallel exhausts pgBouncer pool
  const leadCount = await prisma.lead.count({ where: { organizationId: org.id } });
  const totalConversations = await prisma.conversation.count({ where: { organizationId: org.id } });
  const agentCount = await prisma.agent.count({ where: { organizationId: org.id } });
  const leadsByStage = await prisma.lead.groupBy({ by: ["stage"], where: { organizationId: org.id }, _count: true });
  const meetingsThisMonth = await prisma.leadActivity.count({ where: { lead: { organizationId: org.id }, type: "meeting_booked", createdAt: { gte: startOfMonth } } });
  const meetingsLastMonth = await prisma.leadActivity.count({ where: { lead: { organizationId: org.id }, type: "meeting_booked", createdAt: { gte: startOfLastMonth, lt: startOfMonth } } });
  const campaigns = await prisma.campaign.findMany({ where: { organizationId: org.id }, select: { name: true, status: true, stats: true } });
  const campaignRuns = await prisma.campaignRun.findMany({ where: { campaign: { organizationId: org.id } }, orderBy: { createdAt: "desc" }, take: 20, select: { status: true, stats: true, createdAt: true } });
  const totalMessages = await prisma.message.count({ where: { conversation: { organizationId: org.id }, direction: "outbound" } });
  const aiMessages = await prisma.message.count({ where: { conversation: { organizationId: org.id }, direction: "outbound", aiMetadata: { not: undefined as any } } });
  const qualifiedLeads = await prisma.lead.count({ where: { organizationId: org.id, score: { gte: 70 } } });
  const wonThisMonth = await prisma.lead.count({ where: { organizationId: org.id, stage: "closed_won", updatedAt: { gte: startOfMonth } } });

  const stageMap = Object.fromEntries(leadsByStage.map((s) => [s.stage ?? "new", s._count]));
  const pipelineCount = (stageMap.qualified || 0) + (stageMap.proposal || 0) + (stageMap.negotiation || 0);
  const pipelineValue = pipelineCount * AVG_DEAL_SIZE;
  const conversionRate = leadCount > 0 ? ((wonThisMonth / leadCount) * 100).toFixed(1) : null;
  const aiResponseRate = totalMessages > 0 ? ((aiMessages / totalMessages) * 100).toFixed(0) : null;
  const meetingTrend = meetingsLastMonth > 0 ? (((meetingsThisMonth - meetingsLastMonth) / meetingsLastMonth) * 100).toFixed(0) : null;

  // Campaign aggregation
  let totalSent = 0, totalOpened = 0, totalReplied = 0;
  for (const c of campaigns) {
    const s = (c.stats || {}) as Record<string, number>;
    totalSent += s.sent || 0;
    totalOpened += s.opened || 0;
    totalReplied += s.replied || 0;
  }

  const stages = [
    { key: "new", label: "New", color: "#849b70" },
    { key: "contacted", label: "Contacted", color: "#475540" },
    { key: "qualified", label: "Qualified", color: "#15803d" },
    { key: "proposal", label: "Proposal", color: "#e8f0ea" },
    { key: "negotiation", label: "Negotiation", color: "#166534" },
    { key: "closed_won", label: "Won", color: "#166534" },
    { key: "closed_lost", label: "Lost", color: "#B92D28" },
  ];
  const maxStageCount = Math.max(1, ...stages.map((s) => stageMap[s.key] ?? 0));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-slide-up p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">Pipeline, campaign, and AI performance metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
            <DollarSign className="size-5 text-accent" />
          </div>
          <p className="text-xs text-text-muted mb-1">Pipeline Value</p>
          <p className="text-2xl font-bold text-text">${(pipelineValue / 1000).toFixed(1)}k</p>
          <p className="text-xs text-text-muted mt-1">{pipelineCount} active deals</p>
        </div>

        <div className="glass-card p-5">
          <div className="size-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center mb-3">
            <CalendarCheck className="size-5 text-accent-secondary" />
          </div>
          <p className="text-xs text-text-muted mb-1">Meetings Booked</p>
          <p className="text-2xl font-bold text-text">{meetingsThisMonth}</p>
          <p className="text-xs text-text-muted mt-1">
            {meetingTrend != null ? `${meetingTrend.startsWith("-") ? "" : "+"}${meetingTrend}% vs last month` : "This month"}
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="size-10 rounded-xl bg-warning-soft flex items-center justify-center mb-3">
            <Target className="size-5 text-warning" />
          </div>
          <p className="text-xs text-text-muted mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold text-text">{conversionRate ? `${conversionRate}%` : "—"}</p>
          <p className="text-xs text-text-muted mt-1">Lead to won</p>
        </div>

        <div className="glass-card p-5">
          <div className="size-10 rounded-xl bg-accent-soft flex items-center justify-center mb-3">
            <Bot className="size-5 text-accent-hover" />
          </div>
          <p className="text-xs text-text-muted mb-1">AI Response Rate</p>
          <p className="text-2xl font-bold text-text">{aiResponseRate ? `${aiResponseRate}%` : "—"}</p>
          <p className="text-xs text-text-muted mt-1">{aiMessages} of {totalMessages} messages</p>
        </div>
      </div>

      {/* Pipeline chart + Campaign performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="size-4 text-text-muted" /> Pipeline Distribution
          </h3>
          {leadCount > 0 ? (
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
          ) : (
            <p className="text-sm text-text-muted py-8 text-center">No leads yet. Import leads to see pipeline metrics.</p>
          )}
        </div>

        {/* Campaign Performance */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Send className="size-4 text-text-muted" /> Campaign Performance
          </h3>
          {totalSent > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-text">{totalSent}</p>
                  <p className="text-xs text-text-muted">Sent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "—"}%</p>
                  <p className="text-xs text-text-muted">Open Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "—"}%</p>
                  <p className="text-xs text-text-muted">Reply Rate</p>
                </div>
              </div>
              {/* Campaign list */}
              <div className="space-y-2 pt-3 border-t border-border">
                {campaigns.filter((c) => (c.stats as any)?.sent > 0).slice(0, 5).map((c, i) => {
                  const s = (c.stats || {}) as Record<string, number>;
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{c.name}</span>
                      <span className="text-text-muted text-xs">
                        {s.sent || 0} sent &middot; {s.replied || 0} replies
                      </span>
                    </div>
                  );
                })}
                {campaigns.filter((c) => (c.stats as any)?.sent > 0).length === 0 && (
                  <p className="text-xs text-text-muted text-center py-2">No campaign sends yet</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted py-8 text-center">No campaigns launched yet. Start a campaign to see performance data.</p>
          )}
        </div>
      </div>

      {/* Recent Campaign Runs */}
      {campaignRuns.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <BarChart3 className="size-4 text-text-muted" /> Recent Campaign Runs
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-text-muted font-medium text-xs">Date</th>
                  <th className="text-left py-2 text-text-muted font-medium text-xs">Status</th>
                  <th className="text-right py-2 text-text-muted font-medium text-xs">Sent</th>
                  <th className="text-right py-2 text-text-muted font-medium text-xs">Opened</th>
                  <th className="text-right py-2 text-text-muted font-medium text-xs">Replied</th>
                </tr>
              </thead>
              <tbody>
                {campaignRuns.slice(0, 10).map((run, i) => {
                  const s = (run.stats || {}) as Record<string, number>;
                  return (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 text-text-secondary">{new Date(run.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          run.status === "completed" ? "bg-success-soft text-success" :
                          run.status === "running" ? "bg-accent-soft text-accent-hover" :
                          run.status === "failed" ? "bg-danger-soft text-danger" :
                          "bg-bg-muted text-text-muted"
                        }`}>{run.status}</span>
                      </td>
                      <td className="py-2 text-right text-text">{s.sent || s.completed || 0}</td>
                      <td className="py-2 text-right text-text">{s.opened || 0}</td>
                      <td className="py-2 text-right text-text">{s.replied || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
