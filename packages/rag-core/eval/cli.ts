/**
 * RAG Evaluation CLI
 *
 * Usage:
 *   # Mock retriever (smoke test, no DB needed):
 *   pnpm --filter @salesagent/rag-core eval
 *
 *   # Real retriever (requires DATABASE_URL):
 *   pnpm --filter @salesagent/rag-core eval:retrieval -- --real --org-id <orgId>
 *
 *   # Full eval with LLM judge (real retriever):
 *   DATABASE_URL=... npx tsx packages/rag-core/eval/cli.ts --real --org-id <orgId>
 *
 * Options:
 *   --real             Use real PgVector retriever (needs DATABASE_URL)
 *   --org-id <id>      Organization ID for tenant scoping
 *   --retrieval-only   Skip LLM judge metrics (faster, no API cost)
 *   --dataset <name>   "sales" (default) or "club" (legacy tennis club dataset)
 */

import { GOLDEN_DATASET } from "./dataset";
import { SALES_DATASET } from "./dataset-sales";
import { runEvaluation } from "./metrics";
import type { JudgeFunctions, RetrieverFn, GeneratorFn } from "./types";

// ── Judge Functions (LLM-as-Judge, injected from CLI) ──────────────

function buildJudge(): JudgeFunctions {
  let callDeepSeekJSON: any;

  async function ensureClient() {
    if (!callDeepSeekJSON) {
      try {
        const mod = await import("@salesagent/ai-core/client");
        callDeepSeekJSON = mod.callDeepSeekJSON;
      } catch {
        throw new Error(
          "Cannot import @salesagent/ai-core. Make sure ai-core is built. " +
          "Use --retrieval-only to skip LLM-as-Judge metrics."
        );
      }
    }
  }

  return {
    evaluateFaithfulness: async (answer: string, context: string[]): Promise<number> => {
      await ensureClient();
      const prompt = `You are a factuality judge. Given a generated answer and the retrieved context, determine if EVERY factual claim in the answer is supported by the context.

Context:
${context.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}

Generated Answer: ${answer}

Return JSON: { "score": 0-1 (1 = all claims supported, 0 = hallucinated), "unsupportedClaims": ["..."] }`;

      try {
        const { result } = await callDeepSeekJSON<{ score: number }>(prompt, undefined, { temperature: 0.1 });
        return Math.max(0, Math.min(1, result.score ?? 0.5));
      } catch {
        return 0.5;
      }
    },

    evaluateAnswerRelevancy: async (question: string, answer: string): Promise<number> => {
      await ensureClient();
      const prompt = `You are a relevance judge. Rate how well the generated answer addresses the original question.

Question: ${question}
Answer: ${answer}

Return JSON: { "score": 0-1 (1 = perfectly relevant, 0 = completely off-topic), "reasoning": "..." }`;

      try {
        const { result } = await callDeepSeekJSON<{ score: number }>(prompt, undefined, { temperature: 0.1 });
        return Math.max(0, Math.min(1, result.score ?? 0.5));
      } catch {
        return 0.5;
      }
    },
  };
}

// ── Mock Retrievers ────────────────────────────────────────────────

