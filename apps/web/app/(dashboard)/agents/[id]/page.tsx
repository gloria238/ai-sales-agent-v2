import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AgentDetailClient } from "./agent-detail-client";

export default async function AgentDetailPage({ params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) redirect("/login");

  const agent = await prisma.agent.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
    include: {
      conversations: { take: 5, orderBy: { updatedAt: "desc" } },
      campaigns: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });
  if (!agent) redirect("/agents");

  return <AgentDetailClient agent={JSON.parse(JSON.stringify(agent))} orgSlug={params.slug} />;
}
