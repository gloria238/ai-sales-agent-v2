/**
 * Reindex Document API — re-embeds all chunks for a document.
 *
 * POST /api/orgs/{slug}/kb/documents/{id}/reindex
 *
 * Use this when:
 *   - You've changed the embedding model and want to re-embed
 *   - The original embedding failed partially (some chunks have NULL embedding)
 *   - You suspect embedding quality issues
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { createEmbeddingProvider } from "@salesagent/rag-core/embeddings";

export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string; id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  // Verify the document belongs to this org
  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    include: { chunks: { select: { id: true, content: true }, orderBy: { chunkIndex: "asc" } } },
  });

  if (!doc || doc.organizationId !== membership.organizationId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.chunks.length === 0) {
    return NextResponse.json({ error: "Document has no chunks to reindex" }, { status: 400 });
  }

  try {
    // Update status to processing
    await prisma.document.update({
      where: { id: params.id },
      data: { status: "processing" },
    });

    // Re-embed all chunks in batches
    const embedder = createEmbeddingProvider();
    const batchSize = 10;
    let reindexed = 0;
    let failed = 0;

    for (let i = 0; i < doc.chunks.length; i += batchSize) {
      const batch = doc.chunks.slice(i, i + batchSize);
      const contents = batch.map((c) => c.content);

      try {
        const embeddings = await embedder.embedBatch(contents);
        for (let j = 0; j < batch.length; j++) {
          const embStr = `[${embeddings[j].join(",")}]`;
          try {
            await prisma.$queryRawUnsafe(
              `UPDATE sales_agent."DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
              embStr,
              batch[j].id,
            );
            reindexed++;
          } catch {
            failed++;
          }
        }
      } catch {
        failed += batch.length;
      }
    }

    // Update status back to ready
    await prisma.document.update({
      where: { id: params.id },
      data: { status: "ready" },
    });

    return NextResponse.json({
      success: true,
      documentId: params.id,
      totalChunks: doc.chunks.length,
      reindexed,
      failed,
    });
  } catch (err) {
    // Mark as failed on error
    try {
      await prisma.document.update({
        where: { id: params.id },
        data: { status: "failed" },
      });
    } catch { /* best effort */ }

    console.error("[kb/reindex] Failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Reindex failed. Document status set to 'failed'." },
      { status: 500 },
    );
  }
}
