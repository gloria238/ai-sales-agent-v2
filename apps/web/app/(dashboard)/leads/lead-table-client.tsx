"use client";
import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ImportButton } from "@/components/leads/import-button";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/identity/avatar";
import { relativeTime } from "@/lib/time";
import {
  LayoutGrid,
  List,
  Mail,
  Building2,
  Hash,
  Calendar,
  Sparkles,
  ChevronRight,
  User,
} from "lucide-react";

const STAGES = ["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];
const PAGE_SIZE = 20;

const STAGE_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  new:          { color: "text-text-muted", bg: "bg-bg-subtle", dot: "bg-text-muted" },
  contacted:    { color: "text-lp-hero-sub", bg: "bg-white/[0.04]", dot: "bg-lp-hero-sub" },
  qualified:    { color: "text-lp-hero-sub", bg: "bg-white/[0.04]", dot: "bg-lp-hero-sub" },
  proposal:     { color: "text-warning", bg: "bg-warning-soft", dot: "bg-warning" },
  negotiation:  { color: "text-warning", bg: "bg-warning-soft", dot: "bg-warning" },
  closed_won:   { color: "text-accent", bg: "bg-accent-soft", dot: "bg-accent" },
  closed_lost:  { color: "text-danger", bg: "bg-danger-soft", dot: "bg-danger" },
};

const SCORE_CONFIG = {
  hot:  { bg: "bg-accent-soft", text: "text-accent", bar: "bg-accent", label: "Hot" },
  warm: { bg: "bg-warning-soft", text: "text-warning", bar: "bg-warning", label: "Warm" },
  cold: { bg: "bg-bg-subtle", text: "text-text-muted", bar: "bg-bg-muted", label: "Cold" },
};

function scoreLabel(score: number): "hot" | "warm" | "cold" {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

// ── Types ────────────────────────────────────────────────────────
interface Lead {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  stage: string | null;
  score: number | null;
  source: string | null;
  tags: string[] | null;
  createdAt: string | Date;
}

interface Props {
  initialLeads: Lead[];
  initialTotal: number;
  orgSlug: string;
  canManage: boolean;
}

// ── Sub-components ───────────────────────────────────────────────

function StageBadge({ stage }: { stage: string | null }) {
  const s = stage || "new";
  const cfg = STAGE_CONFIG[s] ?? STAGE_CONFIG.new;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium", cfg.bg, cfg.color)}>
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {s.replace("_", " ")}
    </span>
  );
}

function ScoreDisplay({ score, scoring }: { score: number | null; scoring?: boolean }) {
  if (scoring) {
    return <span className="text-[11px] text-text-muted animate-pulse">评分中…</span>;
  }
  if (score == null) return null;
  const label = scoreLabel(score);
  const cfg = SCORE_CONFIG[label];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-bg-subtle overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", cfg.bar)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("text-[11px] font-semibold tabular-nums", cfg.text)}>{score}</span>
    </div>
  );
}

