// Quick script to enable pgvector + add embedding column
// Run: node packages/db/setup-vector.mjs
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const p = new PrismaClient({ datasources: { db: { url } } });

const r = await p.$queryRawUnsafe(
  `SELECT column_name FROM information_schema.columns
   WHERE table_schema='sales_agent' AND table_name='DocumentChunk' AND column_name='embedding'`
);

if (r.length === 0) {
  await p.$executeRawUnsafe(`ALTER TABLE sales_agent."DocumentChunk" ADD COLUMN embedding vector`);
  console.log("✓ embedding column added to sales_agent.DocumentChunk");
} else {
  console.log("✓ embedding column already exists");
}

await p.$disconnect();
