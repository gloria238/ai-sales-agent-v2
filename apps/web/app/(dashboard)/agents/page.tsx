import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AgentListClient } from "./agents-client";

export default async function AgentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const agents = await prisma.agent.findMany({
    where: { organizationId: session.orgId },
    include: {
      _count: { select: { conversations: true, campaigns: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AgentListClient agents={agents} orgSlug={session.orgSlug} />;
}
