import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CampaignCreateClient } from "./campaign-create-client";

export default async function CampaignCreatePage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) redirect("/login");

  const [agents, scripts] = await Promise.all([
    prisma.agent.findMany({
      where: { organizationId: membership.organizationId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.script.findMany({
      where: { organizationId: membership.organizationId },
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <CampaignCreateClient agents={agents} scripts={scripts} orgSlug={params.slug} />;
}
