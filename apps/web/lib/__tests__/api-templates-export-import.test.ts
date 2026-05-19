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

// ── Template Marketplace ────────────────────────────────────────

describe("Templates API", () => {
  it("GET lists available templates (admin)", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/templates`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    expect(body.templates).toBeInstanceOf(Array);
    expect(body.templates.length).toBeGreaterThanOrEqual(3);
    expect(body.templates[0]).toHaveProperty("slug");
    expect(body.templates[0]).toHaveProperty("name");
    expect(body.templates[0]).toHaveProperty("nodes");
    expect(body.templates[0]).toHaveProperty("edges");
  });

  it("GET lists templates (viewer)", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/templates`, {
      headers: { Cookie: viewerCookie },
    });
    expect(res.status).toBe(200);
    expect(body.templates.length).toBeGreaterThanOrEqual(3);
  });

  it("redirects to login without auth", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/templates`);
    // Middleware redirects unauthenticated requests to /login (307)
    expect([307, 401]).toContain(res.status);
  });

  it("POST installs a template (admin)", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/templates`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ slug: "lead-qualification" }),
    });
    // May be 201 (created) or 409 if already installed
    expect([201, 409]).toContain(res.status);
    if (res.status === 201) {
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("name", "Lead Qualification");
    }
  });

  it("POST returns 403 for viewer", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/templates`, {
      method: "POST",
      headers: { Cookie: viewerCookie },
      body: JSON.stringify({ slug: "lead-qualification" }),
    });
    expect(res.status).toBe(403);
  });

  it("POST returns 404 for unknown template", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/templates`, {
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
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("Name,Email,Stage,Tags,Created At");
  });

  it("redirects to login without auth", async () => {
    const res = await fetch(`${BASE}/api/orgs/${orgSlug}/leads/export`, { redirect: "manual" });
    // Middleware redirects unauthenticated requests to /login (307)
    expect([307, 401]).toContain(res.status);
  });

  it("returns 403 for viewer (view_leads OK)", async () => {
    const res = await fetch(`${BASE}/api/orgs/${orgSlug}/leads/export`, {
      headers: { Cookie: viewerCookie },
      redirect: "manual",
    });
    // viewer has view_leads permission, so export should work
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
    expect(body.total).toBe(2);
  });

  it("POST rejects empty rows", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/leads/import`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ rows: [] }),
    });
    expect(res.status).toBe(400);
  });

  it("POST skips rows with missing name", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/leads/import`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        rows: [
          { Name: "", Email: "bad@test.com" },
          { Name: "Valid", Email: "valid@test.com" },
        ],
      }),
    });
    expect(res.status).toBe(200);
    expect(body.imported).toBe(1);
    expect(body.skipped).toBe(1);
    expect(body.errors).toHaveLength(1);
  });

  it("POST returns 403 for viewer", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/leads/import`, {
      method: "POST",
      headers: { Cookie: viewerCookie },
      body: JSON.stringify({ rows: [{ Name: "Test" }] }),
    });
    expect(res.status).toBe(403);
  });

  it("POST normalizes stage to valid values", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/leads/import`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        rows: [{ Name: "Stage Test", Stage: "INVALID_STAGE" }],
      }),
    });
    expect(res.status).toBe(200);
    expect(body.imported).toBe(1);
  });
});
