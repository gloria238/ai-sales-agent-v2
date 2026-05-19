import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ApiKeysClient } from "./api-keys-client";

export default async function ApiKeysPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        userId: session.userId,
        organizationId: session.orgId,
      },
    },
  });

  return (
    <ApiKeysClient
      orgSlug={session.orgSlug}
      isOwner={membership?.role === "owner"}
    />
  );
}
