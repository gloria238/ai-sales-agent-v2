import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { MembersClient } from "./members-client";

export default async function MembersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const canManage = ["owner", "admin"].includes(membership.role);

  return <MembersClient orgSlug={session.orgSlug} canManage={canManage} />;
}
