import { expect, test } from "@playwright/test";

const relicPath = "/relic/green-drop-lariat";
const fieldRoutes = ["/", "/current", "/archive", "/log", "/about", relicPath] as const;
const browseRoutes = ["/current", "/archive", "/log"] as const;
const focusedRoutes = ["/", "/about", relicPath] as const;

for (const width of [390, 430]) {
  for (const route of fieldRoutes) {
    test(`${route} uses the browser field without a device shell at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route);

      const screen = page.locator("body > main[data-screen]");
      await expect(screen).toBeVisible();
      await expect(screen).toHaveCSS("border-radius", "0px");

      const box = await screen.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.x).toBeCloseTo(0, 0);
      expect(box?.width).toBeCloseTo(width, 0);
      expect(box?.height).toBeGreaterThanOrEqual(844);
    });
  }
}

test("the browse rail belongs only to Current, Archive, and Log", async ({ page }) => {
  for (const route of browseRoutes) {
    await page.goto(route);
    const bottomNav = page.getByRole("navigation", { name: "Browse" });

    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "CURRENT", exact: true })).toHaveAttribute(
      "href",
      "/current",
    );
    await expect(bottomNav.getByRole("link", { name: "ARCHIVE", exact: true })).toHaveAttribute(
      "href",
      "/archive",
    );
    await expect(bottomNav.getByRole("link", { name: "LOG", exact: true })).toHaveAttribute(
      "href",
      "/log",
    );
  }

  for (const route of focusedRoutes) {
    await page.goto(route);
    await expect(page.getByRole("navigation", { name: "Browse" })).toHaveCount(0);
  }
});

test("Arrival is one threshold action instead of competing navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("enter-recoveries")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Browse" })).toHaveCount(0);

  await page.getByTestId("menu-trigger").click();
  const menu = page.getByTestId("menu-overlay");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("heading", { name: "BROWSE" })).toHaveCount(0);
  await expect(menu.getByRole("heading", { name: "ABOUT" })).toBeVisible();
  await expect(menu.getByRole("heading", { name: "FIELD NOTES" })).toBeVisible();
  await expect(menu.getByRole("heading", { name: "ELSEWHERE" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "CURRENT", exact: true })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "ARCHIVE", exact: true })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "LOG", exact: true })).toHaveCount(0);
});

test("Inspection uses focused product chrome and the overflow control opens the site menu", async ({
  page,
}) => {
  await page.goto(relicPath);

  await expect(page.locator("main[data-screen='inspection']")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Browse" })).toHaveCount(0);
  await page.getByTestId("menu-trigger").click();
  await expect(page.getByTestId("menu-overlay")).toBeVisible();
  await expect(page.getByRole("heading", { name: "ABOUT" })).toBeVisible();
});

test("active browse state follows the current route", async ({ page }) => {
  for (const [route, label] of [
    ["/current", "CURRENT"],
    ["/archive", "ARCHIVE"],
    ["/log", "LOG"],
  ] as const) {
    await page.goto(route);
    await expect(
      page
        .getByRole("navigation", { name: "Browse" })
        .getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});

test("desktop screens expand into the shared 960px composition", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });

  for (const route of fieldRoutes) {
    await page.goto(route);
    const screen = page.locator("body > main[data-screen]");
    const box = await screen.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeCloseTo(960, 0);
    expect(box?.x).toBeCloseTo(32, 0);
    expect(box?.height).toBeGreaterThanOrEqual(900);
    await expect(screen).toHaveCSS("border-radius", "0px");
  }
});
