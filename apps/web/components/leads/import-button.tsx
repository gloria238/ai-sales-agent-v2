"use client";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  orgSlug: string;
  onImported: () => void;
}

export function ImportButton({ orgSlug, onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { toast.error("CSV needs at least a header row and one data row"); setImporting(false); return; }

      const headers = parseCsvLine(lines[0]);
      const rows = lines.slice(1).map((line) => {
        const vals = parseCsvLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ""; });
        return row;
      });

      const res = await fetch(`/api/orgs/${orgSlug}/leads/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
      if (data.imported > 0) { toast.success(`Imported ${data.imported} leads`); onImported(); }
      if (data.skipped > 0) toast.warning(`${data.skipped} rows skipped`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [orgSlug, onImported]);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Import CSV</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Import Leads">
          <div className="space-y-3 text-sm">
            <p className="text-zinc-500 dark:text-zinc-400">
              Upload a CSV file with columns: <strong>Name</strong> (required), <strong>Email</strong>, <strong>Stage</strong>, <strong>Tags</strong>.
            </p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} disabled={importing}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 disabled:opacity-50" />
            {importing && <p className="text-zinc-400">Importing...</p>}
            {result && (
              <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-xs space-y-1">
                <p className="text-success font-medium">Imported {result.imported} leads, {result.skipped} skipped</p>
                {result.errors.slice(0, 5).map((e, i) => <p key={i} className="text-red-600 dark:text-red-400">{e}</p>)}
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => { setOpen(false); setResult(null); }}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (inQuotes) {
      if (ch === '"') { inQuotes = false; continue; }
      current += ch;
    } else {
      if (ch === '"') { inQuotes = true; continue; }
      if (ch === ",") { result.push(current.trim()); current = ""; continue; }
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
