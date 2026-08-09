import { expect, test } from "@playwright/test";

test.describe("Discover View — search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
  });

  test("VRT — discover view", async ({ page }) => {
    await expect(page).toHaveScreenshot("discover-view.png", { maxDiffPixels: 100 });
  });

  test("has search input", async ({ page }) => {
    const input = page.locator(
      "input[type='search'], input[placeholder*='検索'], input[placeholder*='search']",
    );
    await expect(input.first()).toBeVisible();
  });

  test("search returns results for known keyword", async ({ page }) => {
    const input = page.locator(
      "input[type='search'], input[placeholder*='検索'], input[placeholder*='search']",
    );
    await input.first().fill("TypeScript");
    await input.first().press("Enter");
    await page.waitForTimeout(500);
    // Should show the TypeScript article
    await expect(page.locator("text=Test Article 1")).toBeVisible({ timeout: 5_000 });
  });
});
