/// <reference types="vitest" />
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const TEST_PREFIX = `test-${Date.now()}`;
const PASSWORD = "testPass123";

let cookie = "";
let orgSlug = "";
let workflowId = "";
let leadId = "";

// ── Helpers ─────────────────────────────────────────────────────────────

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
    try {
      await fetch(`${BASE}/api/auth/login`, { method: "POST" });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`Dev server not reachable at ${BASE}. Start with: pnpm dev`);
}

async function tryLogin(email: string, password: string) {
  const { res, body } = await fetchJSON(`${BASE}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 200 && body.org?.slug) {
    const setCookie = res.headers.get("set-cookie");
    const match = setCookie?.match(/session=([^;]+)/);
    if (match) {
      return { cookie: `session=${match[1]}`, orgSlug: body.org.slug as string };
    }
  }
  return null;
}

async function tryRegisterAsAlice() {
  const email = "alice@example.com";
  const { res, body } = await fetchJSON(`${BASE}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD, name: "Alice Test" }),
  });
  if (res.status !== 201 || !body.verifyUrl) return null;

  const verifyUrl = body.verifyUrl as string;
  const token = new URL(verifyUrl, BASE).searchParams.get("token");
  if (!token) return null;

  const { res: vRes } = await fetchJSON(`${BASE}/api/auth/verify?token=${token}`);
  if (vRes.status !== 307) return null;

  const setCookie = vRes.headers.get("set-cookie");
  const match = setCookie?.match(/session=([^;]+)/);
  if (!match) return null;

  // Get org slug via login
  const loginResult = await tryLogin(email, PASSWORD);
  return loginResult;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe("Core Business Flow", () => {
  beforeAll(async () => {
    await waitForServer();

    // Strategy 1: Try known test accounts (from pnpm seed-members)
    let auth = await tryLogin("admin@salesagent.test", "test123456");
    if (auth) {
      console.log("Using admin@salesagent.test (from seed-members)");
    } else {
      // Strategy 2: Register fresh alice@example.com
      auth = await tryRegisterAsAlice();
      if (auth) {
        console.log("Registered alice@example.com as owner");
      }
    }

    if (!auth) {
      console.warn(
        "Skipping integration tests — no test account available.\n" +
        "Run one of:\n" +
        "  pnpm seed-members <org-slug>   (creates admin@salesagent.test / test123456)\n" +
        "  pnpm seed                      (resets DB, then integration test can register alice)",
      );
      return;
    }

    cookie = auth.cookie;
    orgSlug = auth.orgSlug;
  }, 30000);

  afterAll(async () => {
    if (!cookie) return;
    if (leadId) {
      await fetchJSON(`${BASE}/api/orgs/${orgSlug}/leads/${leadId}`, {
        method: "DELETE", headers: { cookie },
      });
    }
    if (workflowId) {
      await fetchJSON(`${BASE}/api/orgs/${orgSlug}/workflows/${workflowId}`, {
        method: "DELETE", headers: { cookie },
      });
    }
  });

  // ── Step 1: Create workflow ─────────────────────────────────────────

  it("step 1 — creates a workflow", async () => {
    if (!cookie) return;
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/workflows`, {
      method: "POST",
      headers: { cookie },
      body: JSON.stringify({
        name: `${TEST_PREFIX}-qualification`,
        description: "Test: AI Lead Qualification — score → condition → branch",
      }),
    });
    expect(res.status).toBe(201);
    expect(body.id).toBeTruthy();
    workflowId = body.id;
  });

  // ── Step 2: Save canvas with DAG ────────────────────────────────────

  it("step 2 — saves workflow canvas (trigger → score_lead → condition → branch)", async () => {
    if (!cookie) return;
    const p = TEST_PREFIX;
    const nodes = [
      { id: `${p}-t1`, type: "trigger", label: "New Lead", config: { type: "manual" }, positionX: 250, positionY: 30 },
      { id: `${p}-a1`, type: "action", label: "AI Score Lead", config: { action: "score_lead" }, positionX: 250, positionY: 160 },
      { id: `${p}-c1`, type: "condition", label: "Score > 70?", config: { field: "score", operator: "greater_than", value: "70" }, positionX: 250, positionY: 300 },
      { id: `${p}-a2`, type: "action", label: "Flag Hot Lead", config: { action: "update_lead", stage: "qualified", tags: ["hot"] }, positionX: 450, positionY: 430 },
      { id: `${p}-a3`, type: "action", label: "Add to Nurture", config: { action: "update_lead", stage: "new", tags: ["nurture"] }, positionX: 80, positionY: 430 },
    ];
    const edges = [
      { sourceNodeId: `${p}-t1`, targetNodeId: `${p}-a1` },
      { sourceNodeId: `${p}-a1`, targetNodeId: `${p}-c1` },
      { sourceNodeId: `${p}-c1`, targetNodeId: `${p}-a2`, sourceHandle: "true" },
      { sourceNodeId: `${p}-c1`, targetNodeId: `${p}-a3`, sourceHandle: "false" },
    ];

    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/workflows/${workflowId}`, {
      method: "PUT",
      headers: { cookie },
      body: JSON.stringify({ name: `${TEST_PREFIX}-qualification`, nodes, edges }),
    });
    expect(res.status).toBe(200);
    expect(body.versions?.[0]?.nodes).toHaveLength(5);
    expect(body.versions?.[0]?.edges).toHaveLength(4);
  });

  // ── Step 3: Create lead ─────────────────────────────────────────────

  it("step 3 — creates a lead", async () => {
    if (!cookie) return;
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/leads`, {
      method: "POST",
      headers: { cookie },
      body: JSON.stringify({
        name: `${TEST_PREFIX}-Alice`,
        email: `${TEST_PREFIX}-alice@example.com`,
        stage: "new",
      }),
    });
    expect(res.status).toBe(201);
    expect(body.stage).toBe("new");
    leadId = body.id;
  });

  // ── Step 4: Trigger workflow ────────────────────────────────────────

  it("step 4 — triggers the workflow", async () => {
    if (!cookie) return;
    const { res, body } = await fetchJSON(
      `${BASE}/api/orgs/${orgSlug}/workflows/${workflowId}/trigger`,
      {
        method: "POST",
        headers: { cookie },
        body: JSON.stringify({ input: { leadId } }),
      },
    );
    expect(res.status).toBe(201);
    expect(body.status).toBe("queued");
  });

  // ── Step 5: Verify run created ──────────────────────────────────────

  it("step 5 — verifies run exists via API", async () => {
    if (!cookie) return;
    const { res, body } = await fetchJSON(
      `${BASE}/api/orgs/${orgSlug}/workflows/${workflowId}/runs`,
      { headers: { cookie } },
    );
    expect(res.status).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].status).toMatch(/queued|running|completed|failed/);
  });

  // ── Step 6: Verify DAG structure ────────────────────────────────────

  it("step 6 — verifies workflow DAG (5 nodes, condition has 2 branches)", async () => {
    if (!cookie) return;
    const { res, body } = await fetchJSON(
      `${BASE}/api/orgs/${orgSlug}/workflows/${workflowId}`,
      { headers: { cookie } },
    );
    expect(res.status).toBe(200);
    const v = body.versions?.[0];
    expect(v.nodes).toHaveLength(5);
    expect(v.edges).toHaveLength(4);

    // Condition branching: c1→a2 (true), c1→a3 (false)
    const condId = `${TEST_PREFIX}-c1`;
    const hotId = `${TEST_PREFIX}-a2`;
    const nurtId = `${TEST_PREFIX}-a3`;
    const condEdges = v.edges.filter((e: { sourceNodeId: string }) => e.sourceNodeId === condId);
    expect(condEdges).toHaveLength(2);
    const trueEdge = condEdges.find((e: { sourceHandle: string }) => e.sourceHandle === "true");
    const falseEdge = condEdges.find((e: { sourceHandle: string }) => e.sourceHandle === "false");
    expect(trueEdge.targetNodeId).toBe(hotId);
    expect(falseEdge.targetNodeId).toBe(nurtId);
  });

  // ── Step 7: Lead unchanged (worker idle) ────────────────────────────

  it("step 7 — lead stage is unchanged (worker hasn't executed)", async () => {
    if (!cookie) return;
    const { res, body } = await fetchJSON(
      `${BASE}/api/orgs/${orgSlug}/leads/${leadId}`,
      { headers: { cookie } },
    );
    expect(res.status).toBe(200);
    expect(body.stage).toBe("new");
  });
});
