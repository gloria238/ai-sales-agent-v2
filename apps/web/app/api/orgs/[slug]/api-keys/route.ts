// API key management — list and create (Prisma ApiKey model)
import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { createApiKeySchema } from "@/lib/validation";
import crypto from "crypto";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const _perm = checkPermission(membership.role, "view_api_keys"); if (_perm) return _perm;

  const keys = await prisma.apiKey.findMany({
    where: { organizationId: membership.organizationId },
    select: { id: true, name: true, prefix: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const _perm2 = checkPermission(membership.role, "manage_api_keys"); if (_perm2) return _perm2;

  const body = await request.json();
  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const name = parsed.data.name;

  const token = `of_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = token.slice(0, 10);
  const hashedKey = crypto.createHash("sha256").update(token).digest("hex");

  await prisma.apiKey.create({
    data: {
      organizationId: membership.organizationId,
      name,
      prefix,
      hashedKey,
    },
  });

  return NextResponse.json({ key: { id: prefix, name, prefix, token } }, { status: 201 });
}
