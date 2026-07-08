"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, FileText, Link2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Citation {
  id: string; documentId: string; title: string; fileName: string;
  excerpt: string; chunkIndex: number; score: number;
}

interface ChunkPreview {
  id: string; content: string; score: number;
}

export function PlaygroundClient({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [chunks, setChunks] = useState<ChunkPreview[]>([]);

  const handleAsk = useCallback(async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setCitations([]);
    setChunks([]);

    try {
      const res = await fetch(`/api/orgs/${orgSlug}/kb/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAnswer(data.answer);
      setCitations(data.citations || []);
      setChunks(data.chunks || []);
    } catch (err) {
      setAnswer(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [question, orgSlug]);

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/kb")}
          className="size-9 rounded-lg border border-border bg-bg-card flex items-center justify-center hover:bg-bg-subtle transition-colors"
        >
          <ArrowLeft className="size-4 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text">RAG Playground</h1>
          <p className="text-sm text-text-muted mt-1">Ask questions against your knowledge base</p>
        </div>
      </div>

      {/* Question Input */}
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <div className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Ask a question about your documents…"
            className="flex-1 bg-transparent border-none outline-none text-text placeholder:text-text-muted text-sm"
          />
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            {loading ? "Searching…" : "Ask"}
          </button>
        </div>
      </div>

      {/* Answer */}
      {answer && (
        <div className="rounded-xl border border-border bg-bg-card p-5 space-y-6">
          {/* Answer text */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Answer</h3>
            <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">{answer}</div>
          </div>

          {/* Citations */}
          {citations.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Link2 className="size-3.5" />
                Sources
              </h3>
              <div className="space-y-2">
                {citations.map((c, i) => (
                  <div key={c.id} className="rounded-lg border border-border/50 bg-bg-subtle/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                        [{i + 1}]
                      </span>
                      <FileText className="size-3 text-text-muted" />
                      <span className="text-xs font-medium text-text">{c.title}</span>
                      <span className="text-xs text-text-muted">· Chunk {c.chunkIndex} · {c.score}</span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">{c.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retrieved Chunks */}
          {chunks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Retrieved Chunks</h3>
              <div className="space-y-2">
                {chunks.map((c, i) => (
                  <div key={c.id} className="rounded-lg border border-border/30 p-3">
                    <span className="text-[10px] font-mono text-text-muted mb-1 block">
                      Chunk #{i + 1} · Score: {c.score}
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!answer && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-lg bg-bg-sage flex items-center justify-center mb-5">
            <Search className="size-7 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-text mb-1">Ask a question</h3>
          <p className="text-sm text-text-muted max-w-sm">
            The AI will search your knowledge base and answer with citations from your documents.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-text-muted">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">Searching knowledge base…</span>
          </div>
        </div>
      )}
    </div>
  );
}
