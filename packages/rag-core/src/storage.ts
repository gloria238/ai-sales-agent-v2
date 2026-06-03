import type { EmbeddedChunk } from "./types";

export interface StorageAdapter {
  saveChunks(chunks: EmbeddedChunk[]): Promise<void>;
  getChunks(organizationId: string): Promise<EmbeddedChunk[]>;
  getChunk(id: string): Promise<EmbeddedChunk | null>;
  deleteDocument(documentId: string): Promise<void>;
  clearOrg(organizationId: string): Promise<void>;
  /** Vector similarity search. Returns chunks with similarity scores. */
  search?(queryEmbedding: number[], organizationId: string, topK: number): Promise<Array<EmbeddedChunk & { score: number }>>;
}

/**
 * In-memory storage adapter for MVP.
 * Swap to pgvector, Redis, or Pinecone later by implementing StorageAdapter.
 */
export class InMemoryStorage implements StorageAdapter {
  private chunks: Map<string, EmbeddedChunk> = new Map();

  async saveChunks(chunks: EmbeddedChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
    }
  }

  async getChunks(organizationId: string): Promise<EmbeddedChunk[]> {
    return Array.from(this.chunks.values()).filter(
      (c) => c.organizationId === organizationId,
    );
  }

  async getChunk(id: string): Promise<EmbeddedChunk | null> {
    return this.chunks.get(id) || null;
  }

  async deleteDocument(documentId: string): Promise<void> {
    for (const [id, chunk] of this.chunks) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(id);
      }
    }
  }

  async clearOrg(organizationId: string): Promise<void> {
    for (const [id, chunk] of this.chunks) {
      if (chunk.organizationId === organizationId) {
        this.chunks.delete(id);
      }
    }
  }
}
