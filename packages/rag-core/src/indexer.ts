import type { Chunk, EmbeddedChunk, ParsedDocument } from "./types";
import { chunkText, type ChunkOptions } from "./chunker";
import type { EmbeddingProvider } from "./embeddings";
import type { StorageAdapter } from "./storage";

/** Index a parsed document: chunk → embed → store.
 *  Returns the embedded chunks ready for retrieval. */
export async function indexDocument(
  document: ParsedDocument,
  embedder: EmbeddingProvider,
  storage: StorageAdapter,
  options?: ChunkOptions,
): Promise<EmbeddedChunk[]> {
  // 1. Chunk
  const chunks = chunkText(
    document.content,
    document.id,
    document.metadata.organizationId,
    {
      title: document.title,
      fileName: document.metadata.fileName,
    },
    options,
  );

  if (chunks.length === 0) return [];

  // 2. Embed in batch
  const texts = chunks.map((c) => c.content);
  const embeddings = await embedder.embedBatch(texts);

  // 3. Attach embeddings
  const embeddedChunks: EmbeddedChunk[] = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  // 4. Store
  await storage.saveChunks(embeddedChunks);

  return embeddedChunks;
}
