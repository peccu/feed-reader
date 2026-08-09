import { expect, test } from "@playwright/test";

test.describe("Settings / Feeds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
  });

  test("VRT — settings view", async ({ page }) => {
    await expect(page).toHaveScreenshot("settings-view.png", { maxDiffPixels: 200 });
  });

  test("shows the seeded feed", async ({ page }) => {
    await expect(page.getByText("Tech News").first()).toBeVisible({ timeout: 5_000 });
  });

  test("shows the add-feed URL input", async ({ page }) => {
    await expect(page.locator("input[type='url']").first()).toBeVisible();
  });

  test("has a back button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
  });
});
