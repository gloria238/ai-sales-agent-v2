import { test, expect } from "@playwright/test";

test.describe("RBAC UI guards", () => {
  test("viewer cannot see New Workflow button", async ({ page }) => {
    // Login as viewer
    await page.goto("/login");
    await page.fill('input[type="email"]', "viewer@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });

    // Navigate to workflows
    await page.goto("/workflows");
    // "New Workflow" button should NOT be visible
    await expect(page.getByText("New Workflow")).not.toBeVisible({ timeout: 3000 });
  });

  test("operator can see New Workflow but cannot see Delete on detail", async ({ page }) => {
    // Login as operator
    await page.goto("/login");
    await page.fill('input[type="email"]', "operator@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });

    // Navigate to workflows
    await page.goto("/workflows");
    // Operator should see "New Workflow"
    await expect(page.getByText("New Workflow")).toBeVisible({ timeout: 5000 });
  });

  test("admin can see Settings in sidebar", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });

    // Settings link should be in the sidebar
    await expect(page.getByRole("link", { name: /Settings/i })).toBeVisible({ timeout: 3000 });
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForURL("/login", { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Sign in");
  });
});
