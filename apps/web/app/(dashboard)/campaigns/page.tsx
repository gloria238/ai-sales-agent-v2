import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CampaignListClient } from "./campaigns-client";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: session.orgId },
    include: {
      script: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
      _count: { select: { runs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <CampaignListClient campaigns={JSON.parse(JSON.stringify(campaigns))} orgSlug={session.orgSlug} />;
}
