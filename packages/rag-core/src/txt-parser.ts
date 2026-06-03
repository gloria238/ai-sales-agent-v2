/**
 * Plain text parser — handles .txt, .md, .csv files.
 * No external dependencies needed.
 */
export function parseTXT(input: Buffer | string): string {
  const text = typeof input === "string" ? input : input.toString("utf-8");
  return text.trim();
}
