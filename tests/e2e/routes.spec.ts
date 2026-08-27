import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const relicPath = "/relic/green-drop-lariat";
const etsyUrl = "https://www.etsy.com/listing/4555589415";

const placeholders = [
  { path: "/archive", skeleton: "/archive", heading: "ARCHIVE" },
  { path: "/log", skeleton: "/log", heading: "YOUR INSPECTION LOG" },
  { path: "/about", skeleton: "/about", heading: "ABOUT THE ARCHIVE" },
] as const;

async function expectNoRuntimeError(page: Page) {
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    ),
  ).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveText("");
}

async function enterInspection(page: Page) {
  await page.goto("/current");
  await page.getByTestId("active-relic").click();
  await expect(page).toHaveURL(relicPath);
  await expect(page.locator("main")).toHaveAttribute("data-screen", "inspection");
}

for (const route of placeholders) {
  test(`${route.path} remains a PASS 00 placeholder`, async ({ page }) => {
    const response = await page.goto(route.path);

    expect(response?.status()).toBe(200);
    await expectNoRuntimeError(page);
    await expect(page.locator("main")).toHaveAttribute(
      "data-route-skeleton",
      route.skeleton,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading }),
    ).toBeVisible();
    await expect(
      page.getByText("SCREEN NOT IMPLEMENTED", { exact: false }),
    ).toBeVisible();
  });
}

