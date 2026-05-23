import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ScriptListClient } from "./scripts-client";

export default async function ScriptsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const scripts = await prisma.script.findMany({
    where: { organizationId: session.orgId },
    orderBy: { createdAt: "desc" },
  });

  return <ScriptListClient scripts={JSON.parse(JSON.stringify(scripts))} orgSlug={session.orgSlug} />;
}
