import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function settleImages(page: Page) {
  await page.locator("img").first().waitFor({ state: "visible" });
  await page.locator("img").evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
  });
}

async function seedCanonicalLogFixture(page: Page) {
  await page.addInitScript(() => {
    const today = new Date();
    const at = (dayOffset: number, hour: number, minute: number) => {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + dayOffset,
        hour,
        minute,
      );

      return date.toISOString();
    };

    localStorage.setItem(
      "rr.inspectionLog.v1",
      JSON.stringify({
        version: 1,
        records: {
          "RR-S3-N1": {
            relicId: "RR-S3-N1",
            firstInspectedAt: at(-2, 10, 20),
            lastInspectedAt: at(0, 14, 12),
            lastObservedStatus: "available",
            transferRevealAcknowledgedAt: null,
          },
          "RR-VISUAL-02": {
            relicId: "RR-VISUAL-02",
            firstInspectedAt: at(-4, 16, 4),
            lastInspectedAt: at(-1, 16, 4),
            lastObservedStatus: "transferred",
            transferRevealAcknowledgedAt: at(-1, 16, 5),
          },
          "RR-VISUAL-03": {
            relicId: "RR-VISUAL-03",
            firstInspectedAt: at(-3, 9, 18),
            lastInspectedAt: at(-2, 9, 18),
            lastObservedStatus: "available",
            transferRevealAcknowledgedAt: null,
          },
        },
      }),
    );
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

test("Archive canonical resting state", async ({ page }) => {
  await page.goto("/archive");
  await settleImages(page);

  await expect(page).toHaveScreenshot("checkpoint-02-archive.png", {
    fullPage: true,
  });
});

test("Inspection Log canonical resting state", async ({ page }) => {
  await seedCanonicalLogFixture(page);
  await page.goto("/log");
  await expect(page.getByTestId("inspection-log-count")).toHaveText(
    "03 OBJECTS OBSERVED",
  );
  await settleImages(page);

  await expect(page).toHaveScreenshot("checkpoint-03-inspection-log.png", {
    fullPage: true,
  });
});

test("Material Memory canonical resting state", async ({ page }) => {
  await page.goto("/about");
  await settleImages(page);

  await expect(page).toHaveScreenshot("checkpoint-03-material-memory.png", {
    fullPage: true,
  });
});

test("Canonical menu resting state", async ({ page }) => {
  await seedCanonicalLogFixture(page);
  await page.goto("/current");
  await settleImages(page);
  await page.getByTestId("menu-trigger").click();
  await expect(page.getByTestId("menu-overlay")).toBeVisible();

  await expect(page).toHaveScreenshot("checkpoint-03-menu.png", {
    fullPage: true,
  });
});
