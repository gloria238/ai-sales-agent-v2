import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { hashPassword } from "@/lib/password";
import { getRequestContext, logInfo, logError, logWarn } from "@/lib/logger";
import { registerSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(request: Request) {
  const ctx = getRequestContext(request);
  try {
    // Defense-in-depth: auth-specific rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "127.0.0.1";
    const { allowed } = await checkRateLimit(`auth-register:${ip}`, 5);
    if (!allowed) {
      return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
    }
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const isAlice = email === "alice@example.com";

    // Sequential ops — pgBouncer incompatible with interactive $transaction
    const u = await prisma.user.create({
      data: { email, name, passwordHash },
    });

    let orgId: string;
    let orgSlug: string;
    const role: "owner" | "viewer" = isAlice ? "owner" : "viewer";

    try {
      if (isAlice) {
        const org = await prisma.organization.create({
          data: { name: `${name}'s Workspace`, slug: `${email.split("@")[0]}-workspace` },
        });
        orgId = org.id;
        orgSlug = org.slug;
      } else {
        const aliceOrg = await prisma.organization.findFirst({
          where: { memberships: { some: { user: { email: "alice@example.com" }, role: "owner" } } },
        });
        if (!aliceOrg) throw new Error("Registration is currently unavailable");
        orgId = aliceOrg.id;
        orgSlug = aliceOrg.slug;
      }

      await prisma.membership.create({
        data: { organizationId: orgId, userId: u.id, role },
      });
    } catch (err) {
      // Rollback: delete the orphaned user
      await prisma.user.delete({ where: { id: u.id } });
      throw err;
    }

    const user = { ...u, orgId, orgSlug, role };

    // Generate verification token (10-minute expiry)
    const loginToken = crypto.randomUUID();
    const loginTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { loginToken, loginTokenExpires },
    });

    const verifyUrl = `/api/auth/verify?token=${loginToken}`;

    // Send verification email via Resend (if configured)
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await resend.emails.send({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "Verify your SalesAgent account",
          html: `<p>Hi ${name},</p><p>Click the link below to verify your account and get started:</p><p><a href="${baseUrl}${verifyUrl}">${baseUrl}${verifyUrl}</a></p><p>This link expires in 10 minutes.</p>`,
        });
        logInfo(ctx, "Verification email sent", { userId: user.id, email });
      } catch (emailErr) {
        logWarn(ctx, "Failed to send verification email", { userId: user.id, error: String(emailErr) });
      }
    } else {
      logWarn(ctx, "Verification email skipped: RESEND_API_KEY or EMAIL_FROM not configured", { userId: user.id });
    }

    logInfo(ctx, "User registered", { userId: user.id, orgSlug: user.orgSlug });

    return NextResponse.json({
      requiresVerification: true,
      message: "Account created. Check your email for the verification link.",
    }, { status: 201 });
  } catch (error) {
    logError(ctx, "Register error", error);
    // Don't leak internal error details to the client
    return NextResponse.json({ error: "Registration failed. Please try again later." }, { status: 500 });
  }
}
