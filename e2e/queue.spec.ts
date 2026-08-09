import { expect, test } from "@playwright/test";

test.describe("Queue (unread carousel)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='carousel'], [data-testid='empty-state']", {
      timeout: 10_000,
    });
  });

  // VRT first, so it captures the queue before any mutating test runs.
  test("VRT — queue initial", async ({ page }) => {
    await page.waitForTimeout(300); // let the carousel settle
    await expect(page).toHaveScreenshot("queue-initial.png", { maxDiffPixels: 200 });
  });

  test("shows an article title in the carousel", async ({ page }) => {
    await expect(page.getByText("Test Article 1").first()).toBeVisible({ timeout: 5_000 });
  });

  test("position indicator shows N/M", async ({ page }) => {
    const indicator = page.getByTestId("position-indicator");
    await expect(indicator).toBeVisible();
    expect(await indicator.innerText()).toMatch(/\d+\s*\/\s*\d+/);
  });

  test("action bar shows the core actions", async ({ page }) => {
    for (const label of ["Note", "Dislike", "Like", "Read", "Skip"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
  });

  test("right chevron navigates to the next article", async ({ page }) => {
    const indicator = page.getByTestId("position-indicator");
    const before = await indicator.innerText();
    await page.getByRole("button", { name: "Right" }).click();
    await page.waitForTimeout(500);
    expect(await indicator.innerText()).not.toBe(before);
  });

  test("menu opens and links to Settings and Discover", async ({ page }) => {
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("link", { name: "Settings / Feeds" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Discover" })).toBeVisible();
  });

  // Mutating test last: skip removes the current article from the unread queue.
  // The assertion is relative, so it holds regardless of the queue's absolute
  // size (which earlier tests / the other project may already have changed).
  test("skip removes the article from the queue", async ({ page }) => {
    const indicator = page.getByTestId("position-indicator");
    const total = async () => Number((await indicator.innerText()).match(/\/\s*(\d+)/)?.[1] ?? "0");
    const before = await total();
    test.skip(before === 0, "queue already empty");
    await page.getByRole("button", { name: "Skip", exact: true }).click();
    await page.waitForTimeout(700);
    expect(await total()).toBe(before - 1);
  });
});
