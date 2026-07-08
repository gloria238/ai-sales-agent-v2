import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InboxDetailClient } from "./inbox-detail-client";

export default async function InboxDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  // Parallel: list + detail (avoids waterfall)
  const [conversations, conversation] = await Promise.all([
    prisma.conversation.findMany({
      where: { organizationId: session.orgId },
      include: {
        lead: { select: { id: true, name: true, email: true, company: true, stage: true, score: true, phone: true, source: true } },
        agent: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, content: true, direction: true, channel: true, createdAt: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.conversation.findFirst({
      where: { id: params.id, organizationId: session.orgId },
      include: {
        lead: { select: { id: true, name: true, email: true, company: true, phone: true, stage: true, score: true, source: true } },
        agent: { select: { id: true, name: true, personality: true } },
        messages: { orderBy: { createdAt: "asc" }, take: 50 },
      },
    }),
  ]);

  if (!conversation) redirect("/inbox");

  return (
    <div className="-m-4 lg:-m-6 h-[calc(100%+2rem)] lg:h-[calc(100%+3rem)] flex flex-col">
      <InboxDetailClient
        conversation={conversation}
        conversations={conversations}
        orgSlug={session.orgSlug}
      />
    </div>
  );
}
