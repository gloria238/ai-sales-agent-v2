import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ScriptGenerateClient } from "./script-generate-client";

export default async function ScriptGeneratePage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <ScriptGenerateClient orgSlug={params.slug} />;
}
