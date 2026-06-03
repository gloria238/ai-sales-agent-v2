// Run once to enable pgvector extension on Supabase.
// Usage: npx tsx packages/db/setup-vector.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL! } },
});

async function main() {
  try {
    await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
    console.log("✓ pgvector extension enabled");
  } catch (e) {
    console.log("Extension (may already exist):", (e as Error).message.slice(0, 80));
  }

  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE sales_agent.document_chunks ADD COLUMN IF NOT EXISTS embedding vector",
    );
    console.log("✓ embedding column ready");
  } catch (e) {
    console.log("Column:", (e as Error).message.slice(0, 80));
  }

  await prisma.$disconnect();
  console.log("Done.");
}

main();
