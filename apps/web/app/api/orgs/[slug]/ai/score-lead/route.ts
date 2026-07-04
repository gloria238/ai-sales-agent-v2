import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";
import { callDeepSeekJSON, LEAD_SCORING_SYSTEM, buildLeadScoringPrompt } from "@salesagent/ai-core";
import { scoreLeadSchema } from "@/lib/validation";
import { isEnabled } from "@/lib/feature-flags";

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_leads"); if (_perm) return _perm;

  if (!isEnabled("ai_lead_scoring")) {
    return NextResponse.json({ error: "AI lead scoring is disabled" }, { status: 503 });
  }

  const body = await request.json();
  const parsed = scoreLeadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const dbLead = await prisma.lead.findFirst({
    where: { id: parsed.data.leadId, organizationId: membership.organizationId },
    include: { activities: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!dbLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const lead = {
    name: dbLead.name,
    email: dbLead.email,
    company: dbLead.company,
    stage: dbLead.stage,
    source: dbLead.source,
    tags: dbLead.tags,
    createdAt: dbLead.createdAt.toISOString(),
    recentActivity: dbLead.activities.map((a) => ({
      type: a.type,
      content: a.content,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  try {
    const prompt = buildLeadScoringPrompt(lead);
    const { result: scoreData, usage: _scoreUsage } = await callDeepSeekJSON<{
      score: number; label: string; breakdown: Record<string, number>;
      signals: string[]; concerns: string[]; recommendedAction: string; recommendedAgentType: string;
    }>(prompt, LEAD_SCORING_SYSTEM, { temperature: 0.3 });

    const score = Math.max(0, Math.min(100, Math.round(scoreData.score ?? 0)));
    const label = scoreData.label || (score >= 70 ? "hot" : score >= 40 ? "warm" : "cold");

    // Persist score to lead
    await prisma.lead.update({ where: { id: dbLead.id }, data: { score } });

    return NextResponse.json({
      score,
      label,
      breakdown: scoreData.breakdown || {},
      signals: scoreData.signals || [],
      concerns: scoreData.concerns || [],
      recommendedAction: scoreData.recommendedAction || "Review lead",
      recommendedAgentType: scoreData.recommendedAgentType || "inbound_qualifier",
    });
  } catch (err) {
    console.error("Lead scoring error:", err instanceof Error ? err.message : "Unknown");
    return NextResponse.json({ error: "Scoring failed" }, { status: 502 });
  }
}
