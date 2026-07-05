import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { verifyPassword, needsRehash, hashPassword } from "@/lib/password";
import { signToken } from "@/lib/auth";
import { getRequestContext, logInfo, logWarn, logError } from "@/lib/logger";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(request: Request) {
  const ctx = getRequestContext(request);
  try {
    // Defense-in-depth: auth-specific rate limiting (stricter than middleware)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "127.0.0.1";
    const { allowed } = await checkRateLimit(`auth-login:${ip}`, 10);
    if (!allowed) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
    }

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

    // Re-hash old passwords (10 rounds → 12) in background
    if (needsRehash(user.passwordHash)) {
      hashPassword(password).then((newHash: string) =>
        prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })
      ).catch(() => {});
    }

    // Reject unverified accounts — email verification link must be clicked first
    if (!user.emailVerified) {
      logWarn(ctx, "Login failed: email not verified", { emailHash: hashEmail(email) });
      return NextResponse.json({ error: "Please verify your email before logging in. Check your inbox for the verification link." }, { status: 403 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });

    // ── Customer Portal login (no Membership, but linked to a Lead) ──
    if (!membership) {
      const lead = await prisma.lead.findFirst({
        where: { userId: user.id },
        include: { organization: true },
      });
      if (!lead) {
        return NextResponse.json({ error: "No organization found" }, { status: 403 });
      }

      const token = await signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        orgId: lead.organizationId,
        orgSlug: lead.organization.slug,
        role: "customer",
      });

      const response = NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name },
        org: { id: lead.organizationId, slug: lead.organization.slug, name: lead.organization.name },
        isCustomer: true,
        redirectTo: "/portal/conversations",
      });

      response.cookies.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      logInfo(ctx, "Customer portal login", { userId: user.id, orgSlug: lead.organization.slug });
      return response;
    }

    // ── Dashboard login (standard Membership) ──────────────────────

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
