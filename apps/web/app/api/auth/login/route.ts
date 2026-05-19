import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/auth";
import { getRequestContext, logInfo, logWarn, logError } from "@/lib/logger";
import { loginSchema } from "@/lib/validation";
import crypto from "crypto";

export async function POST(request: Request) {
  const ctx = getRequestContext(request);
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logWarn(ctx, "Login failed: user not found", { emailHash: hashEmail(email) });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      logWarn(ctx, "Login failed: wrong password", { emailHash: hashEmail(email) });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgId: membership.organizationId,
      orgSlug: membership.organization.slug,
      role: membership.role,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      org: { id: membership.organizationId, slug: membership.organization.slug, name: membership.organization.name },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    logInfo(ctx, "Login successful", { userId: user.id, orgSlug: membership.organization.slug });
    return response;
  } catch (error) {
    logError(ctx, "Login error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function hashEmail(email: string): string {
  return crypto.createHash("sha256").update(email).digest("hex").slice(0, 12);
}
