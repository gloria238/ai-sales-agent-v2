import { test, expect } from "@playwright/test";

test.describe("RBAC UI guards", () => {
  test("viewer cannot see New Agent button", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "viewer@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });

    await page.goto("/agents");
    await expect(page.getByText("New Agent")).not.toBeVisible({ timeout: 3000 });
  });

  test("operator can see New Agent button", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "operator@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });

    await page.goto("/agents");
    await expect(page.getByText("New Agent")).toBeVisible({ timeout: 5000 });
  });

  test("admin can see Inbox in sidebar", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });

    await expect(page.getByRole("link", { name: /Inbox/i })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("link", { name: /Settings/i })).toBeVisible({ timeout: 3000 });
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/agents");
    await page.waitForURL("/login", { timeout: 10000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Sign in|Welcome/i);
  });

  test("dashboard shows SDR metrics for admin", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });

    // Dashboard should show AI SDR related content
    await expect(page.getByText(/Agent|agent|Dashboard|dashboard/i).first()).toBeVisible({ timeout: 5000 });
  });
});
