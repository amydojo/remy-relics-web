import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function settleImages(page: Page) {
  await page.locator("img").first().waitFor({ state: "visible" });
  await page.locator("img").evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
  });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("Arrival canonical resting state", async ({ page }) => {
  await page.goto("/");
  await settleImages(page);

  await expect(page).toHaveScreenshot("pass-01-arrival.png", { fullPage: true });
});

test("Current canonical resting state", async ({ page }) => {
  await page.goto("/current");
  await settleImages(page);

  await expect(page).toHaveScreenshot("pass-01-current.png", { fullPage: true });
});

test("Inspection canonical resting state", async ({ page }) => {
  await page.goto("/relic/green-drop-lariat");
  await settleImages(page);

  await expect(page).toHaveScreenshot("pass-01-inspection.png", { fullPage: true });
});

test("Full Record canonical resting state", async ({ page }) => {
  await page.goto("/relic/green-drop-lariat");
  await page.getByTestId("view-full-record").click();
  await expect(page.locator("main")).toHaveAttribute("data-screen", "record");
  await settleImages(page);

  await expect(page).toHaveScreenshot("pass-01-full-record.png", { fullPage: true });
});
