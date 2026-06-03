import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PlaygroundClient } from "./playground-client";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <PlaygroundClient orgSlug={session.orgSlug} />;
}
