import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InboxClient } from "../inbox-client";

export default async function InboxDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const exists = await prisma.conversation.findFirst({
    where: { id: params.id, organizationId: session.orgId },
    select: { id: true },
  });
  if (!exists) redirect("/inbox");

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: session.orgId },
    include: {
      lead: { select: { id: true, name: true, email: true, company: true, stage: true, score: true } },
      agent: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, direction: true, createdAt: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="-m-4 lg:-m-6 h-[calc(100%+2rem)] lg:h-[calc(100%+3rem)] flex flex-col">
      <InboxClient
        conversations={conversations}
        orgSlug={session.orgSlug}
        selectedId={params.id}
      />
    </div>
  );
}
