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

  test(`Inspection commerce ${width}px boundary field`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/relic/green-drop-lariat");
    await settleImages(page);

    await expect(page).toHaveScreenshot(
      `v1-2-inspection-commerce-mobile-${width}.png`,
      { fullPage: true },
    );
  });

  test(`Transferred Archive ${width}px boundary field`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.setExtraHTTPHeaders({
      "x-remy-e2e-commerce-state": "transferred",
    });
    await page.goto("/archive");
    await settleImages(page);

    await expect(page).toHaveScreenshot(
      `v1-2-transferred-archive-mobile-${width}.png`,
      { fullPage: true },
    );
  });

  test(`Transfer confirmation ${width}px boundary field`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/transfer/confirmation?session_id=e2e-transferred");
    await settleImages(page);

    await expect(page).toHaveScreenshot(
      `v1-2-transfer-confirmation-mobile-${width}.png`,
      { fullPage: true },
    );
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

test("Transferred record desktop spatial field", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-remy-e2e-commerce-state": "transferred",
  });
  await page.goto("/relic/green-drop-lariat?view=record");
  await settleImages(page);

  await expect(page).toHaveScreenshot("v1-2-desktop-transferred-record.png", {
    fullPage: true,
  });
});

test("Transferred Archive desktop spatial field", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-remy-e2e-commerce-state": "transferred",
  });
  await page.goto("/archive");
  await settleImages(page);

  await expect(page).toHaveScreenshot("v1-2-desktop-transferred-archive.png", {
    fullPage: true,
  });
});

test("Transfer confirmation desktop spatial field", async ({ page }) => {
  await page.goto("/transfer/confirmation?session_id=e2e-transferred");
  await settleImages(page);

  await expect(page).toHaveScreenshot("v1-2-desktop-transfer-confirmation.png", {
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
