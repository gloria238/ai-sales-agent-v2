// Delete an API key
import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";

export async function DELETE(_request: Request, { params }: { params: { slug: string; keyId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const _perm = checkPermission(membership.role, "manage_api_keys"); if (_perm) return _perm;

  const key = await prisma.apiKey.findFirst({
    where: { id: params.keyId, organizationId: membership.organizationId },
  });
  if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  await prisma.apiKey.delete({ where: { id: key.id } });

  return NextResponse.json({ deleted: true });
}
