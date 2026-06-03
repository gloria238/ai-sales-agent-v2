/**
 * FAQ parser — converts structured Q&A formats into searchable text.
 * Accepts JSON arrays of { question, answer } or CSV with columns "question,answer".
 */
export function parseFAQ(input: string): string {
  // Try JSON first
  try {
    const data = JSON.parse(input);
    if (Array.isArray(data)) {
      return data
        .map((item, i) => {
          const q = item.question || item.q || item.Q || "";
          const a = item.answer || item.a || item.A || "";
          return `Q${i + 1}: ${q}\nA${i + 1}: ${a}`;
        })
        .join("\n\n");
    }
    // If it's an object, try to extract Q&A pairs
    return Object.entries(data)
      .map(([key, value]) => `Q: ${key}\nA: ${String(value)}`)
      .join("\n\n");
  } catch {
    // Not JSON — treat as CSV
    const lines = input.trim().split("\n");
    if (lines.length < 2) return input; // Not enough lines for CSV

    // Assume header row: question,answer
    return lines
      .slice(1)
      .map((line, i) => {
        const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/); // CSV-safe split
        const q = (parts[0] || "").replace(/^"|"$/g, "").trim();
        const a = (parts[1] || "").replace(/^"|"$/g, "").trim();
        return q && a ? `Q${i + 1}: ${q}\nA${i + 1}: ${a}` : line;
      })
      .filter(Boolean)
      .join("\n\n");
  }
}
