import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ScriptListClient } from "./scripts-client";

export default async function ScriptsPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) redirect("/login");

  const scripts = await prisma.script.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return <ScriptListClient scripts={JSON.parse(JSON.stringify(scripts))} orgSlug={params.slug} />;
}
