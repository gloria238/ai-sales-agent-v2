"use client";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  orgId: string;
  initialName: string;
  initialSlug: string;
  orgSlug: string;
  canManage: boolean;
}

export function SettingsGeneralForm({ initialName, initialSlug, orgSlug, canManage }: Props) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [saving, setSaving] = useState(false);

  const changed = name !== initialName || slug !== initialSlug;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(name !== initialName && { name }),
          ...(slug !== initialSlug && { slug }),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <div>
        <label className="text-xs font-medium text-text-secondary">Organization Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canManage}
          className="mt-1 w-full rounded-xl border border-border bg-lp-card/60 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:opacity-40 transition-colors duration-150"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-text-secondary">Slug</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={!canManage}
          className="mt-1 w-full rounded-xl border border-border bg-lp-card/60 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:opacity-40 transition-colors duration-150"
        />
      </div>

      {canManage && (
        <button
          onClick={handleSave}
          disabled={saving || !changed}
          className="rounded-xl bg-accent text-white text-sm font-semibold px-5 py-2.5 hover:bg-accent-hover disabled:opacity-40 transition-all duration-150 shadow-sm active:scale-[0.97]"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      )}
    </div>
  );
}
