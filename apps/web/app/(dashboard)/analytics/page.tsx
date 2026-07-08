import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { TrendingUp, Send, BarChart3, Bot, DollarSign, Target, CalendarCheck, Users, AlertCircle, ShieldCheck, Activity } from "lucide-react";
import AIHealthTab from "./ai-health";
import AIMetricsTab from "./ai-metrics";

export default async function AnalyticsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) redirect("/login");

  const activeTab = searchParams.tab === "ai" ? "ai" : searchParams.tab === "boss" ? "boss" : searchParams.tab === "metrics" ? "metrics" : "sales";
  const isBoss = ["owner", "admin"].includes(session.role);

  // ── Tab Navigation ──────────────────────────────────────────
  const TabNav = (
    <div className="flex gap-1 bg-bg-subtle rounded-lg p-0.5 w-fit">
      <a
        href="/analytics?tab=sales"
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          activeTab === "sales" ? "bg-accent text-white" : "text-text-muted hover:text-text"
        }`}
      >
        Sales
      </a>
      <a
        href="/analytics?tab=ai"
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          activeTab === "ai" ? "bg-accent text-white" : "text-text-muted hover:text-text"
        }`}
      >
        AI Health
      </a>
      <a
        href="/analytics?tab=metrics"
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          activeTab === "metrics" ? "bg-accent text-white" : "text-text-muted hover:text-text"
        }`}
      >
        AI 指标
      </a>
      {isBoss && (
        <a
          href="/analytics?tab=boss"
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "boss" ? "bg-accent text-white" : "text-text-muted hover:text-text"
          }`}
        >
          Boss
        </a>
      )}
    </div>
  );

  // ── AI Health Tab (client component) ────────────────────────
  if (activeTab === "ai") {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-slide-up p-4 lg:p-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">AI performance, cost, and latency metrics</p>
        </div>
        {TabNav}
        <AIHealthTab />
      </div>
    );
  }

  // ── AI Metrics Tab (four-layer quality dashboard) ────────────
  if (activeTab === "metrics") {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-slide-up p-4 lg:p-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">数据分析</h1>
          <p className="text-sm text-text-secondary mt-1">AI 四层指标：系统 · 质量 · 业务 · 风险</p>
        </div>
        {TabNav}
        <AIMetricsTab orgSlug={org.slug} />
      </div>
    );
  }

  // ── Boss Dashboard Tab (owner/admin only) ──────────────────
  if (activeTab === "boss") {
    // Sequential queries — connection_limit=1
    const totalMembers = await prisma.membership.count({ where: { organizationId: org.id } });
    const membersByRole = await prisma.membership.groupBy({ by: ["role"], where: { organizationId: org.id }, _count: true });

    // HITL metrics
    const totalConv = await prisma.conversation.count({ where: { organizationId: org.id } });
    const awaitingApproval = await prisma.conversation.count({ where: { organizationId: org.id, status: "awaiting_approval" } });
    const hitlRate = totalConv > 0 ? ((awaitingApproval / totalConv) * 100).toFixed(1) : null;

    // AI Cost trends (30 days)
    const costSince = new Date(Date.now() - 30 * 24 * 3600_000);
    const costMetrics = await prisma.aICallMetric.findMany({
      where: { organizationId: org.id, createdAt: { gte: costSince } },
      select: { jobType: true, promptTokens: true, completionTokens: true, success: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    const totalPromptTokens = costMetrics.reduce((s, m) => s + m.promptTokens, 0);
    const totalCompletionTokens = costMetrics.reduce((s, m) => s + m.completionTokens, 0);
    const estimatedTotalCost = (totalPromptTokens * 0.14 + totalCompletionTokens * 0.28) / 1_000_000;
    const totalAiCalls = costMetrics.length;
    const successRate = totalAiCalls > 0
      ? ((costMetrics.filter((m) => m.success).length / totalAiCalls) * 100).toFixed(1)
      : null;

    // Cost by day
    const costByDay = new Map<string, number>();
    for (const m of costMetrics) {
      const day = m.createdAt.toISOString().slice(0, 10);
      const cost = (m.promptTokens * 0.14 + m.completionTokens * 0.28) / 1_000_000;
      costByDay.set(day, (costByDay.get(day) || 0) + cost);
    }
    const dailyCost = Array.from(costByDay.entries())
      .map(([date, cost]) => ({ date, cost: Math.round(cost * 1_000_000) / 1_000_000 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const maxDailyCost = Math.max(0.001, ...dailyCost.map((d) => d.cost));

    // Agent performance
    const agents = await prisma.agent.findMany({
      where: { organizationId: org.id },
      select: { id: true, name: true, isActive: true, _count: { select: { conversations: true, campaigns: true } } },
    });

    // Stage transition funnel
    const leadsByStage = await prisma.lead.groupBy({ by: ["stage"], where: { organizationId: org.id }, _count: true });
    const stageMap = Object.fromEntries(leadsByStage.map((s) => [s.stage ?? "new", s._count]));
    const funnelStages = [
      { key: "new", label: "新客户" },
      { key: "contacted", label: "已联系" },
      { key: "qualified", label: "已确认" },
      { key: "proposal", label: "方案中" },
      { key: "negotiation", label: "洽谈中" },
      { key: "closed_won", label: "已成交" },
      { key: "closed_lost", label: "已流失" },
    ];

    // Activity heat (last 7 days)
    const activitySince = new Date(Date.now() - 7 * 24 * 3600_000);
    const recentActivity = await prisma.leadActivity.count({ where: { lead: { organizationId: org.id }, createdAt: { gte: activitySince } } });
    const recentMessages = await prisma.message.count({ where: { conversation: { organizationId: org.id }, createdAt: { gte: activitySince } } });

    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-slide-up p-4 lg:p-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Organization overview &amp; AI operations dashboard</p>
        </div>
        {TabNav}

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5">
            <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
              <Users className="size-5 text-accent" />
            </div>
            <p className="text-xs text-text-muted mb-1">团队成员</p>
            <p className="text-2xl font-bold text-text">{totalMembers}</p>
            <p className="text-xs text-text-muted mt-1">
              {membersByRole.map((r) => `${r.role}: ${r._count}`).join(" · ")}
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="size-10 rounded-xl bg-warning-soft flex items-center justify-center mb-3">
              <AlertCircle className="size-5 text-warning" />
            </div>
            <p className="text-xs text-text-muted mb-1">人工介入率</p>
            <p className="text-2xl font-bold text-text">{hitlRate ? `${hitlRate}%` : "—"}</p>
            <p className="text-xs text-text-muted mt-1">
              {awaitingApproval}/{totalConv} 条待审核对话
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="size-10 rounded-xl bg-accent-soft flex items-center justify-center mb-3">
              <DollarSign className="size-5 text-accent-hover" />
            </div>
            <p className="text-xs text-text-muted mb-1">AI 成本（30天）</p>
            <p className="text-2xl font-bold text-text">¥{(estimatedTotalCost * 7.2).toFixed(0)}</p>
            <p className="text-xs text-text-muted mt-1">{totalAiCalls.toLocaleString()} 次调用</p>
          </div>

          <div className="glass-card p-5">
            <div className="size-10 rounded-xl bg-success-soft flex items-center justify-center mb-3">
              <ShieldCheck className="size-5 text-success" />
            </div>
            <p className="text-xs text-text-muted mb-1">AI 成功率</p>
            <p className="text-2xl font-bold text-text">{successRate ? `${successRate}%` : "—"}</p>
            <p className="text-xs text-text-muted mt-1">
              {(totalPromptTokens + totalCompletionTokens).toLocaleString()} Token
            </p>
          </div>
        </div>

        {/* Two-column: Cost trend + Agent performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily AI Cost */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-text-muted" /> AI 每日成本（近30天）
            </h3>
            {dailyCost.length > 0 ? (
              <div className="h-48 flex items-end gap-1">
                {dailyCost.slice(-30).map((d) => {
                  const h = (d.cost / maxDailyCost) * 100;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${d.date}: $${d.cost.toFixed(3)}`}>
                      <div className="w-full rounded-t-sm bg-accent/70 hover:bg-accent transition-colors" style={{ height: `${Math.max(h, 1)}%` }} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted py-12 text-center">暂无 AI 成本数据</p>
            )}
          </div>

          {/* Agent Performance */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
              <Bot className="size-4 text-text-muted" /> 助理表现
            </h3>
            {agents.length > 0 ? (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-subtle/50">
                    <div className="flex items-center gap-3">
                      <div className={`size-2.5 rounded-full ${agent.isActive ? "bg-success" : "bg-text-muted"}`} />
                      <span className="text-sm font-medium text-text">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>{agent._count.conversations} 对话</span>
                      <span>{agent._count.campaigns} 活动</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted py-8 text-center">尚未配置助理</p>
            )}
          </div>

          {/* Funnel */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
              <BarChart3 className="size-4 text-text-muted" /> 客户漏斗
            </h3>
            <div className="space-y-2">
              {funnelStages.map((stage) => {
                const count = stageMap[stage.key] ?? 0;
                const maxCount = Math.max(1, ...Object.values(stageMap));
                const width = (count / maxCount) * 100;
                return (
                  <div key={stage.key} className="flex items-center gap-3 text-xs">
                    <span className="w-20 text-text-secondary shrink-0">{stage.label}</span>
                    <div className="flex-1 h-5 bg-bg-subtle rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent/60 transition-all" style={{ width: `${Math.max(width, count > 0 ? 4 : 0)}%` }} />
                    </div>
                    <span className="font-semibold text-text w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Pulse */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
              <Activity className="size-4 text-text-muted" /> 7 天活跃度
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-xl bg-bg-subtle/50 p-4">
                <p className="text-2xl font-bold text-text">{recentActivity}</p>
                <p className="text-xs text-text-muted mt-1">客户活动</p>
              </div>
              <div className="rounded-xl bg-bg-subtle/50 p-4">
                <p className="text-2xl font-bold text-text">{recentMessages}</p>
                <p className="text-xs text-text-muted mt-1">消息</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">日均消息</span>
                <span className="font-semibold text-text">{(recentMessages / 7).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-text-muted">日均活动</span>
                <span className="font-semibold text-text">{(recentActivity / 7).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Sales Metrics Tab (existing content) ────────────────────

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

  // Real pipeline value from dealAmount SUM — not hardcoded $5K
  const pipelineAgg = await prisma.lead.aggregate({
    where: { organizationId: org.id, stage: { in: ["qualified", "proposal", "negotiation"] } },
    _sum: { dealAmount: true },
  });
  const pipelineValue = pipelineAgg._sum.dealAmount ?? 0;
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
    { key: "new", label: "新客户", color: "hsl(240, 5%, 35%)" },
    { key: "contacted", label: "已联系", color: "hsl(121, 20%, 25%)" },
    { key: "qualified", label: "已确认", color: "hsl(121, 50%, 38%)" },
    { key: "proposal", label: "方案中", color: "hsl(121, 75%, 48%)" },
    { key: "negotiation", label: "洽谈中", color: "hsl(121, 85%, 52%)" },
    { key: "closed_won", label: "已成交", color: "hsl(121, 95%, 56%)" },
    { key: "closed_lost", label: "已流失", color: "hsl(0, 70%, 50%)" },
  ];
  const maxStageCount = Math.max(1, ...stages.map((s) => stageMap[s.key] ?? 0));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-slide-up p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text">数据分析</h1>
        <p className="text-sm text-text-secondary mt-1">销售漏斗、活动效果与 AI 表现</p>
      </div>

      {TabNav}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
            <DollarSign className="size-5 text-accent" />
          </div>
          <p className="text-xs text-text-muted mb-1">销售漏斗金额</p>
          <p className="text-2xl font-bold text-text">{pipelineValue > 0 ? `¥${(pipelineValue / 10000).toFixed(1)}万` : "—"}</p>
          <p className="text-xs text-text-muted mt-1">{pipelineCount} 个商机{pipelineValue === 0 && pipelineCount > 0 ? " · 请填写商机金额" : ""}</p>
        </div>

        <div className="glass-card p-5">
          <div className="size-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center mb-3">
            <CalendarCheck className="size-5 text-accent-secondary" />
          </div>
          <p className="text-xs text-text-muted mb-1">本月会议</p>
          <p className="text-2xl font-bold text-text">{meetingsThisMonth}</p>
          <p className="text-xs text-text-muted mt-1">
            {meetingTrend != null ? `较上月${meetingTrend.startsWith("-") ? "" : "+"}${meetingTrend}%` : "本月"}
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="size-10 rounded-xl bg-warning-soft flex items-center justify-center mb-3">
            <Target className="size-5 text-warning" />
          </div>
          <p className="text-xs text-text-muted mb-1">转化率</p>
          <p className="text-2xl font-bold text-text">{conversionRate ? `${conversionRate}%` : "—"}</p>
          <p className="text-xs text-text-muted mt-1">客户到成交</p>
        </div>

        <div className="glass-card p-5">
          <div className="size-10 rounded-xl bg-accent-soft flex items-center justify-center mb-3">
            <Bot className="size-5 text-accent-hover" />
          </div>
          <p className="text-xs text-text-muted mb-1">AI 回复率</p>
          <p className="text-2xl font-bold text-text">{aiResponseRate ? `${aiResponseRate}%` : "—"}</p>
          <p className="text-xs text-text-muted mt-1">{aiMessages}/{totalMessages} 条消息</p>
        </div>
      </div>

      {/* Pipeline chart + Campaign performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="size-4 text-text-muted" /> 漏斗分布
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
            <p className="text-sm text-text-muted py-8 text-center">暂无客户数据，导入客户后查看漏斗。</p>
          )}
        </div>

        {/* Campaign Performance */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Send className="size-4 text-text-muted" /> 活动效果
          </h3>
          {totalSent > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-text">{totalSent}</p>
                  <p className="text-xs text-text-muted">已发送</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "—"}%</p>
                  <p className="text-xs text-text-muted">打开率</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "—"}%</p>
                  <p className="text-xs text-text-muted">回复率</p>
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
                        发送 {s.sent || 0} · 回复 {s.replied || 0}
                      </span>
                    </div>
                  );
                })}
                {campaigns.filter((c) => (c.stats as any)?.sent > 0).length === 0 && (
                  <p className="text-xs text-text-muted text-center py-2">暂无发送记录</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted py-8 text-center">暂无活动数据，启动外呼活动后查看效果。</p>
          )}
        </div>
      </div>

      {/* Recent Campaign Runs */}
      {campaignRuns.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <BarChart3 className="size-4 text-text-muted" /> 近期活动执行
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-text-muted font-medium text-xs">日期</th>
                  <th className="text-left py-2 text-text-muted font-medium text-xs">状态</th>
                  <th className="text-right py-2 text-text-muted font-medium text-xs">发送</th>
                  <th className="text-right py-2 text-text-muted font-medium text-xs">打开</th>
                  <th className="text-right py-2 text-text-muted font-medium text-xs">回复</th>
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