test("Arrival → Current → Inspection → Full Record preserves the golden path", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/");
  await expectNoRuntimeError(page);
  await expect(page.locator("main")).toHaveAttribute("data-screen", "arrival");
  await page.getByTestId("enter-recoveries").click();

  await expect(page).toHaveURL("/current");
  const current = page.locator("main[data-screen='current']");
  await expect(current).toBeVisible();
  await expect(page.getByText("GREEN TEARDROP BEND", { exact: true })).toBeVisible();
  await expect(page.getByText("RR-S3-N1", { exact: true })).toBeVisible();
  await expect(page.getByText("02 / EYE HEX", { exact: true })).toBeVisible();
  await expect(page.locator("[data-testid='product-card']")).toHaveCount(0);
  expect(await current.evaluate((node) => getComputedStyle(node).display)).not.toBe(
    "grid",
  );

  await page.getByTestId("active-relic").click();
  await expect(page).toHaveURL(relicPath);
  await expect(page.locator("main")).toHaveAttribute("data-screen", "inspection");
  await expect(page.getByText("OBJECT RECORD / INSPECTION")).toBeVisible();
  await expect(page.getByText("ACQUIRE RELIC — $78", { exact: true })).toBeVisible();

  const inspectionLog = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rr.inspectionLog.v1") ?? "null"),
  );
  expect(inspectionLog).toMatchObject({
    version: 1,
    records: {
      "RR-S3-N1": {
        relicId: "RR-S3-N1",
        lastObservedStatus: "available",
        transferRevealAcknowledgedAt: null,
      },
    },
  });
  expect(Object.keys(inspectionLog.records["RR-S3-N1"]).sort()).toEqual([
    "firstInspectedAt",
    "lastInspectedAt",
    "lastObservedStatus",
    "relicId",
    "transferRevealAcknowledgedAt",
  ]);

  const evidence = page.getByTestId("inspection-evidence");
  const evidenceBox = await evidence.boundingBox();
  expect(evidenceBox).not.toBeNull();
  if (evidenceBox === null) {
    return;
  }

  await page.mouse.move(evidenceBox.x + evidenceBox.width * 0.82, evidenceBox.y + 150);
  await page.mouse.down();
  await page.mouse.move(evidenceBox.x + evidenceBox.width * 0.18, evidenceBox.y + 150, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(page.getByTestId("evidence-counter")).toContainText(
    "02 / 05 · SURFACE",
  );

  await page.getByTestId("view-full-record").click();
  await expect(page.locator("main")).toHaveAttribute("data-screen", "record");
  await expect(page.getByRole("heading", { name: "GREEN TEARDROP BEND" })).toBeVisible();
  await expect(page.getByText("RESIN / FOUND COMPONENTS", { exact: true })).toBeVisible();
  await expect(page.getByTestId("acquire-record")).toHaveAttribute("href", etsyUrl);
  await expect(page.getByTestId("acquire-record")).toHaveAttribute("target", "_blank");
  await expect(page.getByText("secure checkout via Etsy ↗", { exact: true })).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("browser Back restores the Current resting field", async ({ page }) => {
  await page.goto("/current");
  const activeRelic = page.getByTestId("active-relic");
  const before = await activeRelic.boundingBox();

  await activeRelic.click();
  await expect(page).toHaveURL(relicPath);
  await page.goBack();

  await expect(page).toHaveURL("/current");
  await expect(page.locator("main")).toHaveAttribute("data-screen", "current");
  const after = await page.getByTestId("active-relic").boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  if (before !== null && after !== null) {
    expect(after.x).toBeCloseTo(before.x, 0);
    expect(after.y).toBeCloseTo(before.y, 0);
    expect(after.width).toBeCloseTo(before.width, 0);
    expect(after.height).toBeCloseTo(before.height, 0);
  }
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("reduced motion removes field parallax and uses the 120ms contract", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/current");

  const current = page.locator("main[data-screen='current']");
  const activeRelic = page.getByTestId("active-relic");
  await expect(current).toHaveAttribute("data-motion", "reduced");
  expect(
    await current.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--rr-motion-promote").trim(),
    ),
  ).toBe(".12s");
  expect(await activeRelic.evaluate((node) => getComputedStyle(node).transform)).toBe(
    "none",
  );

  const box = await current.boundingBox();
  expect(box).not.toBeNull();
  if (box !== null) {
    await page.mouse.move(box.x + 190, box.y + 280);
    await page.mouse.down();
    await page.mouse.move(box.x + 215, box.y + 305);
    await page.mouse.up();
  }
  await expect(current).toHaveCSS("--drag-foreground-x", "0px");

  await activeRelic.click();
  await expect(page).toHaveURL(relicPath);
  const experience = page.locator("main");
  await expect(experience).toHaveAttribute("data-motion", "reduced");
  await page.getByTestId("view-full-record").click();
  await expect(experience).toHaveAttribute("data-screen", "record");
  expect(
    await experience.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--rr-motion-record-total").trim(),
    ),
  ).toBe(".12s");
});

test("Acquire immediately opens the exact canonical Etsy listing", async ({
  context,
  page,
}) => {
  await context.route(`${etsyUrl}**`, async (route) => {
    await route.fulfill({ contentType: "text/html", body: "<title>Etsy handoff</title>" });
  });
  await enterInspection(page);

  const acquire = page.getByTestId("acquire-inspection");
  await expect(acquire).toHaveAttribute("href", etsyUrl);
  await expect(acquire).toHaveAttribute("rel", "external noopener noreferrer");
  const popupPromise = context.waitForEvent("page");
  await acquire.click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  expect(popup.url()).toBe(etsyUrl);
});

test("the locked relic route has canonical SEO and unknown relics 404", async ({ page }) => {
  await page.goto(relicPath);
  await expect(page).toHaveTitle(/Green Drop Lariat/);
  await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
    "href",
    `http://localhost:3000${relicPath}`,
  );
  await expect(page.locator("meta[property='og:image']")).toHaveAttribute(
    "content",
    /relic\.greenDrop\.sunlightMacro\.png$/,
  );

  const response = await page.goto("/relic/not-canonical");
  expect(response?.status()).toBe(404);
});

for (const width of [320, 430]) {
  test(`${width}px keeps the golden-path shell usable without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(relicPath);
    await expect(page.getByTestId("acquire-inspection")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}
