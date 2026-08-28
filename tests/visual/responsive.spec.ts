import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 1024, height: 900 } });

async function settleImages(page: Page) {
  await page.locator("img").first().waitFor({ state: "visible" });
  await page.locator("img").evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
  });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const width of [320, 430]) {
  test(`Current ${width}px boundary field`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/current");
    await settleImages(page);

    await expect(page).toHaveScreenshot(`v1-current-mobile-${width}.png`, {
      fullPage: true,
    });
  });
}

test("Current desktop spatial field", async ({ page }) => {
  await page.goto("/current");
  await settleImages(page);

  await expect(page).toHaveScreenshot("v1-desktop-current.png", {
    fullPage: true,
  });
});

test("Full Record desktop spatial field", async ({ page }) => {
  await page.goto("/relic/green-drop-lariat?view=record");
  await settleImages(page);

  await expect(page).toHaveScreenshot("v1-desktop-full-record.png", {
    fullPage: true,
  });
});

test("Material Memory desktop spatial field", async ({ page }) => {
  await page.goto("/about");
  await settleImages(page);

  await expect(page).toHaveScreenshot("v1-desktop-material-memory.png", {
    fullPage: true,
  });
});
