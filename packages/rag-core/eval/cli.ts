/**
 * RAG Evaluation CLI
 *
 * Usage: npx tsx packages/rag-core/eval/cli.ts [--retrieval-only]
 *
 * This script injects LLM-as-Judge from @salesagent/ai-core at the CLI level,
 * keeping rag-core free of LLM dependencies.
 *
 * ## /verify
 * ```bash
 * pnpm --filter @salesagent/rag-core eval
 * ```
 */

import { GOLDEN_DATASET } from "./dataset";
import { runEvaluation } from "./metrics";
import type { JudgeFunctions, RetrieverFn, GeneratorFn } from "./types";

// ── Judge Functions (LLM-as-Judge, injected from CLI) ──────────────

function buildJudge(): JudgeFunctions {
  // Dynamic import to avoid bundling ai-core into rag-core
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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
        return 0.5; // Judge call failed — neutral score
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

// ── Mock Retriever (for demo / testing) ─────────────────────────────

function buildMockRetriever(): RetrieverFn {
  return async (query: string) => {
    const lower = query.toLowerCase();
    // Simple keyword-based mock — returns fixed chunks for matching keywords
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

function buildMockGenerator(): GeneratorFn {
  return async (_question: string, context: string[]) => {
    return context[0] || "No relevant information found.";
  };
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const retrievalOnly = args.includes("--retrieval-only");

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   RAG Evaluation Suite — SalesAgent AI  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  console.log(`Dataset: ${GOLDEN_DATASET.length} cases`);
  console.log(`Mode: ${retrievalOnly ? "Retrieval-only" : "Full (Retrieval + Generation + LLM Judge)"}\n`);

  const retriever = buildMockRetriever();
  const generator = retrievalOnly ? undefined : buildMockGenerator();
  const judge = retrievalOnly ? undefined : buildJudge();

  console.log("Running evaluation...");

  const startTime = Date.now();
  const { results, summary } = await runEvaluation(GOLDEN_DATASET, retriever, generator, judge, 5);
  const elapsed = Date.now() - startTime;

  // ── Print results ─────────────────────────────────────────
  console.log("\n┌─────────────────────────────────────────────────────────────────────┐");
  console.log("│                         CASE RESULTS                               │");
  console.log("├──────┬──────────────────────────────────┬──────────┬────────┬──────┤");
  console.log("│ Case │ Question                         │ Precision│ Recall │ MRR  │");
  console.log("├──────┼──────────────────────────────────┼──────────┼────────┼──────┤");

  for (const r of results) {
    const q = r.question.length > 32 ? r.question.slice(0, 29) + "..." : r.question.padEnd(32);
    console.log(`│ ${r.caseId.padEnd(4)} │ ${q} │   ${r.retrieval.precisionAtK.toFixed(2)}   │  ${r.retrieval.recallAtK.toFixed(2)}  │ ${r.retrieval.mrr.toFixed(2)} │`);
  }

  console.log("├──────┴──────────────────────────────────┴──────────┴────────┴──────┤");
  console.log("│                         SUMMARY                                     │");
  console.log("├─────────────────────────────────────────────────────────────────────┤");
  console.log(`│ Avg Precision@5:  ${summary.avgPrecision.toFixed(3)}                                            │`);
  console.log(`│ Avg Recall@5:     ${summary.avgRecall.toFixed(3)}                                            │`);
  console.log(`│ Avg MRR:          ${summary.avgMRR.toFixed(3)}                                            │`);
  console.log(`│ Avg NDCG@5:       ${summary.avgNDCG.toFixed(3)}                                            │`);
  if (summary.avgFaithfulness !== undefined) {
    console.log(`│ Avg Faithfulness: ${summary.avgFaithfulness.toFixed(3)}                                            │`);
    console.log(`│ Avg Relevancy:    ${summary.avgAnswerRelevancy!.toFixed(3)}                                            │`);
  }
  console.log(`│ Total cases:      ${summary.totalCases}                                                   │`);
  console.log(`│ Total time:       ${elapsed}ms                                               │`);
  console.log("└─────────────────────────────────────────────────────────────────────┘");
}

main().catch(console.error);
