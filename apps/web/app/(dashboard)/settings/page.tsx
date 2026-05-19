import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SettingsGeneralForm } from "./settings-general";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
    include: { organization: true },
  });
  if (!membership) redirect("/login");

  const canManage = ["owner", "admin"].includes(membership.role);

  return (
    <SettingsGeneralForm
      orgId={membership.organization.id}
      initialName={membership.organization.name}
      initialSlug={membership.organization.slug}
      orgSlug={session.orgSlug}
      canManage={canManage}
    />
  );
}
