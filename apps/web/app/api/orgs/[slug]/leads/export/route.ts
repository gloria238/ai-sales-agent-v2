// CSV export for leads
import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { requirePermission(membership.role, "view_leads"); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const leads = await prisma.lead.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV
  const header = ["Name", "Email", "Stage", "Tags", "Created At"];
  const rows = leads.map((l) => [
    escapeCsv(l.name),
    escapeCsv(l.email || ""),
    escapeCsv(l.stage || ""),
    escapeCsv(Array.isArray(l.tags) ? l.tags.join("; ") : String(l.tags || "")),
    l.createdAt.toISOString(),
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${params.slug}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
