import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Sign in");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h1")).toContainText("Create");
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "noone@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid email or password")).toBeVisible({ timeout: 5000 });
  });

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard (root /)
    await page.waitForURL("/", { timeout: 15000 });
    // Sidebar should be visible
    await expect(page.locator("aside")).toBeVisible({ timeout: 5000 });
  });

  test("successful login shows user name in header", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });
    // The header should show the user's name or email
    await expect(page.getByText("Test Admin")).toBeVisible({ timeout: 5000 });
  });

  test("logout redirects to login", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@salesagent.test");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15000 });

    // Click user menu to open dropdown
    await page.locator("aside header, header .cursor-pointer, [class*='DropdownMenuTrigger']").first().click();
    // Click sign out
    await page.getByText("Sign out").click();
    await page.waitForURL("/login", { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Sign in");
  });
});
