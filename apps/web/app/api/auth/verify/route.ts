import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { signToken } from "@/lib/auth";
import { getRequestContext, logInfo, logWarn, logError } from "@/lib/logger";

export async function GET(request: Request) {
  const ctx = getRequestContext(request);
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { loginToken: token },
    });

    if (!user) {
      logWarn(ctx, "Verification failed: invalid token");
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 401 });
    }

    if (!user.loginTokenExpires || user.loginTokenExpires < new Date()) {
      logWarn(ctx, "Verification failed: expired token", { userId: user.id });
      return NextResponse.json({ error: "Verification link has expired. Please log in again." }, { status: 401 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    // Clear login token, mark email verified
    await prisma.user.update({
      where: { id: user.id },
      data: { loginToken: null, loginTokenExpires: null, emailVerified: true },
    });

    const jwt = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgId: membership.organizationId,
      orgSlug: membership.organization.slug,
      role: membership.role,
    });

    logInfo(ctx, "Login verified", { userId: user.id, orgSlug: membership.organization.slug });

    // Redirect to home (dashboard) with JWT cookie set
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    logError(ctx, "Verification error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
