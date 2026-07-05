import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { callDeepSeekJSON, PROMPT_ARMOR, safe, buildMetric } from "@salesagent/ai-core";

export async function POST(
  _req: Request,
  { params }: { params: { slug: string; id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { lead: true, agent: true, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation || conversation.organizationId !== membership.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const agent = conversation.agent;
  const lead = conversation.lead;
  const allMessages = conversation.messages;

  // Full history so AI knows what was already said
  const history = allMessages
    .map((m) => {
      const who = m.direction === "inbound" ? "客户" : "我方";
      return `[${who}]: ${m.content.slice(0, 600)}`;
    })
    .join("\n\n");

  const latestInbound = [...allMessages].reverse().find((m) => m.direction === "inbound");
  const lastOutbound = [...allMessages].reverse().find((m) => m.direction === "outbound");

  const system = PROMPT_ARMOR + "\n\n你是一个专业的 B2B 销售顾问。撰写销售跟进消息。\n严格规则：\n- 仔细阅读完整对话历史——如果之前已做过产品介绍、发过报价、安排过会议，绝对不要重复\n- 基于客户最新消息和当前阶段决定下一步\n- 用客户的语言回复\n- 自然专业有人情味\n\n返回 JSON：{ \"subject\": \"主题\", \"body\": \"正文\", \"tone\": \"friendly|professional|consultative\", \"suggestedAction\": \"send_now|review\" }";

  const prompt = "撰写回复草稿：\n\n客户: " + safe(lead.name) + "（" + safe(lead.company || "未知") + "）\n阶段: " + safe(lead.stage || "new") + " | 评分: " + (lead.score ?? "未评分") + "\n\n你的角色: " + safe(agent?.name || "AI 销售助理") + "\n性格: " + safe(agent?.personality || "专业友好") + "\n\n完整对话历史:\n" + (history || "（新对话）") + "\n\n" + (latestInbound ? "客户最新消息: " + safe(latestInbound.content.slice(0, 1000)) + "\n" : "") + (lastOutbound ? "我方最后回复: " + safe(lastOutbound.content.slice(0, 300)) + "\n" : "") + "\n请基于完整上下文撰写回复。不要重复对话历史中已出现的内容。";

  try {
    const llmStart = Date.now();
    const { result: draft, usage } = await callDeepSeekJSON<{
      subject: string; body: string; tone: string; suggestedAction: string;
    }>(prompt, system, { temperature: 0.7, timeoutMs: 20_000 });
    const llmLatencyMs = Date.now() - llmStart;

    try {
      await prisma.aICallMetric.create({
        data: buildMetric(
          { organizationId: membership.organizationId, jobType: "compose_response", conversationId: conversation.id, leadId: lead.id },
          usage, llmLatencyMs, llmLatencyMs, true, false,
        ),
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("[ai-draft] Failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "AI 草稿生成失败" }, { status: 500 });
  }
}
