import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OnboardingCard } from "../onboarding-card";
import { ActivityFeed } from "./activity-feed";
import { DonutChart } from "./donut-chart";
import { MessageSquare, Bot, Zap, Plus, Send, Sparkles, Target } from "lucide-react";

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

  // Real pipeline value from dealAmount SUM — not hardcoded $5K
  const pipelineAgg = await prisma.lead.aggregate({
    where: { organizationId: org.id, stage: { in: ["qualified", "proposal", "negotiation"] } },
    _sum: { dealAmount: true },
  });
  const estimatedRevenue = pipelineAgg._sum.dealAmount ?? 0;
  const wonThisMonth = stageMap.closed_won || 0;

  let hotLeads = 0, warmLeads = 0;
  for (const [stage, count] of Object.entries(stageMap)) {
    if (stage === "qualified" || stage === "proposal" || stage === "negotiation" || stage === "closed_won") hotLeads += count;
    else if (stage === "contacted") warmLeads += count;
  }
  const coldLeads = leadCount - hotLeads - warmLeads;
  const scoreDonut = [
    { label: "高意向", value: hotLeads, color: "hsl(121, 95%, 56%)" },
    { label: "中等", value: warmLeads, color: "hsl(121, 60%, 38%)" },
    { label: "低意向", value: coldLeads, color: "hsl(240, 5%, 28%)" },
  ].filter(s => s.value > 0);

  const pipelineDonut = [
    { label: "新客户", value: stageMap.new || 0, color: "hsl(240, 5%, 35%)" },
    { label: "已联系", value: stageMap.contacted || 0, color: "hsl(121, 20%, 25%)" },
    { label: "已确认", value: stageMap.qualified || 0, color: "hsl(121, 50%, 38%)" },
    { label: "方案中", value: stageMap.proposal || 0, color: "hsl(121, 75%, 48%)" },
    { label: "已成交", value: stageMap.closed_won || 0, color: "hsl(121, 95%, 56%)" },
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
            <div className="size-10 rounded-md bg-accent-subtle flex items-center justify-center mx-auto mb-5">
              <Bot className="size-5 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-text mb-2">部署你的 AI 销售团队</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto leading-relaxed">创建 AI 助理，导入客户，启动外呼活动。AI 全天候自动筛选客户并预约会议。</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/agents" className="rounded-md bg-accent text-white text-sm font-medium px-3.5 py-2 hover:bg-accent-hover transition-colors">创建助理</Link>
              <Link href="/leads" className="rounded-md border border-border text-text-secondary text-sm font-medium px-3.5 py-2 hover:bg-bg-subtle transition-colors">导入客户</Link>
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
          <p className="text-xs font-semibold text-text-muted uppercase tracking-[0.15em] mb-1">概览</p>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {new Date().getHours() < 12 ? "早上好" : new Date().getHours() < 18 ? "下午好" : "晚上好"}，{" "}
            <span className="text-accent">{session.name?.split(" ")[0] || "欢迎"}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/agents" className="inline-flex items-center gap-2 rounded-xl bg-accent text-white text-sm font-semibold px-4 py-2.5 hover:bg-accent-hover transition-all shadow-sm hover:shadow-md hover:shadow-accent/25">
            <Plus className="size-4" /> 新建助理
          </Link>
          <Link href="/campaigns/new" className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card text-text-secondary text-sm font-medium px-4 py-2.5 hover:bg-bg-subtle hover:border-accent/30 transition-all">
            <Zap className="size-4" /> 外呼活动
          </Link>
          <Link href="/inbox" className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card text-text-secondary text-sm font-medium px-4 py-2.5 hover:bg-bg-subtle hover:border-accent/30 transition-all">
            <MessageSquare className="size-4" /> 收件箱
          </Link>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 shrink-0 mb-5">
        {[
          { label: "销售漏斗", value: `¥${(estimatedRevenue / 10000).toFixed(1)}万`, sub: `${pipelineCount} 个商机`, icon: Target, color: "text-accent", bg: "bg-accent/10", glow: "shadow-accent/5" },
          { label: "本月会议", value: meetingsThisMonth, sub: "本月", icon: Sparkles, color: "text-accent-hover", bg: "bg-accent-soft", glow: "shadow-accent-hover/5" },
          { label: "回复率", value: replyRate ? `${replyRate}%` : "—", sub: totalSent > 0 ? `${totalReplied}/${totalSent}` : "暂无活动", icon: Send, color: "text-accent-secondary", bg: "bg-accent-muted", glow: "shadow-accent-secondary/5" },
          { label: "AI 回复", value: aiResponseRate ? `${aiResponseRate}%` : "—", sub: aiMessageCount > 0 ? `${aiMessageCount} 条自动` : "待激活助理", icon: Bot, color: "text-accent", bg: "bg-accent/10", glow: "shadow-accent/5" },
        ].map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-in rounded-lg border border-border bg-bg-card/80 px-5 py-4 hover:border-accent/30 hover:shadow-sm transition-all duration-300 group"
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
        <div className="rounded-lg border border-border bg-bg-card/80 shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border shrink-0">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-accent" />
            </span>
            <h2 className="text-sm font-semibold text-text">实时动态</h2>
            <span className="ml-auto text-[10px] text-text-muted tabular-nums">30s</span>
          </div>
          <div className="flex-1 overflow-hidden p-2.5">
            <ActivityFeed orgSlug={session.orgSlug} />
          </div>
        </div>

        {/* ── Right: Charts (2 cols) ─────── */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4 min-h-0">
          {/* Lead Quality */}
          <div className="rounded-lg border border-border bg-bg-card/80 shadow-sm p-5 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-text mb-1">客户质量</h3>
            <p className="text-xs text-text-muted mb-4">共 {leadCount} 条客户</p>
            {scoreDonut.length > 0 ? (
              <div className="flex items-center gap-5 flex-1">
                <div className="w-[120px] h-[120px] shrink-0">
                  <DonutChart segments={scoreDonut} size={120} thickness={28} label="条" />
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
                <p className="text-xs">评分后显示分布</p>
              </div>
            )}
          </div>

          {/* Pipeline */}
          <div className="rounded-lg border border-border bg-bg-card/80 shadow-sm p-5 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-text mb-1">销售漏斗</h3>
            <p className="text-xs text-text-muted mb-4">共 {leadCount} 条客户 · 本月成交 {wonThisMonth}</p>
            {pipelineDonut.length > 0 ? (
              <div className="flex items-center gap-5 flex-1">
                <div className="w-[120px] h-[120px] shrink-0">
                  <DonutChart segments={pipelineDonut} size={120} thickness={28} label="条" />
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
                <p className="text-xs">添加客户后显示漏斗</p>
              </div>
            )}
          </div>

          {/* Campaign reach + Quick stats */}
          <div className="rounded-lg border border-border bg-bg-card/80 shadow-sm p-5 col-span-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-text">活动效果</h3>
              {totalSent > 0 && (
                <span className="text-[10px] text-text-muted">
                  {activeCampaigns} 个进行中
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mb-4">
              {totalSent > 0
                ? `已发送 ${totalSent} 封邮件`
                : "启动外呼活动查看效果数据"}
            </p>
            {totalSent > 0 ? (
              <div className="grid grid-cols-3 gap-5 mb-5">
                {[
                  { label: "已发送", val: totalSent, pct: null, color: "from-accent-secondary to-accent-secondary/70", bg: "bg-accent-secondary" },
                  { label: "已打开", val: totalOpened, pct: openRate, color: "from-accent-hover to-accent-hover/70", bg: "bg-accent-hover" },
                  { label: "已回复", val: totalReplied, pct: replyRate, color: "from-accent to-accent/70", bg: "bg-accent" },
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
                  暂无活动数据 —{" "}
                  <Link href="/campaigns/new" className="text-accent hover:underline font-semibold">创建首个活动</Link>
                </p>
              </div>
            )}
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { val: agentCount, label: "AI 助理", icon: Bot },
                { val: leadCount, label: "客户", icon: Target },
                { val: activeCampaigns, label: "活动", icon: Zap },
                { val: activeConversations, label: "对话", icon: MessageSquare },
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
