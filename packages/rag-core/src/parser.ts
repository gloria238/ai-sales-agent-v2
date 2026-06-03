import type { ParsedDocument, DocumentType } from "./types";

/** Detect document type from file extension or MIME type */
export function detectDocumentType(fileName: string, mimeType?: string): DocumentType {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "pdf";
    case "docx": return "docx";
    case "txt":
    case "md":
    case "csv": return "txt";
    case "json": return "faq";
    default:
      if (mimeType?.includes("pdf")) return "pdf";
      if (mimeType?.includes("docx")) return "docx";
      return "unknown";
  }
}

/** Route to the correct parser based on detected type */
export async function parseDocument(
  buffer: Buffer | string,
  options: {
    fileName: string;
    organizationId: string;
    documentId?: string;
    mimeType?: string;
  },
): Promise<ParsedDocument> {
  const type = detectDocumentType(options.fileName, options.mimeType);
  const id = options.documentId || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const base: Omit<ParsedDocument, "content" | "type"> = {
    id,
    title: options.fileName.replace(/\.[^.]+$/, ""),
    metadata: {
      organizationId: options.organizationId,
      fileName: options.fileName,
      uploadedAt: new Date().toISOString(),
    },
  };

  switch (type) {
    case "pdf": {
      const { parsePDF } = await import("./pdf-parser");
      return { ...base, type: "pdf", content: await parsePDF(buffer as Buffer) };
    }
    case "docx": {
      const { parseDOCX } = await import("./docx-parser");
      return { ...base, type: "docx", content: await parseDOCX(buffer as Buffer) };
    }
    case "txt": {
      const { parseTXT } = await import("./txt-parser");
      return { ...base, type: "txt", content: parseTXT(buffer) };
    }
    case "faq": {
      const { parseFAQ } = await import("./faq-parser");
      return { ...base, type: "faq", content: parseFAQ(typeof buffer === "string" ? buffer : buffer.toString("utf-8")) };
    }
    default:
      // Treat unknown as plain text
      const { parseTXT } = await import("./txt-parser");
      return { ...base, type: "unknown", content: parseTXT(buffer) };
  }
}
