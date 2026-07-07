import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { chunkText } from "@salesagent/rag-core/chunker";
import { createEmbeddingProvider } from "@salesagent/rag-core/embeddings";
import { fingerprintContent } from "@salesagent/rag-core";

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

  const MAX_FILE_SIZE = 10_000_000;
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate file type by magic bytes (primary) with extension fallback
  const fileType = detectTypeByMagic(buffer, file.name);
  if (!fileType) {
    return NextResponse.json({ error: "Unsupported file type. Supported: PDF, TXT, JSON, Markdown." }, { status: 415 });
  }

  // ═══ Content Fingerprinting — check for duplicates ═════════════════════
  const fingerprint = await fingerprintContent(buffer);
  const orgId = membership.organizationId;

  // Check if the exact same content already exists in this org
  const existingByHash = await prisma.document.findFirst({
    where: { organizationId: orgId, metadata: { path: ["contentHash"], equals: fingerprint.hash } },
  });
  if (existingByHash) {
    return NextResponse.json({
      document: {
        id: existingByHash.id,
        name: existingByHash.name,
        type: existingByHash.type,
        chunkCount: existingByHash.chunkCount,
        status: existingByHash.status,
      },
      deduplicated: true,
      message: "This exact document is already indexed. Skipping upload.",
    });
  }

  // Check if a document with the same name exists (potential update)
  const existingByName = await prisma.document.findFirst({
    where: { organizationId: orgId, name: file.name },
  });

  const isUpdate = existingByName !== null;
  const docId = isUpdate
    ? existingByName.id // Reuse same ID for update
    : `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // If updating, delete old chunks first
  if (isUpdate) {
    await prisma.documentChunk.deleteMany({ where: { documentId: docId } });
    await prisma.document.update({
      where: { id: docId },
      data: {
        status: "processing",
        chunkCount: 0,
        metadata: { fileSize: file.size, uploadedAt: new Date().toISOString(), source: "upload", contentHash: fingerprint.hash },
      },
    });
  } else {
    await prisma.document.create({
      data: {
        id: docId,
        organizationId: orgId,
        name: file.name,
        type: fileType,
        status: "processing",
        chunkCount: 0,
        metadata: { fileSize: file.size, uploadedAt: new Date().toISOString(), source: "upload", contentHash: fingerprint.hash },
      },
    });
  }

  try {
    // Parse content based on type
    let content = "";
    if (fileType === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const pdf = new PDFParse({ data: buffer });
      const result = await pdf.getText();
      content = result.text || "";
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

    // Chunk (stable IDs based on docId + index for update compatibility)
    const chunks = chunkText(content, docId, orgId, {
      title: file.name.replace(/\.[^.]+$/, ""),
      fileName: file.name,
    }, { stableIds: true });

    // Embed (optional — if no embedding key, store without vectors)
    let embeddings: number[][] = [];
    try {
      const embedder = createEmbeddingProvider();
      const texts = chunks.map((c) => c.content);
      embeddings = await embedder.embedBatch(texts);
    } catch {
      console.warn("Embedding not available — storing without vectors. Keyword search will be used.");
    }

    // Store chunks (sequential to avoid connection pool exhaustion)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await prisma.documentChunk.create({
        data: {
          id: chunk.id,
          documentId: docId,
          organizationId: orgId,
          content: chunk.content,
          chunkIndex: chunk.index,
          metadata: chunk.metadata as any,
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

    // Update document status
    await prisma.document.update({
      where: { id: docId },
      data: { status: "ready", chunkCount: chunks.length },
    });

    // Invalidate RAG cache for this org (non-blocking, best-effort)
    try {
      const { getSemanticCache } = await import("@salesagent/rag-core");
      getSemanticCache().invalidateOrg(orgId);
    } catch { /* cache not configured */ }

    return NextResponse.json({
      document: { id: docId, name: file.name, type: fileType, chunkCount: chunks.length, status: "ready" },
      updated: isUpdate,
      contentHash: fingerprint.hash,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("KB upload error:", msg, err instanceof Error ? err.stack : "");
    await prisma.document.update({
      where: { id: docId },
      data: { status: "failed", metadata: { fileSize: file.size, uploadedAt: new Date().toISOString(), source: "upload", contentHash: fingerprint.hash, error: msg } },
    });
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 });
  }
}

/** Detect file type by magic bytes first, falling back to extension. Returns null if unsupported. */
function detectTypeByMagic(buffer: Buffer, fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const head = buffer.slice(0, 16).toString("utf-8").trimStart();

  if (buffer.slice(0, 5).toString() === "%PDF-") return "pdf";
  if (head.startsWith("[") || head.startsWith("{")) return "faq";
  if (/^(#|<|>|\*|-)/.test(head) && ext === "md") return "md";

  const isText = !buffer.slice(0, Math.min(buffer.length, 512)).includes(0x00);
  if (isText && ["txt", "md", "csv"].includes(ext)) return ext === "md" ? "md" : "txt";

  if (ext === "json") return "faq";
  if (ext === "txt") return "txt";
  if (ext === "md") return "md";

  return null;
}
