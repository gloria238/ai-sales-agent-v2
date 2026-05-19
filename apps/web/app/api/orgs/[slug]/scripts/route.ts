import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission, checkPermission } from "@/lib/permissions";
import { installScriptSchema } from "@/lib/validation";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const scripts = await prisma.script.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ scripts });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  const body = await req.json();
  const parsed = installScriptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Pre-built script templates
  const TEMPLATES: Record<string, { name: string; description: string; category: string; steps: unknown[] }> = {
    "saas-cold-outreach": {
      name: "SaaS Cold Outreach — SPIN Method",
      description: "4-step cold email sequence for SaaS founders. Uses SPIN methodology.",
      category: "cold_outreach",
      steps: [
        { order: 1, type: "ai_email", subject: "Quick question about {{lead.company}}", template: "Personalize a cold email introducing our SaaS product to {{lead.name}} at {{lead.company}}. Focus on a specific problem their industry faces.", delay: "0d" },
        { order: 2, type: "ai_email", subject: "Re: {{lead.company}}", template: "Follow up with {{lead.name}} — reference the first email, add a relevant case study or stat. Keep it brief.", delay: "3d" },
        { order: 3, type: "ai_email", subject: "One last thing, {{lead.name}}", template: "Final follow-up. Acknowledge they're busy, offer a 15-min call or a case study. Make it easy to respond.", delay: "7d" },
        { order: 4, type: "ai_email", subject: "Closing the loop", template: "Breakup email for {{lead.name}}. No pressure, leave the door open. Include a link to a valuable resource.", delay: "14d" },
      ],
    },
    "b2b-follow-up": {
      name: "B2B Follow-Up Sequence",
      description: "3-step follow-up after initial contact. Keeps you top of mind.",
      category: "follow_up",
      steps: [
        { order: 1, type: "ai_email", subject: "Following up, {{lead.name}}", template: "Gentle follow-up to {{lead.name}} referencing your last conversation. Add value — share an article, tip, or insight.", delay: "2d" },
        { order: 2, type: "ai_email", subject: "{{lead.company}} + [Our Product]", template: "Second follow-up to {{lead.name}}. Share a relevant case study or result. Include a clear, low-friction CTA.", delay: "5d" },
        { order: 3, type: "ai_email", subject: "Worth a quick chat?", template: "Final follow-up to {{lead.name}}. Offer a 15-min call. Make it easy to say yes or no.", delay: "10d" },
      ],
    },
    "re-engagement": {
      name: "Re-engagement Campaign",
      description: "3-step re-engagement for cold leads. Win back lost opportunities.",
      category: "re_engagement",
      steps: [
        { order: 1, type: "ai_email", subject: "Still interested, {{lead.name}}?", template: "Re-engage {{lead.name}} at {{lead.company}}. Acknowledge the gap, share what's new since last contact.", delay: "0d" },
        { order: 2, type: "ai_email", subject: "Something new for {{lead.company}}", template: "Share a new feature, case study, or industry insight with {{lead.name}}. Show continued relevance.", delay: "7d" },
        { order: 3, type: "ai_email", subject: "{{lead.name}}, closing the loop", template: "Final check-in. No pressure. Leave the door open for future contact.", delay: "14d" },
      ],
    },
  };

  const template = TEMPLATES[parsed.data.slug];
  if (!template) return NextResponse.json({ error: "Script template not found" }, { status: 404 });

  // Check if already installed
  const existing = await prisma.script.findFirst({
    where: { organizationId: membership.organizationId, name: template.name },
  });
  if (existing) return NextResponse.json({ script: existing, alreadyInstalled: true });

  const script = await prisma.script.create({
    data: {
      organizationId: membership.organizationId,
      name: template.name,
      description: template.description,
      category: template.category,
      steps: template.steps as any,
    },
  });

  return NextResponse.json({ script }, { status: 201 });
}
