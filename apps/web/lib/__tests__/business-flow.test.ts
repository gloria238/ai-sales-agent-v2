/// <reference types="vitest" />
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const TEST_PREFIX = `test-${Date.now()}`;
const PASSWORD = "testPass123";

let cookie = "";
let orgSlug = "";
let agentId = "";
let leadId = "";
let conversationId = "";

// ── Helpers ────────────────────────────────────────────────────────

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    redirect: "manual",
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function waitForServer(maxSec = 10) {
  for (let i = 0; i < maxSec; i++) {
    try { await fetch(`${BASE}/api/auth/login`, { method: "POST" }); return; }
    catch { await new Promise((r) => setTimeout(r, 1000)); }
  }
  throw new Error(`Dev server not reachable at ${BASE}. Start with: pnpm dev`);
}

async function tryLogin(email: string, password: string) {
  const { res, body } = await fetchJSON(`${BASE}/api/auth/login`, {
    method: "POST", body: JSON.stringify({ email, password }),
  });
  if (res.status === 200 && body.org?.slug) {
    const setCookie = res.headers.get("set-cookie");
    const match = setCookie?.match(/session=([^;]+)/);
    if (match) return { cookie: `session=${match[1]}`, orgSlug: body.org.slug as string };
  }
  return null;
}

// ── Setup ──────────────────────────────────────────────────────────

beforeAll(async () => {
  await waitForServer();

  // Use existing test accounts (from pnpm seed-members)
  let auth = await tryLogin("admin@salesagent.test", "test123456");
  if (!auth) {
    // Fallback: register new org
    const email = `${TEST_PREFIX}@salesagent.test`;
    await fetchJSON(`${BASE}/api/auth/register`, {
      method: "POST", body: JSON.stringify({ name: "Test Owner", email, password: PASSWORD }),
    });
    // Mark as verified via alice
    console.log("Registered new test user, login to continue");
    auth = await tryLogin("admin@salesagent.test", "test123456");
  }
  if (!auth) throw new Error("Cannot authenticate. Run: pnpm seed-members <org-slug>");
  cookie = auth.cookie;
  orgSlug = auth.orgSlug;
  console.log(`Authenticated as org: ${orgSlug}`);
});

// ── Full SDR Business Flow ─────────────────────────────────────────

describe("SDR Business Flow", () => {
  // Step 1: Create an AI SDR agent
  it("creates an AI SDR agent", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/agents`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({
        name: `${TEST_PREFIX}-agent`,
        description: "Test SDR agent for integration test",
        personality: "Friendly and consultative B2B SDR",
        goals: [{ type: "qualify_lead", priority: 1, successCriteria: "Score > 70" }],
        knowledgeBase: { productDescription: "Test product" },
        isActive: true,
      }),
    });
    expect(res.status).toBe(201);
    expect(body.agent).toBeDefined();
    expect(body.agent.name).toContain(TEST_PREFIX);
    agentId = body.agent.id;
  });

  // Step 2: Create a lead
  it("creates a lead", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/leads`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({
        name: `${TEST_PREFIX} Alice Chen`,
        email: `${TEST_PREFIX}@example.com`,
        company: "Test Startup",
        stage: "new",
        source: "website",
      }),
    });
    expect(res.status).toBe(201);
    expect(body.id).toBeDefined();
    leadId = body.id;
  });

  // Step 3: AI score the lead
  it("scores a lead with AI", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/ai/score-lead`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({ leadId }),
    });
    // May be 503 if AI feature is disabled, or 502 if DeepSeek key missing
    expect([200, 400, 502, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(body.score).toBeGreaterThanOrEqual(0);
      expect(body.score).toBeLessThanOrEqual(100);
    }
  });

  // Step 4: List conversations (empty initially)
  it("lists conversations", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/conversations`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    expect(body.conversations).toBeDefined();
  });

  // Step 5: List agents
  it("lists agents", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/agents`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    expect(body.agents.length).toBeGreaterThan(0);
  });

  // Step 6: List campaigns
  it("lists campaigns", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/campaigns`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    expect(body.campaigns).toBeDefined();
  });

  // Step 7: Inbox stats
  it("returns inbox stats", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/inbox/stats`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    expect(body.activeConversations).toBeDefined();
    expect(body.qualifiedLeads).toBeDefined();
  });
});

// ── RBAC: Viewer cannot mutate ─────────────────────────────────────

describe("RBAC enforcement", () => {
  it("viewer cannot create agents", async () => {
    let viewerCookie = "";
    const auth = await tryLogin("viewer@salesagent.test", "test123456");
    if (!auth) { console.log("Skipping: no viewer account. Run pnpm seed-members"); return; }
    viewerCookie = auth.cookie;

    const { res } = await fetchJSON(`${BASE}/api/orgs/${auth.orgSlug}/agents`, {
      method: "POST",
      headers: { Cookie: viewerCookie },
      body: JSON.stringify({ name: "Hacker Agent" }),
    });
    expect(res.status).toBe(403);
  });

  it("viewer cannot create campaigns", async () => {
    const auth = await tryLogin("viewer@salesagent.test", "test123456");
    if (!auth) return;

    const { res } = await fetchJSON(`${BASE}/api/orgs/${auth.orgSlug}/campaigns`, {
      method: "POST",
      headers: { Cookie: auth.cookie },
      body: JSON.stringify({ name: "Hacker Campaign" }),
    });
    expect(res.status).toBe(403);
  });

  it("viewer can view leads", async () => {
    const auth = await tryLogin("viewer@salesagent.test", "test123456");
    if (!auth) return;

    const { res } = await fetchJSON(`${BASE}/api/orgs/${auth.orgSlug}/leads`, {
      headers: { Cookie: auth.cookie },
    });
    expect(res.status).toBe(200);
  });

  it("viewer can view agents", async () => {
    const auth = await tryLogin("viewer@salesagent.test", "test123456");
    if (!auth) return;

    const { res } = await fetchJSON(`${BASE}/api/orgs/${auth.orgSlug}/agents`, {
      headers: { Cookie: auth.cookie },
    });
    expect(res.status).toBe(200);
  });
});
