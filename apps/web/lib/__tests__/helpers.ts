export const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

export async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    redirect: "manual",
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

export async function waitForServer(maxSec = 10) {
  for (let i = 0; i < maxSec; i++) {
    try {
      await fetch(`${BASE}/api/auth/login`, { method: "POST" });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`Dev server not reachable at ${BASE}. Start: pnpm dev`);
}

export interface TestUser {
  email: string;
  cookie: string;
  role: string;
  orgSlug: string;
}

const _userCache = new Map<string, TestUser>();

async function loginAndGetCookie(email: string, password: string): Promise<TestUser> {
  const { res, body } = await fetchJSON(`${BASE}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (res.status !== 200 || !body.org?.slug) {
    throw new Error(`Login failed for ${email}: ${res.status} — run: pnpm seed-members <org-slug>`);
  }
  const match = res.headers.get("set-cookie")?.match(/session=([^;]+)/);
  if (!match) throw new Error(`No cookie for ${email}`);
  return { email, cookie: `session=${match[1]}`, role: body.user?.role ?? "unknown", orgSlug: body.org.slug };
}

/** Get a test user with given role. Uses seed-members accounts (password: test123456).
 *  Requires: pnpm seed-members <org-slug> to have been run.
 */
export async function getTestUser(role: "admin" | "operator" | "viewer"): Promise<TestUser> {
  if (_userCache.has(role)) return _userCache.get(role)!;
  const u = await loginAndGetCookie(`${role}@salesagent.test`, "test123456");
  _userCache.set(role, u);
  return u;
}

/** Get an owner-level user. Falls back to admin if alice password not set. */
export async function getOwner(): Promise<TestUser> {
  if (_userCache.has("owner")) return _userCache.get("owner")!;
  const pw = process.env.ALICE_PASSWORD ?? "Aa7!GzwF7X_W)LB$OSkKkY3x";
  try {
    const u = await loginAndGetCookie("alice@example.com", pw);
    _userCache.set("owner", u);
    return u;
  } catch {
    // Fallback: admin has same workflow/lead permissions as owner (except manage_org)
    console.warn("alice login failed — using admin as owner proxy (missing manage_org)");
    return getTestUser("admin");
  }
}

/** Get the org slug shared by all test users. */
export async function getOrgSlug(): Promise<string> {
  const u = await getTestUser("admin");
  return u.orgSlug;
}
