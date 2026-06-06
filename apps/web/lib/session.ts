import { cookies } from "next/headers";
import { verifyToken, extractJti } from "@/lib/auth";
import { isTokenRevoked } from "@/lib/token-blacklist";

export interface Session {
  userId: string;
  email: string;
  name: string | null;
  orgId: string;
  orgSlug: string;
  role: string;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Check JWT revocation blacklist — ensures logout actually revokes tokens for API routes
  const isRevoked = await isTokenRevoked(payload.jti);
  if (isRevoked) return null;

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name ?? null,
    orgId: payload.orgId,
    orgSlug: payload.orgSlug,
    role: payload.role,
  };
}
