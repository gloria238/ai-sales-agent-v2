"use client";

import { useEffect, useState } from "react";
import { Zap, Timer, Layers, AlertTriangle, TrendingUp, Activity } from "lucide-react";

interface MetricsData {
  system: { p50: number; p95: number; totalCalls: number; kbHitRate: number | null };
  quality: { avgKbChunks: number | null; dailyCalls: { date: string; count: number }[]; dailyKbHit: { date: string; rate: number }[] };
  business: { statusDistribution: { status: string; count: number }[]; handoffRate: number | null; draftAdoptionRate: number | null };
  risk: { confidenceGateFired: number | null; timeouts: number };
  period: { days: number; from: string; to: string };
}

const STATUS_LABELS: Record<string, string> = {
  active: "进行中",
  awaiting_approval: "待审核",
  approved: "已批准",
  closed: "已关闭",
  archived: "已归档",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-primary",
  awaiting_approval: "bg-warning",
  approved: "bg-muted-foreground",
  closed: "bg-bg-muted",
  archived: "bg-bg-muted",
};

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}秒`;
  return `${ms}毫秒`;
}

function nullPlaceholder(val: number | null): string {
  if (val === null || val === undefined) return "数据待接入";
  return String(val);
}

export default function AIMetricsTab({ orgSlug }: { orgSlug: string }) {
  const [data, setData] = useState<MetricsData | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/orgs/${orgSlug}/metrics/ai?days=${days}`);
        if (!res.ok) throw new Error("获取指标失败");
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
  }, [days]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
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
        <p className="text-sm text-text-muted">{error || "暂无 AI 指标数据"}</p>
      </div>
    );
  }

  const maxDailyCount = Math.max(1, ...data.quality.dailyCalls.map((d) => d.count));
  const totalConvCount = data.business.statusDistribution.reduce((s, g) => s + g.count, 0);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          近{days}天 · {data.system.totalCalls} 次 AI 回复
        </p>
        <div className="flex gap-1 bg-bg-subtle rounded-lg p-0.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                days === d ? "bg-primary text-white" : "text-text-muted hover:text-text"
              }`}
            >
              {d}天
            </button>
          ))}
        </div>
      </div>

      {/* ── Layer 1: System (系统层) ──────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
          <Activity className="size-3.5" /> 系统层
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-md border border-border bg-bg-card p-4">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Timer className="size-4 text-primary" />
            </div>
            <p className="text-xs text-text-muted">P50 响应时长</p>
            <p className="text-xl font-bold text-text">{formatMs(data.system.p50)}</p>
          </div>
          <div className="rounded-md border border-border bg-bg-card p-4">
            <div className="size-9 rounded-lg bg-muted-foreground/10 flex items-center justify-center mb-2">
              <Timer className="size-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-text-muted">P95 响应时长</p>
            <p className="text-xl font-bold text-text">{formatMs(data.system.p95)}</p>
          </div>
          <div className="rounded-md border border-border bg-bg-card p-4">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Zap className="size-4 text-primary" />
            </div>
            <p className="text-xs text-text-muted">AI 调用总量</p>
            <p className="text-xl font-bold text-text">{data.system.totalCalls}</p>
          </div>
          <div className="rounded-md border border-border bg-bg-card p-4">
            <div className="size-9 rounded-lg bg-muted-foreground/10 flex items-center justify-center mb-2">
              <Layers className="size-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-text-muted">KB 命中率</p>
            <p className={`text-xl font-bold ${data.system.kbHitRate === null ? "text-text-muted text-sm" : "text-text"}`}>
              {data.system.kbHitRate === null ? "数据待接入" : `${(data.system.kbHitRate * 100).toFixed(0)}%`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Layer 2: Quality (能力质量) ────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
          <TrendingUp className="size-3.5" /> 能力质量
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily call trend */}
          <div className="rounded-md border border-border bg-bg-card p-5">
            <p className="text-sm font-medium text-text mb-4">每日 AI 调用量</p>
            <div className="h-40 flex items-end gap-1">
              {data.quality.dailyCalls.length > 0 ? (
                data.quality.dailyCalls.map((d) => {
                  const h = (d.count / maxDailyCount) * 100;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}次`}>
                      <span className="text-[9px] text-text-muted">{d.count}</span>
                      <div className="w-full rounded-t-sm bg-primary/70" style={{ height: `${Math.max(h, 2)}%` }} />
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-text-muted w-full text-center">暂无数据</p>
              )}
            </div>
          </div>
          {/* KB hit placeholder */}
          <div className="rounded-md border border-border bg-bg-card p-5">
            <p className="text-sm font-medium text-text mb-4">每日 KB 命中率</p>
            <p className="text-xs text-text-muted py-8 text-center">
              数据待接入 — 需要 AICallMetric.kbChunksUsed 字段
            </p>
          </div>
        </div>
      </div>

      {/* ── Layer 3: Business (业务结果) ───────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
          <Layers className="size-3.5" /> 业务结果
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status distribution */}
          <div className="rounded-md border border-border bg-bg-card p-5">
            <p className="text-sm font-medium text-text mb-4">对话状态分布</p>
            {totalConvCount > 0 ? (
              <div className="space-y-2">
                {data.business.statusDistribution.map((g) => {
                  const pct = (g.count / totalConvCount) * 100;
                  return (
                    <div key={g.status} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-text-muted">{STATUS_LABELS[g.status] || g.status}</span>
                      <div className="flex-1 h-5 bg-bg-subtle rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${STATUS_COLORS[g.status] || "bg-bg-muted"}`}
                          style={{ width: `${Math.max(pct, g.count > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-text w-8 text-right">{g.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted py-8 text-center">暂无对话数据</p>
            )}
          </div>
          {/* Handoff + Draft adoption */}
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-bg-card p-5">
              <p className="text-sm font-medium text-text mb-2">AI 参与率</p>
              <p className="text-2xl font-bold text-text">
                {data.business.handoffRate !== null ? `${(data.business.handoffRate * 100).toFixed(0)}%` : "—"}
              </p>
              <p className="text-xs text-text-muted mt-1">有 AI 参与回复的对话占比（近似）</p>
            </div>
            <div className="rounded-md border border-border bg-bg-card p-5">
              <p className="text-sm font-medium text-text mb-2">草稿采纳率</p>
              <p className={`text-2xl font-bold ${data.business.draftAdoptionRate === null ? "text-text-muted text-base" : "text-text"}`}>
                {nullPlaceholder(data.business.draftAdoptionRate)}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {data.business.draftAdoptionRate === null ? "需要 reviewAction 字段数据积累" : "approved / (approved + rejected)"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Layer 4: Risk (风险指标) ───────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
          <AlertTriangle className="size-3.5" /> 风险指标
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`rounded-md border border-border bg-bg-card p-5 ${data.risk.timeouts > 0 ? "ring-1 ring-red-500/30" : ""}`}>
            <p className="text-sm font-medium text-text mb-2">超时中断</p>
            <p className={`text-2xl font-bold ${data.risk.timeouts > 0 ? "text-red-400" : "text-text"}`}>
              {data.risk.timeouts}
            </p>
            <p className="text-xs text-text-muted mt-1">errorType 包含 "timeout" 的调用次数</p>
          </div>
          <div className="rounded-md border border-border bg-bg-card p-5">
            <p className="text-sm font-medium text-text mb-2">置信度门控触发</p>
            <p className={`text-2xl font-bold ${data.risk.confidenceGateFired === null ? "text-text-muted text-base" : "text-text"}`}>
              {nullPlaceholder(data.risk.confidenceGateFired)}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {data.risk.confidenceGateFired === null ? "需要 AICallMetric 新增字段" : "top-1 < 0.7 触发的 expanded search 次数"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
