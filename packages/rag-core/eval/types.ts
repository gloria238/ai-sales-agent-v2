// ── RAG Evaluation Types ────────────────────────────────────────────

export interface EvalCase {
  id: string;
  question: string;
  groundTruthAnswer: string;
  relevantChunkIds: string[];
  metadata?: { category?: string; difficulty?: "easy" | "medium" | "hard" };
}

export interface RetrievalMetrics {
  precisionAtK: number;
  recallAtK: number;
  mrr: number;
  ndcgAtK: number;
}

export interface EvalResult {
  caseId: string;
  question: string;
  groundTruth: string;
  retrievedChunks: Array<{ id: string; content: string; score: number }>;
  generatedAnswer?: string;
  retrieval: RetrievalMetrics;
  faithfulness?: number;
  answerRelevancy?: number;
  latencyMs: number;
}

export interface EvalSummary {
  avgPrecision: number;
  avgRecall: number;
  avgMRR: number;
  avgNDCG: number;
  avgFaithfulness?: number;
  avgAnswerRelevancy?: number;
  totalCases: number;
  totalLatencyMs: number;
}

export interface JudgeFunctions {
  evaluateFaithfulness: (answer: string, context: string[]) => Promise<number>;
  evaluateAnswerRelevancy: (question: string, answer: string) => Promise<number>;
}

export type RetrieverFn = (query: string) => Promise<Array<{ id: string; content: string; score: number }>>;
export type GeneratorFn = (question: string, context: string[]) => Promise<string>;
