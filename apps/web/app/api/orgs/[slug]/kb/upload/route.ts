import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { chunkText } from "@salesagent/rag-core/chunker";
import { createEmbeddingProvider } from "@salesagent/rag-core/embeddings";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileType = detectType(file.name);

  // 1. Create document record (status: processing)
  const doc = await prisma.document.create({
    data: {
      id: docId,
      organizationId: membership.organizationId,
      name: file.name,
      type: fileType,
      status: "processing",
      chunkCount: 0,
      metadata: { fileSize: file.size, uploadedAt: new Date().toISOString(), source: "upload" },
    },
  });

  try {
    // 2. Parse content based on type
    let content = "";
    if (fileType === "pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      content = data.text || "";
    } else if (fileType === "faq") {
      const text = buffer.toString("utf-8");
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          content = data.map((item: Record<string,string>, i: number) =>
            `Q${i+1}: ${item.question || item.q || ""}\nA${i+1}: ${item.answer || item.a || ""}`
          ).join("\n\n");
        } else {
          content = Object.entries(data).map(([k,v]) => `Q: ${k}\nA: ${String(v)}`).join("\n\n");
        }
      } catch { content = text; }
    } else {
      content = buffer.toString("utf-8");
    }
    if (!content.trim()) throw new Error("No text content extracted from file");

    // 3. Chunk
    const chunks = chunkText(content, docId, membership.organizationId, {
      title: file.name.replace(/\.[^.]+$/, ""),
      fileName: file.name,
    });

    // 4. Embed (optional — if no embedding key, store without vectors and use keyword search)
    let embeddings: number[][] = [];
    try {
      const embedder = createEmbeddingProvider();
      const texts = chunks.map((c) => c.content);
      embeddings = await embedder.embedBatch(texts);
    } catch {
      console.warn("Embedding not available — storing without vectors. Keyword search will be used.");
    }

    // 5. Store chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await prisma.documentChunk.create({
        data: {
          id: chunk.id,
          documentId: docId,
          organizationId: membership.organizationId,
          content: chunk.content,
          chunkIndex: chunk.index,
          metadata: chunk.metadata as Record<string, unknown>,
        },
      });
      if (embeddings[i]) {
        const embStr = `[${embeddings[i].join(",")}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE sales_agent."DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
          embStr,
          chunk.id,
        );
      }
    }

    // 6. Update document status
    await prisma.document.update({
      where: { id: docId },
      data: { status: "ready", chunkCount: chunks.length },
    });

    return NextResponse.json({
      document: { id: docId, name: file.name, type: fileType, chunkCount: chunks.length, status: "ready" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("KB upload error:", msg, err instanceof Error ? err.stack : "");
    await prisma.document.update({
      where: { id: docId },
      data: { status: "failed", metadata: { ...(doc.metadata as Record<string,unknown> || {}), error: msg } },
    });
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 });
  }
}

function detectType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "pdf";
    case "md": return "md";
    case "txt": return "txt";
    case "json": return "faq";
    default: return "txt";
  }
}
