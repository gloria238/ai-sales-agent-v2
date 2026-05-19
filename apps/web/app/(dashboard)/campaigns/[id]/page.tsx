import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CampaignDetailClient } from "./campaign-detail-client";

export default async function CampaignDetailPage({ params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) redirect("/login");

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
    include: {
      script: true,
      agent: { select: { id: true, name: true } },
      runs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!campaign) redirect("/campaigns");

  return <CampaignDetailClient campaign={JSON.parse(JSON.stringify(campaign))} orgSlug={params.slug} />;
}
