/** PostgreSQL full-text search via tsvector/tsquery.
 *
 *  Requires a `search_vector tsvector` column on DocumentChunk (added by setup-vector.mjs).
 *  Falls back to regex (~*) if the column doesn't exist.
 */

export interface KeywordSearchResult {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
  score: number;
}

export type SqlExecutor = (query: string, ...params: unknown[]) => Promise<unknown[]>;

/** Search chunks by keyword using PostgreSQL full-text search.
 *  Falls back to ILIKE / ~* if tsvector not available.
 */
export async function keywordSearch(
  sql: SqlExecutor,
  query: string,
  organizationId: string,
  topK: number = 10,
): Promise<KeywordSearchResult[]> {
  // 1. Try tsvector FTS first
  try {
    const tsquery = query
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .map((w) => `${w}:*`)
      .join(" & ");

    if (tsquery) {
      const rows = await sql(
        `SELECT id, document_id, content, chunk_index, metadata,
                ts_rank(search_vector, to_tsquery('english', $1)) AS rank
         FROM sales_agent."DocumentChunk"
         WHERE organization_id = $2
           AND search_vector @@ to_tsquery('english', $1)
         ORDER BY rank DESC
         LIMIT $3`,
        tsquery,
        organizationId,
        topK,
      );

      if (rows && (rows as unknown[]).length > 0) {
        return (rows as Array<Record<string, unknown>>).map((row) => ({
          id: row.id as string,
          documentId: row.document_id as string,
          content: row.content as string,
          chunkIndex: row.chunk_index as number,
          metadata: row.metadata as Record<string, unknown>,
          score: typeof row.rank === "number" ? row.rank / 10 : 0.5, // normalize rank to 0-1ish
        }));
      }
    }
  } catch {
    // tsvector column not available — fall through to regex fallback
  }

  // 2. Regex fallback (no tsvector column)
  const keywords = query.split(/\s+/).filter((w) => w.length > 2).join(" | ");
  const rows = await sql(
    `SELECT id, document_id, content, chunk_index, metadata, 0.5 AS rank
     FROM sales_agent."DocumentChunk"
     WHERE organization_id = $1
       AND content ~* $2
     LIMIT $3`,
    organizationId,
    keywords || query,
    topK,
  );

  return (rows as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    documentId: row.document_id as string,
    content: row.content as string,
    chunkIndex: row.chunk_index as number,
    metadata: row.metadata as Record<string, unknown>,
    score: 0.5,
  }));
}
