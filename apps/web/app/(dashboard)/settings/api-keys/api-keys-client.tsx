"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ApiKey {
  id: string; name: string; prefix: string; createdAt: string;
}

interface Props { orgSlug: string; isOwner: boolean; }

export function ApiKeysClient({ orgSlug, isOwner }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/api-keys`);
      const data = await res.json();
      setKeys(data.keys || []);
    } catch { toast.error("Failed to load API keys"); }
    finally { setLoading(false); }
  }, [orgSlug]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const createKey = useCallback(async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Failed"); }
      const data = await res.json();
      setRevealed((prev) => ({ ...prev, [data.key.id]: data.key.token }));
      setNewName("");
      fetchKeys();
      toast.success("API key created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create key");
    } finally { setCreating(false); }
  }, [newName, orgSlug, fetchKeys]);

  const deleteKey = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Failed"); }
      fetchKeys();
      toast.success("API key deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete key");
    }
  }, [orgSlug, fetchKeys]);

  if (loading) return <p className="text-text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">API 密钥</h2>
        <p className="text-sm text-text-muted mt-1">
          Use API keys to authenticate programmatic requests. Pass the key as a Bearer token in the Authorization header.
        </p>
      </div>

      {isOwner && (
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Key name (e.g. Production)"
            disabled={creating}
            className="max-w-xs"
          />
          <Button onClick={createKey} disabled={creating || !newName.trim()}>
            {creating ? "Creating..." : "Create Key"}
          </Button>
        </div>
      )}

      {keys.length === 0 ? (
        <p className="text-sm text-text-muted">No API keys yet.</p>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text text-sm">{key.name}</p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {revealed[key.id] ? (
                      <span className="text-primary">{revealed[key.id]}</span>
                    ) : (
                      <>{key.prefix}... (created {new Date(key.createdAt).toLocaleDateString()})</>
                    )}
                  </p>
                  {revealed[key.id] && (
                    <p className="text-xs text-warning mt-1">
                      Copy this key now. It will not be shown again.
                    </p>
                  )}
                </div>
                {isOwner && (
                  <Button variant="outline" size="sm" onClick={() => deleteKey(key.id)}>删除</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-bg-subtle p-4 text-xs text-text-muted space-y-1 font-mono">
        <p className="font-semibold text-text-secondary mb-2">Usage example:</p>
        <p>curl -H &quot;Authorization: Bearer of_xxxx&quot; \</p>
        <p>  https://yourapp.com/api/orgs/{orgSlug}/leads</p>
      </div>
    </div>
  );
}
