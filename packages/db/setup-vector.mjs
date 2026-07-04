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

// ── Full-text search vector column (for hybrid search) ──
const fts = await p.$queryRawUnsafe(
  `SELECT column_name FROM information_schema.columns
   WHERE table_schema='sales_agent' AND table_name='DocumentChunk' AND column_name='search_vector'`
);

if (fts.length === 0) {
  await p.$executeRawUnsafe(`ALTER TABLE sales_agent."DocumentChunk" ADD COLUMN search_vector tsvector`);
  await p.$executeRawUnsafe(`UPDATE sales_agent."DocumentChunk" SET search_vector = to_tsvector('english', content)`);
  await p.$executeRawUnsafe(`CREATE INDEX idx_chunk_search_vector ON sales_agent."DocumentChunk" USING GIN (search_vector)`);
  // Trigger to keep search_vector in sync on insert/update
  await p.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION sales_agent.chunk_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector = to_tsvector('english', NEW.content);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
  await p.$executeRawUnsafe(`
    CREATE TRIGGER trg_chunk_search_vector_update
      BEFORE INSERT OR UPDATE OF content ON sales_agent."DocumentChunk"
      FOR EACH ROW EXECUTE FUNCTION sales_agent.chunk_search_vector_update()
  `);
  console.log("✓ search_vector column + GIN index + trigger added to sales_agent.DocumentChunk");
} else {
  console.log("✓ search_vector column already exists");
}

await p.$disconnect();
