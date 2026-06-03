import type { Chunk } from "./types";

export interface ChunkOptions {
  chunkSize?: number;       // characters per chunk (default 1000)
  chunkOverlap?: number;    // overlap between chunks (default 200)
}

let chunkCounter = 0;

/** Recursive character text splitter. Splits on paragraph boundaries first,
 *  then sentence boundaries, then falls back to fixed-size splitting. */
export function chunkText(
  text: string,
  documentId: string,
  organizationId: string,
  metadata: { title: string; fileName: string },
  options: ChunkOptions = {},
): Chunk[] {
  const chunkSize = options.chunkSize ?? 1000;
  const chunkOverlap = options.chunkOverlap ?? 200;

  const chunks: Chunk[] = [];

  // Split on double newlines (paragraphs) first
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  for (const paragraph of paragraphs) {
    if (paragraph.length <= chunkSize) {
      chunks.push(makeChunk(paragraph, documentId, organizationId, metadata));
    } else {
      // Split on sentence boundaries
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      let current = "";

      for (const sentence of sentences) {
        if (current.length + sentence.length > chunkSize && current.length > 0) {
          chunks.push(makeChunk(current.trim(), documentId, organizationId, metadata));
          // Overlap: keep last N chars of previous chunk
          current = current.slice(-chunkOverlap) + sentence;
        } else {
          current += sentence;
        }
      }

      if (current.trim().length > 0) {
        chunks.push(makeChunk(current.trim(), documentId, organizationId, metadata));
      }
    }
  }

  return chunks;
}

function makeChunk(
  content: string,
  documentId: string,
  organizationId: string,
  metadata: { title: string; fileName: string },
): Chunk {
  const id = `chunk-${Date.now()}-${++chunkCounter}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    documentId,
    organizationId,
    content,
    index: chunkCounter,
    metadata,
  };
}
