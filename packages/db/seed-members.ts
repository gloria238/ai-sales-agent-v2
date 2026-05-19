// Create test member accounts for permission testing.
// Usage: pnpm tsx packages/db/seed-members.ts <org-slug>
//
// Creates 3 users if they don't exist and adds them to the org:
//   admin@salesagent.test    — admin role
//   operator@salesagent.test — operator role
//   viewer@salesagent.test   — viewer role
// All have password: test123456

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), "packages/db/.env") });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_USERS = [
  { email: "admin@salesagent.test", name: "Test Admin", role: "admin" as const },
  { email: "operator@salesagent.test", name: "Test Operator", role: "operator" as const },
  { email: "viewer@salesagent.test", name: "Test Viewer", role: "viewer" as const },
];

const PASSWORD = "test123456";

async function main() {
  const orgSlug = process.argv[2];
  if (!orgSlug) {
    console.error("Usage: pnpm tsx packages/db/seed-members.ts <org-slug>");
    console.error("Example: pnpm tsx packages/db/seed-members.ts alice-workspace");
    process.exit(1);
  }

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) {
    console.error(`Organization with slug "${orgSlug}" not found.`);
    const orgs = await prisma.organization.findMany({ select: { slug: true } });
    if (orgs.length > 0) {
      console.error("Available orgs:", orgs.map((o) => o.slug).join(", "));
    }
    process.exit(1);
  }

  console.log(`Adding test members to org: ${org.name} (${org.slug})\n`);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const { email, name, role } of TEST_USERS) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, passwordHash },
      });
      console.log(`Created user: ${email} (password: ${PASSWORD})`);
    } else {
      console.log(`User already exists: ${email}`);
    }

    const existing = await prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    });
    if (existing) {
      await prisma.membership.update({
        where: { id: existing.id },
        data: { role },
      });
      console.log(`  Updated role → ${role}`);
    } else {
      await prisma.membership.create({
        data: { organizationId: org.id, userId: user.id, role },
      });
      console.log(`  Added as ${role}`);
    }
  }

  console.log(`\nDone. Test accounts (all password: ${PASSWORD}):`);
  for (const { email, role } of TEST_USERS) {
    console.log(`  ${email} — ${role}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
