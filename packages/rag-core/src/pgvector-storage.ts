import type { EmbeddedChunk } from "./types";
import type { StorageAdapter } from "./storage";

/**
 * PostgreSQL + pgvector storage adapter.
 *
 * Requires pgvector extension enabled on the database:
 *   CREATE EXTENSION IF NOT EXISTS vector;
 *
 * The embedding column is added via raw SQL migration (not Prisma) since
 * Prisma doesn't support vector type natively:
 *   ALTER TABLE sales_agent."DocumentChunk" ADD COLUMN embedding vector;
 *
 * Embedding dimension is configurable — not hardcoded to 1536.
 */

export interface PgVectorConfig {
  /** PrismaClient instance (imported from @salesagent/db) */
  prisma: {
    documentChunk: {
      create(data: {
        id: string;
        documentId: string;
        organizationId: string;
        content: string;
        chunkIndex: number;
        metadata?: Record<string, unknown>;
      }): Promise<unknown>;
      findMany(args?: { where?: Record<string, unknown>; select?: Record<string, unknown> }): Promise<unknown[]>;
      deleteMany(args?: { where?: Record<string, unknown> }): Promise<unknown>;
    };
  };
  /** Raw SQL executor (e.g. prisma.$queryRawUnsafe or a pg client) */
  sql: (query: string, ...params: unknown[]) => Promise<unknown[]>;
  embeddingDimension: number;
}

export class PgVectorStorage implements StorageAdapter {
  private prisma: PgVectorConfig["prisma"];
  private sql: PgVectorConfig["sql"];
  private dim: number;

  constructor(config: PgVectorConfig) {
    this.prisma = config.prisma;
    this.sql = config.sql;
    this.dim = config.embeddingDimension;
  }

  async saveChunks(chunks: EmbeddedChunk[]): Promise<void> {
    for (const chunk of chunks) {
      // 1. Insert chunk metadata via Prisma
      await this.prisma.documentChunk.create({
        id: chunk.id,
        documentId: chunk.documentId,
        organizationId: chunk.organizationId,
        content: chunk.content,
        chunkIndex: chunk.index,
        metadata: chunk.metadata as Record<string, unknown>,
      });

      // 2. Insert embedding via raw SQL (pgvector column)
      const embeddingStr = `[${chunk.embedding.join(",")}]`;
      await this.sql(
        `UPDATE sales_agent."DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
        embeddingStr,
        chunk.id,
      );
    }
  }

  async getChunks(organizationId: string): Promise<EmbeddedChunk[]> {
    // Query with embedding column via raw SQL
    const rows = await this.sql(
      `SELECT id, document_id, organization_id, content, chunk_index, metadata, embedding::text
       FROM sales_agent."DocumentChunk"
       WHERE organization_id = $1
       ORDER BY chunk_index`,
      organizationId,
    );

    return (rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      documentId: row.document_id as string,
      organizationId: row.organization_id as string,
      content: row.content as string,
      index: row.chunk_index as number,
      metadata: row.metadata as EmbeddedChunk["metadata"],
      embedding: parseVector(row.embedding as string),
    }));
  }

  async getChunk(id: string): Promise<EmbeddedChunk | null> {
    const rows = await this.sql(
      `SELECT id, document_id, organization_id, content, chunk_index, metadata, embedding::text
       FROM sales_agent."DocumentChunk" WHERE id = $1`,
      id,
    );
    if (!rows || (rows as unknown[]).length === 0) return null;
    const row = (rows as Array<Record<string, unknown>>)[0];
    return {
      id: row.id as string,
      documentId: row.document_id as string,
      organizationId: row.organization_id as string,
      content: row.content as string,
      index: row.chunk_index as number,
      metadata: row.metadata as EmbeddedChunk["metadata"],
      embedding: parseVector(row.embedding as string),
    };
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.sql(
      `DELETE FROM sales_agent."DocumentChunk" WHERE document_id = $1`,
      documentId,
    );
  }

  async clearOrg(organizationId: string): Promise<void> {
    await this.sql(
      `DELETE FROM sales_agent."DocumentChunk" WHERE organization_id = $1`,
      organizationId,
    );
  }

  /**
   * Search chunks by vector similarity (cosine distance).
   * Uses pgvector's <=> operator for cosine distance.
   * Returns results ordered by similarity (most similar first).
   */
  async search(
    queryEmbedding: number[],
    organizationId: string,
    topK: number = 5,
  ): Promise<Array<EmbeddedChunk & { score: number }>> {
    const embStr = `[${queryEmbedding.join(",")}]`;
    const rows = await this.sql(
      `SELECT id, document_id, organization_id, content, chunk_index, metadata,
              1 - (embedding <=> $1::vector) AS similarity
       FROM sales_agent."DocumentChunk"
       WHERE organization_id = $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      embStr,
      organizationId,
      topK,
    );

    return (rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      documentId: row.document_id as string,
      organizationId: row.organization_id as string,
      content: row.content as string,
      index: row.chunk_index as number,
      metadata: row.metadata as EmbeddedChunk["metadata"],
      embedding: [],
      score: row.similarity as number,
    }));
  }
}

/** Parse PostgreSQL vector text representation "[1,2,3]" into number[] */
function parseVector(text: string | null | undefined): number[] {
  if (!text) return [];
  return text
    .replace(/[\[\]]/g, "")
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n));
}
