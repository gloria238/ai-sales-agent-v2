import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InboxClient } from "./inbox-client";

export default async function InboxPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

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
    <div className="-m-4 lg:-m-8 h-[calc(100vh-3.5rem)]">
      <InboxClient conversations={conversations} orgSlug={session.orgSlug} />
    </div>
  );
}
