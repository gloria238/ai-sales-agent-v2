import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ScriptDetailClient } from "./script-detail-client";

export default async function ScriptDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const script = await prisma.script.findFirst({
    where: { id: params.id, organizationId: session.orgId },
    include: {
      campaigns: { take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, status: true } },
    },
  });
  if (!script) redirect("/scripts");

  return <ScriptDetailClient script={JSON.parse(JSON.stringify(script))} orgSlug={session.orgSlug} />;
}
