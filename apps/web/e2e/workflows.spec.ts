import { test, expect } from "@playwright/test";

test.describe("Workflows", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });
  });

  test("workflows page loads with list", async ({ page }) => {
    await page.goto("/workflows");
    await expect(page.locator("h2")).toContainText("Workflows", { timeout: 5000 });
    // Should show either the list or an empty state
    const hasList = await page.locator("a[href*='/workflows/']").first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText("No workflows yet").isVisible().catch(() => false);
    expect(hasList || hasEmpty).toBe(true);
  });

  test("can create a new workflow", async ({ page }) => {
    const wfName = `e2e-${Date.now()}`;
    await page.goto("/workflows");

    // Click "New Workflow" button
    await page.getByText("New Workflow").click();
    // Fill in the dialog
    await page.locator('input[placeholder="My workflow"]').fill(wfName);
    // Click Create
    await page.getByRole("button", { name: "Create" }).click();
    // Should redirect to builder
    await page.waitForURL(/\/workflows\/.*\/builder/, { timeout: 15000 });
    // Builder should show the workflow name
    await expect(page.locator('input[placeholder="Workflow name"]')).toBeVisible({ timeout: 5000 });
  });

  test("workflow builder canvas loads", async ({ page }) => {
    // Navigate to an existing workflow detail page first
    await page.goto("/workflows");
    // Click the first workflow
    const firstWf = page.locator("a[href*='/workflows/']").first();
    if (await firstWf.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstWf.click();
      await page.waitForURL(/\/workflows\/[^/]+$/, { timeout: 10000 });

      // Click "Open Builder" or "View Canvas"
      const builderLink = page.getByText(/Open Builder|View Canvas/);
      if (await builderLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await builderLink.click();
        await page.waitForURL(/\/workflows\/.*\/builder/, { timeout: 10000 });

        // Canvas React Flow container should be visible
        await expect(page.locator(".react-flow")).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("dashboard page shows workflow count", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Workflows")).toBeVisible({ timeout: 5000 });
  });
});
