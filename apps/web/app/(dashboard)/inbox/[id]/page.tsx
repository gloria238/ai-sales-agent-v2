import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InboxDetailClient } from "./inbox-detail-client";

export default async function InboxDetailPage({ params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) redirect("/login");

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, organizationId: membership.organizationId },
    include: {
      lead: true,
      agent: { select: { id: true, name: true, personality: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) redirect("/inbox");

  // Fetch all conversations for the side list
  const conversations = await prisma.conversation.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      lead: { select: { id: true, name: true, email: true, company: true, stage: true, score: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <InboxDetailClient
      conversation={JSON.parse(JSON.stringify(conversation))}
      conversations={JSON.parse(JSON.stringify(conversations))}
      orgSlug={params.slug}
    />
  );
}
