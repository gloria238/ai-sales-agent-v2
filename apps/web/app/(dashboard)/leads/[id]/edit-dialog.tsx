"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  lead: { id: string; name: string; email: string };
  orgSlug: string;
}

export function EditDialog({ lead, orgSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Lead updated");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to save");
    } finally {
      setLoading(false);
    }
  }, [name, email, lead.id, orgSlug, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm">编辑</Button>
      </DialogTrigger>
      <DialogContent title="Edit Lead">
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          <Input label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !name.trim()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
