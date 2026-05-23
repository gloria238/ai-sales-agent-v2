import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ScriptGenerateClient } from "./script-generate-client";

export default async function ScriptGeneratePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Verify membership in this org
  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  return <ScriptGenerateClient orgSlug={session.orgSlug} />;
}
