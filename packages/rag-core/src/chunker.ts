import type { Chunk } from "./types";
import { generateChunkId } from "./content-hash";

export interface ChunkOptions {
  chunkSize?: number;       // characters per chunk (default 1000)
  chunkOverlap?: number;    // overlap between chunks (default 200)
  /** Use content-hash-based stable chunk IDs. Default: true */
  stableIds?: boolean;
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
  const stableIds = options.stableIds ?? true;

  const rawChunks: Array<{ content: string; index: number }> = [];
  let idx = 0;

  // Split on double newlines (paragraphs) first
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  for (const paragraph of paragraphs) {
    if (paragraph.length <= chunkSize) {
      rawChunks.push({ content: paragraph.trim(), index: idx++ });
    } else {
      // Split on sentence boundaries
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      let current = "";

      for (const sentence of sentences) {
        if (current.length + sentence.length > chunkSize && current.length > 0) {
          rawChunks.push({ content: current.trim(), index: idx++ });
          current = current.slice(-chunkOverlap) + sentence;
        } else {
          current += sentence;
        }
      }

      if (current.trim().length > 0) {
        rawChunks.push({ content: current.trim(), index: idx++ });
      }
    }
  }

  // Build chunk objects — use stable content-hash IDs when enabled
  const chunks: Chunk[] = [];
  for (const raw of rawChunks) {
    const id = stableIds
      ? `chunk-${documentId.slice(-8)}-${String(raw.index).padStart(3, "0")}-${Date.now().toString(36)}`
      : `chunk-${Date.now()}-${++chunkCounter}-${Math.random().toString(36).slice(2, 6)}`;
    chunks.push({
      id,
      documentId,
      organizationId,
      content: raw.content,
      index: raw.index,
      metadata,
    });
  }

  return chunks;
}
