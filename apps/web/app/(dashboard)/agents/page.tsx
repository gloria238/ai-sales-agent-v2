import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AgentListClient } from "./agents-client";

export default async function AgentsPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) redirect("/login");

  const agents = await prisma.agent.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      _count: { select: { conversations: true, campaigns: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AgentListClient agents={agents} orgSlug={params.slug} />;
}
