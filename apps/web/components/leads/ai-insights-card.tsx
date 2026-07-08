"use client";
import { useEffect, useState, useCallback } from "react";

interface AIScoreResponse {
  score: number; label: string; reason: string; nextAction: string;
}

interface Props {
  leadId: string;
  orgSlug: string;
}

export function AIInsightsCard({ leadId, orgSlug }: Props) {
  const [result, setResult] = useState<AIScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchScore = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/ai/score-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Scoring failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze");
    } finally {
      setLoading(false);
    }
  }, [leadId, orgSlug]);

  useEffect(() => {
    let cancelled = false;
    fetchScore().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [fetchScore]);

  const scoreColor = result?.label === "hot"
    ? "bg-danger" : result?.label === "warm"
    ? "bg-warning" : "bg-bg-muted";

  const badgeColor = result?.label === "hot"
    ? "bg-danger-soft text-danger" : result?.label === "warm"
    ? "bg-warning-soft text-warning" : "bg-bg-subtle text-text-muted";

  return (
    <div className="rounded-xl rounded-md border border-border bg-bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-text-muted">AI Insights</p>
        {!loading && (
          <button onClick={fetchScore} className="text-xs text-accent hover:underline">
            Refresh
          </button>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-text-muted">Analyzing...</p>
      ) : error ? (
        <div className="text-sm text-danger space-y-1.5">
          <p>{error}</p>
          <button onClick={fetchScore} className="text-xs underline hover:text-danger/80">Retry</button>
        </div>
      ) : result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-14 h-14 rounded-full text-lg font-bold text-white shadow-sm ${scoreColor}`}>
              {result.score}
            </div>
            <div>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}>
                {result.label.toUpperCase()}
              </span>
              <p className="text-sm text-text-secondary mt-1">{result.reason}</p>
            </div>
          </div>
          {result.nextAction && (
            <div className="rounded-lg bg-accent-soft border border-accent/20 p-3">
              <p className="text-xs font-semibold text-accent uppercase mb-1">Suggested Next Action</p>
              <p className="text-sm text-text">{result.nextAction}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
