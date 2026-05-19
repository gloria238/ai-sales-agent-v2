// Delete an API key
import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";

export async function DELETE(_request: Request, { params }: { params: { slug: string; keyId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { requirePermission(membership.role, "manage_org"); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const org = await prisma.organization.findUnique({
    where: { id: membership.organizationId },
    select: { apiKeys: true },
  });

  const keys = (org?.apiKeys as Array<{ id: string; name: string; prefix: string; hash: string; createdAt: string }>) || [];
  const filtered = keys.filter((k) => k.id !== params.keyId);

  if (filtered.length === keys.length) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  await prisma.organization.update({
    where: { id: membership.organizationId },
    data: { apiKeys: filtered },
  });

  return NextResponse.json({ deleted: true });
}
