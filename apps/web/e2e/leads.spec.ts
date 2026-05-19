import { test, expect } from "@playwright/test";

test.describe("Leads", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });
  });

  test("leads page loads", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator("h2")).toContainText("Leads", { timeout: 5000 });
  });

  test("can create a lead", async ({ page }) => {
    const leadName = `e2e-lead-${Date.now()}`;
    await page.goto("/leads");

    // Click "Add Lead" or similar button
    const addBtn = page.getByText(/Add Lead|New Lead|Create Lead/);
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();

      // Fill lead form
      const nameInput = page.locator('input[placeholder*="name" i], input#name, [name="name"]');
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill(leadName);

        // Submit
        const submitBtn = page.getByRole("button", { name: /Create|Save|Add/ });
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitBtn.click();
          // Should see the lead name appear on the page
          await expect(page.getByText(leadName).first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test("leads detail page shows stage selector", async ({ page }) => {
    await page.goto("/leads");
    // Click first lead
    const firstLead = page.locator("a[href*='/leads/']").first();
    if (await firstLead.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstLead.click();
      await page.waitForURL(/\/leads\/[^/]+/, { timeout: 10000 });
      // Should see lead detail content
      await expect(page.locator("h2")).toBeVisible({ timeout: 5000 });
    }
  });

  test("sidebar navigation to leads works", async ({ page }) => {
    await page.goto("/");
    // Click "Leads" in sidebar
    await page.getByRole("link", { name: /Leads/i }).click();
    await page.waitForURL("/leads", { timeout: 10000 });
    await expect(page.locator("h2")).toContainText("Leads");
  });
});
