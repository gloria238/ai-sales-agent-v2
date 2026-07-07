/**
 * Retriever Adapter — connects the evaluation framework to the real hybrid retriever.
 *
 * Usage:
 *   1. Set DATABASE_URL env var pointing to a Supabase PostgreSQL with pgvector
 *   2. Ensure knowledge base has documents uploaded (e.g., seed-chinese-demo)
 *   3. Run: npx tsx packages/rag-core/eval/cli.ts --real --org-id <orgId>
 *
 * For CI: npx tsx packages/rag-core/eval/cli.ts --real --org-id <orgId> --retrieval-only
 */

import type { RetrieverFn } from "./types";
import type { SqlExecutor } from "../src/keyword-search";
import { hybridRetrieve } from "../src/hybrid-retriever";
import { createEmbeddingProvider } from "../src/embeddings";

export interface RealRetrieverConfig {
  /** Organization ID for tenant-scoped retrieval */
  orgId: string;
  /** PostgreSQL connection URL (DATABASE_URL) */
  databaseUrl: string;
  /** Optional: embedding API key (falls back to DEEPSEEK_API_KEY) */
  embeddingApiKey?: string;
  /** Optional: Cohere API key for reranker */
  cohereApiKey?: string;
}

/**
 * Create a RetrieverFn that uses the real hybrid retrieval pipeline.
 * Dynamically imports PrismaClient to avoid bundling it into rag-core.
 */
export async function createRealRetriever(config: RealRetrieverConfig): Promise<RetrieverFn> {
  // Dynamic import — PrismaClient is heavy and only needed for eval
  const { PrismaClient } = await import("@prisma/client");

  const prisma = new PrismaClient({
    datasources: { db: { url: config.databaseUrl } },
  });

  // Set env vars for embedder and reranker (eval CLI may not have them loaded)
  if (config.embeddingApiKey) process.env.EMBEDDING_API_KEY = config.embeddingApiKey;
  if (config.cohereApiKey) process.env.COHERE_API_KEY = config.cohereApiKey;

  const embedder = createEmbeddingProvider();

  const sqlExecutor: SqlExecutor = async (query: string, ...params: unknown[]) => {
    return (prisma as any).$queryRawUnsafe(query, ...params) as Promise<unknown[]>;
  };

  return async (query: string) => {
    const { results } = await hybridRetrieve(
      sqlExecutor,
      embedder,
      query,
      config.orgId,
      { topK: 5 },
    );

    return results.map((r) => ({
      id: r.chunk.id,
      content: r.chunk.content,
      score: r.score,
    }));
  };
}

/**
 * Create a mock retriever for the sales domain (used when no DB is available).
 * Uses simple keyword matching against the expected answers — useful for CI smoke tests.
 */
export function createSalesMockRetriever(): RetrieverFn {
  return async (query: string) => {
    const lower = query.toLowerCase();
    // Simulated results with IDs that won't match relevantChunkIds
    // This is only for testing the eval framework plumbing, not real accuracy
    const snippets = [
      { id: "mock-01", content: "启云科技AI客服支持全渠道：网页/微信/企微/邮件/API", score: 0.85 },
      { id: "mock-02", content: "标准版￥9,800/月，专业版￥29,800/月，企业版按需定制", score: 0.72 },
      { id: "mock-03", content: "系统基于RAG技术确保AI严格基于知识库内容回答", score: 0.68 },
      { id: "mock-04", content: "支持14天免费试用，不需要绑定信用卡", score: 0.55 },
      { id: "mock-05", content: "私有化部署1-2周完成，支持AWS/阿里云/腾讯云", score: 0.42 },
    ];

    const words = lower.split(/\s+/).filter((w) => w.length > 1);
    return snippets.filter((s) =>
      words.some((w) => s.content.toLowerCase().includes(w))
    );
  };
}
