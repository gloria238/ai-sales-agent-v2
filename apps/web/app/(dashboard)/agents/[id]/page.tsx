import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AgentDetailClient } from "./agent-detail-client";

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const agent = await prisma.agent.findFirst({
    where: { id: params.id, organizationId: session.orgId },
    include: {
      conversations: { take: 5, orderBy: { updatedAt: "desc" } },
      campaigns: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });
  if (!agent) redirect("/agents");

  return <AgentDetailClient agent={JSON.parse(JSON.stringify(agent))} orgSlug={session.orgSlug} />;
}
