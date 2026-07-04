import type { EvalCase, EvalResult, EvalSummary, RetrievalMetrics, RetrieverFn, GeneratorFn, JudgeFunctions } from "./types";

// ── Retrieval Metrics (pure computation, no LLM) ────────────────────

/** Precision@K — proportion of retrieved chunks that are relevant. */
export function precisionAtK(relevant: string[], retrieved: string[], k: number): number {
  const topK = retrieved.slice(0, k);
  if (topK.length === 0) return 0;
  const hits = topK.filter((id) => relevant.includes(id)).length;
  return hits / topK.length;
}

/** Recall@K — proportion of relevant chunks that were retrieved. */
export function recallAtK(relevant: string[], retrieved: string[], k: number): number {
  if (relevant.length === 0) return 1;
  const topK = retrieved.slice(0, k);
  const hits = topK.filter((id) => relevant.includes(id)).length;
  return hits / relevant.length;
}

/** MRR (Mean Reciprocal Rank) — rank of the first relevant chunk. */
export function mrr(relevant: string[], rankedResults: string[]): number {
  for (let i = 0; i < rankedResults.length; i++) {
    if (relevant.includes(rankedResults[i])) return 1 / (i + 1);
  }
  return 0;
}

/** NDCG@K — Normalized Discounted Cumulative Gain.
 *  Assumes binary relevance (1.0 = relevant, 0.0 = not relevant).
 */
export function ndcgAtK(relevant: string[], retrieved: string[], k: number): number {
  const topK = retrieved.slice(0, k);
  const relevance = topK.map((id) => (relevant.includes(id) ? 1 : 0));

  // DCG
  let dcg = relevance[0] ?? 0;
  for (let i = 1; i < relevance.length; i++) {
    dcg += relevance[i] / Math.log2(i + 1);
  }

  // IDCG (ideal — all relevant docs at top)
  const idealRelevance = Array.from({ length: k }, (_, i) => (i < relevant.length ? 1 : 0));
  let idcg = idealRelevance[0] ?? 0;
  for (let i = 1; i < idealRelevance.length; i++) {
    idcg += idealRelevance[i] / Math.log2(i + 1);
  }

  return idcg === 0 ? 0 : dcg / idcg;
}

function computeRetrievalMetrics(relevant: string[], retrieved: string[], k: number): RetrievalMetrics {
  return {
    precisionAtK: precisionAtK(relevant, retrieved, k),
    recallAtK: recallAtK(relevant, retrieved, k),
    mrr: mrr(relevant, retrieved),
    ndcgAtK: ndcgAtK(relevant, retrieved, k),
  };
}

// ── Evaluation Runner ───────────────────────────────────────────────

/** Run evaluation across a dataset.
 *  `judge` is optional — if omitted, only retrieval metrics are computed.
 *  `generator` is optional — if omitted, only retrieval metrics are computed.
 */
export async function runEvaluation(
  dataset: EvalCase[],
  retriever: RetrieverFn,
  generator?: GeneratorFn,
  judge?: JudgeFunctions,
  topK: number = 5,
): Promise<{ results: EvalResult[]; summary: EvalSummary }> {
  const results: EvalResult[] = [];

  for (const evalCase of dataset) {
    const startTime = Date.now();

    // 1. Retrieve
    const rawResults = await retriever(evalCase.question);
    const retrievedIds = rawResults.map((r) => r.id);

    const retrieval = computeRetrievalMetrics(evalCase.relevantChunkIds, retrievedIds, topK);

    const result: EvalResult = {
      caseId: evalCase.id,
      question: evalCase.question,
      groundTruth: evalCase.groundTruthAnswer,
      retrievedChunks: rawResults.slice(0, topK),
      retrieval,
      latencyMs: Date.now() - startTime,
    };

    // 2. Generate (optional)
    if (generator) {
      const contexts = rawResults.slice(0, topK).map((r) => r.content);
      result.generatedAnswer = await generator(evalCase.question, contexts);
    }

    // 3. Judge (optional, requires generator output)
    if (judge && result.generatedAnswer) {
      const contexts = rawResults.slice(0, topK).map((r) => r.content);
      try {
        const [faith, relevancy] = await Promise.all([
          judge.evaluateFaithfulness(result.generatedAnswer, contexts),
          judge.evaluateAnswerRelevancy(evalCase.question, result.generatedAnswer),
        ]);
        result.faithfulness = faith;
        result.answerRelevancy = relevancy;
      } catch {
        // Judge LLM calls failed — skip generation metrics
      }
    }

    results.push(result);
  }

  // Compute summary
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

  const summary: EvalSummary = {
    avgPrecision: avg(results.map((r) => r.retrieval.precisionAtK)),
    avgRecall: avg(results.map((r) => r.retrieval.recallAtK)),
    avgMRR: avg(results.map((r) => r.retrieval.mrr)),
    avgNDCG: avg(results.map((r) => r.retrieval.ndcgAtK)),
    totalCases: results.length,
    totalLatencyMs: results.reduce((s, r) => s + r.latencyMs, 0),
  };

  const faithResults = results.filter((r) => r.faithfulness !== undefined);
  if (faithResults.length > 0) {
    summary.avgFaithfulness = avg(faithResults.map((r) => r.faithfulness!));
    summary.avgAnswerRelevancy = avg(faithResults.map((r) => r.answerRelevancy!));
  }

  return { results, summary };
}
