/**
 * seed-kb-to-db.ts — Upload knowledge-base/ files directly to PostgreSQL.
 *
 * Usage:
 *   pnpm tsx packages/db/seed-kb-to-db.ts <org-slug>
 *
 * Example:
 *   pnpm tsx packages/db/seed-kb-to-db.ts qicloud-demo
 *   pnpm tsx packages/db/seed-kb-to-db.ts acme-corp
 */

// Load env from packages/db/.env (tsx doesn't auto-load .env like Next.js)
import { config } from "dotenv";
import { resolve, join } from "path";
config({ path: resolve(__dirname, ".env") });

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const ORG_SLUG = process.argv[2];
if (!ORG_SLUG) {
  console.error("Usage: pnpm tsx packages/db/seed-kb-to-db.ts <org-slug>");
  console.error("  e.g. pnpm tsx packages/db/seed-kb-to-db.ts qicloud-demo");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL! + "&connection_limit=1" } },
});

const KB_DIR = resolve(__dirname, "knowledge-base");

async function main() {
  // Find org
  const org = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (!org) {
    console.error(`Organization "${ORG_SLUG}" not found.`);
    process.exit(1);
  }
  console.log(`Org: ${org.name} (${org.id})\n`);

  const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.error("No .md files found in " + KB_DIR);
    process.exit(1);
  }

  // Init embedder — use direct fetch() to avoid workspace package resolution issues
  const EMB_KEY = process.env.EMBEDDING_API_KEY;
  const EMB_URL = (process.env.EMBEDDING_BASE_URL || "https://api.siliconflow.cn/v1") + "/embeddings";
  const EMB_MODEL = process.env.EMBEDDING_MODEL || "Qwen/Qwen3-Embedding-4B";
  const EMB_DIM = process.env.EMBEDDING_DIMENSIONS ? parseInt(process.env.EMBEDDING_DIMENSIONS, 10) : undefined;

  console.log(`Embedding: ${EMB_KEY ? "key set" : "NO KEY"} | ${EMB_URL} | ${EMB_MODEL} | ${EMB_DIM ? EMB_DIM + "d" : "full"}`);

  let embedder: ((texts: string[]) => Promise<number[][]>) | null = null;
  if (EMB_KEY) {
    // Quick test
    try {
      const body: any = { model: EMB_MODEL, input: "测试" };
      if (EMB_DIM) body.dimensions = EMB_DIM;
      const res = await fetch(EMB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${EMB_KEY}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${res.status}: ${err.slice(0, 200)}`);
      }
      const data = (await res.json()) as any;
      console.log(`  Test OK: ${data.data[0].embedding.length} dimensions\n`);
      embedder = async (texts: string[]) => {
        const body2: any = { model: EMB_MODEL, input: texts };
        if (EMB_DIM) body2.dimensions = EMB_DIM;
        const r = await fetch(EMB_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${EMB_KEY}` },
          body: JSON.stringify(body2),
        });
        if (!r.ok) throw new Error(`Embed batch failed: ${r.status}`);
        const d = (await r.json()) as any;
        return (d.data as Array<{ embedding: number[]; index: number }>)
          .sort((a, b) => a.index - b.index)
          .map((x) => x.embedding);
      };
    } catch (err: any) {
      console.log(`  FAILED: ${err.message?.slice(0, 200) || String(err)}\n`);
    }
  } else {
    console.log("  No EMBEDDING_API_KEY — storing chunks without vectors\n");
  }

  let totalDocs = 0;
  let totalChunks = 0;

  for (const filename of files) {
    const content = fs.readFileSync(join(KB_DIR, filename), "utf-8");
    if (!content.trim()) continue;

    // If doc exists with 0 chunks (empty shell) → delete and rebuild
    const existing = await prisma.document.findFirst({
      where: { organizationId: org.id, name: filename },
    });
    if (existing && existing.chunkCount > 0) {
      console.log(`  SKIP ${filename} (already exists, ${existing.chunkCount} chunks)`);
      totalDocs++;
      totalChunks += existing.chunkCount;
      continue;
    }
    if (existing) {
      console.log(`  DEL ${filename} (0 chunks, rebuilding…)`);
      await prisma.document.delete({ where: { id: existing.id } });
    }

    const fileType = filename.endsWith(".md") ? "md" : "txt";
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Create document
    const doc = await prisma.document.create({
      data: {
        id: docId,
        organizationId: org.id,
        name: filename,
        type: fileType,
        status: "processing",
        chunkCount: 0,
        metadata: { fileSize: content.length, uploadedAt: new Date().toISOString(), source: "seed" },
      },
    });

    // Chunk (simple paragraph-based, matching chunker logic)
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 20);
    let chunkIndex = 0;

    for (const para of paragraphs) {
      const trimmed = para.trim();
      const chunks: string[] = [];

      if (trimmed.length > 1200) {
        const sentences = trimmed.match(/[^。.！!？?]+[。.！!？?]+/g) || [trimmed];
        let current = "";
        for (const s of sentences) {
          if (current.length + s.length > 1000 && current.length > 0) {
            chunks.push(current.trim());
            current = s;
          } else {
            current += s;
          }
        }
        if (current.trim()) chunks.push(current.trim());
      } else {
        chunks.push(trimmed);
      }

      for (const chunkContent of chunks) {
        const chunkId = `chunk-${docId}-${String(chunkIndex).padStart(3, "0")}`;
        await prisma.documentChunk.create({
          data: {
            id: chunkId,
            documentId: docId,
            organizationId: org.id,
            content: chunkContent,
            chunkIndex,
            metadata: { title: filename.replace(/\.md$/, ""), fileName: filename },
          },
        });
        chunkIndex++;
      }
    }

    // Embed (optional)
    if (embedder && chunkIndex > 0) {
      try {
        const allChunks = await prisma.documentChunk.findMany({
          where: { documentId: docId },
          orderBy: { chunkIndex: "asc" },
        });
        const texts = allChunks.map((c) => c.content);
        const embeddings = await embedder.embedBatch(texts);
        for (let i = 0; i < allChunks.length; i++) {
          if (embeddings[i]) {
            const embStr = `[${embeddings[i].join(",")}]`;
            await prisma.$executeRawUnsafe(
              `UPDATE sales_agent."DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
              embStr,
              allChunks[i].id,
            );
          }
        }
      } catch (e) {
        console.warn(`  ⚠ Embedding failed for ${filename}, chunks stored without vectors`);
      }
    }

    // Update doc status
    await prisma.document.update({
      where: { id: docId },
      data: { status: "ready", chunkCount: chunkIndex },
    });

    totalDocs++;
    totalChunks += chunkIndex;
    console.log(`  OK  ${filename} → ${chunkIndex} chunks`);
  }

  console.log(`\nDone. ${totalDocs} docs, ${totalChunks} chunks in "${ORG_SLUG}"`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
