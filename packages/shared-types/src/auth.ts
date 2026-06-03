// ── JWT ─────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
  name: string | null;
  orgId: string;
  orgSlug: string;
  role: string;
  jti: string;
}

// ── Session ─────────────────────────────────────────────────────────
export interface Session {
  userId: string;
  email: string;
  name: string | null;
  orgId: string;
  orgSlug: string;
  role: string;
}

// ── Auth API ────────────────────────────────────────────────────────
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: { id: string; email: string; name: string };
  org: { id: string; name: string; slug: string };
}
