// API key management — list and create
import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { createApiKeySchema } from "@/lib/validation";
import crypto from "crypto";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { requirePermission(membership.role, "view_audit_log"); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  // Store API keys in a JSON field on the organization for simplicity
  const org = await prisma.organization.findUnique({
    where: { id: membership.organizationId },
    select: { apiKeys: true },
  });

  const keys = (org?.apiKeys as Array<{ id: string; name: string; prefix: string; createdAt: string }>) || [];
  // Return masked keys (only show prefix)
  return NextResponse.json({
    keys: keys.map((k) => ({ id: k.id, name: k.name, prefix: k.prefix, createdAt: k.createdAt })),
  });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { requirePermission(membership.role, "manage_org"); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const body = await request.json();
  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const name = parsed.data.name;

  const token = `of_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = token.slice(0, 10);
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const keyObj = { id: crypto.randomUUID(), name, prefix, hash, createdAt: new Date().toISOString() };

  const org = await prisma.organization.findUnique({
    where: { id: membership.organizationId },
    select: { apiKeys: true },
  });

  const existing = (org?.apiKeys as Array<typeof keyObj>) || [];
  await prisma.organization.update({
    where: { id: membership.organizationId },
    data: { apiKeys: [...existing, keyObj] },
  });

  return NextResponse.json({ key: { id: keyObj.id, name, prefix, token } }, { status: 201 });
}