function buildClubMockRetriever(): RetrieverFn {
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

function buildSalesMockRetriever(): RetrieverFn {
  return async (query: string) => {
    const lower = query.toLowerCase();
    const mockChunks = [
      { id: "sales-mock-01", content: "启云科技AI客服支持全渠道：网页聊天、微信、企业微信、邮件和API接入。", score: 0.88 },
      { id: "sales-mock-02", content: "标准版￥9,800/月(3个AI坐席)，专业版￥29,800/月(10个AI坐席)，企业版按需定制。年付8折。", score: 0.82 },
      { id: "sales-mock-03", content: "基于大语言模型和RAG知识库，AI能处理产品咨询、故障排查、订单查询等常见问题。", score: 0.75 },
      { id: "sales-mock-04", content: "支持PDF、Word、Markdown、FAQ等格式文档批量导入，系统自动解析分块向量化。", score: 0.71 },
      { id: "sales-mock-05", content: "某头部电商平台部署后日处理10万+会话，AI自动解决率85%，年节省人力成本约￥800万。", score: 0.65 },
      { id: "sales-mock-06", content: "私有化部署支持AWS/阿里云/腾讯云/自建机房，1-2周完成。通过ISO 27001和等保三级认证。", score: 0.58 },
      { id: "sales-mock-07", content: "14天免费试用，包含3个AI坐席和全部功能。不需要绑定信用卡。", score: 0.52 },
      { id: "sales-mock-08", content: "与网易七鱼不同，启云基于大模型+RAG，无需大量配置FAQ——上传文档即可自动学习。", score: 0.45 },
    ];
    const words = lower.split(/\s+/).filter((w) => w.length > 1);
    return mockChunks.filter((c) =>
      words.some((w) => c.content.toLowerCase().includes(w))
    );
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
  const retrievalOnly = args.includes("--retrieval-only");
  const useReal = args.includes("--real");
  const datasetName = args.includes("--dataset") ? args[args.indexOf("--dataset") + 1] : "sales";

  const orgId = args.includes("--org-id") ? args[args.indexOf("--org-id") + 1] : undefined;

  const dataset = datasetName === "club" ? GOLDEN_DATASET : SALES_DATASET;

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   RAG Evaluation Suite — SalesAgent AI  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  console.log(`Dataset: ${dataset.length} cases (${datasetName === "club" ? "Club Concierge" : "启云科技 SalesAgent"})`);
  console.log(`Mode: ${retrievalOnly ? "Retrieval-only" : "Full (Retrieval + Generation + LLM Judge)"}`);
  console.log(`Retriever: ${useReal ? "REAL PgVector (requires DATABASE_URL)" : "Mock (keyword-based)"}`);
  if (useReal) console.log(`Org ID: ${orgId || "(not set — will fail!)"}`);
  console.log("");

  let retriever: RetrieverFn;
  if (useReal) {
    if (!orgId) {
      console.error("ERROR: --org-id is required when using --real retriever.");
      process.exit(1);
    }
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("ERROR: DATABASE_URL env var is required for real retriever.");
      process.exit(1);
    }
    const { createRealRetriever } = await import("./retriever-adapter");
    console.log("Connecting to database...");
    retriever = await createRealRetriever({
      orgId,
      databaseUrl: dbUrl,
      embeddingApiKey: process.env.EMBEDDING_API_KEY,
      cohereApiKey: process.env.COHERE_API_KEY,
    });
    console.log("Real retriever ready.\n");
  } else {
    retriever = datasetName === "club" ? buildClubMockRetriever() : buildSalesMockRetriever();
  }

  const generator = retrievalOnly ? undefined : buildMockGenerator();
  const judge = retrievalOnly ? undefined : buildJudge();

  console.log("Running evaluation...");

  const startTime = Date.now();
  const { results, summary } = await runEvaluation(dataset, retriever, generator, judge, 5);
  const elapsed = Date.now() - startTime;

  // ── Print results by category ──────────────────────────────────
  const categories = [...new Set(results.map((r) => {
    const c = dataset.find((d) => d.id === r.caseId);
    return c?.metadata?.category ?? "unknown";
  }))];

  console.log("\n┌──────────────────────────────────────────────────────────────────────────┐");
  console.log("│                          CATEGORY BREAKDOWN                              │");
  console.log("├────────────┬────────┬──────────┬──────────┬──────────┬──────────────────┤");
  console.log("│ Category   │ Cases  │ Prec@5   │ Recall@5 │ MRR      │ NDCG@5           │");
  console.log("├────────────┼────────┼──────────┼──────────┼──────────┼──────────────────┤");

  for (const cat of categories) {
    const catResults = results.filter((r) => {
      const c = dataset.find((d) => d.id === r.caseId);
      return c?.metadata?.category === cat;
    });
    if (catResults.length === 0) continue;
    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
    const p = avg(catResults.map((r) => r.retrieval.precisionAtK)).toFixed(3);
    const r = avg(catResults.map((r) => r.retrieval.recallAtK)).toFixed(3);
    const m = avg(catResults.map((r) => r.retrieval.mrr)).toFixed(3);
    const n = avg(catResults.map((r) => r.retrieval.ndcgAtK)).toFixed(3);
    console.log(`│ ${cat.padEnd(10)} │ ${String(catResults.length).padEnd(6)} │ ${p.padEnd(8)} │ ${r.padEnd(8)} │ ${m.padEnd(8)} │ ${n.padEnd(16)} │`);
  }

  console.log("├────────────┴────────┴──────────┴──────────┴──────────┴──────────────────┤");
  console.log("│                            SUMMARY                                       │");
  console.log("├──────────────────────────────────────────────────────────────────────────┤");
  console.log(`│ Avg Precision@5:  ${summary.avgPrecision.toFixed(3)}                                                  │`);
  console.log(`│ Avg Recall@5:     ${summary.avgRecall.toFixed(3)}                                                  │`);
  console.log(`│ Avg MRR:          ${summary.avgMRR.toFixed(3)}                                                  │`);
  console.log(`│ Avg NDCG@5:       ${summary.avgNDCG.toFixed(3)}                                                  │`);
  if (summary.avgFaithfulness !== undefined) {
    console.log(`│ Avg Faithfulness: ${summary.avgFaithfulness.toFixed(3)}                                                  │`);
    console.log(`│ Avg Relevancy:    ${summary.avgAnswerRelevancy!.toFixed(3)}                                                  │`);
  }
  console.log(`│ Total cases:      ${summary.totalCases}                                                        │`);
  console.log(`│ Total time:       ${elapsed}ms                                                    │`);
  console.log("└──────────────────────────────────────────────────────────────────────────┘");

  // ── Show per-case detail if < 20 cases ─────────────────────────
  if (results.length <= 20) {
    console.log("\n┌──────┬────────────────────────────────────────────┬──────────┬────────┬──────┐");
    console.log("│ Case │ Question                                   │ Precision│ Recall │ MRR  │");
    console.log("├──────┼────────────────────────────────────────────┼──────────┼────────┼──────┤");
    for (const r of results) {
      const q = r.question.length > 42 ? r.question.slice(0, 39) + "..." : r.question.padEnd(42);
      console.log(`│ ${r.caseId.padEnd(4)} │ ${q} │   ${r.retrieval.precisionAtK.toFixed(2)}   │  ${r.retrieval.recallAtK.toFixed(2)}  │ ${r.retrieval.mrr.toFixed(2)} │`);
    }
    console.log("└──────┴────────────────────────────────────────────┴──────────┴────────┴──────┘");
  }
}

main().catch(console.error);
