const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const MODEL = "deepseek-chat";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
}

export class AIClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable = false,
  ) {
    super(message);
    this.name = "AIClientError";
  }
}

export async function callDeepSeek(
  prompt: string,
  system?: string,
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new AIClientError("DEEPSEEK_API_KEY not configured — set it in .env.local", 500);

  const messages: DeepSeekMessage[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

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

    return content;
  } catch (err) {
    if (err instanceof AIClientError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new AIClientError("DeepSeek API request timed out after 15s — check your network and DEEPSEEK_API_KEY", 408, true);
    }
    throw new AIClientError(`AI request failed: ${(err as Error)?.message || "Unknown"}`, 500);
  } finally {
    clearTimeout(timeout);
  }
}

function extractBalancedJSON(text: string): string | null {
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
  options?: { temperature?: number; maxTokens?: number },
): Promise<T> {
  const raw = await callDeepSeek(prompt, system, {
    ...options,
    temperature: options?.temperature ?? 0.3,
  });

  // Extract JSON from markdown code blocks (handles text before/after)
  let cleaned = raw;
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    cleaned = codeBlock[1].trim();
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fallback: extract balanced JSON object or array using brace counting
    const extracted = extractBalancedJSON(cleaned);
    if (extracted) {
      try { return JSON.parse(extracted) as T; } catch { /* fall through */ }
    }
    throw new AIClientError(
      `AI returned invalid JSON: ${cleaned.slice(0, 300)}`,
    );
  }
}
