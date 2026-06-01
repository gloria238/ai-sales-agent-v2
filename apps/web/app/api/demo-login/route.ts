import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEMO_EMAIL = "demo@salesagent.ai";
const DEMO_ORG_SLUG = "acme-corp";

export async function GET(request: Request) {
  try {
    // Build redirect URL from the actual request (works on Vercel, Railway, localhost)
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;

    // Single query: find membership by user email + org slug, include both relations
    const membership = await prisma.membership.findFirst({
      where: { user: { email: DEMO_EMAIL }, organization: { slug: DEMO_ORG_SLUG } },
      include: { user: true, organization: true },
    });

    if (!membership) {
      return NextResponse.json({
        error: "Demo account not found. Run: pnpm tsx packages/db/seed-demo.ts",
      }, { status: 500 });
    }

    const user = membership.user;

    // Sign JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgId: membership.organization.id,
      orgSlug: membership.organization.slug,
      role: membership.role,
    });

    // Set cookie and redirect
    const response = NextResponse.redirect(new URL("/home", origin));
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: "Demo login failed" }, { status: 500 });
  }
}
