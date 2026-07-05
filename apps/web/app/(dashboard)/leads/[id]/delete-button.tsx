"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  leadId: string;
  leadName: string;
  orgSlug: string;
}

export function DeleteButton({ leadId, leadName, orgSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/leads/${leadId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Lead deleted");
      router.push("/leads");
      // keep loading=true — navigation will unmount
    } catch {
      toast.error("Failed to delete");
      setLoading(false);
    }
  }, [leadId, orgSlug, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="destructive" size="sm">删除</Button>
      </DialogTrigger>
      <DialogContent title="Delete Lead">
        <p className="text-sm text-text-secondary mb-4">
          Are you sure you want to delete <strong>{leadName}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
