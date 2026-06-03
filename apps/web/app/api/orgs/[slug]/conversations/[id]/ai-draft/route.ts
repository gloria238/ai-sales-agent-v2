import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";
import { callDeepSeekJSON, COMPOSE_RESPONSE_SYSTEM, buildComposeResponsePrompt } from "@salesagent/ai-core";
import { isEnabled } from "@/lib/feature-flags";

export async function POST(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  if (!isEnabled("ai_compose_response")) {
    return NextResponse.json({ error: "AI response composition is not enabled" }, { status: 503 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
    include: {
      lead: true,
      agent: true,
      messages: { orderBy: { createdAt: "asc" }, take: 20 },
    },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const latestMessage = conversation.messages.filter((m) => m.direction === "inbound").pop();

  const prompt = buildComposeResponsePrompt({
    leadName: conversation.lead.name,
    leadEmail: conversation.lead.email || "",
    leadStage: conversation.lead.stage || "new",
    leadCompany: conversation.lead.company || undefined,
    leadScore: conversation.lead.score || undefined,
    agentPersonality: conversation.agent?.personality || "Professional, friendly B2B SDR",
    agentGoals: conversation.agent?.goals ? JSON.stringify(conversation.agent.goals) : "Qualify leads and book meetings",
    knowledgeBase: conversation.agent?.knowledgeBase ? JSON.stringify(conversation.agent.knowledgeBase) : "Standard SaaS product knowledge",
    conversationHistory: conversation.messages.map((m) => ({
      direction: m.direction,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    latestMessage: latestMessage?.content,
  });

  try {
    const result = await callDeepSeekJSON<{ subject: string; body: string; tone: string; suggestedAction: string }>(
      prompt,
      COMPOSE_RESPONSE_SYSTEM,
      { temperature: 0.7 },
    );

    return NextResponse.json({
      draft: {
        subject: result.subject,
        body: result.body,
        tone: result.tone,
        suggestedAction: result.suggestedAction || "review",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "AI composition failed", retryable: true }, { status: 500 });
  }
}
