import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const relicPath = "/relic/green-drop-lariat";
const etsyUrl = "https://www.etsy.com/listing/4555589415";
const v1Routes = ["/", "/current", "/archive", "/log", "/about", relicPath];

async function expectNoRuntimeError(page: Page) {
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    ),
  ).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveText("");
}

test("Archive preserves the canonical transferred trace field", async ({ page }) => {
  await page.goto("/archive");

  const archive = page.getByTestId("archive-field");
  await expectNoRuntimeError(page);
  await expect(archive).toHaveAttribute("data-node-id", "547:65");
  await expect(page.getByText("12 TRANSFERRED", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Transferred relic traces").locator("figure")).toHaveCount(4);
  await expect(page.getByLabel("Transferred", { exact: true })).toHaveCount(4);
  await expect(page.getByRole("link", { name: "ARCHIVE" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(await archive.evaluate((node) => getComputedStyle(node).display)).not.toBe(
    "grid",
  );

  const box = await archive.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    return;
  }

  await page.mouse.move(box.x + 180, box.y + 340);
  await page.mouse.down();
  await page.mouse.move(box.x + 202, box.y + 352, { steps: 4 });
  await expect(archive).toHaveCSS("--archive-foreground-x", "22px");
  await expect(archive).toHaveCSS("--archive-mid-x", "13.2px");
  await page.mouse.up();
  await expect(archive).toHaveCSS("--archive-foreground-x", "0px");
});

test("Archive reduced motion removes roam parallax", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/archive");

  const archive = page.getByTestId("archive-field");
  const box = await archive.boundingBox();
  expect(box).not.toBeNull();
  if (box !== null) {
    await page.mouse.move(box.x + 180, box.y + 340);
    await page.mouse.down();
    await page.mouse.move(box.x + 212, box.y + 360);
    await page.mouse.up();
  }

  await expect(archive).toHaveAttribute("data-motion", "reduced");
  await expect(archive).toHaveCSS("--archive-foreground-x", "0px");
  expect(
    await archive.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--rr-motion-archive-roam").trim(),
    ),
  ).toBe(".12s");
});

async function enterInspection(page: Page) {
  await page.goto("/current");
  await page.getByTestId("active-relic").click();
  await expect(page).toHaveURL(relicPath);
  await expect(page.locator("main")).toHaveAttribute("data-screen", "inspection");
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

test("Back and in-screen return controls preserve route and scroll state", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("enter-recoveries").click();
  await expect(page).toHaveURL("/current");
  await page.goBack();
  await expect(page).toHaveURL("/");
  await expect(page.locator("main")).toHaveAttribute("data-screen", "arrival");
  expect(await page.evaluate(() => scrollY)).toBe(0);

  await page.goForward();
  await expect(page).toHaveURL("/current");
  await page.getByTestId("active-relic").click();
  await page.getByTestId("view-full-record").click();
  await expect(page.locator("main")).toHaveAttribute("data-screen", "record");
  await page.getByRole("button", { name: "Back to Current Recoveries" }).click();
  await expect(page).toHaveURL("/current");
  expect(await page.evaluate(() => scrollY)).toBe(0);

  await page.getByTestId("menu-trigger").click();
  await page.getByRole("link", { name: "THE ARCHIVE" }).click();
  await expect(page).toHaveURL("/archive");
  await page.goBack();
  await expect(page).toHaveURL("/current");
  await expect(page.getByTestId("menu-overlay")).toHaveCount(0);
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

test("Inspection Log uses only local observation truth and reopens the permanent record", async ({
  page,
}) => {
  await page.goto("/log");
  await expect(page.locator("main")).toHaveAttribute(
    "data-screen",
    "inspection-log",
  );
  await expect(page.getByTestId("inspection-log-count")).toHaveText(
    "00 OBJECTS OBSERVED",
  );
  await expect(page.getByText("NO OBJECTS OBSERVED YET.")).toBeVisible();
  await expect(page.getByTestId("reopen-relic")).toHaveCount(0);

  await enterInspection(page);
  await page.goto("/log");
  await expect(page.getByTestId("inspection-log-count")).toHaveText(
    "01 OBJECTS OBSERVED",
  );
  await expect(page.getByText("LOCAL DEVICE / NO ACCOUNT REQUIRED")).toBeVisible();
  await expect(page.getByText("GREEN TEARDROP BEND", { exact: true })).toBeVisible();

  const storedRecord = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rr.inspectionLog.v1") ?? "null"),
  );
  expect(storedRecord).not.toHaveProperty("purchased");
  expect(storedRecord.records["RR-S3-N1"]).not.toHaveProperty("purchased");

  await page.getByTestId("reopen-relic").click();
  await expect(page).toHaveURL(`${relicPath}?view=record`);
  await expect(page.locator("main")).toHaveAttribute("data-screen", "record");
  await expect(page.getByTestId("acquire-record")).toHaveAttribute("href", etsyUrl);

  await page.goBack();
  await expect(page).toHaveURL("/log");
  await expect(page.locator("main")).toHaveAttribute(
    "data-screen",
    "inspection-log",
  );
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("Material Memory and the canonical menu expose only implemented destinations", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(page.locator("main")).toHaveAttribute("data-node-id", "546:78");
  await expect(
    page.getByRole("heading", { name: "EVERY ENCOUNTER LEAVES MATERIAL MEMORY." }),
  ).toBeVisible();
  await expect(page.getByText("SCRATCH", { exact: false })).toBeVisible();
  await expect(
    page.getByText("REMY FELL ASLEEP ON THE PAPERWORK."),
  ).toBeVisible();

  const trigger = page.getByTestId("menu-trigger");
  await trigger.click();
  const menu = page.getByTestId("menu-overlay");
  await expect(menu).toHaveAttribute("role", "dialog");
  await expect(page.getByRole("link", { name: "THE ARCHIVE" })).toHaveAttribute(
    "href",
    "/archive",
  );
  await expect(page.getByTestId("menu-instagram")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(page.getByTestId("menu-etsy-shop")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(page.getByRole("link", { name: /YOUR LOG/ })).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await enterInspection(page);
  await page.goto("/current");
  await page.getByTestId("menu-trigger").click();
  await expect(page.getByRole("link", { name: "YOUR LOG / 01" })).toBeVisible();
});

test("Inspection Log reopen honors the reduced-motion dissolve", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterInspection(page);
  await page.goto("/log");

  const log = page.locator("main[data-screen='inspection-log']");
  await expect(log).toHaveAttribute("data-motion", "reduced");
  expect(
    await log.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--log-reopen-duration").trim(),
    ),
  ).toBe("120ms");

  await page.getByTestId("reopen-relic").click();
  await expect(page).toHaveURL(`${relicPath}?view=record`);
  await expect(page.locator("main")).toHaveAttribute("data-motion", "reduced");
});

test("keyboard navigation covers the field, evidence, Full Record, and menu", async ({
  page,
}) => {
  await page.goto("/current");
  const menuTrigger = page.getByTestId("menu-trigger");
  await menuTrigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("menu-overlay")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuTrigger).toBeFocused();

  const activeRelic = page.getByTestId("active-relic");
  await activeRelic.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(relicPath);

  const evidence = page.getByTestId("inspection-evidence");
  await evidence.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("evidence-counter")).toContainText(
    "02 / 05 · SURFACE",
  );
  await page.keyboard.press("Home");
  await expect(page.getByTestId("evidence-counter")).toContainText(
    "01 / 05 · FULL OBJECT",
  );

  await page.getByTestId("view-full-record").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toHaveAttribute("data-screen", "record");
  await page.getByRole("button", { name: "Promote surface evidence" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("section[data-active-evidence='2']")).toBeVisible();
});

test("reduced motion covers Arrival, evidence, and the menu overlay", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const arrival = page.locator("main[data-screen='arrival']");
  await expect(arrival).toHaveAttribute("data-motion", "reduced");
  expect(
    await arrival.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--rr-motion-arrival").trim(),
    ),
  ).toBe(".12s");

  await page.getByTestId("menu-trigger").click();
  const menu = page.getByTestId("menu-overlay");
  expect(await menu.evaluate((node) => getComputedStyle(node).animationDuration)).toBe(
    "0.12s",
  );
  await page.keyboard.press("Escape");

  await page.getByTestId("enter-recoveries").click();
  await expect(page).toHaveURL("/current");
  await page.getByTestId("active-relic").click();
  const evidence = page.getByTestId("inspection-evidence");
  expect(
    await evidence
      .locator("div")
      .first()
      .evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe("0.12s");
});

test("V1 pages expose a minimal accessible document structure", async ({ page }) => {
  for (const route of [...v1Routes, `${relicPath}?view=record`]) {
    await page.goto(route);
    const audit = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll("a, button"));
      const unnamedInteractive = interactive.filter((element) => {
        const label = element.getAttribute("aria-label")?.trim();
        const text = element.textContent?.trim();
        return !label && !text;
      });
      const ids = Array.from(document.querySelectorAll("[id]"))
        .map((element) => element.id)
        .filter(Boolean);

      return {
        duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
        headings: document.querySelectorAll("h1").length,
        imagesMissingAlt: document.querySelectorAll("img:not([alt])").length,
        lang: document.documentElement.lang,
        unnamedInteractive: unnamedInteractive.length,
      };
    });

    expect(audit).toEqual({
      duplicateIds: [],
      headings: 1,
      imagesMissingAlt: 0,
      lang: "en",
      unnamedInteractive: 0,
    });
  }
});

