import { AIClientError, type DeepSeekMessage, type DeepSeekResponse, type TokenUsage } from "@salesagent/shared-types";

// Re-export for convenience
export { AIClientError };
export type { TokenUsage };

const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const MODEL = "deepseek-chat";

export async function callDeepSeek(
  prompt: string,
  system?: string,
  options?: { temperature?: number; maxTokens?: number; timeoutMs?: number },
): Promise<{ content: string; usage?: TokenUsage }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new AIClientError("DEEPSEEK_API_KEY not configured — set it in .env.local", 500);

  const messages: DeepSeekMessage[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const timeoutMs = options?.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4000,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      throw new AIClientError(
        `DeepSeek API error (${res.status}): ${text.slice(0, 200)}`,
        res.status,
        res.status === 429 || res.status >= 500,
      );
    }

    const data = (await res.json()) as DeepSeekResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new AIClientError("Empty AI response");

    return { content, usage: data.usage };
  } catch (err) {
    if (err instanceof AIClientError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new AIClientError(
        `DeepSeek API request timed out after ${timeoutMs / 1000}s`,
        408,
        true,
      );
    }
    throw new AIClientError(`AI request failed: ${(err as Error)?.message || "Unknown"}`, 500);
  } finally {
    clearTimeout(timeout);
  }
}

export function extractBalancedJSON(text: string): string | null {
  const openers = ["{", "["];
  const closers: Record<string, string> = { "{": "}", "[": "]" };
  for (const opener of openers) {
    const start = text.indexOf(opener);
    if (start === -1) continue;
    const closer = closers[opener];
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escaped) { escaped = false; continue; }
      if (ch === "\\" && inString) { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === opener) { depth++; }
      else if (ch === closer) { depth--; if (depth === 0) return text.slice(start, i + 1); }
    }
  }
  return null;
}

export async function callDeepSeekJSON<T>(
  prompt: string,
  system?: string,
  options?: { temperature?: number; maxTokens?: number; timeoutMs?: number },
): Promise<{ result: T; usage?: TokenUsage }> {
  const { content, usage } = await callDeepSeek(prompt, system, {
    ...options,
    temperature: options?.temperature ?? 0.3,
  });

  let cleaned = content;
  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    cleaned = codeBlock[1].trim();
  }
  try {
    return { result: JSON.parse(cleaned) as T, usage };
  } catch {
    const extracted = extractBalancedJSON(cleaned);
    if (extracted) {
      try { return { result: JSON.parse(extracted) as T, usage }; } catch { /* fall through */ }
    }
    throw new AIClientError(`AI returned invalid JSON: ${cleaned.slice(0, 300)}`);
  }
}
