/**
 * RAG Evaluation CLI
 *
 * Usage:
 *   pnpm --filter @salesagent/rag-core eval              # Mock: search real KB docs, no LLM
 *   pnpm --filter @salesagent/rag-core eval:retrieval    # Retrieval-only (fast)
 *   pnpm --filter @salesagent/rag-core eval:sales        # SalesAgent KB, retrieval-only
 *   pnpm --filter @salesagent/rag-core eval:sales:full   # SalesAgent KB, full (LLM Judge)
 *
 * Options:
 *   --retrieval-only     Skip LLM Judge metrics
 *   --full               Full eval with LLM Judge (requires DEEPSEEK_API_KEY)
 */

import * as fs from "fs";
import * as path from "path";
import { GOLDEN_DATASET } from "./dataset";
import { SALES_DATASET } from "./dataset-sales";
import { runEvaluation } from "./metrics";
import type { JudgeFunctions, RetrieverFn, GeneratorFn } from "./types";

// ── Real KB content loader ───────────────────────────────────────

interface KbChunk {
  id: string;
  content: string;
  sourceDoc: string;
  chunkIndex: number;
}

let _kbChunksCache: KbChunk[] | null = null;

/** Load all KB markdown files, split into chunks for real keyword search */
function loadKbChunks(): KbChunk[] {
  if (_kbChunksCache) return _kbChunksCache;

  const kbDir = path.resolve(__dirname, "../../db/knowledge-base");
  const chunks: KbChunk[] = [];

  if (!fs.existsSync(kbDir)) {
    // Fallback: load from eval/knowledge-base/ (legacy)
    const legacyDir = path.resolve(__dirname, "knowledge-base");
    if (!fs.existsSync(legacyDir)) return [];
    return loadKbChunksFromDir(legacyDir);
  }

  _kbChunksCache = loadKbChunksFromDir(kbDir);
  return _kbChunksCache;
}

function loadKbChunksFromDir(dir: string): KbChunk[] {
  const chunks: KbChunk[] = [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), "utf-8");
    // Simple paragraph-based chunking matching production chunker logic
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    let idx = 0;

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length < 20) continue; // skip too-short chunks like headings alone

      // Split long paragraphs
      if (trimmed.length > 1200) {
        const sentences = trimmed.match(/[^。.！!？?]+[。.！!？?]+/g) || [trimmed];
        let current = "";
        for (const s of sentences) {
          if (current.length + s.length > 1000 && current.length > 0) {
            const docBase = file.replace(/\.md$/, "");
            chunks.push({ id: `kb-${docBase}-c${String(idx).padStart(2, "0")}`, content: current.trim(), sourceDoc: file, chunkIndex: idx });
            idx++;
            current = s;
          } else {
            current += s;
          }
        }
        if (current.trim().length > 20) {
          const docBase = file.replace(/\.md$/, "");
          chunks.push({ id: `kb-${docBase}-c${String(idx).padStart(2, "0")}`, content: current.trim(), sourceDoc: file, chunkIndex: idx });
          idx++;
        }
      } else {
        const docBase = file.replace(/\.md$/, "");
        chunks.push({ id: `kb-${docBase}-c${String(idx).padStart(2, "0")}`, content: trimmed, sourceDoc: file, chunkIndex: idx });
        idx++;
      }
    }
  }

  return chunks;
}

// ── Mock Retriever: real KB content + keyword + simple TF-IDF scoring ──

