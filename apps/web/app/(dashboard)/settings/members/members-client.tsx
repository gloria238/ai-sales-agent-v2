"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  orgSlug: string;
  canManage: boolean;
}

const ROLES = ["owner", "admin", "operator", "viewer"];

export function MembersClient({ orgSlug, canManage }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("operator");

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/members`);
      if (!res.ok) throw new Error("Failed to fetch");
      setMembers(await res.json());
      setError("");
    } catch {
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleAdd = useCallback(async () => {
    if (!addEmail.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim(), role: addRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add member");
      }
      toast.success("Member added");
      setAddEmail("");
      setAddRole("operator");
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAdding(false);
    }
  }, [addEmail, addRole, orgSlug, fetchMembers]);

  const handleRoleChange = useCallback(async (membershipId: string, role: string) => {
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }
      toast.success(`Role changed to ${role}`);
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }, [orgSlug, fetchMembers]);

  const handleRemove = useCallback(async (membershipId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/members/${membershipId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove member");
      }
      toast.success("Member removed");
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  }, [orgSlug, fetchMembers]);

  if (loading) return <div className="text-text-muted text-sm py-8 text-center">Loading...</div>;

  return (
    <div className="space-y-4">
      {error && <div className="text-danger text-sm bg-danger-soft rounded-lg px-3 py-2">{error}</div>}

      {canManage && (
        <div className="flex items-center gap-3 p-4 glass-card rounded-lg">
          <input
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 rounded-lg border border-lp-border/30 bg-lp-card/60 text-sm px-3 py-2 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <select
            value={addRole}
            onChange={(e) => setAddRole(e.target.value)}
            className="rounded-lg border border-lp-border/30 bg-lp-card/60 text-sm px-3 py-2 text-text"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={handleAdd}
            disabled={adding || !addEmail.trim()}
            className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {adding ? "Adding..." : "Add Member"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border border-lp-border/30 glass-card p-3">
            <div>
              <p className="text-sm font-medium text-text">{m.name || "Unnamed"}</p>
              <p className="text-xs text-text-muted">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {canManage ? (
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  className="rounded border border-lp-border/30 bg-bg-subtle px-2 py-1 text-xs text-text"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <span className="rounded bg-bg-subtle px-2 py-1 text-xs text-text-secondary">{m.role}</span>
              )}
              {canManage && (
                <button
                  onClick={() => handleRemove(m.id)}
                  className="text-xs text-danger hover:underline ml-2"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
