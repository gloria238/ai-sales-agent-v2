import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VIEWER_EMAIL = "zhou.wei@qicloud.cn";
const VIEWER_ORG_SLUG = "qicloud-demo";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;

    const membership = await prisma.membership.findFirst({
      where: { user: { email: VIEWER_EMAIL }, organization: { slug: VIEWER_ORG_SLUG } },
      include: { user: true, organization: true },
    });

    if (!membership) {
      return NextResponse.json({
        error: "Viewer account not found. Run: pnpm seed-chinese-demo",
      }, { status: 500 });
    }

    const token = await signToken({
      userId: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      orgId: membership.organization.id,
      orgSlug: membership.organization.slug,
      role: membership.role,
    });

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
    console.error("Viewer demo login error:", error);
    return NextResponse.json({ error: "Viewer login failed" }, { status: 500 });
  }
}
