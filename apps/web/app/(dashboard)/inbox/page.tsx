import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InboxClient } from "./inbox-client";

export default async function InboxPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) redirect("/login");

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      lead: { select: { id: true, name: true, email: true, company: true, stage: true, score: true } },
      agent: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, direction: true, createdAt: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return <InboxClient conversations={conversations} orgSlug={params.slug} />;
}
