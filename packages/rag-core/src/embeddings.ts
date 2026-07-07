export interface EmbeddingOptions {
  model?: string;
}

export interface EmbeddingProvider {
  /** Generate an embedding vector for the given text */
  embed(text: string, options?: EmbeddingOptions): Promise<number[]>;

  /** Generate embeddings for multiple texts in batch */
  embedBatch(texts: string[], options?: EmbeddingOptions): Promise<number[][]>;
}

/**
 * OpenAI-compatible embedding provider.
 * Works with OpenAI, Voyage, DeepSeek, or any OpenAI-compatible endpoint.
 *
 * Set EMBEDDING_API_KEY and optionally EMBEDDING_BASE_URL + EMBEDDING_MODEL
 * in the consuming app's environment.
 */
export function createEmbeddingProvider(config?: {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  /** Matryoshka embedding dimension (e.g. 1536, 1024, 512). Qwen3-Embedding supports this. */
  dimensions?: number;
}): EmbeddingProvider {
  const apiKey = config?.apiKey || process.env.EMBEDDING_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  // If no explicit EMBEDDING_API_KEY but DEEPSEEK_API_KEY exists, use DeepSeek's embedding endpoint
  const effectiveKey = apiKey || deepseekKey;
  const baseUrl = config?.baseUrl
    || process.env.EMBEDDING_BASE_URL
    || (effectiveKey === deepseekKey && !apiKey ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1");
  const defaultModel = config?.defaultModel
    || process.env.EMBEDDING_MODEL
    || (effectiveKey === deepseekKey && !apiKey ? "deepseek-chat" : "text-embedding-3-small");
  const dimensions = config?.dimensions
    ?? (process.env.EMBEDDING_DIMENSIONS ? parseInt(process.env.EMBEDDING_DIMENSIONS, 10) : undefined);

  // Build request body once — embed and embedBatch share the same shape
  function buildBody(model: string, input: string | string[]) {
    const body: Record<string, unknown> = { model, input };
    if (dimensions) body.dimensions = dimensions;
    return JSON.stringify(body);
  }

  return {
    async embed(text: string, options?: EmbeddingOptions): Promise<number[]> {
      if (!effectiveKey) throw new Error("No embedding API key configured — set EMBEDDING_API_KEY or DEEPSEEK_API_KEY");
      const model = options?.model || defaultModel;

      const res = await fetch(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveKey}`,
        },
        body: buildBody(model, text),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "Unknown error");
        throw new Error(`Embedding API error (${res.status}): ${body.slice(0, 300)}`);
      }

      const data = (await res.json()) as {
        data: Array<{ embedding: number[] }>;
      };
      return data.data[0].embedding;
    },

    async embedBatch(texts: string[], options?: EmbeddingOptions): Promise<number[][]> {
      if (!effectiveKey) throw new Error("No embedding API key configured");
      const model = options?.model || defaultModel;

      const res = await fetch(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveKey}`,
        },
        body: buildBody(model, texts),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "Unknown error");
        throw new Error(`Embedding API error (${res.status}): ${body.slice(0, 300)}`);
      }

      const data = (await res.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
      };
      return data.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
    },
  };
}
