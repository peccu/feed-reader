import { expect, test } from "@playwright/test";

test.describe("Queue View — carousel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait until carousel or empty-state is visible
    await page.waitForSelector(".snap-x, [data-testid='empty-state'], text=キューが空", {
      timeout: 10_000,
    });
  });

  test("shows article titles in queue", async ({ page }) => {
    const title = page.locator("text=Test Article 1");
    await expect(title).toBeVisible({ timeout: 5_000 });
  });

  test("VRT — queue view initial state (mobile)", async ({ page }) => {
    await page.waitForTimeout(300); // let scroll settle
    await expect(page).toHaveScreenshot("queue-initial-mobile.png", { maxDiffPixels: 100 });
  });

  test("position indicator shows N/M", async ({ page }) => {
    // Expects something matching "1/5" or similar digit/digit pattern in the top bar
    const indicator = page.locator("button").filter({ hasText: /\d+\/\d+/ });
    await expect(indicator).toBeVisible();
    const text = await indicator.innerText();
    expect(text).toMatch(/\d+\/\d+/);
  });

  test("action bar buttons are visible", async ({ page }) => {
    await expect(page.locator("text=スキップ")).toBeVisible();
    await expect(page.locator("text=いいね")).toBeVisible();
    await expect(page.locator("text=全文")).toBeVisible();
    await expect(page.locator("text=興味なし")).toBeVisible();
    await expect(page.locator("text=メモ")).toBeVisible();
  });

  test("VRT — action bar", async ({ page }) => {
    const vp = page.viewportSize() ?? { width: 390, height: 844 };
    await expect(page).toHaveScreenshot("queue-actionbar-mobile.png", {
      clip: { x: 0, y: vp.height - 130, width: vp.width, height: 130 },
      maxDiffPixels: 50,
    });
  });

  test("right tap area navigates to next article", async ({ page }) => {
    const initialIndicator = page.locator("button").filter({ hasText: /\d+\/\d+/ });
    const initialText = await initialIndicator.innerText();

    // Click the right navigation chevron
    const rightChevron = page.locator("button").filter({ hasText: "›" });
    if (await rightChevron.isVisible()) {
      await rightChevron.click();
      await page.waitForTimeout(500);
      const updatedText = await initialIndicator.innerText();
      // Position should have changed
      expect(updatedText).not.toBe(initialText);
    }
  });

  test("settings link in top bar", async ({ page }) => {
    const settingsLink = page.locator('a[href="/settings"]');
    await expect(settingsLink).toBeVisible();
  });

  test("discover link in top bar", async ({ page }) => {
    const discoverLink = page.locator('a[href="/discover"]');
    await expect(discoverLink).toBeVisible();
  });

  test("skip action removes article from queue", async ({ page }) => {
    const skipBtn = page.locator("button").filter({ hasText: "スキップ" });
    await expect(skipBtn).toBeVisible();

    const indicatorBefore = page.locator("button").filter({ hasText: /\d+\/\d+/ });
    const textBefore = await indicatorBefore.innerText();
    const totalBefore = Number(textBefore.match(/\/(\d+)/)?.[1] ?? "0");

    await skipBtn.click();
    await page.waitForTimeout(600);

    const textAfter = await indicatorBefore.innerText();
    const totalAfter = Number(textAfter.match(/\/(\d+)/)?.[1] ?? "0");

    // Queue should have one less item
    expect(totalAfter).toBe(totalBefore - 1);
  });
});

test.describe("Queue View — desktop layout", () => {
  test("VRT — queue view desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".snap-x", { timeout: 10_000 });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("queue-initial-desktop.png", { maxDiffPixels: 100 });
  });
});
