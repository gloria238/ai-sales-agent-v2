import type { Citation, SearchResult } from "./types";

/** Generate citations from search results.
 *  Each citation maps a retrieved chunk back to its source document. */
export function generateCitations(
  results: SearchResult[],
  options?: {
    maxLength?: number;      // max characters per citation excerpt (default 300)
    maxCitations?: number;   // max number of citations to return (default 5)
  },
): Citation[] {
  const maxLength = options?.maxLength ?? 300;
  const maxCitations = options?.maxCitations ?? 5;

  return results.slice(0, maxCitations).map((r) => ({
    chunkId: r.chunk.id,
    documentTitle: r.chunk.metadata.title,
    fileName: r.chunk.metadata.fileName,
    content: r.chunk.content.slice(0, maxLength) +
      (r.chunk.content.length > maxLength ? "…" : ""),
    position: r.chunk.index,
    score: Math.round(r.score * 100) / 100,
  }));
}
