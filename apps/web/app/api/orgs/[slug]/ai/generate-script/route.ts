import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";
import { callDeepSeekJSON } from "@/lib/ai";
import { GENERATE_SCRIPT_SYSTEM, buildGenerateScriptPrompt } from "@/lib/prompts";
import { generateScriptSchema } from "@/lib/validation";
import { isEnabled } from "@/lib/feature-flags";

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  if (!isEnabled("ai_generate_script")) {
    return NextResponse.json({ error: "AI script generation is disabled" }, { status: 503 });
  }

  const body = await request.json();
  const parsed = generateScriptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  try {
    const prompt = buildGenerateScriptPrompt({
      description: parsed.data.description,
      industry: parsed.data.industry,
      targetPersona: parsed.data.targetPersona,
      goal: parsed.data.goal,
      channel: parsed.data.channel,
    });

    const result = await callDeepSeekJSON<{
      name: string; description: string; category: string;
      bestPractices: string[]; subjectLineTips: string[];
      steps: Array<{ order: number; type: string; template?: string; subject?: string; delay?: string; condition?: string }>;
    }>(prompt, GENERATE_SCRIPT_SYSTEM, { temperature: 0.8 });

    return NextResponse.json({ script: result });
  } catch (err) {
    console.error("Script generation error:", err instanceof Error ? err.message : "Unknown");
    return NextResponse.json({ error: "Script generation failed" }, { status: 502 });
  }
}
