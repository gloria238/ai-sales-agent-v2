import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const docs = await prisma.document.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, type: true, status: true,
      chunkCount: true, metadata: true, createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json({ documents: docs });
}
