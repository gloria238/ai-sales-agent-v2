import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await prisma.membership.findMany({
    where: { userId: session.userId },
    include: { organization: true },
  });

  return NextResponse.json(
    orgs.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
    }))
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, slug } = await request.json();

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const org = await prisma.organization.create({
    data: { name, slug },
  });

  await prisma.membership.create({
    data: { organizationId: org.id, userId: session.userId, role: "owner" },
  });

  return NextResponse.json({ id: org.id, name: org.name, slug: org.slug }, { status: 201 });
}
