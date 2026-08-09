import { expect, test } from "@playwright/test";

test.describe("Discover (search)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
  });

  test("VRT — discover view", async ({ page }) => {
    await expect(page).toHaveScreenshot("discover-view.png", { maxDiffPixels: 200 });
  });

  test("has a search box", async ({ page }) => {
    await expect(page.getByRole("searchbox")).toBeVisible();
  });

  test("search returns results for a known keyword", async ({ page }) => {
    const box = page.getByRole("searchbox");
    await box.fill("TypeScript");
    await box.press("Enter");
    await expect(page.getByText("Test Article 1").first()).toBeVisible({ timeout: 5_000 });
  });
});