function TagsList({ tags }: { tags: string[] | null }) {
  if (!tags || tags.length === 0) return null;
  const show = tags.slice(0, 3);
  return (
    <div className="flex flex-wrap gap-1">
      {show.map((t) => (
        <span key={t} className="inline-flex rounded-md bg-bg-subtle px-1.5 py-0.5 text-[10px] text-text-muted font-medium">
          {t}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="text-[10px] text-text-muted">+{tags.length - 3}</span>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export function LeadTableClient({ initialLeads, initialTotal, orgSlug, canManage }: Props) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [aiScores, setAiScores] = useState<Map<string, { score: number; label: string }>>(new Map());
  const [scoringIds, setScoringIds] = useState<Set<string>>(new Set());

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newStage, setNewStage] = useState("new");

  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const queryKey = ["leads", orgSlug, search, stage, page, sortBy, sortOrder];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stage) params.set("stage", stage);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      const res = await fetch(`/api/orgs/${orgSlug}/leads?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ leads: Lead[]; total: number }>;
    },
    initialData: page === 1 && !search && !stage && sortBy === "createdAt" && sortOrder === "desc"
      ? { leads: initialLeads, total: initialTotal }
      : undefined,
  });

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orgs/${orgSlug}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() || undefined, stage: newStage }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewStage("new");
      queryClient.invalidateQueries({ queryKey: ["leads", orgSlug] });
      router.refresh();
    },
  });

  // AI Scoring
  const scoreLead = useCallback(async (leadId: string) => {
    if (scoringIds.has(leadId)) return;
    setScoringIds((prev) => new Set(prev).add(leadId));
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/ai/score-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setAiScores((prev) => {
        const next = new Map(prev);
        next.set(leadId, { score: data.score, label: data.label });
        return next;
      });
    } finally {
      setScoringIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  }, [orgSlug, scoringIds]);

  const scoreAllLeads = useCallback(() => {
    for (const lead of leads) scoreLead(lead.id);
  }, [leads, scoreLead]);

  // Sorting
  const toggleSort = useCallback((column: string) => {
    setSortBy((prev) => {
      if (prev === column) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("asc");
      return column;
    });
    setPage(1);
  }, []);

  // Debounced search
  const debouncedSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  }, []);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return <span className="text-[10px] ml-0.5">{sortOrder === "asc" ? "▲" : "▼"}</span>;
  };

  // ── Render helpers ───────────────────────────────────────────

  const effectiveScore = (lead: Lead) => {
    const ai = aiScores.get(lead.id);
    if (ai) return ai.score;
    return lead.score ?? null;
  };

  const renderCard = (lead: Lead, index: number) => {
    const score = effectiveScore(lead);
    const isScoring = scoringIds.has(lead.id);

    return (
      <Link
        key={lead.id}
        href={`/leads/${lead.id}`}
        className="glass-card group p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-lg hover:border-accent/20 transition-all duration-200 animate-slide-up"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        {/* Header: Avatar + identity */}
        <div className="flex items-start gap-3">
          <Avatar name={lead.name} size="md" seed={lead.email || lead.name} />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text truncate group-hover:text-accent transition-colors">
              {lead.name}
            </h3>
            {lead.company ? (
              <p className="text-[12px] text-text-muted truncate flex items-center gap-1 mt-0.5">
                <Building2 className="size-3 shrink-0" />
                {lead.company}
              </p>
            ) : (
              <p className="text-[12px] text-text-muted truncate mt-0.5">{lead.email || "No email"}</p>
            )}
          </div>
          <ChevronRight className="size-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all shrink-0 -translate-x-1 group-hover:translate-x-0" />
        </div>

        {/* Stage + Score */}
        <div className="flex items-center gap-3">
          <StageBadge stage={lead.stage} />
          {score != null || isScoring ? (
            <div className="flex-1 min-w-0">
              <ScoreDisplay score={score} scoring={isScoring} />
            </div>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); scoreLead(lead.id); }}
              className="text-[11px] text-accent hover:underline font-medium flex items-center gap-1 ml-auto"
            >
              <Sparkles className="size-3" /> Score
            </button>
          )}
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          {lead.email && (
            <span className="flex items-center gap-1 truncate">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </span>
          )}
          {lead.source && (
            <span className="flex items-center gap-1 shrink-0">
              <Hash className="size-3" />
              {lead.source}
            </span>
          )}
        </div>

        {/* Tags + Time */}
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/50">
          <TagsList tags={lead.tags} />
          <span className="text-[10px] text-text-muted flex items-center gap-1 shrink-0 ml-2">
            <Calendar className="size-3" />
            {relativeTime(lead.createdAt)}
          </span>
        </div>
      </Link>
    );
  };

  const renderListRow = (lead: Lead, index: number) => {
    const score = effectiveScore(lead);
    const isScoring = scoringIds.has(lead.id);
    const rowBg = index % 2 === 0 ? "bg-transparent" : "bg-bg-subtle/50";

    return (
      <Link
        key={lead.id}
        href={`/leads/${lead.id}`}
        className={cn(
          "group flex items-center gap-4 px-4 py-3 rounded-xl border border-transparent hover:border-accent/20 hover:bg-bg-subtle/70 transition-all duration-150",
          "border-l-2 hover:border-l-accent",
          rowBg,
        )}
      >
        {/* Avatar + Name */}
        <div className="flex items-center gap-3 min-w-0 w-48">
          <Avatar name={lead.name} size="sm" seed={lead.email || lead.name} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-text truncate group-hover:text-accent transition-colors">
              {lead.name}
            </p>
            {lead.company && (
              <p className="text-[11px] text-text-muted truncate">{lead.company}</p>
            )}
          </div>
        </div>

        {/* Stage */}
        <div className="w-28 shrink-0">
          <StageBadge stage={lead.stage} />
        </div>

        {/* Score or Score button */}
        <div className="w-32 shrink-0">
          {score != null || isScoring ? (
            <ScoreDisplay score={score} scoring={isScoring} />
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); scoreLead(lead.id); }}
              className="text-[11px] text-accent hover:underline font-medium flex items-center gap-1"
            >
              <Sparkles className="size-3" /> Score
            </button>
          )}
        </div>

        {/* Email */}
        <div className="flex-1 min-w-0 text-[12px] text-text-muted truncate">
          {lead.email || "—"}
        </div>

        {/* Source */}
        <div className="w-24 shrink-0 text-[12px] text-text-muted">
          {lead.source || "—"}
        </div>

        {/* Tags */}
        <div className="w-28 shrink-0">
          <TagsList tags={lead.tags} />
        </div>

        {/* Date */}
        <div className="w-20 shrink-0 text-right text-[11px] text-text-muted">
          {relativeTime(lead.createdAt)}
        </div>
      </Link>
    );
  };

  // ── Main Render ──────────────────────────────────────────────

  return (
    <div>
      {/* ── Top Toolbar ── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold tracking-tight text-text">客户管理</h2>
        <div className="flex items-center gap-2">
          <a
            href={`/api/orgs/${orgSlug}/leads/export`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg-card px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-bg-subtle hover:text-text transition-all duration-150"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </a>
          {canManage && (
            <>
              <ImportButton orgSlug={orgSlug} onImported={() => queryClient.invalidateQueries({ queryKey })} />
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger>
                  <Button size="sm">新建客户</Button>
                </DialogTrigger>
                <DialogContent title="新建客户">
                  <div className="space-y-4">
                    <Input label="姓名 *" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={createMutation.isPending} />
                    <Input label="邮箱" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={createMutation.isPending} />
                    <div>
                      <label className="block text-sm font-medium mb-1">阶段</label>
                      <Select value={newStage} onValueChange={setNewStage}>
                        <SelectTrigger />
                        <SelectContent>
                          {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>Cancel</Button>
                      <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newName.trim()}>
                        {createMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          {/* View Toggle */}
          <div className="flex rounded-lg border border-border bg-bg-subtle p-0.5 ml-2">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center justify-center size-8 rounded-md transition-all duration-150",
                viewMode === "grid"
                  ? "bg-bg-card text-accent shadow-sm"
                  : "text-text-muted hover:text-text",
              )}
              title="Card view"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center justify-center size-8 rounded-md transition-all duration-150",
                viewMode === "list"
                  ? "bg-bg-card text-accent shadow-sm"
                  : "text-text-muted hover:text-text",
              )}
              title="List view"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters + Sort ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          <Input
            placeholder="搜索姓名或邮箱…"
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger placeholder="全部阶段" />
            <SelectContent>
              <SelectItem value="">全部阶段</SelectItem>
              {STAGES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
            <SelectTrigger placeholder="排序方式" />
            <SelectContent>
              <SelectItem value="createdAt">创建时间</SelectItem>
              <SelectItem value="name">姓名</SelectItem>
              <SelectItem value="email">邮箱</SelectItem>
              <SelectItem value="stage">阶段</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={() => { setSortOrder((o) => (o === "asc" ? "desc" : "asc")); setPage(1); }}
          className="shrink-0 size-9 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-subtle transition-all text-xs"
          title={sortOrder === "asc" ? "Ascending" : "Descending"}
        >
          {sortOrder === "asc" ? "↑" : "↓"}
        </button>
        <button
          onClick={scoreAllLeads}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 text-accent text-xs font-medium px-3 py-2 hover:bg-accent/10 transition-all"
        >
          <Sparkles className="size-3.5" />
          Score all
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-center mb-5">
          <p className="text-sm text-danger mb-2">{error instanceof Error ? error.message : "Failed to load leads"}</p>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["leads", orgSlug] })}>Retry</Button>
        </div>
      )}

      {/* ── Content ── */}
      {!error && (
        <>
          {isLoading && leads.length === 0 ? (
            /* Loading skeleton */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="size-11 rounded-full bg-bg-subtle" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-bg-subtle" />
                      <div className="h-2.5 w-32 rounded bg-bg-subtle" />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-full rounded bg-bg-subtle" />
                    <div className="h-2 w-2/3 rounded bg-bg-subtle" />
                  </div>
                </div>
              ))}
            </div>
          ) : leads.length === 0 ? (
            /* Empty state */
            <div className="glass-card p-16 text-center">
              <div className="size-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
                <User className="size-8 text-accent opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">
                {search || stage ? "No leads match your search" : "No leads yet"}
              </h3>
              <p className="text-sm text-text-secondary max-w-sm mx-auto mb-5">
                {search || stage
                  ? "Try adjusting your filters or search terms."
                  : "Create your first lead to start tracking prospects and running AI-powered outreach."}
              </p>
              {!search && !stage && canManage && (
                <Button onClick={() => setCreateOpen(true)}>Create your first lead</Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* ── Grid View ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map((lead, i) => renderCard(lead, i))}
            </div>
          ) : (
            /* ── List View ── */
            <div className="space-y-0.5">
              {/* List header */}
              <div className="flex items-center gap-4 px-4 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                <span className="w-48">客户</span>
                <span className="w-28">阶段</span>
                <span className="w-32">评分</span>
                <span className="flex-1">邮箱</span>
                <span className="w-24">来源</span>
                <span className="w-28">标签</span>
                <span className="w-20 text-right">日期</span>
              </div>
              {leads.map((lead, i) => renderListRow(lead, i))}
            </div>
          )}

          {/* Loading overlay for refetches */}
          {isLoading && leads.length > 0 && (
            <div className="text-center py-2 text-xs text-text-muted animate-pulse">更新中…</div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 text-sm">
              <span className="text-text-muted">
                Page {page} of {totalPages} &middot; {total} leads
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
