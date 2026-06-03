"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, XCircle, Loader2, Trash2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Doc {
  id: string; name: string; type: string; status: string;
  chunkCount: number; metadata: unknown; createdAt: string;
}

export function KbClient({ orgSlug, initialDocs }: { orgSlug: string; initialDocs: Doc[] }) {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/orgs/${orgSlug}/kb/upload`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Upload failed");
        return;
      }

      const data = await res.json();
      setDocs((prev) => [data.document as Doc, ...prev]);
      toast.success(`${file.name} uploaded — ${data.document.chunkCount} chunks indexed`);
      router.refresh();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [orgSlug, router]);

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Knowledge Base</h1>
          <p className="text-sm text-text-muted mt-1">
            Upload documents. AI answers questions based on your content.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/kb/playground`)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-bg-card text-text-secondary hover:bg-bg-subtle hover:border-accent/30 transition-colors"
          >
            <ExternalLink className="size-4" />
            Playground
          </button>
          <label className={`
            inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer
            transition-colors
            ${uploading
              ? "bg-bg-muted text-text-muted cursor-not-allowed"
              : "bg-accent text-white hover:bg-accent-hover shadow-sm shadow-accent/20"
            }
          `}>
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploading ? "Uploading…" : "Upload Document"}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md,.json"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Document List */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-16 rounded-2xl bg-bg-subtle flex items-center justify-center mb-5">
            <FileText className="size-7 text-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-text mb-1">No documents yet</h3>
          <p className="text-sm text-text-muted max-w-sm mb-6">
            Upload a PDF, TXT, or FAQ JSON file to build your knowledge base.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-subtle/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Chunks</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} className="border-b border-border/50 hover:bg-bg-subtle/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-4 text-accent" />
                      <span className="text-sm font-medium text-text">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-bg-sage text-text-secondary">
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{doc.chunkCount}</td>
                  <td className="px-4 py-3">
                    {doc.status === "ready" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="size-3" /> Ready
                      </span>
                    ) : doc.status === "processing" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-warning">
                        <Loader2 className="size-3 animate-spin" /> Processing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-danger">
                        <XCircle className="size-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
