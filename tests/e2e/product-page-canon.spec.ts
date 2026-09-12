import { expect, test } from "@playwright/test";

const relicPath = "/relic/green-drop-lariat";

for (const width of [320, 390, 430]) {
  test(`product page uses the browser field at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(relicPath);

    const experience = page.locator("main");
    await expect(experience).toHaveAttribute("data-screen", "inspection");
    await expect(experience).toHaveCSS("border-radius", "0px");

    const inspectionBox = await experience.boundingBox();
    expect(inspectionBox).not.toBeNull();
    expect(inspectionBox?.x).toBeCloseTo(0, 0);
    expect(inspectionBox?.width).toBeCloseTo(width, 0);
    expect(inspectionBox?.height).toBeGreaterThanOrEqual(844);

    await page.getByTestId("view-full-record").click();
    await expect(experience).toHaveAttribute("data-screen", "record");
    await expect(experience).toHaveCSS("border-radius", "0px");

    const recordBox = await experience.boundingBox();
    expect(recordBox).not.toBeNull();
    expect(recordBox?.x).toBeCloseTo(0, 0);
    expect(recordBox?.width).toBeCloseTo(width, 0);
  });
}

test("product share control invokes the canonical relic URL", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        (window as typeof window & { __remySharedUrl?: string }).__remySharedUrl =
          typeof data.url === "string" ? data.url : undefined;
      },
    });
  });

  await page.goto(relicPath);
  await page.getByRole("button", { name: "Share relic" }).click();

  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __remySharedUrl?: string }).__remySharedUrl,
      ),
    )
    .toBe(`${new URL(page.url()).origin}${relicPath}`);
});

test("product page unlocks the canonical desktop composition", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto(relicPath);

  const experience = page.locator("main");
  await expect(experience).toHaveAttribute("data-screen", "inspection");
  await expect(experience).toHaveCSS("border-radius", "0px");

  const inspectionBox = await experience.boundingBox();
  expect(inspectionBox).not.toBeNull();
  expect(inspectionBox?.width).toBeCloseTo(960, 0);
  expect(inspectionBox?.x).toBeCloseTo(32, 0);
  expect(inspectionBox?.height).toBeGreaterThanOrEqual(900);

  const evidenceBox = await page.getByTestId("inspection-evidence").boundingBox();
  const acquireBox = await page.getByTestId("acquire-inspection").boundingBox();
  expect(evidenceBox).not.toBeNull();
  expect(acquireBox).not.toBeNull();
  if (evidenceBox !== null && acquireBox !== null) {
    expect(evidenceBox.x + evidenceBox.width).toBeLessThan(acquireBox.x);
  }

  await page.getByTestId("view-full-record").click();
  await expect(experience).toHaveAttribute("data-screen", "record");

  const recordBox = await experience.boundingBox();
  expect(recordBox).not.toBeNull();
  expect(recordBox?.width).toBeCloseTo(960, 0);
  expect(recordBox?.x).toBeCloseTo(32, 0);
});
