import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { leadImportSchema } from "@/lib/validation";

const MAX_ROWS = 500;

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const _perm = checkPermission(membership.role, "manage_leads"); if (_perm) return _perm;

  const body = await request.json();
  const parsed = leadImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const rows = parsed.data.rows;
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = (row.name || row.Name || "").trim();
    const email = (row.email || row.Email || "").trim() || null;
    const stage = (row.stage || row.Stage || "new").trim().toLowerCase();
    const tagsRaw = (row.tags || row.Tags || "").trim();

    if (!name) {
      errors.push(`Row ${i + 1}: missing name`);
      skipped++;
      continue;
    }

    const tags = tagsRaw ? tagsRaw.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : [];
    // Normalize hyphenated stage names from CSV to underscore format
    const NORMALIZE_STAGE: Record<string, string> = {
      "closed-won": "closed_won",
      "closed-lost": "closed_lost",
    };
    const validStage = NORMALIZE_STAGE[stage] || stage;
    const VALID_STAGES = ["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];
    const finalStage = VALID_STAGES.includes(validStage) ? validStage : "new";

    try {
      await prisma.lead.create({
        data: {
          organizationId: membership.organizationId,
          name,
          email,
          stage: finalStage,
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
    errors: errors.slice(0, 20),
  });
}
