// FK-safe org cleanup: delete all conversations, campaigns, agents, scripts + leads.
// Usage: pnpm tsx packages/db/clean-demo-org.ts <org-slug>
// WARNING: destructive — only run this on demo data.

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), "packages/db/.env") });

import { PrismaClient } from "@prisma/client";

function getDatasourceUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is required");
  if (url.includes("connection_limit")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}connection_limit=1`;
}

const prisma = new PrismaClient({
  datasources: { db: { url: getDatasourceUrl() } },
});

async function main() {
  const orgSlug = process.argv[2];
  if (!orgSlug) { console.error("Usage: pnpm tsx packages/db/clean-demo-org.ts <org-slug>"); process.exit(1); }

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) { console.error(`Org "${orgSlug}" not found.`); process.exit(1); }

  console.log(`Cleaning: ${org.name} (${org.slug})\n`);

  // FK-safe deletion order
  await prisma.campaignRun.deleteMany({ where: { campaign: { organizationId: org.id } } });
  const campDeleted = await prisma.campaign.deleteMany({ where: { organizationId: org.id } });
  console.log(`Deleted ${campDeleted.count} campaign(s)`);

  await prisma.message.deleteMany({ where: { conversation: { organizationId: org.id } } });
  const convDeleted = await prisma.conversation.deleteMany({ where: { organizationId: org.id } });
  console.log(`Deleted ${convDeleted.count} conversation(s)`);

  const scriptDeleted = await prisma.script.deleteMany({ where: { organizationId: org.id } });
  console.log(`Deleted ${scriptDeleted.count} script(s)`);

  const agentDeleted = await prisma.agent.deleteMany({ where: { organizationId: org.id } });
  console.log(`Deleted ${agentDeleted.count} agent(s)`);

  const activityDeleted = await prisma.leadActivity.deleteMany({ where: { organizationId: org.id } });
  console.log(`Deleted ${activityDeleted.count} lead activity/ies`);

  const leadDeleted = await prisma.lead.deleteMany({ where: { organizationId: org.id } });
  console.log(`Deleted ${leadDeleted.count} lead(s)`);

  const auditDeleted = await prisma.auditLog.deleteMany({ where: { organizationId: org.id } });
  console.log(`Deleted ${auditDeleted.count} audit log(s)`);

  console.log("\nDone cleaning.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
