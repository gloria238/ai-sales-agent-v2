import { describe, it, expect, beforeAll } from "vitest";
import { BASE, fetchJSON, getTestUser, getOwner, getOrgSlug } from "./helpers";

let ownerCookie = "";
let adminCookie = "";
let viewerCookie = "";
let orgSlug = "";

beforeAll(async () => {
  orgSlug = await getOrgSlug();
  const owner = await getOwner();
  ownerCookie = owner.cookie;
  const admin = await getTestUser("admin");
  adminCookie = admin.cookie;
  const viewer = await getTestUser("viewer");
  viewerCookie = viewer.cookie;
}, 30000);

describe("API Keys CRUD", () => {
  let createdKeyId = "";

  it("GET lists keys (empty initially)", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    expect(body.keys).toBeInstanceOf(Array);
  });

  it("POST creates a key (owner only)", async () => {
    const { res, body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys`, {
      method: "POST",
      headers: { Cookie: ownerCookie },
      body: JSON.stringify({ name: "Test Key" }),
    });
    expect(res.status).toBe(201);
    expect(body.key).toHaveProperty("id");
    expect(body.key).toHaveProperty("name", "Test Key");
    expect(body.key).toHaveProperty("token");
    expect(body.key.token).toMatch(/^of_/);
    expect(body.key.prefix).toBe(body.key.token.slice(0, 10));
    createdKeyId = body.key.id;
  });

  it("POST succeeds for admin (has manage_api_keys)", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ name: "Admin Created Key" }),
    });
    expect(res.status).toBe(201);
  });

  it("POST returns 403 for viewer", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys`, {
      method: "POST",
      headers: { Cookie: viewerCookie },
      body: JSON.stringify({ name: "Nope" }),
    });
    expect(res.status).toBe(403);
  });

  it("POST requires a name", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys`, {
      method: "POST",
      headers: { Cookie: ownerCookie },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("DELETE removes a key (owner only)", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys/${createdKeyId}`, {
      method: "DELETE",
      headers: { Cookie: ownerCookie },
    });
    expect(res.status).toBe(200);

    // Verify key is gone
    const { body } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys`, {
      headers: { Cookie: adminCookie },
    });
    const found = body.keys.find((k: { id: string }) => k.id === createdKeyId);
    expect(found).toBeUndefined();
  });

  it("DELETE succeeds for admin (has manage_api_keys)", async () => {
    const { body: create } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys`, {
      method: "POST",
      headers: { Cookie: ownerCookie },
      body: JSON.stringify({ name: "To Delete" }),
    });
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys/${create.key.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(204);
  });

  it("DELETE returns 404 for non-existent key", async () => {
    const { res } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys/non-existent`, {
      method: "DELETE",
      headers: { Cookie: ownerCookie },
    });
    expect(res.status).toBe(404);
  });

  it("token is only shown once on creation", async () => {
    const { body: create } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys`, {
      method: "POST",
      headers: { Cookie: ownerCookie },
      body: JSON.stringify({ name: "One-time Token" }),
    });
    // Token in create response
    expect(create.key.token).toBeTruthy();

    // But not in the list
    const { body: list } = await fetchJSON(`${BASE}/api/orgs/${orgSlug}/api-keys`, {
      headers: { Cookie: adminCookie },
    });
    const found = list.keys.find((k: { id: string }) => k.id === create.key.id);
    expect(found).toBeTruthy();
    expect(found.token).toBeUndefined();
    expect(found.prefix).toBeTruthy();
  });
});
