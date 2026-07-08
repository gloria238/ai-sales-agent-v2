import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { scoreLeadSchema } from "@/lib/validation";
import { isEnabled } from "@/lib/feature-flags";
import { getRequestContext } from "@/lib/logger";

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

  const lead = await prisma.lead.findFirst({
    where: { id: parsed.data.leadId, organizationId: membership.organizationId },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Enqueue scoring job via BullMQ — Worker handles the actual DeepSeek call
  // with retry, concurrency control, PROMPT_ARMOR, and AICallMetric logging.
  try {
    const ctx = getRequestContext(request);
    const { scoringQueue } = await import("@salesagent/worker/queue");
    await scoringQueue.add("score-lead", {
      leadId: lead.id,
      context: { requestId: ctx.requestId, spanId: `http-score-${ctx.requestId.slice(0, 8)}` },
    });
    return NextResponse.json({ queued: true, leadId: lead.id });
  } catch {
    // Redis unavailable — return an error, caller can retry
    return NextResponse.json({ error: "Scoring service unavailable, please retry" }, { status: 503 });
  }
}