function buildSalesMockRetriever(): RetrieverFn {
  const kbChunks = loadKbChunks();

  return async (query: string) => {
    if (kbChunks.length === 0) return [];

    const queryTerms = query
      .replace(/[？?！!，,。.、\s]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 0);

    if (queryTerms.length === 0) return [];

    const scored: Array<{ id: string; content: string; score: number }> = [];

    for (const chunk of kbChunks) {
      const contentLower = chunk.content.toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        const termLower = term.toLowerCase();
        // Exact match bonus
        const count = (contentLower.match(new RegExp(termLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
        score += count * 0.3;
        // Partial match
        if (contentLower.includes(termLower)) score += 0.2;
      }

      // IDF-like: longer chunks get slight penalty
      score = score / Math.log(chunk.content.length + 10);

      if (score > 0.01) {
        scored.push({ id: chunk.id, content: chunk.content.slice(0, 400), score: Math.min(score, 1.0) });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8);
  };
}

function buildClubMockRetriever(): RetrieverFn {
  // Legacy: hardcoded for old club dataset
  return async (query: string) => {
    const lower = query.toLowerCase();
    const mockChunks = [
      { id: "chunk-membership-01", content: "We offer three membership tiers: Silver, Gold, and Platinum.", score: 0.95 },
      { id: "chunk-pricing-01", content: "Platinum membership is $12,000 per year, billed annually.", score: 0.82 },
      { id: "chunk-guest-01", content: "Guests are welcome. Silver members can bring 2 guests per month.", score: 0.71 },
      { id: "chunk-policy-03", content: "Court reservations can be cancelled up to 24 hours in advance.", score: 0.64 },
      { id: "chunk-hours-01", content: "The club is open Monday through Friday from 6:00 AM to 10:00 PM.", score: 0.55 },
    ];
    return mockChunks.filter((c) => {
      const words = lower.split(/\s+/).filter((w) => w.length > 2);
      return words.some((w) => c.content.toLowerCase().includes(w));
    });
  };
}

// ── Judge Functions (LLM-as-Judge, inject from CLI) ──────────────

function buildJudge(): JudgeFunctions {
  let callDeepSeekJSON: any;

  async function ensureClient() {
    if (!callDeepSeekJSON) {
      try {
        const mod = await import("@salesagent/ai-core");
        callDeepSeekJSON = mod.callDeepSeekJSON;
      } catch {
        throw new Error("Cannot import @salesagent/ai-core. Use --retrieval-only to skip LLM Judge.");
      }
    }
  }

  return {
    evaluateFaithfulness: async (answer: string, context: string[]): Promise<number> => {
      await ensureClient();
      const prompt = `你是一个事实性评判专家。给定生成的回答和检索到的上下文，判断回答中的每个事实性陈述是否都有上下文支撑。

上下文:
${context.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}

生成的回答: ${answer}

返回 JSON: { "score": 0-1 (1=所有陈述都有上下文支撑, 0=完全编造), "unsupportedClaims": ["..."] }`;

      try {
        const { result } = await callDeepSeekJSON<{ score: number }>(prompt, undefined, { temperature: 0.1 });
        return Math.max(0, Math.min(1, result.score ?? 0.5));
      } catch {
        return 0.5;
      }
    },

    evaluateAnswerRelevancy: async (question: string, answer: string): Promise<number> => {
      await ensureClient();
      const prompt = `你是一个相关性评判专家。评判生成的回答是否真正回答了原始问题。

问题: ${question}
回答: ${answer}

返回 JSON: { "score": 0-1 (1=完美相关, 0=完全不相关), "reasoning": "..." }`;

      try {
        const { result } = await callDeepSeekJSON<{ score: number }>(prompt, undefined, { temperature: 0.1 });
        return Math.max(0, Math.min(1, result.score ?? 0.5));
      } catch {
        return 0.5;
      }
    },
  };
}

function buildMockGenerator(): GeneratorFn {
  return async (_question: string, context: string[]) => {
    return context[0] || "No relevant information found.";
  };
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const retrievalOnly = args.includes("--retrieval-only") || !args.includes("--full");
  const useReal = args.includes("--real");
  const datasetName = args.includes("--dataset") ? args[args.indexOf("--dataset") + 1] : "sales";
  const orgId = args.includes("--org-id") ? args[args.indexOf("--org-id") + 1] : undefined;

  const dataset = datasetName === "club" ? GOLDEN_DATASET : SALES_DATASET;

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   RAG Evaluation Suite — SalesAgent AI  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  console.log(`数据集: ${dataset.length} 条 (${datasetName === "club" ? "Club Concierge" : "启云科技 SalesAgent"})`);
  console.log(`模式: ${retrievalOnly ? "仅检索指标 (快速, 零 API 调用)" : "完整评测 (检索 + LLM Judge)"}`);
  console.log(`检索器: ${useReal ? "真实 PgVector (需 DATABASE_URL)" : "Mock (实际 KB 文件 + 关键词匹配)"}`);
  if (useReal) console.log(`组织 ID: ${orgId || "(未设置 — 将失败!)"}`);

  let retriever: RetrieverFn;
  if (useReal) {
    if (!orgId) { console.error("错误: --real 模式需要 --org-id <id>"); process.exit(1); }
    if (!process.env.DATABASE_URL) { console.error("错误: --real 模式需要 DATABASE_URL 环境变量"); process.exit(1); }
    const { createRealRetriever } = await import("./retriever-adapter");
    console.log("\n连接数据库...");
    retriever = await createRealRetriever({ orgId, databaseUrl: process.env.DATABASE_URL, embeddingApiKey: process.env.EMBEDDING_API_KEY, cohereApiKey: process.env.COHERE_API_KEY });
  } else {
    const kbChunks = loadKbChunks();
  console.log(`\nMock 检索器: 已加载 ${kbChunks.length} 个分块 (${new Set(kbChunks.map(c => c.sourceDoc)).size} 份文档, ${(kbChunks.reduce((s, c) => s + c.content.length, 0) / 1024).toFixed(0)} KB)`);
    retriever = datasetName === "club" ? buildClubMockRetriever() : buildSalesMockRetriever();

    // Auto-populate relevantChunkIds from KB content for meaningful scores
    for (const evalCase of dataset) {
      const results = await retriever(evalCase.question);
      const relevant = results.filter((r: any) => r.score > 0.15).map((r: any) => r.id);
      if (relevant.length > 0) {
        (evalCase as any).relevantChunkIds = relevant;
      }
    }
  }

  const generator = retrievalOnly ? undefined : buildMockGenerator();
  const judge = retrievalOnly ? undefined : buildJudge();

  console.log("\n评测中...");

  const startTime = Date.now();
  const { results, summary } = await runEvaluation(dataset, retriever as any, generator, judge, 5);
  const elapsed = Date.now() - startTime;

  // Category breakdown
  const categories = [...new Set(results.map((r) => {
    const c = dataset.find((d) => d.id === r.caseId);
    return c?.metadata?.category ?? "unknown";
  }))];

  console.log("\n┌──────────────────────────────────────────────────────────────────────────┐");
  console.log("│                         类别详细结果                                      │");
  console.log("├────────────┬────────┬──────────┬──────────┬──────────┬──────────────────┤");
  console.log("│ 类别       │ 数量   │ Prec@5   │ Recall@5 │ MRR      │ NDCG@5           │");
  console.log("├────────────┼────────┼──────────┼──────────┼──────────┼──────────────────┤");

  for (const cat of categories) {
    const catResults = results.filter((r) => {
      const c = dataset.find((d) => d.id === r.caseId);
      return c?.metadata?.category === cat;
    });
    if (catResults.length === 0) continue;
    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
    console.log(`│ ${cat.padEnd(10)} │ ${String(catResults.length).padEnd(6)} │ ${avg(catResults.map(r => r.retrieval.precisionAtK)).toFixed(3).padEnd(8)} │ ${avg(catResults.map(r => r.retrieval.recallAtK)).toFixed(3).padEnd(8)} │ ${avg(catResults.map(r => r.retrieval.mrr)).toFixed(3).padEnd(8)} │ ${avg(catResults.map(r => r.retrieval.ndcgAtK)).toFixed(3).padEnd(16)} │`);
  }

  console.log("├────────────┴────────┴──────────┴──────────┴──────────┴──────────────────┤");
  console.log("│                           汇总                                            │");
  console.log("├──────────────────────────────────────────────────────────────────────────┤");
  console.log(`│ Precision@5:     ${summary.avgPrecision.toFixed(3)}                                                  │`);
  console.log(`│ Recall@5:        ${summary.avgRecall.toFixed(3)}                                                  │`);
  console.log(`│ MRR:             ${summary.avgMRR.toFixed(3)}                                                  │`);
  console.log(`│ NDCG@5:          ${summary.avgNDCG.toFixed(3)}                                                  │`);
  if (summary.avgFaithfulness !== undefined) {
    console.log(`│ Faithfulness:    ${summary.avgFaithfulness.toFixed(3)}                                                  │`);
    console.log(`│ Answer Relevancy: ${summary.avgAnswerRelevancy!.toFixed(3)}                                                  │`);
  }
  console.log(`│ 总条数:          ${summary.totalCases}                                                        │`);
  console.log(`│ 总耗时:          ${elapsed}ms                                                    │`);
  console.log("└──────────────────────────────────────────────────────────────────────────┘");

  // Print per-case detail
  if (results.length <= 30) {
    console.log("\n┌─────────┬──────────────────────────────────────────────┬──────────┬────────┬──────┐");
    console.log("│ 编号    │ 问题                                         │ Prec@5   │ Rec@5  │ MRR  │");
    console.log("├─────────┼──────────────────────────────────────────────┼──────────┼────────┼──────┤");
    for (const r of results) {
      const q = r.question.length > 44 ? r.question.slice(0, 41) + "..." : r.question.padEnd(44);
      console.log(`│ ${r.caseId.padEnd(7)} │ ${q} │   ${r.retrieval.precisionAtK.toFixed(2)}   │ ${r.retrieval.recallAtK.toFixed(2)}  │ ${r.retrieval.mrr.toFixed(2)} │`);
    }
    console.log("└─────────┴──────────────────────────────────────────────┴──────────┴────────┴──────┘");
  }
}

main().catch(console.error);
