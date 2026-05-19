import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
    include: { organization: true },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = await signToken({
    userId: session.userId,
    email: session.email,
    name: session.name ?? null,
    orgId: membership.organizationId,
    orgSlug: membership.organization.slug,
    role: membership.role,
  });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 3600,
    path: "/",
  });

  return NextResponse.json({
    orgId: membership.organizationId,
    orgSlug: membership.organization.slug,
    role: membership.role,
  });
}
