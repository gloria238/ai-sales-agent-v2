import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { KbClient } from "./kb-client";

export const dynamic = "force-dynamic";

export default async function KbPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: session.orgSlug } },
  });
  if (!membership) redirect("/login");

  const docs = await prisma.document.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, type: true, status: true,
      chunkCount: true, metadata: true, createdAt: true,
    },
  });

  return <KbClient orgSlug={session.orgSlug} initialDocs={docs.map(d => ({ ...d, createdAt: d.createdAt.toISOString() }))} />;
}
