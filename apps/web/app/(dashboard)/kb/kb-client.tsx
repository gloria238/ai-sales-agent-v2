"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, XCircle, Loader2, Trash2, ExternalLink, Layers, RefreshCw, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Doc {
  id: string; name: string; type: string; status: string;
  chunkCount: number; metadata: unknown; createdAt: string;
}

/** Map filename to knowledge base layer */
function getDocLayer(name: string): { layer: string; color: string } {
  const core = ["product-overview", "pricing-v3", "technical-specs"];
  const sales = ["faq-v2", "objection-handbook", "case-studies", "competitor-battlecards", "sales-playbook"];
  const ops = ["onboarding-guide", "compliance-policy", "internal-escalation"];

  const base = name.replace(/\.[^.]+$/, "");
  if (core.includes(base)) return { layer: "核心层", color: "bg-accent/10 text-accent border-accent/20" };
  if (sales.includes(base)) return { layer: "销售参考层", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
  if (ops.includes(base)) return { layer: "运营支撑层", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return { layer: "未分类", color: "bg-bg-subtle text-text-muted border-border" };
}

export function KbClient({ orgSlug, initialDocs }: { orgSlug: string; initialDocs: Doc[] }) {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/orgs/${orgSlug}/kb/upload`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "上传失败");
        return;
      }

      if (data.deduplicated) {
        toast.info("文档已存在，跳过上传");
        return;
      }

      setDocs((prev) => [data.document as Doc, ...prev]);
      const updated = data.updated ? "已更新" : "已上传";
      toast.success(`${file.name} ${updated} — ${data.document.chunkCount} 个分块`);
      router.refresh();
    } catch {
      toast.error("上传失败，请重试");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [orgSlug, router]);

  const handleDelete = useCallback(async (docId: string, docName: string) => {
    if (!confirm(`确定要删除「${docName}」吗？该文档的所有分块将被同时删除。`)) return;

    setDeleting(docId);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/kb/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "删除失败");
        return;
      }
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      toast.success(`已删除「${docName}」`);
      router.refresh();
    } catch {
      toast.error("删除失败，请重试");
    } finally {
      setDeleting(null);
    }
  }, [orgSlug, router]);

  const handleReindex = useCallback(async (docId: string, docName: string) => {
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/kb/documents/${docId}/reindex`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "重建索引失败");
        return;
      }
      toast.success(`「${docName}」重建完成 — ${data.reindexed}/${data.totalChunks} 个分块`);
      router.refresh();
    } catch {
      toast.error("重建索引失败");
    }
  }, [orgSlug, router]);

  // Count by layer
  const layerCounts = { 核心层: 0, 销售参考层: 0, 运营支撑层: 0, 未分类: 0 };
  for (const doc of docs) {
    const { layer } = getDocLayer(doc.name);
    layerCounts[layer as keyof typeof layerCounts]++;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">知识库</h1>
          <p className="text-sm text-text-muted mt-1">
            上传文档，AI 将基于你的内容精准回答。支持 PDF / Word / Markdown / TXT / FAQ JSON。
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
            {uploading ? "上传中…" : "上传文档"}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md,.json,.docx"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Layer Overview — only show when docs exist */}
      {docs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "核心层", desc: "产品·定价·技术规格", count: layerCounts.核心层, color: "border-l-accent" },
            { label: "销售参考层", desc: "FAQ·话术·案例·竞品", count: layerCounts.销售参考层, color: "border-l-blue-500" },
            { label: "运营支撑层", desc: "上线·合规·内部流程", count: layerCounts.运营支撑层, color: "border-l-amber-500" },
          ].map((l) => (
            <div key={l.label} className={`rounded-xl border border-border bg-bg-card p-4 border-l-4 ${l.color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-text">{l.label}</span>
                <span className="text-2xl font-bold text-text-secondary">{l.count}</span>
              </div>
              <p className="text-xs text-text-muted">{l.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Layer Legend */}
      {docs.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <Layers className="size-3.5" />
          <span>三层架构：核心层（权威事实）→ 销售参考层（FAQ/话术）→ 运营支撑层（内部流程）。文档间的引用、派生、场景关系由 RAG 检索时自动处理。</span>
        </div>
      )}

      {/* Document List */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-16 rounded-2xl bg-bg-subtle flex items-center justify-center mb-5">
            <BookOpen className="size-7 text-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-text mb-1">暂无文档</h3>
          <p className="text-sm text-text-muted max-w-sm mb-6">
            上传 PDF、Word、Markdown 或 FAQ JSON 文件来构建你的知识库。上传后 AI 将自动解析、分块、向量化。
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-subtle/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">文档名称</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">层级</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">类型</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">分块数</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">状态</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">上传时间</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const { layer, color } = getDocLayer(doc.name);
                return (
                <tr key={doc.id} className="border-b border-border/50 hover:bg-bg-subtle/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-4 text-accent shrink-0" />
                      <span className="text-sm font-medium text-text truncate max-w-[180px]" title={doc.name}>{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>{layer}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-bg-subtle text-text-secondary">
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{doc.chunkCount}</td>
                  <td className="px-4 py-3">
                    {doc.status === "ready" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="size-3" /> 就绪
                      </span>
                    ) : doc.status === "processing" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-warning">
                        <Loader2 className="size-3 animate-spin" /> 处理中
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-danger">
                        <XCircle className="size-3" /> 失败
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(doc.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleReindex(doc.id, doc.name)}
                        className="p-1.5 rounded-lg hover:bg-bg-subtle text-text-muted hover:text-text transition-colors"
                        title="重建索引"
                      >
                        <RefreshCw className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.name)}
                        disabled={deleting === doc.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                        title="删除文档"
                      >
                        {deleting === doc.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
