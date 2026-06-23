"use client";
import { Avatar } from "./avatar";
import { PresenceDot } from "./presence";
import type { PresenceState } from "@/lib/time";
import { relativeTime, presenceFromDate } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Building2, Mail, Sparkles, User, ChevronRight } from "lucide-react";

// ── Customer type (the operational identity) ──────────────────

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  avatarSeed?: string;
  stage?: string | null;
  score?: number | null | undefined;
  agentName?: string | null;
  agentId?: string | null;
  aiConfidence?: number | null;
  lastSeenAt?: string | null;
}

// ── Stage config ──────────────────────────────────────────────

const STAGE_CONFIG: Record<string, { dot: string; color: string }> = {
  new:          { dot: "bg-text-muted", color: "text-text-muted" },
  contacted:    { dot: "bg-lp-hero-sub", color: "text-lp-hero-sub" },
  qualified:    { dot: "bg-lp-hero-sub", color: "text-lp-hero-sub" },
  proposal:     { dot: "bg-warning", color: "text-warning" },
  negotiation:  { dot: "bg-warning", color: "text-warning" },
  closed_won:   { dot: "bg-accent", color: "text-accent" },
  closed_lost:  { dot: "bg-danger", color: "text-danger" },
};

const SCORE_LABEL = (s: number) => (s >= 70 ? "Hot" : s >= 40 ? "Warm" : "Cold");
const SCORE_BG = (s: number) =>
  s >= 70
    ? "bg-accent-soft text-accent"
    : s >= 40
    ? "bg-warning-soft text-warning"
    : "bg-bg-subtle text-text-muted";

// ── Sub-components ─────────────────────────────────────────────

function CustomerMeta({ customer, compact }: { customer: Customer; compact?: boolean }) {
  return (
    <div className="min-w-0 flex-1">
      <p className={cn("font-semibold text-text truncate", compact ? "text-[13px]" : "text-sm")}>
        {customer.name}
      </p>
      {customer.company ? (
        <p className="text-[11px] text-text-muted truncate flex items-center gap-1 mt-0.5">
          <Building2 className="size-3 shrink-0 opacity-60" />
          {customer.company}
        </p>
      ) : customer.email ? (
        <p className="text-[11px] text-text-muted truncate flex items-center gap-1 mt-0.5">
          <Mail className="size-3 shrink-0 opacity-60" />
          {customer.email}
        </p>
      ) : null}
    </div>
  );
}

function LeadIntent({ score }: { score: number | null | undefined }) {
  if (score == null) return null;
  const label = SCORE_LABEL(score);
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", SCORE_BG(score))}>
      {label} &middot; {score}
    </span>
  );
}

function AIState({ customer, compact }: { customer: Customer; compact?: boolean }) {
  if (compact) {
    // Compact: just show agent name or AI indicator
    if (customer.agentName) {
      return (
        <span className="text-[10px] text-text-muted flex items-center gap-1">
          <Sparkles className="size-2.5 text-accent" />
          {customer.agentName}
        </span>
      );
    }
    return null;
  }

  // Expanded: show full AI ownership
  if (customer.agentName) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
          <Sparkles className="size-2.5" />
          AI handling
        </span>
        {customer.aiConfidence != null && (
          <span className="text-[10px] text-text-muted">
            {customer.aiConfidence}% confidence
          </span>
        )}
      </div>
    );
  }

  // No agent assigned — may need human
  if (customer.lastSeenAt) {
    const presence = presenceFromDate(customer.lastSeenAt);
    if (presence === "offline") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-warning mt-1">
          <User className="size-2.5" />
          Needs human review
        </span>
      );
    }
  }

  return null;
}

function ActivityTimestamp({ lastSeenAt }: { lastSeenAt?: string | null }) {
  if (!lastSeenAt) return null;
  const presence = presenceFromDate(lastSeenAt);
  const time = relativeTime(lastSeenAt);

  return (
    <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
      {presence !== "offline" && <PresenceDot state={presence} />}
      {time}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────

interface IdentityCardProps {
  customer: Customer;
  variant?: "compact" | "expanded";
  showAIState?: boolean;
  showScore?: boolean;
  showPresence?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  /** Optional: render a snippet of the last message below identity */
  messagePreview?: string;
  /** Optional: right-side slot for actions */
  actions?: React.ReactNode;
}

export function IdentityCard({
  customer,
  variant = "compact",
  showAIState = true,
  showScore = true,
  showPresence = true,
  isActive,
  onClick,
  className,
  messagePreview,
  actions,
}: IdentityCardProps) {
  const presence = showPresence ? presenceFromDate(customer.lastSeenAt ?? null) : null;
  const isClickable = !!onClick;
  const Tag = isClickable ? "button" : "div";

  if (variant === "compact") {
    return (
      <Tag
        onClick={onClick}
        className={cn(
          "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group",
          isClickable && "cursor-pointer",
          isActive
            ? "bg-accent/5 border-l-2 border-l-accent shadow-sm"
            : "border-l-2 border-l-transparent hover:bg-bg-subtle hover:border-l-accent/30",
          className,
        )}
      >
        <Avatar
          name={customer.name}
          size="sm"
          presence={presence}
          seed={customer.avatarSeed}
        />
        <div className="flex-1 min-w-0">
          <CustomerMeta customer={customer} compact />
          {messagePreview && (
            <p className="text-[11px] text-text-muted truncate mt-0.5 leading-relaxed">
              {messagePreview}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {showScore && <LeadIntent score={customer.score} />}
            {showAIState && <AIState customer={customer} compact />}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <ActivityTimestamp lastSeenAt={customer.lastSeenAt} />
          {isClickable && (
            <ChevronRight className="size-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform" />
          )}
        </div>
      </Tag>
    );
  }

  // ── Expanded variant ──
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl transition-all duration-150",
        isClickable && "cursor-pointer hover:bg-bg-subtle/50",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar
          name={customer.name}
          size="lg"
          presence={presence}
          seed={customer.avatarSeed}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CustomerMeta customer={customer} />
              {customer.stage && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
                    <span className={cn("size-1.5 rounded-full", STAGE_CONFIG[customer.stage]?.dot)} />
                    {customer.stage.replace(/_/g, " ")}
                  </span>
                  {showScore && <LeadIntent score={customer.score} />}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showScore && customer.score != null && (
                <div className={cn(
                  "size-12 rounded-xl flex items-center justify-center text-base font-bold",
                  SCORE_BG(customer.score),
                )}>
                  {customer.score}
                </div>
              )}
              {actions}
            </div>
          </div>

          {showAIState && <AIState customer={customer} />}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            {customer.email && (
              <span className="text-[11px] text-text-muted truncate max-w-[60%]">
                {customer.email}
              </span>
            )}
            <ActivityTimestamp lastSeenAt={customer.lastSeenAt} />
          </div>
        </div>
      </div>
    </Tag>
  );
}
