// Mark alice@example.com as email-verified so she can log in immediately.
// Usage: pnpm tsx packages/db/seed-verify-alice.ts

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
  const user = await prisma.user.findUnique({ where: { email: "alice@example.com" } });
  if (!user) {
    console.log("alice@example.com not found. Please register first.");
    process.exit(1);
  }

  if (user.emailVerified) {
    console.log("alice@example.com is already verified.");
    return;
  }

  await prisma.user.update({
    where: { email: "alice@example.com" },
    data: { emailVerified: true },
  });

  console.log("alice@example.com marked as email verified.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
