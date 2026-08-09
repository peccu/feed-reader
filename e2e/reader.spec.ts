import { expect, test } from "@playwright/test";

test.describe("Reader", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reader/e2e-art-0");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("h1", { timeout: 10_000 });
  });

  test("VRT — reader view", async ({ page }) => {
    await expect(page).toHaveScreenshot("reader-view.png", { maxDiffPixels: 200 });
  });

  test("shows the article title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Test Article 1", { timeout: 5_000 });
  });

  test("shows the full article text", async ({ page }) => {
    await expect(page.getByText("TypeScript continues to evolve").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("has a back button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
  });

  test("action bar has Read / Like / Dislike", async ({ page }) => {
    for (const label of ["Read", "Like", "Dislike"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
  });

  test("note button opens the note form overlay", async ({ page }) => {
    await page.getByRole("button", { name: "Note", exact: true }).click();
    await expect(page.locator("textarea")).toBeVisible({ timeout: 2_000 });
    await expect(page.getByText("Add note")).toBeVisible();
  });
});
