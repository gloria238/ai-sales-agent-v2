// ── Document ──────────────────────────────────────────────────────
export type DocumentType = "pdf" | "docx" | "txt" | "faq" | "unknown";

export interface ParsedDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;           // raw text after parsing
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  organizationId: string;
  fileName: string;
  fileSize?: number;
  uploadedAt: string;
  source?: string;           // e.g. "upload", "notion", "confluence"
}

// ── Chunks ────────────────────────────────────────────────────────
export interface Chunk {
  id: string;
  documentId: string;
  organizationId: string;
  content: string;
  index: number;             // position in document
  metadata: {
    title: string;
    fileName: string;
    section?: string;
  };
}

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

// ── Search ────────────────────────────────────────────────────────
export interface SearchResult {
  chunk: Chunk;
  score: number;             // cosine similarity (0-1)
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  topK: number;
}

// ── Citation ──────────────────────────────────────────────────────
export interface Citation {
  chunkId: string;
  documentTitle: string;
  fileName: string;
  content: string;           // the relevant excerpt
  position: number;          // chunk index in document
  score: number;
}

// ── Reranker (see reranker.ts) ────────────────────────────────────
