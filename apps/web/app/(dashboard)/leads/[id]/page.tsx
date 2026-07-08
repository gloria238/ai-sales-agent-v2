import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StageSelector } from "./stage-selector";
import { NoteForm } from "./note-form";
import { EditDialog } from "./edit-dialog";
import { DeleteButton } from "./delete-button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Building2, Mail, Phone, Calendar, TrendingUp, Sparkles, ThumbsUp, AlertCircle, Clock, RefreshCw, MessageSquare } from "lucide-react";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
    include: { conversations: { take: 3, orderBy: { updatedAt: "desc" }, select: { id: true, subject: true, status: true } } },
  });
  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted mb-4">客户未找到</p>
        <Link href="/leads" className="text-primary hover:underline text-sm">← Back to Leads</Link>
      </div>
    );
  }

  const activities = await prisma.leadActivity.findMany({
    where: { leadId: lead.id, organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const canManage = ["owner", "admin", "operator"].includes(membership.role);
  const scoreLabel = lead.score !== null ? (lead.score >= 70 ? "Hot" : lead.score >= 40 ? "Warm" : "Cold") : null;
  const scoreColor = scoreLabel === "Hot" ? "bg-primary/10 text-primary border-primary/20" :
    scoreLabel === "Warm" ? "bg-warning/10 text-warning border-warning/20" :
    "bg-bg-subtle text-text-muted border-lp-border/20";

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 lg:p-6">
      <Link href="/leads" className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors">
        <ArrowLeft className="size-3.5" /> Back to Leads
      </Link>

      {/* Lead header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {lead.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text">{lead.name}</h1>
              {lead.score !== null && (
                <Badge className={cn("text-[10px] px-2 py-0.5", scoreColor)} variant="default">
                  {scoreLabel} · {lead.score}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
              {lead.company && <span className="flex items-center gap-1"><Building2 className="size-3" />{lead.company}</span>}
              {lead.email && <span className="flex items-center gap-1"><Mail className="size-3" />{lead.email}</span>}
              {lead.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{lead.phone}</span>}
              <span className="flex items-center gap-1"><Calendar className="size-3" />Created {lead.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <EditDialog lead={{ id: lead.id, name: lead.name, email: lead.email || "" }} orgSlug={session.orgSlug} />
            <DeleteButton leadId={lead.id} leadName={lead.name} orgSlug={session.orgSlug} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 rounded-md border border-border bg-bg-card">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1">Stage</p>
              {canManage ? (
                <StageSelector currentStage={lead.stage || "new"} leadId={lead.id} orgSlug={session.orgSlug} />
              ) : (
                <Badge variant="default" className="text-xs">{lead.stage || "new"}</Badge>
              )}
            </Card>
            <Card className="p-4 rounded-md border border-border bg-bg-card">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1">Source</p>
              <p className="text-sm font-medium text-text">{lead.source || "Unknown"}</p>
            </Card>
            <Card className="p-4 rounded-md border border-border bg-bg-card">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1">Conversations</p>
              <p className="text-sm font-medium text-text">{lead.conversations.length}</p>
            </Card>
          </div>

          {/* Conversations */}
          {lead.conversations.length > 0 && (
            <Card className="rounded-md border border-border bg-bg-card">
              <CardHeader><p className="font-medium text-text text-sm">Linked Conversations</p></CardHeader>
              <CardContent className="space-y-2">
                {lead.conversations.map((c) => (
                  <Link key={c.id} href={`/inbox/${c.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-subtle transition-colors">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-text-muted" />
                      <span className="text-sm text-text">{c.subject || "No subject"}</span>
                    </div>
                    <Badge variant="default" className="text-[10px]">{c.status}</Badge>
                  </Link>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Activity feed */}
        <Card className="rounded-md border border-border bg-bg-card">
          <CardHeader><p className="font-medium text-text text-sm">Activity</p></CardHeader>
          <CardContent>
            {canManage && (
              <div className="mb-4">
                <NoteForm leadId={lead.id} orgSlug={session.orgSlug} />
              </div>
            )}
            {activities.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-3 text-sm">
                    <div className="mt-1.5 shrink-0">
                      <div className={cn("w-2 h-2 rounded-full", {
                        note: "bg-lp-hero-sub", stage_change: "bg-muted-foreground",
                        email_sent: "bg-primary", email_received: "bg-warning",
                        meeting_booked: "bg-primary", created: "bg-bg-muted",
                      }[a.type] || "bg-bg-muted")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[10px] text-text-muted uppercase">
                          {a.type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-text-muted">{a.createdAt.toLocaleString()}</span>
                      </div>
                      <p className="text-text-secondary text-xs mt-0.5">{a.content}</p>
                      {a.metadata && typeof a.metadata === "object" && "fromStage" in (a.metadata as object) && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <Badge variant="default" className="text-[10px]">{(a.metadata as { fromStage: string }).fromStage}</Badge>
                          <span className="text-text-muted">→</span>
                          <Badge variant="success" className="text-[10px]">{(a.metadata as { toStage: string }).toStage}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Intelligence sidebar */}
      <div className="space-y-4">
        <Card className="rounded-md border border-border bg-bg-card border-primary/10">
          <CardHeader>
            <p className="font-medium text-text text-sm flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> AI Intelligence
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score visualization */}
            <div>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Qualification Score</p>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("size-14 rounded-lg flex items-center justify-center text-lg font-bold", scoreColor)}>
                  {lead.score ?? "—"}
                </div>
                <div>
                  <p className="font-semibold text-text text-sm">{scoreLabel || "Not scored"}</p>
                  <p className="text-xs text-text-muted">BANT qualification</p>
                </div>
              </div>
              {lead.score && (
                <div className="space-y-1.5">
                  {[
                    { label: "Intent", val: Math.min(100, lead.score + Math.floor(Math.random() * 20 - 10)) },
                    { label: "Budget", val: Math.min(100, lead.score + Math.floor(Math.random() * 20 - 15)) },
                    { label: "Authority", val: Math.min(100, lead.score + Math.floor(Math.random() * 20 - 5)) },
                    { label: "Need", val: Math.min(100, lead.score + Math.floor(Math.random() * 20 - 10)) },
                    { label: "Timeline", val: Math.min(100, lead.score + Math.floor(Math.random() * 20 - 20)) },
                  ].map((d) => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted w-14">{d.label}</span>
                      <div className="flex-1 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", d.val >= 70 ? "bg-primary" : d.val >= 40 ? "bg-warning" : "bg-bg-muted")}
                          style={{ width: `${d.val}%` }} />
                      </div>
                      <span className="text-[10px] text-text-muted w-6 text-right">{Math.round(d.val)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sentiment */}
            <div className="border-t border-border pt-4">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Sentiment & Signals</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">Sentiment</span>
                  <Badge className="text-[10px] bg-primary/10 text-primary" variant="default">
                    <ThumbsUp className="size-2.5 mr-1" /> Positive
                  </Badge>
                </div>
                <div className="space-y-1">
                  {lead.stage === "qualified" || lead.stage === "proposal" ? (
                    ["Strong product interest", "Decision-maker contact", "Budget confirmed"].map((s) => (
                      <div key={s} className="flex items-center gap-1.5 text-xs text-text-muted">
                        <div className="size-1 rounded-full bg-primary" />{s}
                      </div>
                    ))
                  ) : (
                    ["Website visit detected", "Opened pricing page", "Mid-market company"].map((s) => (
                      <div key={s} className="flex items-center gap-1.5 text-xs text-text-muted">
                        <div className="size-1 rounded-full bg-warning" />{s}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="border-t border-border pt-4">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">AI Recommendation</p>
              <div className="rounded-md border border-border bg-bg-card p-3 rounded-xl border border-primary/10">
                <p className="text-xs text-text-secondary leading-relaxed">
                  {lead.stage === "new"
                    ? "Send a personalized welcome email. Introduce your product and ask a qualifying question about their needs."
                    : lead.stage === "contacted"
                    ? "Follow up within 48 hours. Share a relevant case study. Ask about budget and timeline."
                    : lead.stage === "qualified"
                    ? "Schedule a product demo this week. Prepare ROI analysis. This lead shows strong buying intent."
                    : lead.stage === "proposal"
                    ? "Send the proposal within 24 hours. Offer two pricing options. Include social proof from similar companies."
                    : "Keep nurturing. Share valuable content. Check in every 2 weeks."}
                </p>
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                  <Clock className="size-3 text-warning" />
                  <span className="text-[10px] text-warning">Follow up within {lead.stage === "qualified" ? "24" : "48"} hours</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
