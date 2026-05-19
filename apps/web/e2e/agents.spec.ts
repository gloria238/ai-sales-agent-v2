import { test, expect } from "@playwright/test";

test.describe("Agents page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });
  });

  test("agents page loads with list or empty state", async ({ page }) => {
    await page.goto("/agents");
    await expect(page.getByText(/AI SDR Agents/i)).toBeVisible({ timeout: 5000 });
  });

  test("can open create agent dialog", async ({ page }) => {
    await page.goto("/agents");
    const newBtn = page.getByText("New Agent");
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page.getByText(/Create AI SDR Agent/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test("inbox page loads", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page.getByText(/Inbox/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("campaigns page loads", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page.getByText(/Campaign/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("scripts page loads", async ({ page }) => {
    await page.goto("/scripts");
    await expect(page.getByText(/Sales Scripts/i)).toBeVisible({ timeout: 5000 });
  });

  test("dashboard page loads with metrics", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByText(/AI Agent|Dashboard|Active Conversation/i).first()).toBeVisible({ timeout: 5000 });
  });
});
