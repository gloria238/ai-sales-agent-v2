import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";
import { callDeepSeekJSON, SUMMARIZE_CONVERSATION_SYSTEM, buildSummarizeConversationPrompt, buildMetric } from "@salesagent/ai-core";
import { summarizeConversationSchema } from "@/lib/validation";
import { isEnabled } from "@/lib/feature-flags";

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  if (!isEnabled("ai_summarize_conversation")) {
    return NextResponse.json({ error: "AI conversation summarization is disabled" }, { status: 503 });
  }

  const body = await request.json();
  const parsed = summarizeConversationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  const conversation = await prisma.conversation.findFirst({
    where: { id: parsed.data.conversationId, organizationId: membership.organizationId },
    include: {
      lead: { select: { name: true, company: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  try {
    const prompt = buildSummarizeConversationPrompt({
      leadName: conversation.lead.name,
      leadCompany: conversation.lead.company || undefined,
      messages: conversation.messages.map((m) => ({
        direction: m.direction,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });

    const llmStart = Date.now();
    const { result: summary, usage } = await callDeepSeekJSON<{
      summary: string; keyPoints: string[]; objections: string[];
      sentiment: string; buyingSignals: string[]; missingInfo: string[];
      nextSteps: string[]; shouldEscalate: boolean;
    }>(prompt, SUMMARIZE_CONVERSATION_SYSTEM, { temperature: 0.3 });
    const latencyMs = Date.now() - llmStart;

    // Log AI call metric (non-blocking)
    const metric = buildMetric(
      { organizationId: membership.organizationId, jobType: "summarize_conversation", conversationId: conversation.id },
      usage, latencyMs, latencyMs, true, false,
    );
    prisma.aICallMetric.create({ data: metric }).catch(() => {});

    return NextResponse.json(summary);
  } catch (err) {
    // Log failed metric (non-blocking)
    const failMetric = buildMetric(
      { organizationId: membership!.organizationId, jobType: "summarize_conversation" },
      undefined, 0, 0, false, true,
      err instanceof Error ? err.message.slice(0, 200) : "unknown",
    );
    prisma.aICallMetric.create({ data: failMetric }).catch(() => {});
    console.error("Summarization error:", err instanceof Error ? err.message : "Unknown");
    return NextResponse.json({ error: "Summarization failed" }, { status: 502 });
  }
}
