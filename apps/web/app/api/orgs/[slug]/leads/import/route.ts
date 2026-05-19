// CSV import for leads
import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";

const MAX_ROWS = 500;
const VALID_STAGES = ["new", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"];

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { requirePermission(membership.role, "manage_leads"); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const body = await request.json();
  const rows = body.rows as Array<Record<string, string>> | undefined;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Maximum ${MAX_ROWS} rows per import` }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = (row.Name || row.name || "").trim();
    const email = (row.Email || row.email || "").trim() || null;
    const stage = (row.Stage || row.stage || "new").trim().toLowerCase();
    const tagsRaw = (row.Tags || row.tags || "").trim();

    if (!name) {
      errors.push(`Row ${i + 1}: missing name`);
      skipped++;
      continue;
    }

    const tags = tagsRaw ? tagsRaw.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : [];
    const validStage = VALID_STAGES.includes(stage) ? stage : "new";

    try {
      await prisma.lead.create({
        data: {
          organizationId: membership.organizationId,
          name,
          email,
          stage: validStage,
          tags,
        },
      });
      imported++;
    } catch (err) {
      console.error("Lead import error:", { row: i + 1, name, error: err instanceof Error ? err.message : String(err) });
      errors.push(`Row ${i + 1} (${name}): Failed to import`);
      skipped++;
    }
  }

  return NextResponse.json({
    imported,
    skipped,
    total: rows.length,
    errors: errors.slice(0, 20), // limit error messages
  });
}