test("all V1 pages publish canonical Open Graph metadata and crawl rules", async ({
  page,
  request,
}) => {
  for (const route of v1Routes) {
    await page.goto(route);
    const canonicalPath = route === "/" ? "" : route;
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
      "href",
      `http://localhost:3000${canonicalPath}`,
    );
    await expect(page.locator("meta[property='og:image']")).toHaveAttribute(
      "content",
      /\/assets\/figma\/.+\.(png|svg)$/,
    );
    await expect(page.locator("meta[name='robots']")).toHaveAttribute(
      "content",
      /index/,
    );
  }

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /");
  expect(robots).not.toContain("Disallow: /");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/relic/green-drop-lariat");
});

for (const width of [320, 390, 430]) {
  test(`${width}px keeps every V1 field usable without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const route of v1Routes) {
      await page.goto(route);
      const field = page.locator("main[data-screen]");
      await expect(field).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
        width,
      );
      expect(await field.evaluate((node) => getComputedStyle(node).display)).not.toBe(
        "grid",
      );
    }
  });
}

test("desktop expands the same spatial field without card or grid conversion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });

  for (const route of [...v1Routes, `${relicPath}?view=record`]) {
    await page.goto(route);
    const field = page.locator("main[data-screen]");
    const box = await field.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThan(700);
    expect(await field.evaluate((node) => getComputedStyle(node).display)).not.toBe(
      "grid",
    );
    expect(await page.locator("[data-testid='product-card']").count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      1024,
    );
  }
});
