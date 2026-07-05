import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isTokenRevoked } from "@/lib/token-blacklist";

const publicPaths = ["/", "/login", "/register", "/docs", "/api/demo-login", "/portal/login"];
const authApiPaths = ["/api/auth/login", "/api/auth/register", "/api/auth/logout", "/api/auth/verify"];
const apiAuthRateLimitWindow = 10; // requests per window for auth endpoints

/** Extract client IP, optionally validating against trusted proxy ranges. */
function getClientIp(request: NextRequest): string {
  const trustedRanges = process.env.TRUSTED_PROXY_RANGES
    ? process.env.TRUSTED_PROXY_RANGES.split(",").map((r) => r.trim())
    : [];

  // In production (Vercel), the edge network guarantees x-forwarded-for is real.
  // In other environments, validate the proxy first.
  const directIp = request.headers.get("x-real-ip") || "127.0.0.1";

  if (process.env.NODE_ENV === "production" && !trustedRanges.length) {
    // Production without explicit trusted ranges — assume edge/CDN handles it
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || directIp;
  }

  if (trustedRanges.length) {
    // In trusted-proxy mode, use x-forwarded-for (the proxy sets it)
    const proxyIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (proxyIp) return proxyIp;
  }

  return directIp;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);

    // Auth routes get stricter rate limiting (10 req/min)
    const isAuthRoute = authApiPaths.some((p) => pathname.startsWith(p));
    const limitKey = isAuthRoute ? `auth:${ip}` : ip;
    const windowSize = isAuthRoute ? apiAuthRateLimitWindow : 100;

    const { allowed, remaining, reset } = await checkRateLimit(limitKey, windowSize);

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(reset));

    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      });
    }

    // Add deprecation notice on non-versioned /api/ paths (/api/v1/ is preferred)
    if (!pathname.startsWith("/api/v1/")) {
      response.headers.set("Deprecation", "true");
      response.headers.set("Sunset", "Sat, 01 Jan 2028 00:00:00 GMT");
      response.headers.set("Link", `</api/v1${pathname.slice(4)}>; rel="successor-version"`);
    }

    // Attach rate limit headers but don't early-return for auth routes anymore
    if (pathname.startsWith("/api/auth/")) {
      return response;
    }
  }

  // ═══ Clear stale session cookie on layout-initiated redirect ═══
  if (pathname === "/login" && request.nextUrl.searchParams.has("clear")) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("session", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
    return response;
  }

  // Redirect authenticated users from landing page to dashboard
  if (pathname === "/") {
    const token = request.cookies.get("session")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        const revoked = payload.jti ? await isTokenRevoked(payload.jti) : false;
        if (!revoked) {
          const url = request.nextUrl.clone();
          url.pathname = "/home";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  // Allow public paths, auth API routes, and webhook triggers
  if (
    publicPaths.some((p) => pathname === p) ||
    authApiPaths.some((p) => pathname.startsWith(p)) ||
    pathname.match(/^\/api\/orgs\/[^/]+\/workflows\/[^/]+\/webhook$/)
  ) {
    return NextResponse.next();
  }

  // Allow Portal pages (skeleton — no auth required for Phase 19)
  if (pathname.startsWith("/portal")) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/videos/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    // API routes return 401 JSON; page routes redirect to /login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      response.cookies.set("session", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
      return response;
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("session", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
    return response;
  }

  if (payload.jti) {
    const revoked = await isTokenRevoked(payload.jti);
    if (revoked) {
      if (pathname.startsWith("/api/")) {
        const response = NextResponse.json({ error: "Token revoked" }, { status: 401 });
        response.cookies.set("session", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
        return response;
      }
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.set("session", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|videos/|images/|fonts/).*)"],
};
