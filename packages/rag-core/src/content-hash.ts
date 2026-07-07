/**
 * Content-Addressable Indexing — SHA-256 document hashing for dedup and incremental indexing.
 *
 * Why:
 *   1. Same document uploaded twice → skip (idempotent)
 *   2. Same file name, different content → delete old chunks, rebuild
 *   3. Chunk IDs based on content hash → stable across re-uploads
 *   4. Changed content → only re-embed changed chunks (future: diff-based)
 */

// ── Types ────────────────────────────────────────────────────────────

export interface ContentFingerprint {
  /** SHA-256 hex of the full document content */
  hash: string;
  /** Human-readable: "sha256:a1b2c3d4..." */
  toString(): string;
}

export interface IndexDiff {
  /** Chunks that exist in the new document but not in the old */
  added: number[];
  /** Chunk indices that were present in the old document but not in the new */
  removed: number[];
  /** Chunk indices where content changed */
  modified: number[];
  /** Chunk indices that are identical (content hash match) */
  unchanged: number[];
  /** Total chunks in new document */
  totalNew: number;
  /** Total chunks in old document */
  totalOld: number;
}

// ── Content Fingerprinting ───────────────────────────────────────────

/** Compute SHA-256 hash of a string or Buffer. */
export async function fingerprintContent(content: string | Buffer): Promise<ContentFingerprint> {
  const data = typeof content === "string" ? new TextEncoder().encode(content) : new Uint8Array(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return {
    hash,
    toString: () => `sha256:${hash.slice(0, 12)}...`,
  };
}

/** Compute SHA-256 of a string (synchronous hash via Web Crypto — actually async). */
export async function hashString(input: string): Promise<string> {
  const fp = await fingerprintContent(input);
  return fp.hash;
}

// ── Chunk ID Generation ──────────────────────────────────────────────

/**
 * Generate a stable chunk ID based on content hash and chunk index.
 * Unlike timestamp-based IDs, these are deterministic — same content → same ID.
 * Format: ck-{contentHash8}-{index}
 */
export async function generateChunkId(content: string, index: number): Promise<string> {
  const h = await hashString(content);
  return `ck-${h.slice(0, 8)}-${String(index).padStart(3, "0")}`;
}

// ── Incremental Index Diff ───────────────────────────────────────────

/**
 * Compare old chunks (from DB) with new chunks (from fresh parse) to determine
 * what needs to be added, updated, or removed.
 *
 * Uses per-chunk content hashing for precise diff.
 * Returns null if the content is completely unchanged (full skip).
 */
export async function diffChunks(
  oldChunks: Array<{ index: number; contentHash: string }>,
  newChunks: Array<{ index: number; content: string }>,
): Promise<IndexDiff | null> {
  // Quick check: same chunk count and all hashes match → full skip
  if (oldChunks.length === newChunks.length) {
    const newHashes = await Promise.all(newChunks.map((c) => hashString(c.content)));
    const allMatch = oldChunks.every((old, i) => old.contentHash === newHashes[i]);
    if (allMatch) return null; // null = no changes, skip indexing
  }

  // Detailed diff
  const oldHashSet = new Map(oldChunks.map((c) => [c.index, c.contentHash]));
  const newHashes = await Promise.all(newChunks.map((c) => hashString(c.content)));

  const added: number[] = [];
  const removed: number[] = [];
  const modified: number[] = [];
  const unchanged: number[] = [];

  // Find added/modified/unchanged in new chunks
  for (let i = 0; i < newChunks.length; i++) {
    const oldHash = oldHashSet.get(newChunks[i].index);
    if (oldHash === undefined) {
      added.push(i);
    } else if (oldHash !== newHashes[i]) {
      modified.push(i);
    } else {
      unchanged.push(i);
    }
  }

  // Find removed (in old but not in new)
  const newIndexSet = new Set(newChunks.map((c) => c.index));
  for (const old of oldChunks) {
    if (!newIndexSet.has(old.index)) {
      removed.push(old.index);
    }
  }

  return {
    added,
    removed,
    modified,
    unchanged,
    totalNew: newChunks.length,
    totalOld: oldChunks.length,
  };
}

// ── Content Hash Column SQL ──────────────────────────────────────────

/**
 * SQL to add a content_hash column to DocumentChunk for incremental indexing.
 * Run via setup-vector.mjs or manually.
 */
export const ADD_CONTENT_HASH_SQL = `
ALTER TABLE sales_agent."DocumentChunk"
  ADD COLUMN IF NOT EXISTS content_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_document_chunk_hash
  ON sales_agent."DocumentChunk" ("documentId", content_hash);
`;

/** SQL to add a content_hash column to Document for dedup on upload. */
export const ADD_DOCUMENT_HASH_SQL = `
ALTER TABLE sales_agent."Document"
  ADD COLUMN IF NOT EXISTS content_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_org_hash
  ON sales_agent."Document" ("organizationId", content_hash);
`;
