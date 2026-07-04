/** Reciprocal Rank Fusion — combines multiple ranked result lists into one.
 *
 *  RRF is parameter-free (only the k constant) and requires no score normalization.
 *  k=60 is the standard value from the original paper (Cormack et al., 2009).
 *
 *  Each result's score = sum_over_rankings(1 / (k + rank_position))
 *  where rank_position is 0-indexed.
 */
export function reciprocalRankFusion<T extends { id: string; score: number }>(
  resultSets: T[][],
  k: number = 60,
  topK: number = 5,
): Array<{ id: string; score: number }> {
  const scores = new Map<string, number>();

  for (const results of resultSets) {
    for (let i = 0; i < results.length; i++) {
      const rrfScore = 1 / (k + i + 1); // i is 0-indexed → rank = i+1
      const current = scores.get(results[i].id) ?? 0;
      scores.set(results[i].id, current + rrfScore);
    }
  }

  return Array.from(scores.entries())
    .map(([id, score]) => ({ id, score: Math.round(score * 10_000) / 10_000 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
