import { expect, test } from "@playwright/test";

test.describe("Reader View", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to first seeded article
    await page.goto("/reader/e2e-art-0");
    await page.waitForLoadState("networkidle");
  });

  test("shows article title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Test Article 1", { timeout: 5_000 });
  });

  test("shows full article text", async ({ page }) => {
    await expect(page.locator("text=TypeScript continues to evolve")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("VRT — reader view", async ({ page }) => {
    await page.waitForSelector("h1", { timeout: 5_000 });
    await expect(page).toHaveScreenshot("reader-view.png", { maxDiffPixels: 100 });
  });

  test("back button is visible", async ({ page }) => {
    const backBtn = page.locator("button").filter({ hasText: "←" });
    await expect(backBtn).toBeVisible();
  });

  test("bottom action bar has read/like/dislike buttons", async ({ page }) => {
    await expect(page.locator("text=既読")).toBeVisible();
    await expect(page.locator("text=いいね")).toBeVisible();
    await expect(page.locator("text=興味なし")).toBeVisible();
  });

  test("memo button opens note form overlay", async ({ page }) => {
    const memoBtn = page.locator("button").filter({ hasText: "メモ" });
    await memoBtn.click();
    // The note form should appear
    await expect(page.locator("textarea")).toBeVisible({ timeout: 2_000 });
    await expect(page.locator("text=メモを追加")).toBeVisible();
  });

  test("VRT — reader note form overlay", async ({ page }) => {
    const memoBtn = page.locator("button").filter({ hasText: "メモ" });
    await memoBtn.click();
    await page.waitForSelector("textarea", { timeout: 2_000 });
    await expect(page).toHaveScreenshot("reader-note-overlay.png", { maxDiffPixels: 100 });
  });
});

test.describe("Reader View — navigation", () => {
  test("queue link navigates back to home", async ({ page }) => {
    await page.goto("/reader/e2e-art-0");
    await page.waitForLoadState("networkidle");
    const queueLink = page.locator('a[href="/"]');
    if (await queueLink.isVisible()) {
      await queueLink.click();
      await expect(page).toHaveURL("/");
    }
  });
});
