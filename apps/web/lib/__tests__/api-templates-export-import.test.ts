import { describe, it, expect, beforeAll } from "vitest";
import { BASE, fetchJSON, getTestUser, getOrgSlug } from "./helpers";

// These tests require: pnpm seed-members <org-slug> and pnpm dev
// Run with: pnpm --filter @salesagent/web test:integration

let adminCookie = "";
let viewerCookie = "";
let operatorCookie = "";
let orgSlug = "";

beforeAll(async () => {
  orgSlug = await getOrgSlug();
  const admin = await getTestUser("admin");
  adminCookie = admin.cookie;
  const viewer = await getTestUser("viewer");
  viewerCookie = viewer.cookie;
  const operator = await getTestUser("operator");
  operatorCookie = operator.cookie;
}, 30000);

// ── Script Marketplace ──────────────────────────────────────────

describe("Scripts API", () => {
  it("GET lists available scripts (admin)", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/scripts`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    expect(body.scripts).toBeInstanceOf(Array);
  });

  it("GET lists scripts (viewer)", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/scripts`, {
      headers: { Cookie: viewerCookie },
    });
    expect(res.status).toBe(200);
    expect(body.scripts).toBeInstanceOf(Array);
  });

  it("redirects to login without auth", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/scripts`);
    expect([307, 308, 401]).toContain(res.status);
  });

  it("POST installs a script template (admin)", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/scripts`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ slug: "saas-cold-outreach" }),
    });
    expect([201, 200]).toContain(res.status);
    if (res.status === 201) {
      expect(body.script).toHaveProperty("name");
      expect(body.script.name).toContain("Cold Outreach");
    }
  });

  it("POST returns 403 for viewer", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/scripts`, {
      method: "POST",
      headers: { Cookie: viewerCookie },
      body: JSON.stringify({ slug: "saas-cold-outreach" }),
    });
    expect(res.status).toBe(403);
  });

  it("POST returns 404 for unknown script", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/scripts`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ slug: "non-existent" }),
    });
    expect(res.status).toBe(404);
  });
});

// ── Lead Export ─────────────────────────────────────────────────

describe("Lead Export API", () => {
  it("GET returns CSV content type", async () => {
    const res = await fetch(`${BASE}/api/orgs/${orgSlug}/leads/export`, {
      headers: { Cookie: adminCookie }, redirect: "manual",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("Name,Email,Stage,Tags,Created At");
  });

  it("redirects to login without auth", async () => {
    const res = await fetch(`${BASE}/api/orgs/${orgSlug}/leads/export`, { redirect: "manual" });
    expect([307, 308, 401]).toContain(res.status);
  });

  it("returns 200 for viewer (view_leads)", async () => {
    const res = await fetch(`${BASE}/api/orgs/${orgSlug}/leads/export`, {
      headers: { Cookie: viewerCookie }, redirect: "manual",
    });
    expect(res.status).toBe(200);
  });
});

// ── Lead Import ─────────────────────────────────────────────────

describe("Lead Import API", () => {
  it("POST imports leads from JSON rows", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/leads/import`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        rows: [
          { Name: "Test Import 1", Email: "import1@test.com", Stage: "new", Tags: "test,import" },
          { Name: "Test Import 2", Email: "import2@test.com", Stage: "qualified" },
        ],
      }),
    });
    expect(res.status).toBe(200);
    expect(body.imported).toBe(2);
    expect(body.skipped).toBe(0);
  });

  it("POST rejects empty rows", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/leads/import`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ rows: [] }),
    });
    expect(res.status).toBe(400);
  });

  it("POST returns 403 for viewer", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/leads/import`, {
      method: "POST",
      headers: { Cookie: viewerCookie },
      body: JSON.stringify({ rows: [{ Name: "Test" }] }),
    });
    expect(res.status).toBe(403);
  });
});
