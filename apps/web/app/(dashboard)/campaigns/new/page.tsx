import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CampaignCreateClient } from "./campaign-create-client";

export default async function CampaignCreatePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const agents = await prisma.agent.findMany({
    where: { organizationId: session.orgId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const scripts = await prisma.script.findMany({
    where: { organizationId: session.orgId },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  return <CampaignCreateClient agents={agents} scripts={scripts} orgSlug={session.orgSlug} />;
}
