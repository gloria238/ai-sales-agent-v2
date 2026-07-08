"use client";

import { useEffect, useState } from "react";
import { Zap, Timer, DollarSign, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

// Job type display names
const JOB_LABELS: Record<string, string> = {
  compose_response: "撰写回复",
  score_lead: "客户评分",
  summarize_conversation: "对话总结",
  generate_script: "话术生成",
  campaign_ai: "活动AI",
  kb_ask: "知识库问答",
};

interface AIHealthData {
  summary: {
    totalCalls: number;
    avgLatencyP50: number;
    avgLatencyP95: number;
    totalCost: number;
    fallbackRate: number;
    successRate: number;
  };
  byJobType: Array<{ jobType: string; count: number; avgLatency: number; cost: number }>;
  dailyTokens: Array<{ date: string; promptTokens: number; completionTokens: number }>;
  alerts: Array<{ level: "warning" | "critical"; message: string }>;
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}秒`;
  return `${ms}毫秒`;
}

function formatCost(usd: number): string {
  const rmb = usd * 7.2;
  if (rmb < 0.01) return "<¥0.01";
  if (rmb >= 1000) return `¥${(rmb / 1000).toFixed(1)}k`;
  return `¥${rmb.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function AIHealthTab() {
  const [data, setData] = useState<AIHealthData | null>(null);
  const [period, setPeriod] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/v1/metrics/ai-health?period=${period}`);
        if (!res.ok) throw new Error("获取 AI 指标失败");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [period]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border border-border bg-bg-card p-5 animate-pulse">
            <div className="size-10 rounded-xl bg-bg-subtle mb-3" />
            <div className="h-3 bg-bg-subtle rounded w-20 mb-2" />
            <div className="h-6 bg-bg-subtle rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-md border border-border bg-bg-card p-8 text-center">
        <AlertTriangle className="size-8 text-warning mx-auto mb-3" />
        <p className="text-sm text-text-muted">{error || "暂无 AI 调用数据，触发 AI 操作后自动填充。"}</p>
      </div>
    );
  }

  const maxDailyTokens = Math.max(1, ...data.dailyTokens.map((d) => d.promptTokens + d.completionTokens));
  const maxJobCount = Math.max(1, ...data.byJobType.map((j) => j.count));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Period selector + summary header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {data.summary.totalCalls === 0
            ? "（暂无数据）"
            : `近${period === "24h" ? "24小时" : period === "7d" ? "7天" : "30天"} ${data.summary.totalCalls} 次调用`}
        </p>
        <div className="flex gap-1 bg-bg-subtle rounded-lg p-0.5">
          {["24h", "7d", "30d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                period === p ? "bg-accent text-white" : "text-text-muted hover:text-text"
              }`}
            >
              {p === "24h" ? "24小时" : p === "7d" ? "7天" : "30天"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-md border border-border bg-bg-card p-4">
          <div className="size-9 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
            <Zap className="size-4 text-accent" />
          </div>
          <p className="text-xs text-text-muted">调用次数</p>
          <p className="text-xl font-bold text-text">{data.summary.totalCalls}</p>
        </div>

        <div className="rounded-md border border-border bg-bg-card p-4">
          <div className="size-9 rounded-lg bg-accent-secondary/10 flex items-center justify-center mb-2">
            <Timer className="size-4 text-accent-secondary" />
          </div>
          <p className="text-xs text-text-muted">延迟 P50 / P95</p>
          <p className="text-xl font-bold text-text">
            {formatMs(data.summary.avgLatencyP50)} / {formatMs(data.summary.avgLatencyP95)}
          </p>
        </div>

        <div className="rounded-md border border-border bg-bg-card p-4">
          <div className="size-9 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
            <DollarSign className="size-4 text-accent" />
          </div>
          <p className="text-xs text-text-muted">总费用（估算）</p>
          <p className="text-xl font-bold text-text">{formatCost(data.summary.totalCost)}</p>
        </div>

        <div className="rounded-md border border-border bg-bg-card p-4">
          <div className="size-9 rounded-lg bg-accent-secondary/10 flex items-center justify-center mb-2">
            <TrendingUp className="size-4 text-accent-secondary" />
          </div>
          <p className="text-xs text-text-muted">成功率</p>
          <p className="text-xl font-bold text-text">{data.summary.successRate}%</p>
        </div>

        <div className={`rounded-md border border-border bg-bg-card p-4 ${data.summary.fallbackRate > 0.1 ? "ring-1 ring-red-500/30" : ""}`}>
          <div className="size-9 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
            <TrendingDown className="size-4 text-warning" />
          </div>
          <p className="text-xs text-text-muted">降级率</p>
          <p className={`text-xl font-bold ${data.summary.fallbackRate > 0.1 ? "text-red-400" : "text-text"}`}>
            {(data.summary.fallbackRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                a.level === "critical" ? "bg-red-500/10 text-red-400" : "bg-warning/10 text-warning"
              }`}
            >
              <AlertTriangle className="size-4 shrink-0" />
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Two-column detail panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls by job type */}
        <div className="rounded-md border border-border bg-bg-card p-5">
          <p className="text-sm font-medium text-text mb-4">按任务类型</p>
          <div className="space-y-3">
            {data.byJobType.map((j) => (
              <div key={j.jobType} className="flex items-center gap-3">
                <span className="w-24 text-xs text-text-muted truncate">
                  {JOB_LABELS[j.jobType] || j.jobType}
                </span>
                <div className="flex-1 bg-bg-subtle rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${(j.count / maxJobCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-text tabular-nums w-10 text-right">{j.count}</span>
                <span className="text-xs text-text-muted tabular-nums w-14 text-right">
                  {formatMs(j.avgLatency)}
                </span>
              </div>
            ))}
          </div>
          {data.byJobType.length === 0 && (
            <p className="text-xs text-text-muted text-center py-4">暂无 AI 调用记录</p>
          )}
        </div>

        {/* Daily token usage */}
        <div className="rounded-md border border-border bg-bg-card p-5">
          <p className="text-sm font-medium text-text mb-4">每日 Token 用量（近30天）</p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {data.dailyTokens.map((d) => {
              const total = d.promptTokens + d.completionTokens;
              return (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-text-muted tabular-nums">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-bg-subtle rounded-full h-3 overflow-hidden flex">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${(d.promptTokens / maxDailyTokens) * 100}%` }}
                    />
                    <div
                      className="h-full bg-accent-secondary/60 transition-all duration-300"
                      style={{ width: `${(d.completionTokens / maxDailyTokens) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted tabular-nums w-14 text-right">
                    {formatTokens(total)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-accent" />
              <span className="text-xs text-text-muted">输入</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-accent-secondary/60" />
              <span className="text-xs text-text-muted">输出</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
