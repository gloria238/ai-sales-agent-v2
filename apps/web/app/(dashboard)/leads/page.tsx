import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LeadTableClient } from "./lead-table-client";

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const [initialLeads, total] = await Promise.all([
    prisma.lead.findMany({
      where: { organizationId: session.orgId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.lead.count({ where: { organizationId: session.orgId } }),
  ]);

  const canManage = ["owner", "admin", "operator"].includes(membership.role);

  return (
    <LeadTableClient
      initialLeads={initialLeads}
      initialTotal={total}
      orgSlug={session.orgSlug}
      canManage={canManage}
    />
  );
}
