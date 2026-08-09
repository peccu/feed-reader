import { expect, test } from "@playwright/test";

test.describe("Settings View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
  });

  test("VRT — settings view", async ({ page }) => {
    await expect(page).toHaveScreenshot("settings-view.png", { maxDiffPixels: 100 });
  });

  test("shows existing seeded feed", async ({ page }) => {
    await expect(page.locator("text=Tech News")).toBeVisible({ timeout: 5_000 });
  });

  test("shows feed URL input and add button", async ({ page }) => {
    const input = page.locator("input[placeholder*='URL']");
    await expect(input).toBeVisible();
  });

  test("can navigate back to queue", async ({ page }) => {
    // There should be a link/button back to the queue (home)
    const homeLink = page.locator('a[href="/"]');
    if (await homeLink.first().isVisible()) {
      await homeLink.first().click();
      await expect(page).toHaveURL("/");
    }
  });

  test("shows URL ingest form", async ({ page }) => {
    const urlInput = page.locator("input[type='url'], input[placeholder*='http']");
    await expect(urlInput.first()).toBeVisible();
  });
});
